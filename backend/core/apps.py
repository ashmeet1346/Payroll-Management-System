import os
import sys
from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = 'core'

    def ready(self):
        """
        Initializes core signals and triggers automatic daily database backup
        when the development server is started.
        """
        if 'runserver' in sys.argv:
            # Only trigger once in the reloaded process or if running with --noreload
            is_main_or_reload = (os.environ.get('RUN_MAIN') == 'true') or ('--noreload' in sys.argv)
            if is_main_or_reload:
                try:
                    from core.backup import auto_daily_backup
                    res = auto_daily_backup()
                    if res:
                        print(f"[PaySphere] Daily database backup created: {res['filename']} ({res['size_human']})")
                except Exception as exc:
                    pass
