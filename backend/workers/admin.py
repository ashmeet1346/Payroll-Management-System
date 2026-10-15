from django.contrib import admin
from .models import Worker, WorkerWageHistory, WorkerDepartmentHistory


class WorkerWageHistoryInline(admin.TabularInline):
    model = WorkerWageHistory
    extra = 0
    readonly_fields = ['effective_date', 'wage_basis', 'base_wage', 'revised_by', 'remarks', 'created_at']


class WorkerDepartmentHistoryInline(admin.TabularInline):
    model = WorkerDepartmentHistory
    extra = 0
    readonly_fields = ['effective_date', 'department', 'transferred_by', 'remarks', 'created_at']


@admin.register(Worker)
class WorkerAdmin(admin.ModelAdmin):
    list_display = (
        'worker_id',
        'name',
        'department',
        'designation',
        'wage_basis',
        'base_wage',
        'phone',
        'status',
        'worker_type',
        'joining_date'
    )
    list_filter = ('status', 'worker_type', 'wage_basis', 'department')
    search_fields = ('worker_id', 'name', 'phone', 'designation', 'contractor_agency')
    ordering = ('worker_id',)
    inlines = [WorkerWageHistoryInline, WorkerDepartmentHistoryInline]


@admin.register(WorkerWageHistory)
class WorkerWageHistoryAdmin(admin.ModelAdmin):
    list_display = ['worker', 'effective_date', 'wage_basis', 'base_wage', 'revised_by', 'created_at']
    list_filter = ['wage_basis', 'effective_date']


@admin.register(WorkerDepartmentHistory)
class WorkerDepartmentHistoryAdmin(admin.ModelAdmin):
    list_display = ['worker', 'effective_date', 'department', 'transferred_by', 'created_at']
    list_filter = ['department', 'effective_date']
