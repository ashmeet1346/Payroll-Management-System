from django.db import models
from core.models import TimeStampedModel


class Department(TimeStampedModel):
    """
    Department model for PaySphere.
    """
    DEPARTMENT_TYPE_CHOICES = [
        ('Security', 'Security'),
        ('Production', 'Production'),
        ('Tool Room and Die', 'Tool Room and Die'),
        ('CNC and VMC Machining', 'CNC and VMC Machining'),
        ('Cutting', 'Cutting'),
        ('Shot Blasting', 'Shot Blasting'),
        ('Dispatch', 'Dispatch'),
        ('Maintenance and Electrical', 'Maintenance and Electrical'),
        ('IT and Design', 'IT and Design'),
        ('Accounts and Finance', 'Accounts and Finance'),
        ('Administration and Management', 'Administration and Management'),
    ]

    name = models.CharField(
        max_length=100,
        unique=True,
        error_messages={
            'unique': 'A department with this name already exists.',
        },
        help_text='Unique name of the department (e.g. Production, Tool Room)'
    )
    code = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text='Department short code (e.g. SEC, PRD, TRD, CNC)'
    )
    department_type = models.CharField(
        max_length=100,
        blank=True,
        default='General',
        help_text='Functional classification of the department'
    )
    description = models.TextField(
        blank=True,
        default='',
        help_text='Description of functions handled by this department'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Designates whether this department is currently active.'
    )
    head = models.CharField(
        max_length=150,
        blank=True,
        default='',
        help_text='Name and title of the department in-charge (selected later)'
    )
    location = models.CharField(
        max_length=200,
        blank=True,
        default='',
        help_text='Floor, bay, or physical unit location'
    )

    class Meta:
        ordering = ['name']
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'

    def __str__(self):
        return f"{self.name} ({self.code})" if self.code else self.name

    @property
    def total_workers(self):
        """
        Dynamically calculates active workers count without hardcoding totals.
        """
        return self.workers.filter(status='Active').count()


class Designation(TimeStampedModel):
    """
    Designation/Role model associated with departments or plant-wide.
    """
    title = models.CharField(
        max_length=150,
        unique=True,
        error_messages={
            'unique': 'A designation with this title already exists.',
        },
        help_text='Job title or role (e.g. CNC Operator, Lathe Specialist, QA Inspector)'
    )
    code = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text='Designation short code (e.g. OPR-01, SUP-01, HLP-01)'
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='designations',
        help_text='Associated department (optional, or leaves as plant-wide)'
    )
    description = models.TextField(
        blank=True,
        default='',
        help_text='Brief description of role responsibilities'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Designates whether this designation is active.'
    )


    class Meta:
        ordering = ['title']
        verbose_name = 'Designation'
        verbose_name_plural = 'Designations'

    def __str__(self):
        return self.title

    @property
    def total_workers(self):
        from workers.models import Worker
        return Worker.objects.filter(designation__iexact=self.title, status='Active').count()

