from django.apps import AppConfig
from django.db.utils import OperationalError, ProgrammingError


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        # Ensure signup/API role slugs exist (migration 0002_seed_default_roles also does this).
        from accounts.models import Role
        from accounts.roles_data import DEFAULT_ROLES

        try:
            for slug, name in DEFAULT_ROLES:
                Role.objects.get_or_create(slug=slug, defaults={"name": name})
        except (OperationalError, ProgrammingError):
            pass
