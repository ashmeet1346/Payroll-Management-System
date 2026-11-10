"""
PaySphere Transaction-Safe SQLite Backup & Restore Engine

Provides automated daily and on-demand backups using SQLite's native Online Backup API
(sqlite3.Connection.backup). This ensures zero-downtime, zero-corruption backups
even while workers, attendance, and payroll transactions are being recorded.
"""

import os
import sys
import sqlite3
import shutil
from datetime import datetime
from pathlib import Path
from django.conf import settings
from django.utils import timezone


def get_sqlite_db_path():
    """Returns the resolved Path to the active SQLite database."""
    db_path = settings.DATABASES['default']['NAME']
    return Path(db_path).resolve()


def get_backup_dir():
    """Returns the resolved Path to the backups directory, ensuring it exists."""
    backup_dir = getattr(settings, 'BACKUP_DIR', settings.BASE_DIR.parent / 'database_backups')
    backup_path = Path(backup_dir).resolve()
    backup_path.mkdir(parents=True, exist_ok=True)
    return backup_path


def format_file_size(size_bytes):
    """Formats bytes into human-readable string (KB, MB, GB)."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"


def create_backup(custom_filename=None, tag=None):
    """
    Creates a transaction-safe, verified SQLite backup.
    
    Uses Python's native sqlite3 online backup API to copy database pages
    safely while the application is live without table locks or corruption.
    
    Naming:
      - Default: paysphere_backup_YYYY-MM-DD.sqlite3
      - If today's backup exists: paysphere_backup_YYYY-MM-DD_HHMMSS.sqlite3 (never overwrites!)
      - Custom: custom_filename (if supplied)
    """
    src_db = get_sqlite_db_path()
    if not src_db.exists():
        raise FileNotFoundError(f"Source database file not found at: {src_db}")

    backup_dir = get_backup_dir()
    today_str = datetime.now().strftime('%Y-%m-%d')
    time_str = datetime.now().strftime('%H%M%S')

    if custom_filename:
        filename = custom_filename if custom_filename.endswith('.sqlite3') else f"{custom_filename}.sqlite3"
    elif tag:
        filename = f"paysphere_backup_{today_str}_{tag}.sqlite3"
    else:
        default_name = f"paysphere_backup_{today_str}.sqlite3"
        if (backup_dir / default_name).exists():
            # Never overwrite existing daily backup - append timestamp
            filename = f"paysphere_backup_{today_str}_{time_str}.sqlite3"
        else:
            filename = default_name

    dst_path = backup_dir / filename

    # Execute transaction-safe online backup
    src_conn = sqlite3.connect(str(src_db), timeout=30.0)
    dst_conn = sqlite3.connect(str(dst_path))

    try:
        # Atomic page-by-page copy
        src_conn.backup(dst_conn)
    finally:
        dst_conn.close()
        src_conn.close()

    # Verify backup integrity
    verify_conn = sqlite3.connect(str(dst_path))
    try:
        cursor = verify_conn.cursor()
        cursor.execute("PRAGMA integrity_check;")
        check_result = cursor.fetchone()
        if not check_result or check_result[0] != 'ok':
            dst_path.unlink(missing_ok=True)
            raise RuntimeError(f"Backup verification failed: {check_result}")
    finally:
        verify_conn.close()

    size_bytes = dst_path.stat().st_size

    return {
        'success': True,
        'filename': filename,
        'path': str(dst_path),
        'size_bytes': size_bytes,
        'size_human': format_file_size(size_bytes),
        'timestamp': timezone.now().isoformat(),
        'source_db': str(src_db),
    }


def restore_backup(backup_file_or_name):
    """
    Restores the SQLite database from a specified backup file.
    
    Safety features:
      1. Validates that the backup file exists and passes PRAGMA integrity_check.
      2. Automatically takes an emergency safety backup of the current database
         (paysphere_pre_restore_YYYY-MM-DD_HHMMSS.sqlite3) before making changes.
      3. Closes active Django connections.
      4. Restores atomically into the live database.
      5. Cleans up stale WAL/SHM files to ensure instant sync.
    """
    backup_dir = get_backup_dir()
    backup_path = Path(backup_file_or_name)

    if not backup_path.is_absolute():
        backup_path = backup_dir / backup_file_or_name

    if not backup_path.exists():
        # Try appending .sqlite3 if omitted
        if (backup_dir / f"{backup_file_or_name}.sqlite3").exists():
            backup_path = backup_dir / f"{backup_file_or_name}.sqlite3"
        else:
            raise FileNotFoundError(f"Backup file not found: {backup_path}")

    # Validate backup file integrity
    test_conn = sqlite3.connect(str(backup_path))
    try:
        cursor = test_conn.cursor()
        cursor.execute("PRAGMA integrity_check;")
        res = cursor.fetchone()
        if not res or res[0] != 'ok':
            raise ValueError(f"Cannot restore corrupted backup: {res}")
    finally:
        test_conn.close()

    live_db = get_sqlite_db_path()

    # Step 1: Emergency pre-restore safety snapshot
    pre_restore_backup = None
    if live_db.exists():
        pre_restore_backup = create_backup(tag=f"pre_restore_{datetime.now().strftime('%H%M%S')}")

    # Step 2: Close all Django database connections
    from django.db import connections
    connections.close_all()

    # Step 3: Atomic restore using SQLite backup API
    backup_conn = sqlite3.connect(str(backup_path), timeout=30.0)
    live_conn = sqlite3.connect(str(live_db), timeout=30.0)
    try:
        backup_conn.backup(live_conn)
    finally:
        live_conn.close()
        backup_conn.close()

    # Step 4: Remove stale WAL/SHM files if present
    wal_file = live_db.parent / f"{live_db.name}-wal"
    shm_file = live_db.parent / f"{live_db.name}-shm"
    if wal_file.exists():
        try:
            wal_file.unlink()
        except Exception:
            pass
    if shm_file.exists():
        try:
            shm_file.unlink()
        except Exception:
            pass

    # Step 5: Verify restored database
    verify_conn = sqlite3.connect(str(live_db))
    try:
        cursor = verify_conn.cursor()
        cursor.execute("PRAGMA integrity_check;")
        check_result = cursor.fetchone()
        if not check_result or check_result[0] != 'ok':
            raise RuntimeError(f"Restored database integrity check failed: {check_result}")
    finally:
        verify_conn.close()

    return {
        'success': True,
        'restored_from': str(backup_path),
        'target_db': str(live_db),
        'safety_backup': pre_restore_backup,
        'restored_at': timezone.now().isoformat(),
    }


def list_backups():
    """Lists all available backup files sorted newest-first."""
    backup_dir = get_backup_dir()
    backups = []

    for file_path in backup_dir.glob("*.sqlite3"):
        stat = file_path.stat()
        backups.append({
            'filename': file_path.name,
            'path': str(file_path),
            'size_bytes': stat.st_size,
            'size_human': format_file_size(stat.st_size),
            'modified_time': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
            'created_date': datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d'),
        })

    backups.sort(key=lambda x: x['modified_time'], reverse=True)
    return backups


def auto_daily_backup():
    """
    Checks if a backup for today already exists.
    If not, automatically creates one on server startup.
    Safe and silent - never crashes application startup.
    """
    try:
        live_db = get_sqlite_db_path()
        if not live_db.exists():
            return None

        today_str = datetime.now().strftime('%Y-%m-%d')
        backup_dir = get_backup_dir()

        # Check if any backup for today already exists
        existing_today = list(backup_dir.glob(f"paysphere_backup_{today_str}*.sqlite3"))
        if existing_today:
            # Daily backup already present for today
            return None

        return create_backup()
    except Exception as exc:
        # Don't fail server startup if backup fails
        print(f"[PaySphere Backup] Auto-backup notice: {exc}", file=sys.stderr)
        return None
