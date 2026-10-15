from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Worker
from .serializers import WorkerSerializer, WorkerDetailSerializer


class WorkerViewSet(viewsets.ModelViewSet):
    """
    API ViewSet for managing workers.
    Endpoints:
    - GET /api/workers/ - list with search & department filtering
    - POST /api/workers/ - create worker with validation
    - GET /api/workers/<id>/ - worker details
    - PUT /api/workers/<id>/ - full update
    - PATCH /api/workers/<id>/ - partial update
    - POST/PATCH /api/workers/<id>/deactivate/ - authorised worker deactivation
    - DELETE /api/workers/<id>/ - delete worker or mark inactive
    """
    queryset = Worker.objects.select_related('department').all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'status', 'worker_type']
    search_fields = [
        'worker_id',
        'name',
        'designation',
        'phone',
        'department__name',
        'contractor_agency',
    ]
    ordering_fields = ['worker_id', 'name', 'joining_date', 'created_at']
    ordering = ['worker_id']

    def get_serializer_class(self):
        if self.action in ['retrieve']:
            return WorkerDetailSerializer
        return WorkerSerializer

    @action(detail=True, methods=['post', 'patch'], url_path='deactivate')
    def deactivate(self, request, pk=None):
        """
        Authorised deactivation endpoint for a worker.
        Sets worker status to 'Inactive'.
        """
        worker = self.get_object()
        if worker.status == Worker.STATUS_INACTIVE:
            return Response(
                {
                    'detail': f"Worker {worker.worker_id} ({worker.name}) is already inactive.",
                    'worker': WorkerSerializer(worker).data
                },
                status=status.HTTP_200_OK
            )
        
        worker.deactivate()
        return Response(
            {
                'detail': f"Worker {worker.worker_id} ({worker.name}) successfully deactivated.",
                'worker': WorkerSerializer(worker).data
            },
            status=status.HTTP_200_OK
        )
