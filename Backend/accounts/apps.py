from django.apps import AppConfig
from django.db.utils import OperationalError, ProgrammingError


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        # Migrations and manual seeding handle this better.
        # Premature DB access here causes deadlocks in some environments.
        pass
