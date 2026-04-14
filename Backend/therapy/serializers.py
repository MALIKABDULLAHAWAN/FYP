from __future__ import annotations

from rest_framework import serializers
from django.contrib.auth import get_user_model

from patients.models import ChildProfile
from therapy.models import TherapySession, SessionTrial, Observation, GameSession, GameImage

User = get_user_model()


class SessionTrialSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionTrial
        fields = (
            "id",
            "trial_type",
            "prompt",
            "target_behavior",
            "status",
            "started_at",
            "ended_at",
            "score",
            "success",
            "created_at",
        )
        read_only_fields = ("id", "started_at", "ended_at", "created_at", "status")

    def validate_score(self, value):
        if value is None:
            return value
        if not (0 <= value <= 10):
            raise serializers.ValidationError("score must be between 0 and 10")
        return value


class ObservationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Observation
        fields = ("id", "trial", "note", "tags", "rating", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_rating(self, value):
        if value is None:
            return value
        if not (0 <= value <= 10):
            raise serializers.ValidationError("rating must be between 0 and 10")
        return value


class TherapySessionSerializer(serializers.ModelSerializer):
    child_id = serializers.IntegerField(source="child.id", read_only=True)
    child_email = serializers.EmailField(source="child.user.email", read_only=True)
    therapist_id = serializers.IntegerField(source="therapist.id", read_only=True)
    therapist_email = serializers.EmailField(source="therapist.email", read_only=True)

    trials = SessionTrialSerializer(many=True, read_only=True)
    observations = ObservationSerializer(many=True, read_only=True)

    class Meta:
        model = TherapySession
        fields = (
            "id",
            "status",
            "session_date",
            "started_at",
            "ended_at",
            "title",
            "notes",
            "child_id",
            "child_email",
            "therapist_id",
            "therapist_email",
            "trials",
            "observations",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "status", "started_at", "ended_at", "created_at", "updated_at")


class CreateSessionSerializer(serializers.Serializer):
    child_profile_id = serializers.IntegerField()
    title = serializers.CharField(required=False, allow_blank=True, default="")
    notes = serializers.CharField(required=False, allow_blank=True, default="")
    session_date = serializers.DateField(required=False)

    def validate_child_profile_id(self, value):
        if not ChildProfile.objects.filter(id=value).exists():
            raise serializers.ValidationError("Child profile not found")
        return value


class AddTrialSerializer(serializers.Serializer):
    trial_type = serializers.CharField(max_length=120)
    prompt = serializers.CharField(required=False, allow_blank=True, default="")
    target_behavior = serializers.CharField(required=False, allow_blank=True, default="")


class UpdateTrialResultSerializer(serializers.Serializer):
    score = serializers.IntegerField(required=False, allow_null=True)
    success = serializers.BooleanField(required=False, allow_null=True)
    status = serializers.ChoiceField(choices=["completed", "skipped"], required=False)

    def validate_score(self, value):
        if value is None:
            return value
        if not (0 <= value <= 10):
            raise serializers.ValidationError("score must be between 0 and 10")
        return value


class GameSessionSerializer(serializers.ModelSerializer):
    child_id = serializers.IntegerField(source="child.id", read_only=True)
    child_email = serializers.EmailField(source="child.user.email", read_only=True)
    game_id = serializers.IntegerField(source="game.id", read_only=True)
    game_name = serializers.CharField(source="game.name", read_only=True)
    therapist_id = serializers.IntegerField(source="therapist.id", read_only=True)
    therapist_email = serializers.EmailField(source="therapist.email", read_only=True)

    class Meta:
        model = GameSession
        fields = (
            "id",
            "child_id",
            "child_email",
            "game_id",
            "game_name",
            "therapist_id",
            "therapist_email",
            "started_at",
            "completed_at",
            "duration_seconds",
            "performance_metrics",
            "therapeutic_goals_targeted",
            "child_engagement_level",
            "therapist_notes",
            "observations",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "started_at", "created_at", "updated_at")


class CreateGameSessionSerializer(serializers.Serializer):
    child_profile_id = serializers.IntegerField()
    game_id = serializers.IntegerField()
    therapeutic_goals_targeted = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list,
    )

    def validate_child_profile_id(self, value):
        if not ChildProfile.objects.filter(id=value).exists():
            raise serializers.ValidationError("Child profile not found")
        return value

    def validate_game_id(self, value):
        if not GameImage.objects.filter(id=value).exists():
            raise serializers.ValidationError("Game not found")
        return value


class RecordGameSessionSerializer(serializers.Serializer):
    completed_at = serializers.DateTimeField(required=False, allow_null=True)
    duration_seconds = serializers.IntegerField(required=False, default=0)
    performance_metrics = serializers.JSONField(required=False, default=dict)
    child_engagement_level = serializers.ChoiceField(
        choices=["low", "medium", "high"],
        required=False,
        default="medium",
    )
    therapist_notes = serializers.CharField(required=False, allow_blank=True, default="")
    observations = serializers.JSONField(required=False, default=dict)

    def validate_performance_metrics(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("performance_metrics must be a dictionary")
        # Validate score if present
        if "score" in value:
            score = value["score"]
            if not (0 <= score <= 100):
                raise serializers.ValidationError("score must be between 0 and 100")
        # Validate accuracy if present
        if "accuracy" in value:
            accuracy = value["accuracy"]
            if not (0 <= accuracy <= 1):
                raise serializers.ValidationError("accuracy must be between 0 and 1")
        # Validate completion_percentage if present
        if "completion_percentage" in value:
            completion = value["completion_percentage"]
            if not (0 <= completion <= 1):
                raise serializers.ValidationError("completion_percentage must be between 0 and 1")
        return value


class ChildProgressMetricsSerializer(serializers.Serializer):
    """Serializer for child progress metrics calculation"""
    total_sessions = serializers.IntegerField(read_only=True)
    average_score = serializers.FloatField(read_only=True)
    games_completed = serializers.IntegerField(read_only=True)
    therapeutic_goals_progress = serializers.JSONField(read_only=True)
