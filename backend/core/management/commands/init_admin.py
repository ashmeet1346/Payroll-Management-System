import os
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from departments.models import Department
from workers.models import Worker


class Command(BaseCommand):
    help = 'Initializes the single super admin credential and ensures no sample data exists.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default=os.getenv('DJANGO_SUPERUSER_USERNAME', 'ashmeet123'),
            help='Super admin username'
        )
        parser.add_argument(
            '--password',
            type=str,
            default=os.getenv('DJANGO_SUPERUSER_PASSWORD', 'Ashmeet@123'),
            help='Super admin password'
        )
        parser.add_argument(
            '--email',
            type=str,
            default=os.getenv('DJANGO_SUPERUSER_EMAIL', 'ashmeet@paysphere.local'),
            help='Super admin email'
        )

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        email = options['email']

        self.stdout.write(self.style.NOTICE("Purging any sample/dummy records..."))
        deleted_workers = Worker.objects.all().delete()[0]
        deleted_departments = Department.objects.all().delete()[0]
        self.stdout.write(
            self.style.SUCCESS(
                f"Removed sample data: {deleted_workers} workers, {deleted_departments} departments."
            )
        )

        # Remove any other non-superadmin or lingering user accounts
        other_users = User.objects.exclude(username=username).delete()[0]
        if other_users:
            self.stdout.write(self.style.NOTICE(f"Removed {other_users} other user account(s)."))

        # Create or update the single super admin user
        user, created = User.objects.get_or_create(username=username)
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        action = "Created new" if created else "Updated existing"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action} super admin user: username='{username}', password is set, active=True, is_superuser=True."
            )
        )
