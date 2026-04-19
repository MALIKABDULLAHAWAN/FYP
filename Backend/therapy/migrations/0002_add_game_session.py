# Generated migration for adding GameSession model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('therapy', '0001_initial'),
        ('patients', '0002_extend_child_profile'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='GameSession',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('started_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('duration_seconds', models.IntegerField(default=0, help_text='Total session duration in seconds')),
                ('performance_metrics', models.JSONField(blank=True, default=dict, help_text='Performance data: score (0-100), accuracy (0-1), completion_percentage (0-1), difficulty_adjusted (bool)')),
                ('therapeutic_goals_targeted', models.JSONField(blank=True, default=list, help_text='Array of therapeutic goals targeted in this session')),
                ('child_engagement_level', models.CharField(blank=True, choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium', max_length=20)),
                ('therapist_notes', models.TextField(blank=True, default='')),
                ('observations', models.JSONField(blank=True, default=dict, help_text='Structured observations: behavior_notes, progress_indicators, areas_for_improvement')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('child', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='game_sessions', to='patients.childprofile')),
                ('game', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='sessions', to='therapy.gameimage')),
                ('therapist', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='game_sessions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'indexes': [
                    models.Index(fields=['child', 'created_at'], name='therapy_gam_child_i_idx'),
                    models.Index(fields=['game', 'created_at'], name='therapy_gam_game_i_idx'),
                    models.Index(fields=['therapist', 'created_at'], name='therapy_gam_therapi_idx'),
                    models.Index(fields=['started_at'], name='therapy_gam_started_idx'),
                ],
            },
        ),
    ]
