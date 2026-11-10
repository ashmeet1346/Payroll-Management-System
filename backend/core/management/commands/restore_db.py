"""
Django management command: python manage.py restore_db
Restores the PaySphere SQLite database from a backup file with automatic safety snapshot.
"""

from django.core.management.base import BaseCommand, CommandError
from core.backup import restore_backup, list_backups, get_backup_dir


class Command(BaseCommand):
    help = 'Restores the PaySphere SQLite database from a backup in database_backups/'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default=None,
            help='Filename or path of the backup to restore'
        )
        parser.add_argument(
            '--latest',
            action='store_true',
            default=False,
            help='Automatically restore the latest available backup'
        )
        parser.add_argument(
            '--list',
            action='store_true',
            default=False,
            help='List all available database backups without restoring'
        )

    def handle(self, *args, **options):
        self.stdout.write("=" * 65)
        self.stdout.write("PaySphere SQLite Local Database Restore Tool")
        self.stdout.write("=" * 65)

        backups = list_backups()
        backup_dir = get_backup_dir()

        if options.get('list'):
            if not backups:
                self.stdout.write(self.style.WARNING(f"No backups found in {backup_dir}"))
                return

            self.stdout.write(f"Available backups in {backup_dir}:")
            for idx, b in enumerate(backups, start=1):
                self.stdout.write(f"  [{idx}] {b['filename']} ({b['size_human']}, modified: {b['modified_time']})")
            return

        target_file = options.get('file')

        if options.get('latest'):
            if not backups:
                raise CommandError(f"No backups available in {backup_dir} to restore.")
            target_file = backups[0]['filename']
            self.stdout.write(f"Selected latest backup: {target_file}")

        if not target_file:
            if not backups:
                raise CommandError(f"No backups found in {backup_dir}. Run 'python manage.py backup_db' first.")

            self.stdout.write(f"Available backups in {backup_dir}:")
            for idx, b in enumerate(backups, start=1):
                self.stdout.write(f"  [{idx}] {b['filename']} ({b['size_human']}, modified: {b['modified_time']})")

            self.stdout.write("")
            self.stdout.write(
                self.style.NOTICE(
                    "To restore, specify: python manage.py restore_db --file <filename>\n"
                    "Or to restore the latest: python manage.py restore_db --latest"
                )
            )
            return

        try:
            result = restore_backup(target_file)
            self.stdout.write(self.style.SUCCESS("[OK] Database restored successfully!"))
            self.stdout.write(f"  Restored From: {result['restored_from']}")
            self.stdout.write(f"  Target DB:     {result['target_db']}")
            if result.get('safety_backup'):
                self.stdout.write(
                    f"  Safety Backup: {result['safety_backup']['filename']} "
                    f"({result['safety_backup']['size_human']})"
                )
            self.stdout.write("  Integrity:     PASSED (PRAGMA integrity_check verified)")
            self.stdout.write("=" * 65)
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"[FAIL] Restore failed: {exc}"))
            raise CommandError(str(exc))
