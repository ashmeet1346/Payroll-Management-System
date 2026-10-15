from django.contrib import admin
from .models import Advance, AdvanceTransaction


class AdvanceTransactionInline(admin.TabularInline):
    model = AdvanceTransaction
    extra = 0
    readonly_fields = ['transaction_type', 'amount', 'balance_after', 'transaction_date', 'reference_number', 'notes', 'created_by', 'created_at']


@admin.register(Advance)
class AdvanceAdmin(admin.ModelAdmin):
    list_display = ['advance_id', 'worker', 'advance_type', 'principal_amount', 'monthly_deduction', 'outstanding_balance', 'status', 'issue_date']
    list_filter = ['advance_type', 'status', 'issue_date']
    search_fields = ['advance_id', 'worker__worker_id', 'worker__name']
    inlines = [AdvanceTransactionInline]


@admin.register(AdvanceTransaction)
class AdvanceTransactionAdmin(admin.ModelAdmin):
    list_display = ['advance', 'transaction_type', 'amount', 'balance_after', 'transaction_date', 'reference_number']
    list_filter = ['transaction_type', 'transaction_date']
