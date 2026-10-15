from django.contrib import admin
from .models import SalaryRuleConfig, PayrollPeriod, PayrollLine, SalaryPayment


@admin.register(SalaryRuleConfig)
class SalaryRuleConfigAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'basic_percentage', 'da_percentage', 'pf_employee_rate', 'esi_employee_rate', 'overtime_multiplier']


class PayrollLineInline(admin.TabularInline):
    model = PayrollLine
    extra = 0
    readonly_fields = ['worker', 'payable_days', 'approved_overtime_hours', 'gross_earnings', 'total_deductions', 'net_payable', 'paid_amount', 'payment_status']


@admin.register(PayrollPeriod)
class PayrollPeriodAdmin(admin.ModelAdmin):
    list_display = ['name', 'month', 'year', 'run_number', 'status', 'total_gross', 'total_net_payable', 'total_paid', 'outstanding_salary']
    list_filter = ['status', 'year', 'month']
    inlines = [PayrollLineInline]


@admin.register(PayrollLine)
class PayrollLineAdmin(admin.ModelAdmin):
    list_display = ['worker', 'payroll_period', 'payable_days', 'gross_earnings', 'total_deductions', 'net_payable', 'paid_amount', 'payment_status']
    list_filter = ['payment_status', 'payroll_period']
    search_fields = ['worker__worker_id', 'worker__name']


@admin.register(SalaryPayment)
class SalaryPaymentAdmin(admin.ModelAdmin):
    list_display = ['worker', 'amount_paid', 'payment_date', 'payment_method', 'reference_number', 'status']
    list_filter = ['payment_method', 'payment_date']
