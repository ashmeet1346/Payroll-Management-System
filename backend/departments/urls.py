from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, DesignationViewSet

app_name = 'departments'

router = DefaultRouter()
router.register(r'designations', DesignationViewSet, basename='designation')
router.register(r'', DepartmentViewSet, basename='department')

urlpatterns = router.urls
