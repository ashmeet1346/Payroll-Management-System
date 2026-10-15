from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    is_active = serializers.BooleanField(default=True, required=False)
    total_workers = serializers.ReadOnlyField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id',
            'name',
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
