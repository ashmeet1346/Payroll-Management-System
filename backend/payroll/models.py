from decimal import Decimal
from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel

User = get_user_model()


class SalaryRuleConfig(TimeStampedModel):
    """
    Configurable rules and statutory rates for industrial HR & Payroll calculations.
    Can be adjusted anytime without hardcoding formulas into Python or React.
    """
    name = models.CharField(max_length=150, default='Standard Industrial Forging Plant Rules')
    is_active = models.BooleanField(default=True, help_text='Active calculation ruleset')

    # Earnings breakdown percentages (applied on base wage)
    basic_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('50.00'), help_text='Basic Salary % of gross base (default 50%)')
    da_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('20.00'), help_text='Dearness Allowance % of gross base (default 20%)')
    hra_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('20.00'), help_text='House Rent Allowance % of gross base (default 20%)')
    conveyance_allowance = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('1600.00'), help_text='Fixed Conveyance Allowance')
    medical_allowance = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('1250.00'), help_text='Fixed Medical Allowance')
    special_allowance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10.00'), help_text='Balancing special allowance % (default 10%)')

    # Overtime rule
    overtime_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('2.00'), help_text='Multiplier for approved overtime (default 2.0x normal hourly rate)')
    standard_shift_hours = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('8.00'), help_text='Hours per standard shift (default 8.00)')
    standard_month_days = models.PositiveIntegerField(default=26, help_text='Standard working days per month (default 26 industrial days)')

    # Statutory Deductions
    pf_employee_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('12.00'), help_text='Provident Fund Employee % (default 12% on Basic+DA)')
    pf_wage_ceiling = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('15000.00'), help_text='PF Wage Ceiling (₹15,000)')
    esi_employee_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.75'), help_text='ESI Employee % (default 0.75% on Gross)')
    esi_gross_ceiling = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('21000.00'), help_text='ESI Gross limit (₹21,000)')
    professional_tax_monthly = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('200.00'), help_text='Professional Tax standard monthly deduction')

    class Meta:
        ordering = ['-is_active', '-created_at']
        verbose_name = 'Salary Rule Configuration'
        verbose_name_plural = 'Salary Rule Configurations'

    def __str__(self):
        return f"{self.name} ({'Active' if self.is_active else 'Inactive'})"


class PayrollPeriod(TimeStampedModel):
    """
    Monthly payroll processing cycle for workforce.
    """
    STATUS_DRAFT = 'Draft'
    STATUS_CALCULATED = 'Calculated'
    STATUS_REVIEW = 'Under Review'
    STATUS_APPROVED = 'Approved'
    STATUS_LOCKED = 'Locked'
    STATUS_PARTIAL_PAID = 'Partially Paid'
    STATUS_PAID = 'Paid'
    STATUS_REVERSED = 'Reversed'

    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_CALCULATED, 'Calculated'),
        (STATUS_REVIEW, 'Under Review'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_LOCKED, 'Locked'),
        (STATUS_PARTIAL_PAID, 'Partially Paid'),
        (STATUS_PAID, 'Paid'),
        (STATUS_REVERSED, 'Reversed'),
    ]

    name = models.CharField(max_length=100, help_text='e.g. October 2026')
    month = models.PositiveSmallIntegerField(help_text='1-12')
    year = models.PositiveSmallIntegerField(help_text='e.g. 2026')
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT, db_index=True)
    run_number = models.PositiveIntegerField(default=1)

    total_gross = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    total_deductions = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    total_net_payable = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    total_paid = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_payrolls')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payrolls')
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-year', '-month', '-run_number']
        constraints = [
            models.UniqueConstraint(fields=['month', 'year', 'run_number'], name='unique_payroll_cycle')
        ]
        verbose_name = 'Payroll Period'
        verbose_name_plural = 'Payroll Periods'

    def __str__(self):
        return f"{self.name} (Run #{self.run_number}) - {self.status}"

    @property
    def outstanding_salary(self):
        return max(Decimal('0.00'), self.total_net_payable - self.total_paid)


class PayrollLine(TimeStampedModel):
    """
    Individual worker wage sheet line for a specific payroll cycle.
    Stores the exact snapshot of calculated attendance, earnings, deductions, and payslip data.
    """
    STATUS_UNPAID = 'Unpaid'
    STATUS_PARTIAL_PAID = 'Partially Paid'
    STATUS_PAID = 'Paid'

    PAYMENT_STATUS_CHOICES = [
        (STATUS_UNPAID, 'Unpaid'),
        (STATUS_PARTIAL_PAID, 'Partially Paid'),
        (STATUS_PAID, 'Paid'),
    ]

    payroll_period = models.ForeignKey(PayrollPeriod, on_delete=models.CASCADE, related_name='lines')
    worker = models.ForeignKey('workers.Worker', on_delete=models.CASCADE, related_name='payroll_lines')
    wage_basis = models.CharField(max_length=20, default='Monthly')
    base_rate = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    # Attendance summary for the period
    present_days = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'))
    absent_days = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'))
    half_days = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'))
    leave_days = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'))
    payable_days = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'))
    approved_overtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'))

    # Earnings breakdown
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    da = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name='Dearness Allowance')
    hra = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name='House Rent Allowance')
    allowances = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name='Other Allowances')
    overtime_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    gross_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    # Deductions breakdown
    pf_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name='Provident Fund')
    esi_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name='ESI')
    pt_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name='Professional Tax')
    other_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    advance_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name='Advance Recovery')
    total_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    # Net and payment
    net_payable = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    outstanding_balance = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default=STATUS_UNPAID, db_index=True)
    payment_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True, default='')
    reference_no = models.CharField(max_length=100, blank=True, default='')
    payslip_number = models.CharField(max_length=100, blank=True, default='')

    # Calculation Snapshot preserving configuration rules applied during run
    calculation_snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['worker__worker_id']
        constraints = [
            models.UniqueConstraint(fields=['payroll_period', 'worker'], name='unique_payroll_line_worker')
        ]
        verbose_name = 'Payroll Line'
        verbose_name_plural = 'Payroll Lines'

    def __str__(self):
        return f"{self.worker.worker_id} - {self.payroll_period.name}: Net ₹{self.net_payable} ({self.payment_status})"


class SalaryPayment(TimeStampedModel):
    """
    Direct payment voucher recorded against a worker's payroll line.
    """
    payroll_line = models.ForeignKey(PayrollLine, on_delete=models.CASCADE, related_name='payments')
    worker = models.ForeignKey('workers.Worker', on_delete=models.CASCADE, related_name='salary_payments')
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=50, default='Bank Transfer')
    reference_number = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(max_length=20, default='Completed')
    notes = models.TextField(blank=True, default='')
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']
        verbose_name = 'Salary Payment'
        verbose_name_plural = 'Salary Payments'

    def __str__(self):
        return f"Payment ₹{self.amount_paid} to {self.worker.name} on {self.payment_date}"


class BankAccount(TimeStampedModel):
    """
    Company Disbursal and Operational Bank/Cash Accounts.
    Tracks live ledger balances for payroll and worker payments.
    """
    ACCOUNT_TYPE_BANK = 'Bank'
    ACCOUNT_TYPE_CASH = 'Cash'
    ACCOUNT_TYPE_CHOICES = [
        (ACCOUNT_TYPE_BANK, 'Bank Account'),
        (ACCOUNT_TYPE_CASH, 'Cash in Hand'),
    ]

    account_name = models.CharField(max_length=150, help_text='Display name e.g. HDFC Disbursal A/C')
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPE_CHOICES, default=ACCOUNT_TYPE_BANK)
    bank_name = models.CharField(max_length=100, blank=True, default='')
    account_number = models.CharField(max_length=50, blank=True, default='')
    ifsc_code = models.CharField(max_length=20, blank=True, default='')
    opening_balance = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    current_balance = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_default', 'account_name']
        verbose_name = 'Bank Account'
        verbose_name_plural = 'Bank Accounts'

    def __str__(self):
        return f"{self.account_name} ({self.account_type}) - ₹{self.current_balance:,.2f}"


class PaymentVoucher(TimeStampedModel):
    """
    Official Payment Voucher for Worker Settlement & Wage Disbursements.
    Provides complete financial auditability with double-entry journal linkage.
    """
    STATUS_COMPLETED = 'Completed'
    STATUS_CANCELLED = 'Cancelled'
    STATUS_CHOICES = [
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    MODE_BANK_TRANSFER = 'Bank Transfer'
    MODE_UPI = 'UPI'
    MODE_CASH = 'Cash'
    MODE_CHEQUE = 'Cheque'
    MODE_CHOICES = [
        (MODE_BANK_TRANSFER, 'Bank Transfer'),
        (MODE_UPI, 'UPI'),
        (MODE_CASH, 'Cash'),
        (MODE_CHEQUE, 'Cheque'),
    ]

    voucher_number = models.CharField(max_length=50, unique=True, db_index=True)
    payment_date = models.DateField(db_index=True)
    worker = models.ForeignKey('workers.Worker', on_delete=models.CASCADE, related_name='payment_vouchers')
    payroll_line = models.ForeignKey(PayrollLine, on_delete=models.SET_NULL, null=True, blank=True, related_name='vouchers')
    settlement_period = models.CharField(max_length=100, default='Current Settlement', help_text='Settlement period e.g. October 2026')

    total_payable = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    previously_paid = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    outstanding_after = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))

    payment_mode = models.CharField(max_length=30, choices=MODE_CHOICES, default=MODE_BANK_TRANSFER)
    bank_account = models.ForeignKey(BankAccount, on_delete=models.PROTECT, related_name='vouchers')

    transaction_reference = models.CharField(max_length=100, blank=True, default='', help_text='Bank UTR / UPI Ref / Cash Voucher No')
    cheque_number = models.CharField(max_length=50, blank=True, default='')
    cheque_date = models.DateField(null=True, blank=True)
    drawn_on = models.CharField(max_length=100, blank=True, default='')

    narration = models.TextField(blank=True, default='')
    payment_proof = models.TextField(blank=True, default='', help_text='Receipt or document upload in base64')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_COMPLETED, db_index=True)
    cancellation_reason = models.TextField(blank=True, default='')
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cancelled_vouchers')

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_payment_vouchers')

    class Meta:
        ordering = ['-payment_date', '-created_at']
        verbose_name = 'Payment Voucher'
        verbose_name_plural = 'Payment Vouchers'

    def __str__(self):
        return f"{self.voucher_number} - {self.worker.name} - ₹{self.amount_paid:,.2f} ({self.status})"


class JournalEntry(TimeStampedModel):
    """
    Double-entry accounting journal transaction generated upon payment posting.
    Ensures Debit Worker Payable = Credit Bank/Cash.
    """
    voucher = models.OneToOneField(PaymentVoucher, on_delete=models.CASCADE, related_name='journal_entry', null=True, blank=True)
    entry_number = models.CharField(max_length=50, unique=True, db_index=True)
    entry_date = models.DateField(db_index=True)
    reference = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    is_reversed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-entry_date', '-created_at']
        verbose_name = 'Journal Entry'
        verbose_name_plural = 'Journal Entries'

    def __str__(self):
        return f"{self.entry_number} ({self.entry_date}): {self.description}"


class JournalEntryLine(TimeStampedModel):
    """
    Debits and Credits for a journal transaction.
    """
    TYPE_DEBIT = 'Debit'
    TYPE_CREDIT = 'Credit'
    TYPE_CHOICES = [
        (TYPE_DEBIT, 'Debit'),
        (TYPE_CREDIT, 'Credit'),
    ]

    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account_name = models.CharField(max_length=150)
    entry_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ['-entry_type', 'account_name']
        verbose_name = 'Journal Entry Line'
        verbose_name_plural = 'Journal Entry Lines'

    def __str__(self):
        return f"{self.journal_entry.entry_number}: {self.account_name} {self.entry_type} ₹{self.amount}"
