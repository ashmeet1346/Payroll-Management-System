import csv
from decimal import Decimal
from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SalaryRuleConfig, PayrollPeriod, PayrollLine, SalaryPayment
from .serializers import (
    SalaryRuleConfigSerializer,
    PayrollPeriodSerializer,
    PayrollLineSerializer,
    SalaryPaymentSerializer,
)
from .calculations import (
    calculate_payable_days,
    calculate_worker_salary,
    round_currency,
)
from workers.models import Worker
from attendance.models import AttendanceRecord
from advances.models import Advance, AdvanceTransaction
from advances.calculations import calculate_total_worker_advance_recovery
from core.models import AuditLog


class SalaryRuleConfigView(APIView):
    """
    Get or update active payroll calculation rules & statutory percentage rates.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        config = SalaryRuleConfig.objects.filter(is_active=True).first()
        if not config:
            config = SalaryRuleConfig.objects.create()
        return Response(SalaryRuleConfigSerializer(config).data)

    def put(self, request):
        config = SalaryRuleConfig.objects.filter(is_active=True).first()
        if not config:
            config = SalaryRuleConfig.objects.create()
        serializer = SalaryRuleConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        AuditLog.objects.create(
            actor=request.user,
            action='UPDATE',
            model_name='SalaryRuleConfig',
            record_id=str(config.id),
            details=request.data,
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response(serializer.data)


class PayrollPeriodListCreateView(generics.ListCreateAPIView):
    queryset = PayrollPeriod.objects.all().order_by('-year', '-month', '-run_number')
    serializer_class = PayrollPeriodSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PayrollPeriodDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PayrollPeriod.objects.all()
    serializer_class = PayrollPeriodSerializer
    permission_classes = [IsAuthenticated]


class PayrollCalculateView(APIView):
    """
    Compute full payroll sheet for all active workers for the given period.
    Aggregates approved attendance, computes statutory deductions, applies advances.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            period = PayrollPeriod.objects.get(pk=pk)
        except PayrollPeriod.DoesNotExist:
            return Response({'error': 'Payroll period not found.'}, status=status.HTTP_404_NOT_FOUND)

        if period.status in (PayrollPeriod.STATUS_LOCKED, PayrollPeriod.STATUS_PAID):
            return Response({'error': f'Cannot recalculate payroll in {period.status} status.'}, status=status.HTTP_400_BAD_REQUEST)

        rule_config = SalaryRuleConfig.objects.filter(is_active=True).first()
        workers = Worker.objects.filter(status='Active')

        total_gross = Decimal('0.00')
        total_deductions = Decimal('0.00')
        total_net = Decimal('0.00')

        with transaction.atomic():
            for worker in workers:
                # 1. Aggregate attendance for period
                records = AttendanceRecord.objects.filter(
                    worker=worker,
                    attendance_date__range=[period.start_date, period.end_date]
                )

                present_days = Decimal(str(records.filter(status=AttendanceRecord.STATUS_PRESENT).count()))
                absent_days = Decimal(str(records.filter(status=AttendanceRecord.STATUS_ABSENT).count()))
                half_days = Decimal(str(records.filter(status=AttendanceRecord.STATUS_HALF_DAY).count()))
                leave_days = Decimal(str(records.filter(status=AttendanceRecord.STATUS_LEAVE).count()))

                payable_days = calculate_payable_days(present_days, half_days, leave_days)

                # Approved overtime hours only
                approved_ot_records = records.filter(approval_status=AttendanceRecord.APPROVAL_APPROVED)
                ot_hours = sum(r.overtime_hours for r in approved_ot_records)

                # 2. Advance recovery scheduled for this month
                advance_due = calculate_total_worker_advance_recovery(worker)

                # 3. Compute salary breakdown
                calc = calculate_worker_salary(
                    base_wage=worker.base_wage,
                    wage_basis=worker.wage_basis,
                    payable_days=payable_days,
                    approved_ot_hours=ot_hours,
                    advance_deduction=advance_due,
                    rule_config=rule_config
                )

                # 4. Save or update payroll line
                line, _ = PayrollLine.objects.get_or_create(
                    payroll_period=period,
                    worker=worker,
                    defaults={
                        'wage_basis': worker.wage_basis,
                        'base_rate': worker.base_wage,
                    }
                )

                line.wage_basis = worker.wage_basis
                line.base_rate = worker.base_wage
                line.present_days = present_days
                line.absent_days = absent_days
                line.half_days = half_days
                line.leave_days = leave_days
                line.payable_days = payable_days
                line.approved_overtime_hours = ot_hours

                line.basic_salary = calc['basic_salary']
                line.da = calc['da']
                line.hra = calc['hra']
                line.allowances = calc['allowances']
                line.overtime_amount = calc['overtime_amount']
                line.gross_earnings = calc['gross_earnings']

                line.pf_deduction = calc['pf_deduction']
                line.esi_deduction = calc['esi_deduction']
                line.pt_deduction = calc['pt_deduction']
                line.advance_deduction = calc['advance_deduction']
                line.total_deductions = calc['total_deductions']

                line.net_payable = calc['net_payable']
                line.outstanding_balance = max(Decimal('0.00'), line.net_payable - line.paid_amount)
                line.payslip_number = f"PAY-{period.year}{period.month:02d}-{worker.worker_id}"
                line.calculation_snapshot = {
                    'calculated_at': timezone.now().isoformat(),
                    'rule_config_name': rule_config.name if rule_config else 'Default',
                    'ot_hourly_rate': str(calc['ot_hourly_rate']),
                    'daily_rate': str(calc['daily_rate']),
                }
                line.save()

                total_gross += calc['gross_earnings']
                total_deductions += calc['total_deductions']
                total_net += calc['net_payable']

            period.total_gross = total_gross
            period.total_deductions = total_deductions
            period.total_net_payable = total_net
            period.status = PayrollPeriod.STATUS_CALCULATED
            period.save()

        AuditLog.objects.create(
            actor=request.user,
            action='UPDATE',
            model_name='PayrollPeriod',
            record_id=str(period.id),
            details={'status': 'Calculated', 'total_net': str(total_net), 'worker_count': workers.count()},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'message': f'Successfully calculated payroll for {workers.count()} workers.',
            'period': PayrollPeriodSerializer(period).data
        }, status=status.HTTP_200_OK)


class PayrollApproveView(APIView):
    """
    Approve payroll cycle and post advance deductions to the advance ledger.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            period = PayrollPeriod.objects.get(pk=pk)
        except PayrollPeriod.DoesNotExist:
            return Response({'error': 'Payroll period not found.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            period.status = PayrollPeriod.STATUS_APPROVED
            period.approved_by = request.user
            period.approved_at = timezone.now()
            period.save()

            # Post advance deductions to Advance ledger
            for line in period.lines.filter(advance_deduction__gt=0):
                remaining_deduction = line.advance_deduction
                active_advances = line.worker.advances.filter(status='Approved', outstanding_balance__gt=0).order_by('issue_date')
                for adv in active_advances:
                    if remaining_deduction <= 0:
                        break
                    deduct = min(adv.outstanding_balance, remaining_deduction)
                    adv.record_repayment(
                        amount=deduct,
                        transaction_type=AdvanceTransaction.TYPE_PAYROLL_DEDUCTION,
                        reference_no=f"PAYROLL-{period.name}",
                        notes=f"Auto recovery via approved payroll run {period.name}",
                        user=request.user
                    )
                    remaining_deduction -= deduct

        AuditLog.objects.create(
            actor=request.user,
            action='APPROVE',
            model_name='PayrollPeriod',
            record_id=str(period.id),
            details={'status': 'Approved', 'total_net': str(period.total_net_payable)},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'message': f'Payroll period {period.name} approved successfully.',
            'period': PayrollPeriodSerializer(period).data
        }, status=status.HTTP_200_OK)


class PayrollLockView(APIView):
    """
    Lock approved payroll against any further changes and freeze corresponding attendance.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            period = PayrollPeriod.objects.get(pk=pk)
        except PayrollPeriod.DoesNotExist:
            return Response({'error': 'Payroll period not found.'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            period.status = PayrollPeriod.STATUS_LOCKED
            period.save()

            # Lock all attendance records in period range
            AttendanceRecord.objects.filter(
                attendance_date__range=[period.start_date, period.end_date]
            ).update(approval_status=AttendanceRecord.APPROVAL_LOCKED)

        AuditLog.objects.create(
            actor=request.user,
            action='LOCK',
            model_name='PayrollPeriod',
            record_id=str(period.id),
            details={'status': 'Locked'},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'message': f'Payroll period {period.name} locked successfully.',
            'period': PayrollPeriodSerializer(period).data
        }, status=status.HTTP_200_OK)


class PayrollLineListView(generics.ListAPIView):
    serializer_class = PayrollLineSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = PayrollLine.objects.select_related('worker', 'worker__department', 'payroll_period')
        period_id = self.request.query_params.get('period')
        if period_id:
            qs = qs.filter(payroll_period_id=period_id)

        dept = self.request.query_params.get('department')
        if dept and dept != 'All':
            qs = qs.filter(worker__department__name__iexact=dept)

        payment_status = self.request.query_params.get('payment_status')
        if payment_status and payment_status != 'All':
            qs = qs.filter(payment_status=payment_status)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(worker__name__icontains=search) | qs.filter(worker__worker_id__icontains=search)

        return qs.order_by('worker__worker_id')


class PayrollLineDetailView(generics.RetrieveAPIView):
    queryset = PayrollLine.objects.all()
    serializer_class = PayrollLineSerializer
    permission_classes = [IsAuthenticated]


class SalaryPaymentCreateView(APIView):
    """
    Record full or partial payment against a worker's payroll line.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, line_pk):
        try:
            line = PayrollLine.objects.get(pk=line_pk)
        except PayrollLine.DoesNotExist:
            return Response({'error': 'Payroll line not found.'}, status=status.HTTP_404_NOT_FOUND)

        amount_raw = request.data.get('amount')
        try:
            amount = Decimal(str(amount_raw or 0))
        except Exception:
            return Response({'error': 'Invalid payment amount.'}, status=status.HTTP_400_BAD_REQUEST)

        if amount <= 0:
            return Response({'error': 'Payment amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        new_total_paid = line.paid_amount + amount
        if new_total_paid > line.net_payable:
            return Response({
                'error': f'Total payment (₹{new_total_paid}) cannot exceed net payable (₹{line.net_payable}).'
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            line.paid_amount = new_total_paid
            line.outstanding_balance = max(Decimal('0.00'), line.net_payable - new_total_paid)
            line.payment_status = (
                PayrollLine.STATUS_PAID if line.outstanding_balance == 0
                else PayrollLine.STATUS_PARTIAL_PAID
            )
            line.payment_date = request.data.get('payment_date') or timezone.localdate()
            line.payment_method = request.data.get('payment_method', 'Bank Transfer')
            line.reference_no = request.data.get('reference_number', '')
            line.save()

            payment = SalaryPayment.objects.create(
                payroll_line=line,
                worker=line.worker,
                amount_paid=amount,
                payment_date=line.payment_date,
                payment_method=line.payment_method,
                reference_number=line.reference_no,
                notes=request.data.get('notes', ''),
                recorded_by=request.user
            )

            # Update period total paid
            period = line.payroll_period
            period.total_paid = sum(l.paid_amount for l in period.lines.all())
            if period.total_paid >= period.total_net_payable and period.total_net_payable > 0:
                period.status = PayrollPeriod.STATUS_PAID
            elif period.total_paid > 0:
                period.status = PayrollPeriod.STATUS_PARTIAL_PAID
            period.save()

        AuditLog.objects.create(
            actor=request.user,
            action='PAY',
            model_name='PayrollLine',
            record_id=f'{line.worker.worker_id} - ₹{amount}',
            details={'amount': str(amount), 'reference': line.reference_no},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response({
            'message': f'Recorded payment of ₹{amount} for {line.worker.name}.',
            'line': PayrollLineSerializer(line).data
        }, status=status.HTTP_200_OK)


class PayslipDownloadView(APIView):
    """
    Get detailed printable payslip payload for a worker's payroll line.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, line_pk):
        try:
            line = PayrollLine.objects.select_related('worker', 'worker__department', 'payroll_period').get(pk=line_pk)
        except PayrollLine.DoesNotExist:
            return Response({'error': 'Payroll line not found.'}, status=status.HTTP_404_NOT_FOUND)

        w = line.worker
        p = line.payroll_period

        data = {
            'payslip_number': line.payslip_number,
            'period_name': p.name,
            'period_start': p.start_date,
            'period_end': p.end_date,
            'worker': {
                'worker_id': w.worker_id,
                'name': w.name,
                'designation': w.designation,
                'department': w.department.name if w.department else 'N/A',
                'joining_date': w.joining_date,
                'bank_account': w.bank_account,
                'ifsc_code': w.ifsc_code,
                'pan_number': w.pan_number,
                'aadhar_number': w.aadhar_number,
            },
            'attendance': {
                'present_days': float(line.present_days),
                'absent_days': float(line.absent_days),
                'half_days': float(line.half_days),
                'leave_days': float(line.leave_days),
                'payable_days': float(line.payable_days),
                'overtime_hours': float(line.approved_overtime_hours),
            },
            'earnings': {
                'basic_salary': float(line.basic_salary),
                'dearness_allowance': float(line.da),
                'hra': float(line.hra),
                'other_allowances': float(line.allowances),
                'overtime_earnings': float(line.overtime_amount),
                'gross_earnings': float(line.gross_earnings),
            },
            'deductions': {
                'provident_fund': float(line.pf_deduction),
                'esi': float(line.esi_deduction),
                'professional_tax': float(line.pt_deduction),
                'advance_recovery': float(line.advance_deduction),
                'other_deductions': float(line.other_deductions),
                'total_deductions': float(line.total_deductions),
            },
            'net_payable': float(line.net_payable),
            'paid_amount': float(line.paid_amount),
            'outstanding_balance': float(line.outstanding_balance),
            'payment_status': line.payment_status,
            'payment_method': line.payment_method,
            'payment_date': line.payment_date,
        }
        return Response(data, status=status.HTTP_200_OK)


class PayrollExportView(APIView):
    """
    Export complete monthly payroll sheet to CSV.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            period = PayrollPeriod.objects.get(pk=pk)
        except PayrollPeriod.DoesNotExist:
            return Response({'error': 'Payroll period not found.'}, status=status.HTTP_404_NOT_FOUND)

        lines = period.lines.select_related('worker', 'worker__department').order_by('worker__worker_id')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="payroll_{period.name.replace(" ", "_")}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Worker ID', 'Name', 'Department', 'Wage Basis', 'Base Rate',
            'Present Days', 'Payable Days', 'OT Hours',
            'Basic', 'DA', 'HRA', 'Allowances', 'OT Amount', 'Gross Earnings',
            'PF', 'ESI', 'PT', 'Advance Recovery', 'Total Deductions',
            'Net Payable', 'Paid Amount', 'Balance', 'Status'
        ])

        for line in lines:
            writer.writerow([
                line.worker.worker_id,
                line.worker.name,
                line.worker.department.name if line.worker.department else 'N/A',
                line.wage_basis,
                line.base_rate,
                line.present_days,
                line.payable_days,
                line.approved_overtime_hours,
                line.basic_salary,
                line.da,
                line.hra,
                line.allowances,
                line.overtime_amount,
                line.gross_earnings,
                line.pf_deduction,
                line.esi_deduction,
                line.pt_deduction,
                line.advance_deduction,
                line.total_deductions,
                line.net_payable,
                line.paid_amount,
                line.outstanding_balance,
                line.payment_status
            ])

        return response
