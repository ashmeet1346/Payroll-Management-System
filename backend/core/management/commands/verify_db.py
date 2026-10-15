import socket
from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings


class Command(BaseCommand):
    help = 'Verifies database installation, connectivity, and executes a test query.'

    def handle(self, *args, **options):
        self.stdout.write("=" * 60)
        self.stdout.write("PaySphere Database & PostgreSQL Connectivity Diagnosis")
        self.stdout.write("=" * 60)

        # 1. Inspect configured settings
        db_conf = settings.DATABASES['default']
        engine = db_conf.get('ENGINE', '')
        name = db_conf.get('NAME', '')
        user = db_conf.get('USER', '')
        host = db_conf.get('HOST', '')
        port = db_conf.get('PORT', '')

        self.stdout.write(f"Active Database Engine: {engine}")
        self.stdout.write(f"Database Name:         {name}")
        self.stdout.write(f"Database User:         {user or 'N/A'}")
        self.stdout.write(f"Host / Port:           {host or 'localhost'}:{port or 'default'}")

        # 2. Check PostgreSQL port 5432
        target_host = host or '127.0.0.1'
        target_port = int(port) if port else 5432
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1.5)
        port_open = False
        try:
            res = sock.connect_ex((target_host, target_port))
            port_open = (res == 0)
        except Exception:
            port_open = False
        finally:
            sock.close()

        if port_open:
            self.stdout.write(self.style.SUCCESS(f"PostgreSQL port {target_port} on {target_host} is OPEN and LISTENING."))
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"PostgreSQL port {target_port} on {target_host} is NOT reachable. "
                    "Ensure PostgreSQL service is installed and started."
                )
            )

        # 3. Check active database query
        self.stdout.write("Testing live database query on current connection...")
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1;")
                row = cursor.fetchone()
                if row and row[0] == 1:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Database connection verified! Executed 'SELECT 1;' successfully. Result: {row[0]}"
                        )
                    )
        except Exception as exc:
            self.stdout.write(self.style.ERROR(f"Failed to query database: {exc}"))
        
        self.stdout.write("=" * 60)
