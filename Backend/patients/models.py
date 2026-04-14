from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone


class ChildProfile(models.Model):
    """
    Clinical child record. Backed by a User (often created as a non-login identity).
    Child does NOT authenticate.
    """
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"
        UNDISCLOSED = "undisclosed", "Undisclosed"

    id = models.BigAutoField(primary_key=True)

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="child_profile",
    )

    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=Gender.choices, default=Gender.UNDISCLOSED)

    primary_language = models.CharField(max_length=30, blank=True, default="")

    diagnosis_notes = models.TextField(blank=True, default="")
    clinical_notes = models.TextField(blank=True, default="")

    # IMPORTANT:
    # These booleans can remain as *cached gates* for MVP.
    # Legal-grade consent history should live in compliance.Consent (we add next).
    consent_audio = models.BooleanField(default=False)
    consent_video = models.BooleanField(default=False)
    consent_face = models.BooleanField(default=False)
    consent_ai = models.BooleanField(default=False)

    # Child-friendly UI enhancements
    preferred_difficulty = models.CharField(
        max_length=20,
        choices=[("easy", "Easy"), ("medium", "Medium"), ("hard", "Hard")],
        default="easy",
        blank=True,
    )
    therapeutic_focus_areas = models.JSONField(
        default=list,
        blank=True,
        help_text="Array of therapeutic goals (e.g., ['speech-articulation', 'social-awareness'])",
    )
    age_group = models.CharField(
        max_length=10,
        choices=[("3-5", "3-5 years"), ("6-8", "6-8 years"), ("9-12", "9-12 years")],
        blank=True,
        default="",
    )
    
    # Accessibility preferences
    accessibility_preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text="Accessibility settings: text_size_multiplier, animation_enabled, high_contrast_mode, screen_reader_enabled, reduced_motion",
    )
    
    # Game history and progress
    game_history = models.JSONField(
        default=list,
        blank=True,
        help_text="Array of recent game IDs",
    )
    progress_metrics = models.JSONField(
        default=dict,
        blank=True,
        help_text="Progress tracking: total_sessions, average_score, games_completed, therapeutic_goals_progress",
    )

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["updated_at"]),
            models.Index(fields=["deleted_at"]),
        ]

    def __str__(self) -> str:
        return f"ChildProfile({self.user.email})"

    def calculate_progress_metrics(self):
        """Calculate and update progress metrics based on game sessions"""
        from therapy.models import GameSession
        
        sessions = GameSession.objects.filter(child=self)
        total_sessions = sessions.count()
        
        # Calculate average score
        scores = []
        for session in sessions:
            metrics = session.performance_metrics or {}
            if "score" in metrics:
                scores.append(metrics["score"])
        average_score = sum(scores) / len(scores) if scores else 0
        
        # Count completed games
        games_completed = sessions.filter(completed_at__isnull=False).count()
        
        # Calculate therapeutic goals progress
        therapeutic_goals_progress = {}
        for session in sessions:
            goals = session.therapeutic_goals_targeted or []
            metrics = session.performance_metrics or {}
            score = metrics.get("score", 0)
            
            for goal in goals:
                if goal not in therapeutic_goals_progress:
                    therapeutic_goals_progress[goal] = {
                        "sessions_completed": 0,
                        "average_performance": 0,
                        "last_session_date": None,
                    }
                therapeutic_goals_progress[goal]["sessions_completed"] += 1
                therapeutic_goals_progress[goal]["last_session_date"] = session.created_at.isoformat()
        
        # Calculate average performance per goal
        for goal, data in therapeutic_goals_progress.items():
            goal_sessions = sessions.filter(therapeutic_goals_targeted__contains=[goal])
            scores = []
            for session in goal_sessions:
                metrics = session.performance_metrics or {}
                if "score" in metrics:
                    scores.append(metrics["score"])
            data["average_performance"] = sum(scores) / len(scores) if scores else 0
        
        self.progress_metrics = {
            "total_sessions": total_sessions,
            "average_score": average_score,
            "games_completed": games_completed,
            "therapeutic_goals_progress": therapeutic_goals_progress,
        }
        self.save()


class Guardian(models.Model):
    """
    Guardian/contact for the child (MVP).
    Later you can attach Guardian to a User for login + legal consent signatures.
    """
    id = models.BigAutoField(primary_key=True)
    child_profile = models.ForeignKey(ChildProfile, on_delete=models.CASCADE, related_name="guardians")

    name = models.CharField(max_length=200)
    relation = models.CharField(max_length=80, blank=True, default="")  # mother, father, etc.
    phone = models.CharField(max_length=40, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    address = models.TextField(blank=True, default="")

    is_legal_guardian = models.BooleanField(default=False)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=["child_profile", "created_at"]),
            models.Index(fields=["phone"]),
        ]

    def __str__(self) -> str:
        return f"Guardian({self.name})"


class TherapistChildAssignment(models.Model):
    therapist = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_children",
    )

    # TEMPORARY: allow null during migration
    child_profile = models.ForeignKey(
        "patients.ChildProfile",
        on_delete=models.CASCADE,
        related_name="assigned_therapists",
        null=True,
        blank=True,
    )

    # Keep old field for now (so we can migrate data)
    child_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_therapists",
    )

    is_primary = models.BooleanField(default=True)
    assigned_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=["therapist"]),
            models.Index(fields=["child_user"]),
            models.Index(fields=["child_profile"]),
        ]
