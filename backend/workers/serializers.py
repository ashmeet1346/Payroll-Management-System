import re
from datetime import datetime
from rest_framework import serializers
from departments.models import Department
from departments.serializers import DepartmentSerializer
from core.validators import (
    validate_name_string,
    validate_indian_mobile,
    validate_email_address,
    validate_date_not_future,
    validate_dob_and_calculate_age,
    validate_aadhaar_number,
    validate_pan_number,
    validate_bank_account_number,
    validate_ifsc_code,
    validate_positive_amount,
    mask_aadhaar,
    mask_bank_account,
)
from .models import Worker, WorkerWageHistory, WorkerDepartmentHistory


class WorkerSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        allow_null=True,
        required=False
    )

    class Meta:
        model = Worker
        fields = [
            'id',
            'worker_id',
            'name',
            'department',
            'department_id',
            'department_name',
            'designation',
            'phone',
            'email',
            'joining_date',
            'status',
            'worker_type',
            'wage_basis',
            'base_wage',
            'overtime_eligible',
            'gender',
            'dob',
            'address',
            'photo',
            'contractor_agency',
            'bank_account',
            'ifsc_code',
            'aadhar_number',
            'pan_number',
            'emergency_contact',
            'permanent_address',
            'aadhar_doc',
            'pan_doc',
            'salary_policy',
            'policy_rate',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'department_name']
        extra_kwargs = {
            'department': {'write_only': True, 'required': False},
            'photo': {'required': False, 'allow_blank': True},
            'phone': {'required': False, 'allow_blank': True},
            'email': {'required': False, 'allow_blank': True},
            'designation': {'required': False, 'allow_blank': True},
            'address': {'required': False, 'allow_blank': True},
            'contractor_agency': {'required': False, 'allow_blank': True},
            'bank_account': {'required': False, 'allow_blank': True},
            'ifsc_code': {'required': False, 'allow_blank': True},
            'aadhar_number': {'required': False, 'allow_blank': True},
            'pan_number': {'required': False, 'allow_blank': True},
            'emergency_contact': {'required': False, 'allow_blank': True},
            'permanent_address': {'required': False, 'allow_blank': True},
            'aadhar_doc': {'required': False, 'allow_blank': True},
            'pan_doc': {'required': False, 'allow_blank': True},
            'salary_policy': {'required': False, 'allow_blank': True},
            'policy_rate': {'required': False},
        }

    @staticmethod
    def _parse_flexible_date(val):
        if not val or val == 'N/A':
            return None
        val_str = str(val).strip()
        for fmt in ('%Y-%m-%d', '%d %b %Y', '%d-%m-%Y', '%d/%m/%Y', '%Y/%m/%d', '%d %B %Y'):
            try:
                return datetime.strptime(val_str, fmt).date().isoformat()
            except ValueError:
                pass
        return None

    def to_internal_value(self, data):
        field_map = {
            'workerId': 'worker_id',
            'workerType': 'worker_type',
            'joinDate': 'joining_date',
            'wageBasis': 'wage_basis',
            'baseWage': 'base_wage',
            'overtimeEligible': 'overtime_eligible',
            'bankAccount': 'bank_account',
            'ifscCode': 'ifsc_code',
            'aadharNumber': 'aadhar_number',
            'panNumber': 'pan_number',
            'contractorAgency': 'contractor_agency',
            'emergencyContact': 'emergency_contact',
            'permanentAddress': 'permanent_address',
            'aadharDoc': 'aadhar_doc',
            'panDoc': 'pan_doc',
            'salaryPolicy': 'salary_policy',
            'policyRate': 'policy_rate',
        }
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        for camel, snake in field_map.items():
            if camel in mutable_data and snake not in mutable_data:
                mutable_data[snake] = mutable_data[camel]

        dept_val = mutable_data.get('department')
        if isinstance(dept_val, str) and not dept_val.isdigit():
            dept_obj = Department.objects.filter(name__iexact=dept_val.strip()).first()
            if not dept_obj and dept_val.strip() and dept_val.strip() != 'All':
                dept_obj = Department.objects.create(name=dept_val.strip(), description='Created via worker registration')
            if dept_obj:
                mutable_data['department'] = dept_obj.pk

        for date_field in ('joining_date', 'dob'):
            if date_field in mutable_data:
                parsed = self._parse_flexible_date(mutable_data[date_field])
                mutable_data[date_field] = parsed

        return super().to_internal_value(mutable_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['workerId'] = instance.worker_id
        ret['workerType'] = instance.worker_type
        # ISO YYYY-MM-DD for form inputs (<input type="date">)
        ret['joinDate'] = instance.joining_date.strftime('%Y-%m-%d') if instance.joining_date else ''
        ret['joinDateRaw'] = instance.joining_date.strftime('%Y-%m-%d') if instance.joining_date else ''
        ret['joinDateFormatted'] = instance.joining_date.strftime('%d %b %Y') if instance.joining_date else ''
        ret['joining_date'] = instance.joining_date.strftime('%Y-%m-%d') if instance.joining_date else ''
        ret['dob'] = instance.dob.strftime('%Y-%m-%d') if instance.dob else ''
        ret['dobRaw'] = instance.dob.strftime('%Y-%m-%d') if instance.dob else ''
        ret['dobFormatted'] = instance.dob.strftime('%d %b %Y') if instance.dob else ''
        ret['department'] = instance.department.name if instance.department else ''
        ret['wageBasis'] = instance.wage_basis
        ret['baseWage'] = float(instance.base_wage)
        ret['overtimeEligible'] = instance.overtime_eligible
        ret['bankAccount'] = instance.bank_account
        ret['maskedBankAccount'] = mask_bank_account(instance.bank_account)
        ret['ifscCode'] = instance.ifsc_code
        ret['aadharNumber'] = instance.aadhar_number
        ret['maskedAadhar'] = mask_aadhaar(instance.aadhar_number)
        ret['panNumber'] = instance.pan_number
        ret['contractorAgency'] = instance.contractor_agency
        ret['emergencyContact'] = instance.emergency_contact
        ret['permanentAddress'] = instance.permanent_address
        ret['aadharDoc'] = instance.aadhar_doc
        ret['panDoc'] = instance.pan_doc
        ret['salaryPolicy'] = instance.salary_policy
        ret['policyRate'] = float(instance.policy_rate)
        return ret


    def validate_worker_id(self, value):
        cleaned_id = value.strip().upper()
        if not cleaned_id:
            raise serializers.ValidationError('Worker ID cannot be blank.')

        qs = Worker.objects.filter(worker_id__iexact=cleaned_id)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A worker with this Worker ID already exists.')

        return cleaned_id

    def validate_name(self, value):
        return validate_name_string(value, field_name='Full name', min_len=2, max_len=150, required=True)

    def validate_phone(self, value):
        return validate_indian_mobile(value, field_name='Phone number', required=False)

    def validate_emergency_contact(self, value):
        return validate_indian_mobile(value, field_name='Emergency contact', required=False)

    def validate_email(self, value):
        return validate_email_address(value, required=False)

    def validate_joining_date(self, value):
        if value:
            return validate_date_not_future(value, field_name='Joining date')
        return value

    def validate_dob(self, value):
        if value:
            d, _ = validate_dob_and_calculate_age(value, min_age=18, max_age=100)
            return d
        return value

    def validate_aadhar_number(self, value):
        return validate_aadhaar_number(value, required=False)

    def validate_pan_number(self, value):
        return validate_pan_number(value, required=False)

    def validate_bank_account(self, value):
        return validate_bank_account_number(value, required=False)

    def validate_ifsc_code(self, value):
        return validate_ifsc_code(value, required=False)

    def validate_base_wage(self, value):
        return validate_positive_amount(value, field_name='Base wage', allow_zero=False)

    def validate_status(self, value):
        valid_statuses = [c[0] for c in Worker.STATUS_CHOICES]
        if value not in valid_statuses:
            raise serializers.ValidationError(
                f"Invalid status '{value}'. Allowed statuses are: {', '.join(valid_statuses)}."
            )
        return value


class WorkerDetailSerializer(WorkerSerializer):
    department_detail = DepartmentSerializer(source='department', read_only=True)

    class Meta(WorkerSerializer.Meta):
        fields = WorkerSerializer.Meta.fields + ['department_detail']


class WorkerWageHistorySerializer(serializers.ModelSerializer):
    revised_by_name = serializers.ReadOnlyField(source='revised_by.username')

    class Meta:
        model = WorkerWageHistory
        fields = '__all__'


class WorkerDepartmentHistorySerializer(serializers.ModelSerializer):
    transferred_by_name = serializers.ReadOnlyField(source='transferred_by.username')
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = WorkerDepartmentHistory
        fields = '__all__'
