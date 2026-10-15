from decimal import Decimal
from rest_framework import serializers
from .models import Shift, AttendanceRecord, AttendanceImportBatch
from workers.models import Worker
from payroll.calculations import calculate_working_and_overtime


class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = '__all__'


class AttendanceRecordSerializer(serializers.ModelSerializer):
    worker_name = serializers.ReadOnlyField(source='worker.name')
    worker_id_code = serializers.ReadOnlyField(source='worker.worker_id')
    department_name = serializers.ReadOnlyField(source='worker.department.name')
    shift_name = serializers.ReadOnlyField(source='shift.name')
    approved_by_name = serializers.ReadOnlyField(source='approved_by.username')

    class Meta:
        model = AttendanceRecord
        fields = [
            'id',
            'worker',
            'worker_id_code',
            'worker_name',
            'department_name',
            'attendance_date',
            'shift',
            'shift_name',
            'status',
            'time_in',
            'time_out',
            'break_minutes',
            'working_hours',
            'overtime_hours',
            'approval_status',
            'remarks',
            'correction_reason',
            'source',
            'approved_by',
            'approved_by_name',
            'approved_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'approved_by_name']

    def validate(self, attrs):
        time_in = attrs.get('time_in', self.instance.time_in if self.instance else '')
        time_out = attrs.get('time_out', self.instance.time_out if self.instance else '')
        break_mins = attrs.get('break_minutes', self.instance.break_minutes if self.instance else 60)
        status_val = attrs.get('status', self.instance.status if self.instance else AttendanceRecord.STATUS_PRESENT)

        if status_val == AttendanceRecord.STATUS_PRESENT and time_in and time_out:
            calc = calculate_working_and_overtime(time_in, time_out, break_minutes=break_mins)
            attrs['working_hours'] = calc['working_hours']
            attrs['overtime_hours'] = calc['overtime_hours']
        elif status_val in (AttendanceRecord.STATUS_ABSENT, AttendanceRecord.STATUS_LEAVE):
            attrs['working_hours'] = Decimal('0.00')
            attrs['overtime_hours'] = Decimal('0.00')

        return attrs


class AttendanceImportBatchSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.ReadOnlyField(source='uploaded_by.username')
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = AttendanceImportBatch
        fields = '__all__'
