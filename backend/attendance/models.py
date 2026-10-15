from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel

User = get_user_model()


class Shift(TimeStampedModel):
    """
    Configurable shift definition for industrial workforce.
    """
    name = models.CharField(max_length=100, unique=True, help_text='e.g. Day Shift (8:00 AM - 5:00 PM)')
    code = models.CharField(max_length=20, unique=True, help_text='e.g. SHIFT-A, SHIFT-B')
    start_time = models.TimeField(help_text='Shift scheduled start time')
    end_time = models.TimeField(help_text='Shift scheduled end time')
    break_duration_minutes = models.PositiveIntegerField(default=60, help_text='Unpaid break in minutes (default 60m)')
    standard_hours = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('8.00'), help_text='Scheduled hours (usually 8.00)')
    is_night_shift = models.BooleanField(default=False, help_text='Crosses midnight boundary')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['code']
        verbose_name = 'Shift'
        verbose_name_plural = 'Shifts'

    def __str__(self):
        return f"{self.name} ({self.code})"


class AttendanceRecord(TimeStampedModel):
    """
    Single attendance entry per worker per date.
    Maintains calculated hours, overtime, and rigorous approval workflow.
    """
    STATUS_PRESENT = 'Present'
    STATUS_ABSENT = 'Absent'
    STATUS_LEAVE = 'Leave'
    STATUS_HALF_DAY = 'Half Day'

    STATUS_CHOICES = [
        (STATUS_PRESENT, 'Present'),
        (STATUS_ABSENT, 'Absent'),
        (STATUS_LEAVE, 'Leave'),
        (STATUS_HALF_DAY, 'Half Day'),
    ]

    APPROVAL_DRAFT = 'Draft'
    APPROVAL_PENDING = 'Pending Review'
    APPROVAL_APPROVED = 'Approved'
    APPROVAL_REJECTED = 'Rejected'
    APPROVAL_LOCKED = 'Locked'

    APPROVAL_CHOICES = [
        (APPROVAL_DRAFT, 'Draft'),
        (APPROVAL_PENDING, 'Pending Review'),
        (APPROVAL_APPROVED, 'Approved'),
        (APPROVAL_REJECTED, 'Rejected'),
        (APPROVAL_LOCKED, 'Locked'),
    ]

    SOURCE_MANUAL = 'manual'
    SOURCE_IMPORTED = 'imported'

    SOURCE_CHOICES = [
        (SOURCE_MANUAL, 'Manual Entry'),
        (SOURCE_IMPORTED, 'Imported File'),
    ]

    worker = models.ForeignKey('workers.Worker', on_delete=models.CASCADE, related_name='attendance_records')
    attendance_date = models.DateField(db_index=True)
    shift = models.ForeignKey(Shift, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PRESENT, db_index=True)
    time_in = models.CharField(max_length=20, blank=True, default='', help_text='e.g. 08:00 AM or 08:00')
    time_out = models.CharField(max_length=20, blank=True, default='', help_text='e.g. 05:00 PM or 17:00')
    break_minutes = models.PositiveIntegerField(default=60)
    working_hours = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), help_text='Net working hours')
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'), help_text='Approved eligible overtime hours')
    approval_status = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default=APPROVAL_DRAFT, db_index=True)
    remarks = models.TextField(blank=True, default='')
    correction_reason = models.TextField(blank=True, default='')
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default=SOURCE_MANUAL)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_attendance')
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-attendance_date', 'worker__worker_id']
        constraints = [
            models.UniqueConstraint(fields=['worker', 'attendance_date'], name='unique_worker_attendance_date')
        ]
        verbose_name = 'Attendance Record'
        verbose_name_plural = 'Attendance Records'

    def __str__(self):
        return f"{self.worker.worker_id} - {self.attendance_date}: {self.status} ({self.approval_status})"


class AttendanceImportBatch(TimeStampedModel):
    """
    Audit log of imported attendance files (Excel, CSV) with per-row stats and error logs.
    """
    STATUS_PROCESSING = 'Processing'
    STATUS_COMPLETED = 'Completed'
    STATUS_FAILED = 'Failed'

    STATUS_CHOICES = [
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
    ]

    file_name = models.CharField(max_length=255)
    file_format = models.CharField(max_length=20, default='CSV')
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    upload_timestamp = models.DateTimeField(auto_now_add=True)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    department = models.ForeignKey('departments.Department', on_delete=models.SET_NULL, null=True, blank=True)
    total_rows = models.PositiveIntegerField(default=0)
    valid_rows = models.PositiveIntegerField(default=0)
    invalid_rows = models.PositiveIntegerField(default=0)
    duplicate_rows = models.PositiveIntegerField(default=0)
    inserted_rows = models.PositiveIntegerField(default=0)
    updated_rows = models.PositiveIntegerField(default=0)
    errors_log = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_COMPLETED)
    completion_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-upload_timestamp']
        verbose_name = 'Attendance Import Batch'
        verbose_name_plural = 'Attendance Import Batches'

    def __str__(self):
        return f"Import Batch {self.file_name} ({self.upload_timestamp:%Y-%m-%d %H:%M})"
