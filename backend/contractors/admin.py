from django.contrib import admin
from .models import Contractor, Contract, ContractorWorkerAssignment, ContractorBill


@admin.register(Contractor)
class ContractorAdmin(admin.ModelAdmin):
    list_display = ['contractor_id', 'name', 'contact_person', 'phone', 'is_active', 'total_assigned_workers']
    search_fields = ['contractor_id', 'name', 'contact_person', 'phone']
    list_filter = ['is_active']


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ['contract_number', 'contractor', 'billing_basis', 'agreed_rate', 'start_date', 'end_date', 'status']
    list_filter = ['status', 'billing_basis']


@admin.register(ContractorWorkerAssignment)
class ContractorWorkerAssignmentAdmin(admin.ModelAdmin):
    list_display = ['worker', 'contractor', 'department', 'start_date', 'end_date', 'is_active']
    list_filter = ['is_active', 'contractor']


@admin.register(ContractorBill)
class ContractorBillAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'contractor', 'invoice_date', 'approved_amount', 'payment_amount', 'status']
    list_filter = ['status', 'contractor']
