from decimal import Decimal
from rest_framework import serializers
from .models import Advance, AdvanceTransaction


class AdvanceTransactionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = AdvanceTransaction
        fields = [
            'id',
            'advance',
            'transaction_type',
            'amount',
            'balance_after',
            'transaction_date',
            'reference_number',
            'notes',
            'created_by',
            'created_by_name',
            'created_at',
        ]
        read_only_fields = ['id', 'balance_after', 'created_at', 'created_by_name']


class AdvanceSerializer(serializers.ModelSerializer):
    worker_name = serializers.ReadOnlyField(source='worker.name')
    worker_id_code = serializers.ReadOnlyField(source='worker.worker_id')
    department_name = serializers.ReadOnlyField(source='worker.department.name')
    approved_by_name = serializers.ReadOnlyField(source='approved_by.username')
    transactions = AdvanceTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Advance
        fields = [
            'id',
            'advance_id',
            'worker',
            'worker_id_code',
            'worker_name',
            'department_name',
            'advance_type',
            'principal_amount',
            'monthly_deduction',
            'issue_date',
            'repayment_start_date',
            'reason',
            'status',
            'outstanding_balance',
            'approved_by',
            'approved_by_name',
            'approved_at',
            'transactions',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'outstanding_balance', 'approved_by_name', 'created_at', 'updated_at']

    def create(self, validated_data):
        # Outstanding balance starts equal to principal amount
        principal = validated_data.get('principal_amount')
        validated_data['outstanding_balance'] = principal
        advance = super().create(validated_data)

        # Record initial disbursement in transaction ledger
        request = self.context.get('request')
        user = request.user if request and request.user.is_authenticated else None

        AdvanceTransaction.objects.create(
            advance=advance,
            transaction_type=AdvanceTransaction.TYPE_DISBURSEMENT,
            amount=principal,
            balance_after=principal,
            transaction_date=advance.issue_date,
            reference_number=f"INIT-{advance.advance_id}",
            notes=f"Initial sanction of {advance.advance_type}",
            created_by=user
        )
        return advance
