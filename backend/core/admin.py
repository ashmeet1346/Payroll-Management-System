from django.contrib import admin
from .models import Company, AuditLog, DataStore


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'legal_name', 'tax_id', 'contact_phone', 'contact_email', 'currency', 'is_active']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'actor', 'action', 'model_name', 'record_id', 'ip_address']
    list_filter = ['action', 'model_name', 'created_at']
    search_fields = ['record_id', 'model_name']
    readonly_fields = ['created_at', 'actor', 'action', 'model_name', 'record_id', 'details', 'ip_address']


@admin.register(DataStore)
class DataStoreAdmin(admin.ModelAdmin):
    list_display = ['key', 'updated_at', 'created_at']
    search_fields = ['key']
