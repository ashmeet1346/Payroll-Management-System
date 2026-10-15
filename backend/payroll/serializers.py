from decimal import Decimal
from rest_framework import serializers
from .models import SalaryRuleConfig, PayrollPeriod, PayrollLine, SalaryPayment


class SalaryRuleConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryRuleConfig
        fields = '__all__'


class SalaryPaymentSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.ReadOnlyField(source='recorded_by.username')

    class Meta:
        model = SalaryPayment
        fields = '__all__'


class PayrollLineSerializer(serializers.ModelSerializer):
    worker_name = serializers.ReadOnlyField(source='worker.name')
    worker_id_code = serializers.ReadOnlyField(source='worker.worker_id')
    department_name = serializers.ReadOnlyField(source='worker.department.name')
    payments = SalaryPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = PayrollLine
        fields = '__all__'


class PayrollPeriodSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.username')
    approved_by_name = serializers.ReadOnlyField(source='approved_by.username')
    outstanding_salary = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    lines_count = serializers.IntegerField(source='lines.count', read_only=True)

    class Meta:
        model = PayrollPeriod
        fields = '__all__'
