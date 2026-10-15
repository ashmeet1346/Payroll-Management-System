from decimal import Decimal
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Advance, AdvanceTransaction
from .serializers import AdvanceSerializer, AdvanceTransactionSerializer
from .calculations import validate_repayment_amount
from core.models import AuditLog


class AdvanceListCreateView(generics.ListCreateAPIView):
    serializer_class = AdvanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Advance.objects.select_related('worker', 'worker__department', 'approved_by')
        adv_type = self.request.query_params.get('type')
        if adv_type:
            qs = qs.filter(advance_type__iexact=adv_type)

        worker_id = self.request.query_params.get('worker')
        if worker_id:
            qs = qs.filter(worker__worker_id=worker_id) | qs.filter(worker__id=worker_id)

        status_val = self.request.query_params.get('status')
        if status_val and status_val != 'All':
            qs = qs.filter(status=status_val)

        return qs.order_by('-issue_date')


class AdvanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Advance.objects.all()
    serializer_class = AdvanceSerializer
    permission_classes = [IsAuthenticated]


class AdvanceRepaymentView(APIView):
    """
    Record a manual repayment or adjustment against an outstanding advance.
    Guarantees repayment amount cannot exceed outstanding balance.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            advance = Advance.objects.get(pk=pk)
        except Advance.DoesNotExist:
            return Response({'error': 'Advance record not found.'}, status=status.HTTP_404_NOT_FOUND)

        amount_raw = request.data.get('amount')
        trans_type = request.data.get('transaction_type', AdvanceTransaction.TYPE_MANUAL_REPAYMENT)
        ref_no = request.data.get('reference_number', '')
        notes = request.data.get('notes', '')

        try:
            amount = validate_repayment_amount(advance, amount_raw)
            transaction = advance.record_repayment(
                amount=amount,
                transaction_type=trans_type,
                reference_no=ref_no,
                notes=notes,
                user=request.user
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        AuditLog.objects.create(
            actor=request.user,
            action='UPDATE',
            model_name='Advance',
            record_id=advance.advance_id,
            details={
                'repayment_amount': str(amount),
                'new_balance': str(advance.outstanding_balance),
                'transaction_id': transaction.id
            },
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response(AdvanceSerializer(advance).data, status=status.HTTP_200_OK)


class AdvanceApproveView(APIView):
    """
    Approve an advance request.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            advance = Advance.objects.get(pk=pk)
        except Advance.DoesNotExist:
            return Response({'error': 'Advance record not found.'}, status=status.HTTP_404_NOT_FOUND)

        advance.status = Advance.STATUS_APPROVED
        advance.approved_by = request.user
        advance.approved_at = timezone.now()
        advance.save()

        AuditLog.objects.create(
            actor=request.user,
            action='APPROVE',
            model_name='Advance',
            record_id=advance.advance_id,
            details={'principal_amount': str(advance.principal_amount)},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response(AdvanceSerializer(advance).data, status=status.HTTP_200_OK)
