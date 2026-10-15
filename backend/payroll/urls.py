from django.urls import path
from .views import (
    SalaryRuleConfigView,
    PayrollPeriodListCreateView,
    PayrollPeriodDetailView,
    PayrollCalculateView,
    PayrollApproveView,
    PayrollLockView,
    PayrollLineListView,
    PayrollLineDetailView,
    SalaryPaymentCreateView,
    PayslipDownloadView,
    PayrollExportView,
)

urlpatterns = [
    path('config/', SalaryRuleConfigView.as_view(), name='payroll-config'),
    path('periods/', PayrollPeriodListCreateView.as_view(), name='payroll-periods-list'),
    path('periods/<int:pk>/', PayrollPeriodDetailView.as_view(), name='payroll-period-detail'),
    path('periods/<int:pk>/calculate/', PayrollCalculateView.as_view(), name='payroll-calculate'),
    path('periods/<int:pk>/approve/', PayrollApproveView.as_view(), name='payroll-approve'),
    path('periods/<int:pk>/lock/', PayrollLockView.as_view(), name='payroll-lock'),
    path('periods/<int:pk>/export/', PayrollExportView.as_view(), name='payroll-export'),
    path('lines/', PayrollLineListView.as_view(), name='payroll-lines-list'),
    path('lines/<int:pk>/', PayrollLineDetailView.as_view(), name='payroll-line-detail'),
    path('lines/<int:line_pk>/pay/', SalaryPaymentCreateView.as_view(), name='payroll-line-pay'),
    path('lines/<int:line_pk>/payslip/', PayslipDownloadView.as_view(), name='payroll-line-payslip'),
]
