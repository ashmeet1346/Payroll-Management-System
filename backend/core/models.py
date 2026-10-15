from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    ``created_at`` and ``updated_at`` fields.
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Company(TimeStampedModel):
    """
    Company profile and enterprise configuration for PaySphere.
    """
    name = models.CharField(max_length=200, default='PaySphere Forging Industries Ltd.')
    legal_name = models.CharField(max_length=200, blank=True, default='')
    registration_number = models.CharField(max_length=100, blank=True, default='')
    tax_id = models.CharField(max_length=100, blank=True, default='', help_text='GSTIN or PAN')
    address = models.TextField(blank=True, default='')
    contact_email = models.EmailField(blank=True, default='')
    contact_phone = models.CharField(max_length=30, blank=True, default='')
    financial_year_start = models.DateField(null=True, blank=True)
    currency = models.CharField(max_length=10, default='INR')
    logo = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    config = models.JSONField(default=dict, blank=True, help_text='Configurable company-level policies')

    class Meta:
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'

    def __str__(self):
        return self.name


class AuditLog(models.Model):
    """
    System-wide audit trail for sensitive financial, attendance, and administrative events.
    """
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
        ('LOCK', 'Lock'),
        ('PAY', 'Record Payment'),
        ('REVERSE', 'Reverse'),
        ('LOGIN', 'User Login'),
        ('IMPORT', 'Import Batch'),
    ]

    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=50, choices=ACTION_CHOICES, db_index=True)
    model_name = models.CharField(max_length=100, db_index=True)
    record_id = models.CharField(max_length=100, blank=True, default='')
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'

    def __str__(self):
        actor_name = self.actor.username if self.actor else 'System'
        return f"[{self.created_at:%Y-%m-%d %H:%M:%S}] {actor_name} -> {self.action} on {self.model_name} ({self.record_id})"


class DataStore(TimeStampedModel):
    """
    Persistent key-value JSON storage for application modules (Contractors, Advances, Attendance, etc.)
    Ensures that any data created by the user is persisted across logins and reloads.
    """
    key = models.CharField(max_length=100, unique=True, db_index=True)
    data = models.JSONField(default=list)

    class Meta:
        ordering = ['key']
        verbose_name = 'Data Store'
        verbose_name_plural = 'Data Stores'

    def __str__(self):
        return self.key
