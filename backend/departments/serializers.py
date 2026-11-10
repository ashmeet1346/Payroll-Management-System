from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(default=True, required=False)
    department_type = serializers.CharField(required=False, allow_blank=True, default='General')
    total_workers = serializers.ReadOnlyField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id',
            'name',
            'code',
            'department_type',
            'description',
            'is_active',
            'status',
            'head',
            'location',
            'total_workers',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_workers', 'status']

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'department_type' not in mutable_data and 'departmentType' not in mutable_data:
            mutable_data['department_type'] = 'General'
        elif 'departmentType' in mutable_data and 'department_type' not in mutable_data:
            mutable_data['department_type'] = mutable_data['departmentType']
        return super().to_internal_value(mutable_data)

    def get_status(self, obj):
        return 'Active' if obj.is_active else 'Inactive'

    def validate_name(self, value):
        cleaned_name = value.strip()
        if not cleaned_name:
            raise serializers.ValidationError('Department name cannot be blank.')
        
        # Check uniqueness case-insensitively
        qs = Department.objects.filter(name__iexact=cleaned_name)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A department with this name already exists.')
        
        return cleaned_name

    def validate_code(self, value):
        import re
        from .models import Designation
        cleaned_code = value.strip().upper() if value else ''
        if not cleaned_code:
            raise serializers.ValidationError('Department code is required.')
        
        if not re.match(r'^[A-Z]{3}[0-9]{3}$', cleaned_code):
            raise serializers.ValidationError(
                'Department code must consist of exactly 3 alphabetic letters followed by 3 numeric digits (e.g. DEP001).'
            )
        
        # Check if code already used in another department
        dept_qs = Department.objects.filter(code__iexact=cleaned_code)
        if self.instance:
            dept_qs = dept_qs.exclude(pk=self.instance.pk)
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
        
        # Check if code already used in any contractor
        from contractors.models import Contractor
        con_qs = Contractor.objects.filter(contractor_id__iexact=cleaned_code)
        if con_qs.exists():
            raise serializers.ValidationError(
                f'Code "{cleaned_code}" is already in use by contractor agency "{con_qs.first().name}".'
            )
        
        return cleaned_code


class DesignationSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    total_workers = serializers.ReadOnlyField()
    status = serializers.SerializerMethodField()

    class Meta:
        from .models import Designation
        model = Designation
        fields = [
            'id',
            'title',
            'code',
            'department',
            'department_name',
            'description',
            'is_active',
            'status',
            'total_workers',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'total_workers', 'status', 'department_name']


    def get_status(self, obj):
        return 'Active' if obj.is_active else 'Inactive'

    def validate_title(self, value):
        from .models import Designation
        cleaned_title = value.strip()
        if not cleaned_title:
            raise serializers.ValidationError('Designation title cannot be blank.')
        qs = Designation.objects.filter(title__iexact=cleaned_title)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A designation with this title already exists.')
        return cleaned_title

    def validate_code(self, value):
        import re
        from .models import Designation
        cleaned_code = value.strip().upper() if value else ''
        if not cleaned_code:
            raise serializers.ValidationError('Designation code is required.')
        
        if not re.match(r'^[A-Z]{3}[0-9]{3}$', cleaned_code):
            raise serializers.ValidationError(
                'Designation code must consist of exactly 3 alphabetic letters followed by 3 numeric digits (e.g. ACT001).'
            )
        
        # Check if code already used in another designation
        desig_qs = Designation.objects.filter(code__iexact=cleaned_code)
        if self.instance:
            desig_qs = desig_qs.exclude(pk=self.instance.pk)
        if desig_qs.exists():
            raise serializers.ValidationError(
                f'Code "{cleaned_code}" is already in use by designation "{desig_qs.first().title}".'
            )
        
        # Check if code already used in any department
        dept_qs = Department.objects.filter(code__iexact=cleaned_code)
        if dept_qs.exists():
            raise serializers.ValidationError(
                f'Code "{cleaned_code}" is already in use by department "{dept_qs.first().name}".'
            )
        
        # Check if code already used in any contractor
        from contractors.models import Contractor
        con_qs = Contractor.objects.filter(contractor_id__iexact=cleaned_code)
        if con_qs.exists():
            raise serializers.ValidationError(
                f'Code "{cleaned_code}" is already in use by contractor agency "{con_qs.first().name}".'
            )
        
        return cleaned_code

