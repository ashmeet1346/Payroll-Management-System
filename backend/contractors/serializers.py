from decimal import Decimal
from rest_framework import serializers
from .models import Contractor, Contract, ContractorWorkerAssignment, ContractorBill
from core.validators import (
    validate_name_string,
    validate_entity_code,
    validate_indian_mobile,
    validate_email_address,
    validate_aadhaar_number,
    validate_pan_number,
    validate_bank_account_number,
    validate_ifsc_code,
    validate_bank_name_string,
    mask_aadhaar,
    mask_bank_account,
)


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
    assigned_department_name = serializers.CharField(source='assigned_department.name', read_only=True)

    class Meta:
        model = Contractor
        fields = '__all__'

    def validate_name(self, value):
        cleaned_name = validate_name_string(value, field_name='Contractor agency name', required=True)
        qs = Contractor.objects.filter(name__iexact=cleaned_name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A contractor with this name already exists.')
        return cleaned_name

    def validate_contact_person(self, value):
        return validate_name_string(value, field_name='Contact person name', required=False)

    def validate_contractor_id(self, value):
        from departments.models import Department, Designation
        cleaned_code = validate_entity_code(value, field_name='Contractor code', required=True)

        # Check if code already used in another contractor
        con_qs = Contractor.objects.filter(contractor_id__iexact=cleaned_code)
        if self.instance:
            con_qs = con_qs.exclude(pk=self.instance.pk)
        if con_qs.exists():
            raise serializers.ValidationError(
                f'Code "{cleaned_code}" is already in use by contractor "{con_qs.first().name}".'
            )

        # Check if code already used in any department
        dept_qs = Department.objects.filter(code__iexact=cleaned_code)
        if dept_qs.exists():
            raise serializers.ValidationError(
                f'Code "{cleaned_code}" is already in use by department "{dept_qs.first().name}".'
            )

        # Check if code already used in any designation
        desig_qs = Designation.objects.filter(code__iexact=cleaned_code)
        if desig_qs.exists():
            raise serializers.ValidationError(
                f'Code "{cleaned_code}" is already in use by designation "{desig_qs.first().title}".'
            )

        return cleaned_code

    def validate_phone(self, value):
        return validate_indian_mobile(value, field_name='Primary mobile', required=False)

    def validate_alternate_phone(self, value):
        return validate_indian_mobile(value, field_name='Alternate mobile', required=False)

    def validate_email(self, value):
        return validate_email_address(value, required=False)

    def validate_aadhar_number(self, value):
        return validate_aadhaar_number(value, required=False)

    def validate_pan_number(self, value):
        return validate_pan_number(value, required=False)

    def validate_ifsc_code(self, value):
        return validate_ifsc_code(value, required=False)

    def validate_bank_account(self, value):
        return validate_bank_account_number(value, required=False)

    def validate_bank_name(self, value):
        return validate_bank_name_string(value, required=False)

    def to_internal_value(self, data):
        field_map = {
            'code': 'contractor_id',
            'contractorId': 'contractor_id',
            'owner': 'contact_person',
            'contactPerson': 'contact_person',
            'alternatePhone': 'alternate_phone',
            'alternateMobile': 'alternate_phone',
            'permanentAddress': 'permanent_address',
            'aadharNumber': 'aadhar_number',
            'aadharDoc': 'aadhar_doc',
            'panNumber': 'pan_number',
            'panDoc': 'pan_doc',
            'bankName': 'bank_name',
            'bankAccount': 'bank_account',
            'ifscCode': 'ifsc_code',
            'gstin': 'gst_number',
            'gstNumber': 'gst_number',
            'labourLicense': 'labour_license',
            'assignedDepartment': 'assigned_department',
        }
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        for camel, snake in field_map.items():
            if camel in mutable_data and snake not in mutable_data:
                mutable_data[snake] = mutable_data[camel]

        if 'status' in mutable_data and 'is_active' not in mutable_data:
            mutable_data['is_active'] = (str(mutable_data['status']).lower() == 'active')

        # Resolve department string to pk if provided
        dept_val = mutable_data.get('assigned_department')
        if isinstance(dept_val, str) and not dept_val.isdigit():
            from departments.models import Department
            dept_obj = Department.objects.filter(name__iexact=dept_val.strip()).first()
            mutable_data['assigned_department'] = dept_obj.pk if dept_obj else None

        return super().to_internal_value(mutable_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['code'] = instance.contractor_id
        ret['owner'] = instance.contact_person
        ret['contactPerson'] = instance.contact_person
        ret['alternatePhone'] = instance.alternate_phone
        ret['permanentAddress'] = instance.permanent_address
        ret['aadharNumber'] = instance.aadhar_number
        ret['maskedAadhar'] = mask_aadhaar(instance.aadhar_number)
        ret['aadharDoc'] = instance.aadhar_doc
        ret['panNumber'] = instance.pan_number
        ret['panDoc'] = instance.pan_doc
        ret['bankName'] = instance.bank_name
        ret['bankAccount'] = instance.bank_account
        ret['maskedBankAccount'] = mask_bank_account(instance.bank_account)
        ret['ifscCode'] = instance.ifsc_code
        ret['gstin'] = instance.gst_number
        ret['labourLicense'] = instance.labour_license
        ret['assignedDepartment'] = instance.assigned_department_id
        ret['assignedDepartmentName'] = instance.assigned_department.name if instance.assigned_department else ''
        ret['departments'] = [instance.assigned_department.name] if instance.assigned_department else ['General']
        ret['status'] = 'Active' if instance.is_active else 'Inactive'
        ret['complianceStatus'] = 'Fully Compliant' if instance.is_active else 'Pending Review'

        # Fetch live database workers belonging to this contractor
        from workers.models import Worker
        from django.db.models import Q
        assigned_worker_ids = instance.worker_assignments.filter(is_active=True).values_list('worker_id', flat=True)
        worker_qs = Worker.objects.filter(
            Q(id__in=assigned_worker_ids) |
            Q(contractor_agency__iexact=instance.name) |
            Q(contractor_agency__iexact=instance.contractor_id)
        ).distinct()

        worker_list = []
        for w in worker_qs:
            worker_list.append({
                'id': w.worker_id,
                'db_id': w.id,
                'name': w.name,
                'department': w.department.name if w.department else 'General',
                'designation': w.designation or 'Contract Worker',
                'phone': w.phone or '',
                'shift': 'General (09:00 - 17:00)',
                'dailyRate': float(w.base_wage or 0),
                'status': w.status,
                'statusToday': 'Present' if w.status == 'Active' else 'Absent',
                'joinDate': str(w.joining_date) if w.joining_date else '',
                'workerType': w.worker_type,
            })

        ret['workers'] = worker_list
        ret['totalWorkers'] = len(worker_list)
        ret['presentToday'] = sum(1 for w in worker_list if w.get('status') == 'Active')
        ret['absentToday'] = len(worker_list) - ret['presentToday']
        # Fetch invoices, payments and calculate last month salary payout
        bills = instance.bills.all()
        invoice_list = []
        pending_payment = Decimal('0.00')
        total_paid_ytd = Decimal('0.00')
        last_month_payout = Decimal('0.00')

        import datetime
        today = datetime.date.today()
        first_day_this_month = today.replace(day=1)
        last_day_last_month = first_day_this_month - datetime.timedelta(days=1)
        first_day_last_month = last_day_last_month.replace(day=1)

        for b in bills:
            outstanding = max(Decimal('0.00'), b.approved_amount - b.payment_amount)
            pending_payment += outstanding
            total_paid_ytd += b.payment_amount
            # Check if bill was paid or billed in last month
            if b.payment_date and first_day_last_month <= b.payment_date <= last_day_last_month:
                last_month_payout += b.payment_amount
            elif not b.payment_date and b.billing_period_start and first_day_last_month <= b.billing_period_start <= last_day_last_month:
                last_month_payout += b.approved_amount

            invoice_list.append({
                'id': b.id,
                'invoiceNumber': b.invoice_number,
                'periodStart': str(b.billing_period_start),
                'periodEnd': str(b.billing_period_end),
                'invoiceDate': str(b.invoice_date),
                'totalMandays': b.total_mandays,
                'baseAmount': float(b.base_amount),
                'approvedAmount': float(b.approved_amount),
                'paidAmount': float(b.payment_amount),
                'pendingAmount': float(outstanding),
                'status': b.status,
            })

        # If no explicit bills exist yet, compute last month estimated salary from assigned workers base wages / daily rates
        if last_month_payout == Decimal('0.00') and worker_list:
            estimated_salary = sum(
                (w['dailyRate'] * 26 if w['dailyRate'] < 3000 else w['dailyRate'])
                for w in worker_list
            )
            last_month_payout = Decimal(str(estimated_salary))

        ret['invoices'] = invoice_list
        ret['pendingPayment'] = float(pending_payment)
        ret['totalPaidYTD'] = float(total_paid_ytd)
        ret['lastMonthSalary'] = float(last_month_payout)
        return ret

