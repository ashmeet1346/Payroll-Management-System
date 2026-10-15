from rest_framework.routers import DefaultRouter
from .views import WorkerViewSet

app_name = 'workers'

router = DefaultRouter()
router.register(r'', WorkerViewSet, basename='worker')

urlpatterns = router.urls
