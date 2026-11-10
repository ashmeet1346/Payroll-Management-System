from django.urls import path
from .views import (
    ShiftListCreateView,
    ShiftDetailView,
    AttendanceRecordListCreateView,
    AttendanceRecordDetailView,
    AttendanceBulkSaveView,
    AttendanceApproveBulkView,
    AttendanceStatsDailyView,
    AttendanceImportView,
    AttendanceImportBatchListView,
    AttendanceExportView,
    AttendancePunchListCreateView,
    AttendancePunchDetailView,
)

urlpatterns = [
    path('shifts/', ShiftListCreateView.as_view(), name='shift-list-create'),
    path('shifts/<int:pk>/', ShiftDetailView.as_view(), name='shift-detail'),
    path('records/', AttendanceRecordListCreateView.as_view(), name='attendance-records-list'),
    path('records/<int:pk>/', AttendanceRecordDetailView.as_view(), name='attendance-record-detail'),
    path('punches/', AttendancePunchListCreateView.as_view(), name='attendance-punches-list-create'),
    path('punches/<int:pk>/', AttendancePunchDetailView.as_view(), name='attendance-punch-detail'),
    path('bulk/', AttendanceBulkSaveView.as_view(), name='attendance-bulk-save'),
    path('approve-bulk/', AttendanceApproveBulkView.as_view(), name='attendance-approve-bulk'),
    path('stats/daily/', AttendanceStatsDailyView.as_view(), name='attendance-stats-daily'),
    path('import/', AttendanceImportView.as_view(), name='attendance-import'),
    path('import/batches/', AttendanceImportBatchListView.as_view(), name='attendance-import-batches'),
    path('export/', AttendanceExportView.as_view(), name='attendance-export'),
]
