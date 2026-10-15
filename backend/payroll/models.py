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
