"""
URL configuration for PaySphere enterprise backend.
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),

    # Core system endpoints (health, auth, company, users, audit, dashboard, datastore)
    path('api/', include('core.urls')),

    # Domain modules
    path('api/departments/', include('departments.urls')),
    path('api/workers/', include('workers.urls')),
    path('api/contractors/', include('contractors.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/advances/', include('advances.urls')),
    path('api/payroll/', include('payroll.urls')),

    # OpenAPI 3.0 / Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
