from django.urls import path
from .views import (
    ContractorListCreateView,
    ContractorDetailView,
    ContractListCreateView,
    ContractDetailView,
    ContractorWorkerAssignmentListCreateView,
    ContractorBillListCreateView,
    ContractorBillDetailView,
    ContractorBillApproveView,
    ContractorBillPayView,
)

urlpatterns = [
    path('', ContractorListCreateView.as_view(), name='contractors-list-create'),
    path('<int:pk>/', ContractorDetailView.as_view(), name='contractor-detail'),
    path('contracts/', ContractListCreateView.as_view(), name='contracts-list-create'),
    path('contracts/<int:pk>/', ContractDetailView.as_view(), name='contract-detail'),
    path('assignments/', ContractorWorkerAssignmentListCreateView.as_view(), name='contractor-assignments'),
    path('bills/', ContractorBillListCreateView.as_view(), name='contractor-bills'),
    path('bills/<int:pk>/', ContractorBillDetailView.as_view(), name='contractor-bill-detail'),
    path('bills/<int:pk>/approve/', ContractorBillApproveView.as_view(), name='contractor-bill-approve'),
    path('bills/<int:pk>/pay/', ContractorBillPayView.as_view(), name='contractor-bill-pay'),
]
