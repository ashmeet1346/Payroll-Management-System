from django.contrib import admin
from .models import Department


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'is_active', 'head', 'location', 'total_workers', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description', 'head', 'location')
    ordering = ('name',)
