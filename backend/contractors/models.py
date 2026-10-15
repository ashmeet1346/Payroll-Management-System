from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel

User = get_user_model()


class Contractor(TimeStampedModel):
    """
    Contractor entity providing contract workforce to PaySphere.
    """
    contractor_id = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text='Unique identifier for contractor (e.g. CON-001)'
    )
    name = models.CharField(max_length=200, help_text='Agency or Contractor business name')
    contact_person = models.CharField(max_length=150, blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    address = models.TextField(blank=True, default='')
    pan_number = models.CharField(max_length=20, blank=True, default='')
    gst_number = models.CharField(max_length=30, blank=True, default='')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['contractor_id']
        verbose_name = 'Contractor'
        verbose_name_plural = 'Contractors'

    def __str__(self):
        return f"{self.contractor_id} - {self.name}"

    @property
    def total_assigned_workers(self):
        return self.worker_assignments.filter(is_active=True).count()


class Contract(TimeStampedModel):
    """
    Contract terms, rates, and validity periods agreed with an agency.
    """
    BILLING_BASIS_DAILY = 'Per Day'
    BILLING_BASIS_HOURLY = 'Per Hour'
    BILLING_BASIS_PIECE = 'Piece Rate'
    BILLING_BASIS_MONTHLY = 'Fixed Monthly'

    BILLING_BASIS_CHOICES = [
        (BILLING_BASIS_DAILY, 'Per Day'),
        (BILLING_BASIS_HOURLY, 'Per Hour'),
        (BILLING_BASIS_PIECE, 'Piece Rate'),
        (BILLING_BASIS_MONTHLY, 'Fixed Monthly'),
    ]

    STATUS_ACTIVE = 'Active'
    STATUS_EXPIRED = 'Expired'
    STATUS_TERMINATED = 'Terminated'

    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_EXPIRED, 'Expired'),
        (STATUS_TERMINATED, 'Terminated'),
    ]

    contractor = models.ForeignKey(Contractor, on_delete=models.CASCADE, related_name='contracts')
    contract_number = models.CharField(max_length=100, unique=True)
    start_date = models.DateField()
    end_date = models.DateField()
    billing_basis = models.CharField(max_length=30, choices=BILLING_BASIS_CHOICES, default=BILLING_BASIS_DAILY)
    agreed_rate = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('650.00'), help_text='Agreed rate per unit basis')
    overtime_rate = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('150.00'), help_text='Hourly OT rate if applicable')
    terms = models.TextField(blank=True, default='')
    document_ref = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)

    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Contract'
        verbose_name_plural = 'Contracts'

    def __str__(self):
        return f"{self.contract_number} ({self.contractor.name})"


class ContractorWorkerAssignment(TimeStampedModel):
    """
    Tracks which workers are supplied by which contractor with historical assignment periods.
    """
    contractor = models.ForeignKey(Contractor, on_delete=models.CASCADE, related_name='worker_assignments')
    worker = models.ForeignKey('workers.Worker', on_delete=models.CASCADE, related_name='contractor_assignments')
    department = models.ForeignKey('departments.Department', on_delete=models.SET_NULL, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-start_date']
        verbose_name = 'Contractor Worker Assignment'
        verbose_name_plural = 'Contractor Worker Assignments'

    def __str__(self):
        return f"{self.worker.name} -> {self.contractor.name} ({'Active' if self.is_active else 'Ended'})"


class ContractorBill(TimeStampedModel):
    """
    Contractor invoices verified against approved attendance and agreed billing rates.
    """
    STATUS_DRAFT = 'Draft'
    STATUS_REVIEW = 'Under Review'
    STATUS_APPROVED = 'Approved'
    STATUS_PAID = 'Paid'
    STATUS_REJECTED = 'Rejected'

    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_REVIEW, 'Under Review'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_PAID, 'Paid'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    invoice_number = models.CharField(max_length=100, unique=True, db_index=True)
    invoice_date = models.DateField()
    billing_period_start = models.DateField()
    billing_period_end = models.DateField()
    contractor = models.ForeignKey(Contractor, on_delete=models.CASCADE, related_name='bills')
    total_man_days = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    agreed_rate = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    billable_overtime_hours = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    overtime_rate = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    base_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    overtime_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text='GST / statutory taxes')
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'), help_text='TDS / penalties')
    approved_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    payment_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    payment_date = models.DateField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    remarks = models.TextField(blank=True, default='')
    verified_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-invoice_date']
        verbose_name = 'Contractor Bill'
        verbose_name_plural = 'Contractor Bills'

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.contractor.name} ({self.status})"

    @property
    def outstanding_balance(self):
        return max(Decimal('0.00'), self.approved_amount - self.payment_amount)
