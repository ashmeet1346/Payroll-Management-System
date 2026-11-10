"""
Django management command: python manage.py backup_db
Creates a transaction-safe local backup of the PaySphere SQLite database.
"""

from django.core.management.base import BaseCommand
from core.backup import create_backup, get_backup_dir


class Command(BaseCommand):
    help = 'Creates a verified, transaction-safe SQLite database backup in database_backups/'

    def add_arguments(self, parser):
        parser.add_argument(
            '--name',
            type=str,
            default=None,
            help='Optional custom filename for the backup (defaults to paysphere_backup_YYYY-MM-DD.sqlite3)'
        )
        parser.add_argument(
            '--tag',
            type=str,
            default=None,
            help='Optional tag to append to the filename (e.g., pre_test, weekly, milestone)'
        )

    def handle(self, *args, **options):
        custom_name = options.get('name')
        tag = options.get('tag')

        self.stdout.write("=" * 65)
        self.stdout.write("PaySphere SQLite Local Database Backup")
        self.stdout.write("=" * 65)

        try:
            result = create_backup(custom_filename=custom_name, tag=tag)
            self.stdout.write(self.style.SUCCESS("[OK] Backup created successfully!"))
            self.stdout.write(f"  Backup File: {result['filename']}")
            self.stdout.write(f"  File Size:   {result['size_human']} ({result['size_bytes']:,} bytes)")
            self.stdout.write(f"  Saved To:    {result['path']}")
            self.stdout.write(f"  Source DB:   {result['source_db']}")
            self.stdout.write(f"  Integrity:   PASSED (PRAGMA integrity_check verified)")
            self.stdout.write("=" * 65)
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"[FAIL] Backup failed: {exc}"))
            raise exc
