from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel

User = get_user_model()


class Worker(TimeStampedModel):
    """
    Worker model representing an employee or contractor worker in PaySphere.
    """
    STATUS_ACTIVE = 'Active'
    STATUS_INACTIVE = 'Inactive'
    STATUS_ON_LEAVE = 'On Leave'
    STATUS_TERMINATED = 'Terminated'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_INACTIVE, 'Inactive'),
        (STATUS_ON_LEAVE, 'On Leave'),
        (STATUS_TERMINATED, 'Terminated'),
    ]

    WORKER_TYPE_PERMANENT = 'Permanent'
    WORKER_TYPE_CONTRACTOR = 'Contractor'

    WORKER_TYPE_CHOICES = [
        (WORKER_TYPE_PERMANENT, 'Permanent'),
        (WORKER_TYPE_CONTRACTOR, 'Contractor'),
    ]

    WAGE_BASIS_MONTHLY = 'Monthly'
    WAGE_BASIS_DAILY = 'Daily'
    WAGE_BASIS_HOURLY = 'Hourly'

    WAGE_BASIS_CHOICES = [
        (WAGE_BASIS_MONTHLY, 'Monthly'),
        (WAGE_BASIS_DAILY, 'Daily'),
        (WAGE_BASIS_HOURLY, 'Hourly'),
    ]

    worker_id = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        error_messages={
            'unique': 'A worker with this Worker ID already exists.',
        },
        help_text='Unique identifier code for the worker (e.g. W001, EMP-101)'
    )
    name = models.CharField(
        max_length=150,
        help_text='Full name of the worker'
    )
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='workers',
        help_text='Department where the worker is assigned'
    )
    designation = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text='Role/Designation (e.g. CNC Operator, Supervisor)'
    )
    phone = models.CharField(
        max_length=25,
        blank=True,
        default='',
        help_text='Contact phone number'
    )
    email = models.EmailField(
        blank=True,
        default='',
        help_text='Email address'
    )
    joining_date = models.DateField(
        null=True,
        blank=True,
        help_text='Date the worker joined the organization'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_ACTIVE,
        db_index=True,
        help_text='Current employment status'
    )
    worker_type = models.CharField(
        max_length=50,
        choices=WORKER_TYPE_CHOICES,
        default=WORKER_TYPE_PERMANENT,
        blank=True,
        help_text='Permanent or Contractor'
    )
    wage_basis = models.CharField(
        max_length=20,
        choices=WAGE_BASIS_CHOICES,
        default=WAGE_BASIS_MONTHLY,
        help_text='Wage calculation basis: Monthly, Daily, or Hourly'
    )
    base_wage = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('25000.00'),
        help_text='Base wage or monthly rate in INR'
    )
    overtime_eligible = models.BooleanField(
        default=True,
        help_text='Whether this worker is eligible for overtime pay'
    )
    gender = models.CharField(
        max_length=20,
        blank=True,
        default='Male'
    )
    dob = models.DateField(
        null=True,
        blank=True,
        help_text='Date of birth'
    )
    address = models.TextField(
        blank=True,
        default=''
    )
    photo = models.TextField(
        blank=True,
        default=''
    )
    contractor_agency = models.CharField(
        max_length=150,
        blank=True,
        default=''
    )
    bank_account = models.CharField(
        max_length=50,
        blank=True,
        default=''
    )
    ifsc_code = models.CharField(
        max_length=20,
        blank=True,
        default=''
    )
    aadhar_number = models.CharField(
        max_length=30,
        blank=True,
        default=''
    )
    pan_number = models.CharField(
        max_length=20,
        blank=True,
        default=''
    )

    class Meta:
        ordering = ['worker_id']
        verbose_name = 'Worker'
        verbose_name_plural = 'Workers'

    def __str__(self):
        return f"{self.worker_id} - {self.name}"

    def deactivate(self):
        """Authorised deactivation helper."""
        self.status = self.STATUS_INACTIVE
        self.save(update_fields=['status', 'updated_at'])


class WorkerWageHistory(TimeStampedModel):
    """
    Immutable audit history of wage revisions with effective dates.
    Ensures wage changes do not mutate historical payroll calculations.
    """
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='wage_history')
    effective_date = models.DateField(db_index=True)
    wage_basis = models.CharField(max_length=20, choices=Worker.WAGE_BASIS_CHOICES)
    base_wage = models.DecimalField(max_digits=10, decimal_places=2)
    revised_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    remarks = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-effective_date', '-created_at']
        verbose_name = 'Worker Wage History'
        verbose_name_plural = 'Worker Wage Histories'

    def __str__(self):
        return f"{self.worker.worker_id} wage revision {self.effective_date}: {self.base_wage}"


class WorkerDepartmentHistory(TimeStampedModel):
    """
    Immutable audit history of worker department transfers with effective dates.
    """
    worker = models.ForeignKey(Worker, on_delete=models.CASCADE, related_name='department_history')
    effective_date = models.DateField(db_index=True)
    department = models.ForeignKey('departments.Department', on_delete=models.CASCADE)
    transferred_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    remarks = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-effective_date', '-created_at']
        verbose_name = 'Worker Department History'
        verbose_name_plural = 'Worker Department Histories'

    def __str__(self):
        return f"{self.worker.worker_id} transferred to {self.department.name} on {self.effective_date}"
