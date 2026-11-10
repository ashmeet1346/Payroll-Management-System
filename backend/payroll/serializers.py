from decimal import Decimal
from rest_framework import serializers
from .models import (
    SalaryRuleConfig,
    PayrollPeriod,
    PayrollLine,
    SalaryPayment,
    BankAccount,
    PaymentVoucher,
    JournalEntry,
    JournalEntryLine,
)
from core.validators import validate_positive_amount


class SalaryRuleConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryRuleConfig
        fields = '__all__'


class SalaryPaymentSerializer(serializers.ModelSerializer):
    recorded_by_name = serializers.ReadOnlyField(source='recorded_by.username')

    class Meta:
        model = SalaryPayment
        fields = '__all__'

    def validate_amount_paid(self, value):
        return validate_positive_amount(value, field_name='Amount paid', allow_zero=False)


class PayrollLineSerializer(serializers.ModelSerializer):
    worker_name = serializers.ReadOnlyField(source='worker.name')
    worker_id_code = serializers.ReadOnlyField(source='worker.worker_id')
    department_name = serializers.ReadOnlyField(source='worker.department.name')
    payments = SalaryPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = PayrollLine
        fields = '__all__'

    def validate(self, attrs):
        net_salary = attrs.get('net_salary', self.instance.net_salary if self.instance else None)
        if net_salary is not None and net_salary < Decimal('0.00'):
            raise serializers.ValidationError('Calculated net salary cannot be negative without an authorized adjustment.')
        return attrs


class PayrollPeriodSerializer(serializers.ModelSerializer):
    created_by_name = serializers.ReadOnlyField(source='created_by.username')
    approved_by_name = serializers.ReadOnlyField(source='approved_by.username')
    outstanding_salary = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    lines_count = serializers.IntegerField(source='lines.count', read_only=True)

    class Meta:
        model = PayrollPeriod
        fields = '__all__'


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = '__all__'

    def validate_current_balance(self, value):
        if value < Decimal('0.00'):
            raise serializers.ValidationError('Bank or Cash account balance cannot be negative.')
        return value


class JournalEntryLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntryLine
        fields = ['id', 'account_name', 'entry_type', 'amount']


class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalEntryLineSerializer(many=True, read_only=True)

    class Meta:
        model = JournalEntry
        fields = ['id', 'entry_number', 'entry_date', 'reference', 'description', 'is_reversed', 'lines', 'created_at']


class PaymentVoucherSerializer(serializers.ModelSerializer):
    worker_name = serializers.ReadOnlyField(source='worker.name')
    worker_id_code = serializers.ReadOnlyField(source='worker.worker_id')
    worker_department = serializers.ReadOnlyField(source='worker.department.name')
    worker_phone = serializers.ReadOnlyField(source='worker.phone')
    bank_account_name = serializers.ReadOnlyField(source='bank_account.account_name')
    bank_account_type = serializers.ReadOnlyField(source='bank_account.account_type')
    created_by_name = serializers.ReadOnlyField(source='created_by.username')
    cancelled_by_name = serializers.ReadOnlyField(source='cancelled_by.username')
    journal_entry = JournalEntrySerializer(read_only=True)

    class Meta:
        model = PaymentVoucher
        fields = '__all__'

    def validate_amount_paid(self, value):
        return validate_positive_amount(value, field_name='Payment amount', allow_zero=False)

