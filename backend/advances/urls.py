from django.urls import path
from .views import (
    AdvanceListCreateView,
    AdvanceDetailView,
    AdvanceRepaymentView,
    AdvanceApproveView,
)

urlpatterns = [
    path('', AdvanceListCreateView.as_view(), name='advance-list-create'),
    path('<int:pk>/', AdvanceDetailView.as_view(), name='advance-detail'),
    path('<int:pk>/repay/', AdvanceRepaymentView.as_view(), name='advance-repay'),
    path('<int:pk>/approve/', AdvanceApproveView.as_view(), name='advance-approve'),
]
