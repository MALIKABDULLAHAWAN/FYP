# Generated manually — ensures signup role slugs exist after migrate.

from django.db import migrations


def seed_roles(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    default_roles = [
        ("admin", "Admin"),
        ("therapist", "Therapist"),
        ("parent", "Parent"),
        ("child", "Child"),
    ]
    for slug, name in default_roles:
        Role.objects.get_or_create(slug=slug, defaults={"name": name})


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_roles, noop_reverse),
    ]
