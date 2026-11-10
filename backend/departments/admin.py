from django.contrib import admin
from .models import Department, Designation


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code', 'department_type', 'is_active', 'head', 'total_workers', 'created_at')
    list_filter = ('department_type', 'is_active', 'created_at')
    search_fields = ('name', 'code', 'description', 'head')
    ordering = ('name',)


@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'code', 'department', 'is_active', 'total_workers', 'created_at')
    list_filter = ('is_active', 'department', 'created_at')
    search_fields = ('title', 'code', 'description', 'department__name')
    ordering = ('title',)


