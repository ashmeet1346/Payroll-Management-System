from django.contrib import admin
from .models import Shift, AttendanceRecord, AttendanceImportBatch, AttendancePunch


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'start_time', 'end_time', 'standard_hours', 'is_night_shift', 'is_active']
    list_filter = ['is_active', 'is_night_shift']


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['worker', 'attendance_date', 'status', 'time_in', 'time_out', 'working_hours', 'overtime_hours', 'approval_status', 'source']
    list_filter = ['status', 'approval_status', 'source', 'attendance_date']
    search_fields = ['worker__worker_id', 'worker__name']


@admin.register(AttendanceImportBatch)
class AttendanceImportBatchAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'file_format', 'upload_timestamp', 'total_rows', 'valid_rows', 'inserted_rows', 'status']
    list_filter = ['status', 'file_format']


@admin.register(AttendancePunch)
class AttendancePunchAdmin(admin.ModelAdmin):
    list_display = ['worker', 'punch_time', 'punch_type', 'device_id', 'location', 'is_processed']
    list_filter = ['punch_type', 'is_processed', 'device_id']
    search_fields = ['worker__worker_id', 'worker__name', 'device_id', 'location']
