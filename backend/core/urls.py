from django.urls import path
from .views import (
    HealthCheckView,
    AuthLoginView,
    AuthLogoutView,
    CurrentUserView,
    UserListCreateView,
    CompanyView,
    AuditLogListView,
    DataStoreView,
    DashboardStatsView,
)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('auth/login/', AuthLoginView.as_view(), name='auth-login'),
    path('auth/logout/', AuthLogoutView.as_view(), name='auth-logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth-me'),
    path('users/', UserListCreateView.as_view(), name='users-list-create'),
    path('company/', CompanyView.as_view(), name='company-profile'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-logs-list'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('datastore/<str:key>/', DataStoreView.as_view(), name='datastore-detail'),
]
