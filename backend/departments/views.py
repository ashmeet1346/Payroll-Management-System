from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Department
from .serializers import DepartmentSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for viewing and managing Departments.
    Requires authentication for access.
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description', 'head', 'location']
    ordering_fields = ['name', 'created_at', 'id']
    ordering = ['name']

    def destroy(self, request, *args, **kwargs):
        department = self.get_object()
        # Check if department has associated workers
        worker_count = department.workers.count()
        if worker_count > 0:
            # Soft-deactivate if workers exist
            department.is_active = False
            department.save()
            return Response(
                {
                    'detail': f"Department has {worker_count} worker(s). It has been deactivated instead of deleted.",
                    'department': DepartmentSerializer(department).data
                },
                status=status.HTTP_200_OK
            )
        return super().destroy(request, *args, **kwargs)
