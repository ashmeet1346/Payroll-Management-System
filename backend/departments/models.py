from django.db import models
from core.models import TimeStampedModel


class Department(TimeStampedModel):
    """
    Department model for PaySphere.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        error_messages={
            'unique': 'A department with this name already exists.',
        },
        help_text='Unique name of the department (e.g. Production, Maintenance)'
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
        help_text='Name and title of the department in-charge'
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
        return self.name

    @property
    def total_workers(self):
        """
        Dynamically calculates active workers count without hardcoding totals.
        """
        return self.workers.filter(status='Active').count()
