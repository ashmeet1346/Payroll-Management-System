from decimal import Decimal
from rest_framework import serializers
from .models import Contractor, Contract, ContractorWorkerAssignment, ContractorBill


class ContractSerializer(serializers.ModelSerializer):
    contractor_name = serializers.ReadOnlyField(source='contractor.name')

    class Meta:
        model = Contract
        fields = '__all__'


class ContractorWorkerAssignmentSerializer(serializers.ModelSerializer):
    worker_name = serializers.ReadOnlyField(source='worker.name')
    worker_code = serializers.ReadOnlyField(source='worker.worker_id')
    contractor_name = serializers.ReadOnlyField(source='contractor.name')
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = ContractorWorkerAssignment
        fields = '__all__'


class ContractorBillSerializer(serializers.ModelSerializer):
    contractor_name = serializers.ReadOnlyField(source='contractor.name')
    contractor_code = serializers.ReadOnlyField(source='contractor.contractor_id')
    outstanding_balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = ContractorBill
        fields = '__all__'


class ContractorSerializer(serializers.ModelSerializer):
    total_assigned_workers = serializers.ReadOnlyField()
    contracts = ContractSerializer(many=True, read_only=True)

    class Meta:
        model = Contractor
        fields = '__all__'
