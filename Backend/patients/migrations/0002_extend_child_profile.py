# Generated migration for extending ChildProfile with child-friendly UI fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patients', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='childprofile',
            name='preferred_difficulty',
            field=models.CharField(
                blank=True,
                choices=[('easy', 'Easy'), ('medium', 'Medium'), ('hard', 'Hard')],
                default='easy',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='childprofile',
            name='therapeutic_focus_areas',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="Array of therapeutic goals (e.g., ['speech-articulation', 'social-awareness'])",
            ),
        ),
        migrations.AddField(
            model_name='childprofile',
            name='age_group',
            field=models.CharField(
                blank=True,
                choices=[('3-5', '3-5 years'), ('6-8', '6-8 years'), ('9-12', '9-12 years')],
                default='',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='childprofile',
            name='accessibility_preferences',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='Accessibility settings: text_size_multiplier, animation_enabled, high_contrast_mode, screen_reader_enabled, reduced_motion',
            ),
        ),
        migrations.AddField(
            model_name='childprofile',
            name='game_history',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='Array of recent game IDs',
            ),
        ),
        migrations.AddField(
            model_name='childprofile',
            name='progress_metrics',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text='Progress tracking: total_sessions, average_score, games_completed, therapeutic_goals_progress',
            ),
        ),
    ]
