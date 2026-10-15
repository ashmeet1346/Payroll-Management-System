from decimal import Decimal
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Contractor, Contract, ContractorWorkerAssignment, ContractorBill
from .serializers import (
    ContractorSerializer,
    ContractSerializer,
    ContractorWorkerAssignmentSerializer,
    ContractorBillSerializer,
)
from core.models import AuditLog


class ContractorListCreateView(generics.ListCreateAPIView):
    queryset = Contractor.objects.all().order_by('contractor_id')
    serializer_class = ContractorSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['contractor_id', 'name', 'contact_person', 'phone']
    filterset_fields = ['is_active']


class ContractorDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Contractor.objects.all()
    serializer_class = ContractorSerializer
    permission_classes = [IsAuthenticated]


class ContractListCreateView(generics.ListCreateAPIView):
    queryset = Contract.objects.all().order_by('-start_date')
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['contractor', 'status', 'billing_basis']


class ContractDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated]


class ContractorWorkerAssignmentListCreateView(generics.ListCreateAPIView):
    queryset = ContractorWorkerAssignment.objects.all().order_by('-start_date')
    serializer_class = ContractorWorkerAssignmentSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['contractor', 'worker', 'is_active', 'department']


class ContractorBillListCreateView(generics.ListCreateAPIView):
    queryset = ContractorBill.objects.all().order_by('-invoice_date')
    serializer_class = ContractorBillSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['contractor', 'status']
    search_fields = ['invoice_number', 'contractor__name']


class ContractorBillDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ContractorBill.objects.all()
    serializer_class = ContractorBillSerializer
    permission_classes = [IsAuthenticated]


class ContractorBillApproveView(APIView):
    """
    Approve a contractor invoice after verifying billed man-days and overtime.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            bill = ContractorBill.objects.get(pk=pk)
        except ContractorBill.DoesNotExist:
            return Response({'error': 'Contractor bill not found.'}, status=status.HTTP_404_NOT_FOUND)

        approved_amount = request.data.get('approved_amount', bill.approved_amount or (bill.base_amount + bill.overtime_amount + bill.tax_amount - bill.deductions))
        bill.approved_amount = Decimal(str(approved_amount))
        bill.status = ContractorBill.STATUS_APPROVED
        bill.verified_by = request.user
        bill.save()

        AuditLog.objects.create(
            actor=request.user,
            action='APPROVE',
            model_name='ContractorBill',
            record_id=bill.invoice_number,
            details={'approved_amount': str(bill.approved_amount)},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response(ContractorBillSerializer(bill).data, status=status.HTTP_200_OK)


class ContractorBillPayView(APIView):
    """
    Record full or partial payment against an approved contractor invoice.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            bill = ContractorBill.objects.get(pk=pk)
        except ContractorBill.DoesNotExist:
            return Response({'error': 'Contractor bill not found.'}, status=status.HTTP_404_NOT_FOUND)

        amount = Decimal(str(request.data.get('amount', 0)))
        if amount <= 0:
            return Response({'error': 'Payment amount must be greater than zero.'}, status=status.HTTP_400_BAD_REQUEST)

        new_total_paid = bill.payment_amount + amount
        if new_total_paid > bill.approved_amount:
            return Response({'error': f'Total payment (₹{new_total_paid}) cannot exceed approved amount (₹{bill.approved_amount}).'}, status=status.HTTP_400_BAD_REQUEST)

        bill.payment_amount = new_total_paid
        bill.payment_date = request.data.get('payment_date') or timezone.localdate()
        bill.payment_reference = request.data.get('payment_reference', '')
        if bill.payment_amount >= bill.approved_amount:
            bill.status = ContractorBill.STATUS_PAID
        bill.save()

        AuditLog.objects.create(
            actor=request.user,
            action='PAY',
            model_name='ContractorBill',
            record_id=bill.invoice_number,
            details={'payment_amount': str(amount), 'new_total_paid': str(bill.payment_amount)},
            ip_address=request.META.get('REMOTE_ADDR')
        )

        return Response(ContractorBillSerializer(bill).data, status=status.HTTP_200_OK)
