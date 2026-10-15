from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel

User = get_user_model()


class Advance(TimeStampedModel):
    """
    Advance record for workers, supporting both Salary Advance (short-term)
    and Fixed Advance (long-term multi-month recovery).
    """
    TYPE_SALARY_ADVANCE = 'Salary Advance'
    TYPE_FIXED_ADVANCE = 'Fixed Advance'

    TYPE_CHOICES = [
        (TYPE_SALARY_ADVANCE, 'Salary Advance'),
        (TYPE_FIXED_ADVANCE, 'Fixed Advance'),
    ]

    STATUS_PENDING = 'Pending'
    STATUS_APPROVED = 'Approved'
    STATUS_REJECTED = 'Rejected'
    STATUS_COMPLETED = 'Completed'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_COMPLETED, 'Completed'),
    ]

    advance_id = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        help_text='Unique advance tracking ID (e.g. ADV-001 or FA-001)'
    )
    worker = models.ForeignKey('workers.Worker', on_delete=models.CASCADE, related_name='advances')
    advance_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default=TYPE_SALARY_ADVANCE)
    principal_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text='Original sanctioned advance amount')
    monthly_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), help_text='Agreed deduction per payroll run')
    issue_date = models.DateField()
    repayment_start_date = models.DateField(null=True, blank=True)
    reason = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_APPROVED)
    outstanding_balance = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_advances')
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-issue_date', '-created_at']
        verbose_name = 'Advance'
        verbose_name_plural = 'Advances'

    def __str__(self):
        return f"{self.advance_id} - {self.worker.name} ({self.advance_type}: {self.outstanding_balance} left)"

    def record_repayment(self, amount, transaction_type='Payroll Deduction', reference_no='', notes='', user=None):
        """
        Safely records a repayment against this advance and creates an audit transaction entry.
        Guarantees that repayment will not exceed the outstanding balance without authorization.
        """
        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValueError("Repayment amount must be strictly positive.")
        if amount > self.outstanding_balance:
            raise ValueError(f"Repayment amount (₹{amount}) cannot exceed current outstanding balance (₹{self.outstanding_balance}).")

        new_balance = self.outstanding_balance - amount
        self.outstanding_balance = new_balance
        if new_balance == Decimal('0.00'):
            self.status = self.STATUS_COMPLETED
        self.save(update_fields=['outstanding_balance', 'status', 'updated_at'])

        transaction = AdvanceTransaction.objects.create(
            advance=self,
            transaction_type=transaction_type,
            amount=amount,
            balance_after=new_balance,
            transaction_date=self.issue_date,  # will default or pass current date
            reference_number=reference_no,
            notes=notes,
            created_by=user
        )
        return transaction


class AdvanceTransaction(TimeStampedModel):
    """
    Immutable ledger of advance disbursements, payroll recoveries, and manual adjustments.
    """
    TYPE_DISBURSEMENT = 'Disbursement'
    TYPE_PAYROLL_DEDUCTION = 'Payroll Deduction'
    TYPE_MANUAL_REPAYMENT = 'Manual Repayment'
    TYPE_ADJUSTMENT = 'Adjustment'

    TRANSACTION_TYPE_CHOICES = [
        (TYPE_DISBURSEMENT, 'Disbursement'),
        (TYPE_PAYROLL_DEDUCTION, 'Payroll Deduction'),
        (TYPE_MANUAL_REPAYMENT, 'Manual Repayment'),
        (TYPE_ADJUSTMENT, 'Adjustment'),
    ]

    advance = models.ForeignKey(Advance, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=30, choices=TRANSACTION_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_date = models.DateField()
    reference_number = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-transaction_date', '-created_at']
        verbose_name = 'Advance Transaction'
        verbose_name_plural = 'Advance Transactions'

    def __str__(self):
        return f"{self.advance.advance_id} {self.transaction_type}: ₹{self.amount} (Balance: ₹{self.balance_after})"
