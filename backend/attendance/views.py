import csv
import io
from decimal import Decimal
from datetime import datetime
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, status, serializers, exceptions
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
import pandas as pd

from .models import Shift, AttendanceRecord, AttendanceImportBatch, AttendancePunch
from .serializers import (
    ShiftSerializer,
    AttendanceRecordSerializer,
    AttendanceImportBatchSerializer,
    AttendancePunchSerializer,
)
from workers.models import Worker
from departments.models import Department
from core.models import AuditLog
from payroll.calculations import calculate_working_and_overtime


class ShiftListCreateView(generics.ListCreateAPIView):
    queryset = Shift.objects.all().order_by('code')
    serializer_class = ShiftSerializer
    permission_classes = [IsAuthenticated]


class ShiftDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    permission_classes = [IsAuthenticated]


class AttendanceRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AttendanceRecord.objects.select_related('worker', 'worker__department', 'shift', 'approved_by')
        date_str = self.request.query_params.get('date')
        if date_str:
            qs = qs.filter(attendance_date=date_str)

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date and end_date:
            qs = qs.filter(attendance_date__range=[start_date, end_date])

        worker_id = self.request.query_params.get('worker')
        if worker_id:
            if str(worker_id).isdigit():
                qs = qs.filter(worker__id=worker_id) | qs.filter(worker__worker_id=worker_id)
            else:
                qs = qs.filter(worker__worker_id=worker_id)

        dept_id = self.request.query_params.get('department')
        if dept_id and dept_id != 'All':
            if str(dept_id).isdigit():
                qs = qs.filter(worker__department__id=dept_id) | qs.filter(worker__department__name__iexact=dept_id)
            else:
                qs = qs.filter(worker__department__name__iexact=dept_id)

        status_val = self.request.query_params.get('status')
        if status_val and status_val != 'All':
            qs = qs.filter(status=status_val)

        approval_val = self.request.query_params.get('approval_status')
        if approval_val and approval_val != 'All':
            qs = qs.filter(approval_status=approval_val)

        return qs.order_by('-attendance_date', 'worker__worker_id')


class AttendanceRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        record = self.get_object()
        if record.approval_status == AttendanceRecord.APPROVAL_LOCKED:
            raise serializers.ValidationError("Cannot modify attendance that has been locked for approved payroll.")
        serializer.save()


class AttendanceBulkSaveView(APIView):
    """
    Bulk save attendance records (Manual Day-wise or Worker-wise).
    Saves as Draft or Submits for Review.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        records_data = request.data.get('records', [])
        if not isinstance(records_data, list):
            return Response({'error': 'Payload must contain a "records" list.'}, status=status.HTTP_400_BAD_REQUEST)

        default_date = request.data.get('date') or timezone.localdate().isoformat()
        approval_status = request.data.get('approval_status', AttendanceRecord.APPROVAL_DRAFT)

        saved_records = []
        errors = []

        with transaction.atomic():
            for idx, item in enumerate(records_data):
                w_id = item.get('workerId') or item.get('worker_id') or item.get('worker')
                worker = Worker.objects.filter(worker_id__iexact=str(w_id)).first()
                if not worker and str(w_id).isdigit():
                    worker = Worker.objects.filter(id=int(w_id)).first()

                if not worker:
                    errors.append({'index': idx, 'error': f'Worker {w_id} not found.'})
                    continue

                rec_date = item.get('date') or default_date
                time_in = item.get('timeIn') or item.get('time_in') or ''
                time_out = item.get('timeOut') or item.get('time_out') or ''
                break_mins = int(item.get('breakMinutes') or item.get('break_minutes') or 60)
                status_val = item.get('status') or AttendanceRecord.STATUS_PRESENT
                remarks = item.get('remarks') or ''

                calc = calculate_working_and_overtime(time_in, time_out, break_minutes=break_mins)

                record, created = AttendanceRecord.objects.get_or_create(
                    worker=worker,
                    attendance_date=rec_date,
                    defaults={
                        'status': status_val,
                        'time_in': time_in,
                        'time_out': time_out,
                        'break_minutes': break_mins,
                        'working_hours': calc['working_hours'],
                        'overtime_hours': calc['overtime_hours'],
                        'approval_status': approval_status,
                        'remarks': remarks,
                        'source': AttendanceRecord.SOURCE_MANUAL,
                    }
                )

                if not created:
                    if record.approval_status == AttendanceRecord.APPROVAL_LOCKED:
                        errors.append({'index': idx, 'error': f'Record for {worker.worker_id} on {rec_date} is locked.'})
                        continue
                    record.status = status_val
                    record.time_in = time_in
                    record.time_out = time_out
                    record.break_minutes = break_mins
                    record.working_hours = calc['working_hours']
                    record.overtime_hours = calc['overtime_hours']
                    record.approval_status = approval_status
                    record.remarks = remarks
                    record.save()

                saved_records.append(record)

        return Response({
            'message': f'Successfully processed {len(saved_records)} attendance records.',
            'count': len(saved_records),
            'errors': errors
        }, status=status.HTTP_200_OK)


class AttendanceApproveBulkView(APIView):
    """
    Approve or Reject attendance records in bulk.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        record_ids = request.data.get('record_ids', [])
        if not isinstance(record_ids, list):
            if hasattr(request.data, 'getlist'):
                record_ids = request.data.getlist('record_ids')
            else:
                record_ids = [record_ids] if record_ids else []

        if not record_ids:
            return Response({'error': 'No record_ids provided.'}, status=status.HTTP_400_BAD_REQUEST)

        action = request.data.get('action', 'Approved')
        reason = request.data.get('reason', '')

        valid_status = (
            AttendanceRecord.APPROVAL_APPROVED if action.lower() == 'approved'
            else AttendanceRecord.APPROVAL_REJECTED
        )

        records = AttendanceRecord.objects.filter(id__in=record_ids).exclude(
            approval_status=AttendanceRecord.APPROVAL_LOCKED
        )
        updated_count = records.update(
            approval_status=valid_status,
            approved_by=request.user,
            approved_at=timezone.now(),
            correction_reason=reason
        )

        AuditLog.objects.create(
            actor=request.user,
            action=action.upper(),
            model_name='AttendanceRecord',
            record_id=f'{updated_count} records',
            details={'record_ids': record_ids, 'reason': reason},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'message': f'Successfully updated {updated_count} records to {valid_status}.',
            'updated_count': updated_count
        }, status=status.HTTP_200_OK)


class AttendanceStatsDailyView(APIView):
    """
    Returns dynamic day-wise attendance counters for any specified date.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_str = request.query_params.get('date') or timezone.localdate().isoformat()
        records = AttendanceRecord.objects.filter(attendance_date=date_str)
        total_workers = Worker.objects.filter(status='Active').count()

        present = records.filter(status=AttendanceRecord.STATUS_PRESENT).count()
        absent = records.filter(status=AttendanceRecord.STATUS_ABSENT).count()
        leave = records.filter(status=AttendanceRecord.STATUS_LEAVE).count()
        half_day = records.filter(status=AttendanceRecord.STATUS_HALF_DAY).count()
        total_ot_hours = sum(r.overtime_hours for r in records)

        return Response({
            'date': date_str,
            'total_workers': total_workers,
            'recorded_attendance': records.count(),
            'present': present,
            'absent': absent,
            'leave': leave,
            'half_day': half_day,
            'total_overtime_hours': float(total_ot_hours),
        }, status=status.HTTP_200_OK)


class AttendanceImportView(APIView):
    """
    Upload CSV or Excel file of attendance, validate rows, and insert/update records.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'No file uploaded. Please provide a CSV or Excel file.'}, status=status.HTTP_400_BAD_REQUEST)

        file_name = uploaded_file.name
        is_excel = file_name.endswith(('.xlsx', '.xls'))
        is_csv = file_name.endswith('.csv')

        if not (is_excel or is_csv):
            return Response({'error': 'Unsupported file format. Please upload .csv or .xlsx.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if is_excel:
                df = pd.read_excel(uploaded_file)
            else:
                df = pd.read_csv(uploaded_file)
        except Exception as e:
            return Response({'error': f'Failed to parse file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        total_rows = len(df)
        valid_rows = 0
        invalid_rows = 0
        inserted_rows = 0
        updated_rows = 0
        errors = []

        batch = AttendanceImportBatch.objects.create(
            file_name=file_name,
            file_format='Excel' if is_excel else 'CSV',
            uploaded_by=request.user,
            total_rows=total_rows,
            status=AttendanceImportBatch.STATUS_PROCESSING
        )

        with transaction.atomic():
            for idx, row in df.iterrows():
                # Normalize column headers
                row_dict = {str(k).strip().lower().replace(' ', '_'): v for k, v in row.items()}
                w_code = str(row_dict.get('worker_id') or row_dict.get('workerid') or row_dict.get('id') or '').strip()
                date_val = str(row_dict.get('date') or row_dict.get('attendance_date') or '').strip()

                if not w_code or not date_val or date_val in ('nan', 'NaT'):
                    invalid_rows += 1
                    errors.append({'row': idx + 2, 'error': 'Missing Worker ID or Date'})
                    continue

                worker = Worker.objects.filter(worker_id__iexact=w_code).first()
                if not worker:
                    invalid_rows += 1
                    errors.append({'row': idx + 2, 'error': f'Worker {w_code} does not exist.'})
                    continue

                # Parse date
                try:
                    parsed_date = pd.to_datetime(date_val).date()
                except Exception:
                    invalid_rows += 1
                    errors.append({'row': idx + 2, 'error': f'Invalid date format: {date_val}'})
                    continue

                status_val = str(row_dict.get('status') or 'Present').strip().capitalize()
                time_in = str(row_dict.get('time_in') or '08:00 AM').strip() if status_val == 'Present' else ''
                time_out = str(row_dict.get('time_out') or '05:00 PM').strip() if status_val == 'Present' else ''

                calc = calculate_working_and_overtime(time_in, time_out)

                rec, created = AttendanceRecord.objects.get_or_create(
                    worker=worker,
                    attendance_date=parsed_date,
                    defaults={
                        'status': status_val,
                        'time_in': time_in,
                        'time_out': time_out,
                        'working_hours': calc['working_hours'],
                        'overtime_hours': calc['overtime_hours'],
                        'source': AttendanceRecord.SOURCE_IMPORTED,
                        'approval_status': AttendanceRecord.APPROVAL_PENDING,
                    }
                )

                if created:
                    inserted_rows += 1
                else:
                    if rec.approval_status != AttendanceRecord.APPROVAL_LOCKED:
                        rec.status = status_val
                        rec.time_in = time_in
                        rec.time_out = time_out
                        rec.working_hours = calc['working_hours']
                        rec.overtime_hours = calc['overtime_hours']
                        rec.source = AttendanceRecord.SOURCE_IMPORTED
                        rec.save()
                        updated_rows += 1

                valid_rows += 1

            batch.valid_rows = valid_rows
            batch.invalid_rows = invalid_rows
            batch.inserted_rows = inserted_rows
            batch.updated_rows = updated_rows
            batch.errors_log = errors
            batch.status = AttendanceImportBatch.STATUS_COMPLETED
            batch.completion_time = timezone.now()
            batch.save()

        return Response({
            'message': f'Import completed: {inserted_rows} inserted, {updated_rows} updated, {invalid_rows} invalid.',
            'batch_id': batch.id,
            'total_rows': total_rows,
            'valid_rows': valid_rows,
            'inserted_rows': inserted_rows,
            'updated_rows': updated_rows,
            'errors': errors[:20],
        }, status=status.HTTP_200_OK)


class AttendanceImportBatchListView(generics.ListAPIView):
    queryset = AttendanceImportBatch.objects.all().order_by('-upload_timestamp')
    serializer_class = AttendanceImportBatchSerializer
    permission_classes = [IsAuthenticated]


class AttendanceExportView(APIView):
    """
    Export attendance register to CSV format.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_str = request.query_params.get('date')
        qs = AttendanceRecord.objects.select_related('worker', 'worker__department').order_by('worker__worker_id')
        if date_str:
            qs = qs.filter(attendance_date=date_str)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="attendance_export_{date_str or "all"}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Worker ID', 'Name', 'Department', 'Date', 'Status', 'Time In', 'Time Out', 'Working Hours', 'Overtime', 'Approval Status'])

        for r in qs:
            writer.writerow([
                r.worker.worker_id,
                r.worker.name,
                r.worker.department.name if r.worker.department else 'N/A',
                r.attendance_date,
                r.status,
                r.time_in,
                r.time_out,
                r.working_hours,
                r.overtime_hours,
                r.approval_status
            ])

        return response


class AttendancePunchListCreateView(generics.ListCreateAPIView):
    serializer_class = AttendancePunchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AttendancePunch.objects.select_related('worker').order_by('-punch_time')
        worker_id = self.request.query_params.get('worker')
        if worker_id:
            if str(worker_id).isdigit():
                qs = qs.filter(worker__id=worker_id) | qs.filter(worker__worker_id=worker_id)
            else:
                qs = qs.filter(worker__worker_id=worker_id)
        date_str = self.request.query_params.get('date')
        if date_str:
            qs = qs.filter(punch_time__date=date_str)
        is_processed = self.request.query_params.get('is_processed')
        if is_processed is not None:
            qs = qs.filter(is_processed=is_processed.lower() in ('true', '1'))
        return qs


class AttendancePunchDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AttendancePunch.objects.all()
    serializer_class = AttendancePunchSerializer
    permission_classes = [IsAuthenticated]
