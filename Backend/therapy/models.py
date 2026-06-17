from __future__ import annotations

from django.conf import settings
from django.db import models
from django.utils import timezone

from patients.models import ChildProfile


class TherapySession(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"

    class SupervisionMode(models.TextChoices):
        THERAPIST = "therapist", "Therapist"
        CAREGIVER = "caregiver", "Caregiver"
        MIXED = "mixed", "Mixed"

    id = models.BigAutoField(primary_key=True)

    child = models.ForeignKey(ChildProfile, on_delete=models.PROTECT, related_name="therapy_sessions")
    therapist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="therapy_sessions")

    # Who actually started/created the session record (therapist, caregiver, admin)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_therapy_sessions",
        null=True,
        blank=True,
    )

    supervision_mode = models.CharField(
        max_length=20,
        choices=SupervisionMode.choices,
        default=SupervisionMode.THERAPIST,
    )

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    session_date = models.DateField(default=timezone.localdate)

    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    title = models.CharField(max_length=200, blank=True, default="")
    notes = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["child", "session_date"]),
            models.Index(fields=["therapist", "session_date"]),
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"Session({self.id}) child={self.child_id} status={self.status}"


class SessionTrial(models.Model):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        SKIPPED = "skipped", "Skipped"

    id = models.BigAutoField(primary_key=True)

    session = models.ForeignKey(TherapySession, on_delete=models.CASCADE, related_name="trials")

    trial_type = models.CharField(max_length=120)  # e.g., "joint_attention", "speech_prompt", "imitation"
    prompt = models.TextField(blank=True, default="")
    target_behavior = models.CharField(max_length=200, blank=True, default="")

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    score = models.IntegerField(null=True, blank=True)  # 0-10 (validate in serializer)
    success = models.BooleanField(null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=["session", "created_at"]),
            models.Index(fields=["trial_type"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return f"Trial({self.id}) type={self.trial_type} status={self.status}"


class Observation(models.Model):
    """
    Observation can be attached to a session or a specific trial.
    Also used for structured telemetry (JSON tags) for games and AI signals.
    """
    id = models.BigAutoField(primary_key=True)

    session = models.ForeignKey(TherapySession, on_delete=models.CASCADE, related_name="observations")
    trial = models.ForeignKey(SessionTrial, on_delete=models.SET_NULL, null=True, blank=True, related_name="observations")

    therapist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="observations")

    note = models.TextField(blank=True, default="")

    # IMPORTANT: dict is required for structured telemetry
    tags = models.JSONField(default=dict, blank=True)
    rating = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=["session", "created_at"]),
            models.Index(fields=["therapist", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"Obs({self.id}) session={self.session_id} trial={self.trial_id}"


class ScenarioImage(models.Model):
    """
    A scenario image/video used in the Scene Description game.
    Stores the image, expected description, and metadata for adaptive difficulty.
    """
    id = models.BigAutoField(primary_key=True)

    # Scenario details
    title = models.CharField(max_length=200)
    image = models.ImageField(upload_to="scenarios/")  # or VideoField for videos
    expected_description = models.TextField(help_text="Expected key elements child should describe")

    # Difficulty level (1-3)
    level = models.IntegerField(default=1, choices=[(1, "Easy"), (2, "Medium"), (3, "Hard")])

    # Key elements to look for (JSON list)
    key_elements = models.JSONField(default=list, blank=True, help_text="List of key things to describe")

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=["level"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self) -> str:
        return f"Scenario({self.id}) {self.title} (Level {self.level})"


class SceneDescriptionResponse(models.Model):
    """
    Tracks a child's response to a scenario image in the Scene Description game.
    """
    id = models.BigAutoField(primary_key=True)

    trial = models.ForeignKey(SessionTrial, on_delete=models.CASCADE, related_name="scene_responses")
    scenario = models.ForeignKey(ScenarioImage, on_delete=models.PROTECT, related_name="responses")

    child_response = models.TextField(help_text="Child's description of the scenario")

    # LLM Evaluation Results
    llm_feedback = models.TextField(blank=True, default="", help_text="Detailed feedback from LLM")
    llm_score = models.IntegerField(null=True, blank=True, help_text="0-100 score from LLM")
    key_elements_found = models.JSONField(default=list, blank=True, help_text="Which key elements were mentioned")
    clarity_score = models.IntegerField(null=True, blank=True, help_text="0-10 clarity/coherence")
    completeness_score = models.IntegerField(null=True, blank=True, help_text="0-10 how complete the description is")

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=["trial"]),
            models.Index(fields=["scenario"]),
        ]

    def __str__(self) -> str:
        return f"Response({self.id}) trial={self.trial_id} score={self.llm_score}"


class GameImage(models.Model):
    """
    Generic game image dataset for various therapy games.
    Supports: Memory Match, Object Discovery, Problem Solving, etc.
    """
    class GameType(models.TextChoices):
        MEMORY_MATCH = "memory_match", "Memory Match"
        OBJECT_DISCOVERY = "object_discovery", "Object Discovery"
        PROBLEM_SOLVING = "problem_solving", "Problem Solving"
        SPEECH_PROMPT = "speech_prompt", "Speech Prompt"
        MATCHING = "matching", "Matching Game"
    
    id = models.BigAutoField(primary_key=True)
    
    # Basic info
    name = models.CharField(max_length=200)
    game_type = models.CharField(max_length=30, choices=GameType.choices)
    category = models.CharField(max_length=50, blank=True, default="", help_text="E.g., animal, food, vehicle")
    
    # Image
    image = models.ImageField(upload_to="game_images/%Y/%m/", null=True, blank=True)
    emoji = models.CharField(max_length=10, blank=True, default="", help_text="Emoji representation if available")
    
    # Difficulty and metadata
    difficulty = models.IntegerField(default=1, choices=[(1, "Easy"), (2, "Medium"), (3, "Hard")])
    tags = models.JSONField(default=list, blank=True, help_text="Searchable tags")
    
    # Problem solving specific fields
    question = models.TextField(blank=True, default="", help_text="Question for problem solving games")
    correct_answer = models.CharField(max_length=200, blank=True, default="")
    options = models.JSONField(default=list, blank=True, help_text="Multiple choice options")
    hint = models.TextField(blank=True, default="", help_text="Hint for the child")
    
    # Status
    is_active = models.BooleanField(default=True)
    usage_count = models.IntegerField(default=0, help_text="How many times this image has been used")
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=["game_type", "category"]),
            models.Index(fields=["game_type", "difficulty"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["tags"]),
        ]
        ordering = ["game_type", "category", "name"]
    
    def __str__(self) -> str:
        return f"GameImage({self.id}) {self.name} [{self.game_type}]"


class GameSession(models.Model):
    """
    Records a child's game session with performance metrics.
    Tracks score, accuracy, completion percentage, and difficulty adjustments.
    """
    id = models.BigAutoField(primary_key=True)
    
    child = models.ForeignKey(ChildProfile, on_delete=models.CASCADE, related_name="game_sessions")
    game = models.ForeignKey(GameImage, on_delete=models.PROTECT, related_name="sessions")
    therapist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="game_sessions")
    
    # Timing
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(default=0, help_text="Total session duration in seconds")
    
    # Performance metrics
    performance_metrics = models.JSONField(
        default=dict,
        blank=True,
        help_text="Performance data: score (0-100), accuracy (0-1), completion_percentage (0-1), difficulty_adjusted (bool)",
    )
    
    # Therapeutic data
    therapeutic_goals_targeted = models.JSONField(
        default=list,
        blank=True,
        help_text="Array of therapeutic goals targeted in this session",
    )
    child_engagement_level = models.CharField(
        max_length=20,
        choices=[("low", "Low"), ("medium", "Medium"), ("high", "High")],
        default="medium",
        blank=True,
    )
    
    # Therapist notes
    therapist_notes = models.TextField(blank=True, default="")
    observations = models.JSONField(
        default=dict,
        blank=True,
        help_text="Structured observations: behavior_notes, progress_indicators, areas_for_improvement",
    )
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=["child", "created_at"]),
            models.Index(fields=["game", "created_at"]),
            models.Index(fields=["therapist", "created_at"]),
            models.Index(fields=["started_at"]),
        ]
    
    def __str__(self) -> str:
        return f"GameSession({self.id}) child={self.child_id} game={self.game_id}"

    def record_session_completion(self, performance_metrics=None, observations=None, therapist_notes=""):
        """Record session completion with performance data"""
        from django.utils import timezone
        
        self.completed_at = timezone.now()
        
        if performance_metrics:
            self.performance_metrics = performance_metrics
        
        if observations:
            self.observations = observations
        
        if therapist_notes:
            self.therapist_notes = therapist_notes
        
        # Calculate duration
        if self.started_at and self.completed_at:
            duration = (self.completed_at - self.started_at).total_seconds()
            self.duration_seconds = int(duration)
        
        self.save()
        
        # Update child's progress metrics
        self.child.calculate_progress_metrics()
        
        return self
