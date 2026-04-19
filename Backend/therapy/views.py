from __future__ import annotations

from django.utils import timezone
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from accounts.models import UserRole
from patients.models import ChildProfile, TherapistChildAssignment
from therapy.models import TherapySession, SessionTrial, Observation
from therapy.serializers import (
    TherapySessionSerializer,
    CreateSessionSerializer,
    AddTrialSerializer,
    UpdateTrialResultSerializer,
    ObservationSerializer,
)
from therapy.permissions import IsAdminOrTherapist, CanAccessSession, is_admin, is_therapist

User = get_user_model()


def _ensure_therapist_can_access_child(therapist: User, child: ChildProfile) -> bool:
    return TherapistChildAssignment.objects.filter(therapist=therapist, child_user=child.user).exists()


class SessionListCreateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTherapist]

    def get(self, request):
        if is_admin(request.user):
            qs = TherapySession.objects.select_related("child__user", "therapist").order_by("-created_at")
        else:
            child_ids = TherapistChildAssignment.objects.filter(
                therapist=request.user
            ).values_list("child_user_id", flat=True)

            qs = TherapySession.objects.select_related("child__user", "therapist").filter(
                child__user_id__in=child_ids
            ).order_by("-created_at")

        return Response(TherapySessionSerializer(qs, many=True).data)

    def post(self, request):
        ser = CreateSessionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        child = ChildProfile.objects.select_related("user").get(id=ser.validated_data["child_profile_id"])

        # Therapist must be assigned to that child
        if is_therapist(request.user) and not _ensure_therapist_can_access_child(request.user, child):
            return Response({"detail": "Not assigned to this child"}, status=status.HTTP_403_FORBIDDEN)

        session = TherapySession.objects.create(
            child=child,
            therapist=request.user,
            title=ser.validated_data.get("title", ""),
            notes=ser.validated_data.get("notes", ""),
            session_date=ser.validated_data.get("session_date", timezone.localdate()),
            status=TherapySession.Status.DRAFT,
        )

        return Response(TherapySessionSerializer(session).data, status=status.HTTP_201_CREATED)


class SessionDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTherapist, CanAccessSession]

    def _get(self, session_id: int) -> TherapySession:
        return TherapySession.objects.select_related("child__user", "therapist").prefetch_related("trials", "observations").get(id=session_id)

    def get(self, request, session_id: int):
        s = self._get(session_id)
        self.check_object_permissions(request, s)
        return Response(TherapySessionSerializer(s).data)

    def patch(self, request, session_id: int):
        s = self._get(session_id)
        self.check_object_permissions(request, s)

        if s.status == TherapySession.Status.COMPLETED:
            return Response({"detail": "Completed session cannot be edited"}, status=status.HTTP_400_BAD_REQUEST)

        # allow editing title/notes only
        title = request.data.get("title", None)
        notes = request.data.get("notes", None)
        if title is not None:
            s.title = str(title)
        if notes is not None:
            s.notes = str(notes)

        s.save()
        return Response(TherapySessionSerializer(s).data)


class SessionStartView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTherapist, CanAccessSession]

    def post(self, request, session_id: int):
        s = TherapySession.objects.select_related("child__user", "therapist").get(id=session_id)
        self.check_object_permissions(request, s)

        if s.status != TherapySession.Status.DRAFT:
            return Response({"detail": "Session must be in draft to start"}, status=status.HTTP_400_BAD_REQUEST)

        s.status = TherapySession.Status.IN_PROGRESS
        s.started_at = timezone.now()
        s.save()

        return Response({"status": "ok", "session_id": s.id, "started_at": s.started_at})


class SessionEndView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTherapist, CanAccessSession]

    def post(self, request, session_id: int):
        s = TherapySession.objects.select_related("child__user", "therapist").get(id=session_id)
        self.check_object_permissions(request, s)

        if s.status != TherapySession.Status.IN_PROGRESS:
            return Response({"detail": "Session must be in progress to end"}, status=status.HTTP_400_BAD_REQUEST)

        s.status = TherapySession.Status.COMPLETED
        s.ended_at = timezone.now()
        s.save()

        return Response({"status": "ok", "session_id": s.id, "ended_at": s.ended_at})


class SessionAddTrialView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTherapist, CanAccessSession]

    def post(self, request, session_id: int):
        s = TherapySession.objects.select_related("child__user", "therapist").get(id=session_id)
        self.check_object_permissions(request, s)

        if s.status == TherapySession.Status.COMPLETED:
            return Response({"detail": "Cannot add trials to completed session"}, status=status.HTTP_400_BAD_REQUEST)

        ser = AddTrialSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        trial = SessionTrial.objects.create(
            session=s,
            trial_type=ser.validated_data["trial_type"],
            prompt=ser.validated_data.get("prompt", ""),
            target_behavior=ser.validated_data.get("target_behavior", ""),
            status=SessionTrial.Status.PLANNED,
        )

        return Response({"status": "ok", "trial_id": trial.id}, status=status.HTTP_201_CREATED)


class TrialStartView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTherapist, CanAccessSession]

    def post(self, request, session_id: int, trial_id: int):
        s = TherapySession.objects.select_related("child__user", "therapist").get(id=session_id)
        self.check_object_permissions(request, s)

        if s.status != TherapySession.Status.IN_PROGRESS:
            return Response({"detail": "Session must be in progress to start trials"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            t = SessionTrial.objects.get(id=trial_id, session=s)
        except SessionTrial.DoesNotExist:
            return Response({"detail": "Trial not found"}, status=status.HTTP_404_NOT_FOUND)

        if t.status not in (SessionTrial.Status.PLANNED, SessionTrial.Status.RUNNING):
            return Response({"detail": f"Cannot start trial from status={t.status}"}, status=status.HTTP_400_BAD_REQUEST)

        t.status = SessionTrial.Status.RUNNING
        if not t.started_at:
            t.started_at = timezone.now()
        t.save()

        return Response({"status": "ok", "trial_id": t.id, "started_at": t.started_at})


class TrialFinalizeView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTherapist, CanAccessSession]

    def post(self, request, session_id: int, trial_id: int):
        s = TherapySession.objects.select_related("child__user", "therapist").get(id=session_id)
        self.check_object_permissions(request, s)

        if s.status != TherapySession.Status.IN_PROGRESS:
            return Response({"detail": "Session must be in progress to finalize trials"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            t = SessionTrial.objects.get(id=trial_id, session=s)
        except SessionTrial.DoesNotExist:
            return Response({"detail": "Trial not found"}, status=status.HTTP_404_NOT_FOUND)

        ser = UpdateTrialResultSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        new_status = ser.validated_data.get("status", "completed")
        if new_status == "completed":
            t.status = SessionTrial.Status.COMPLETED
        else:
            t.status = SessionTrial.Status.SKIPPED

        if "score" in ser.validated_data:
            t.score = ser.validated_data["score"]
        if "success" in ser.validated_data:
            t.success = ser.validated_data["success"]

        if not t.started_at:
            t.started_at = timezone.now()
        t.ended_at = timezone.now()
        t.save()

        return Response({"status": "ok", "trial_id": t.id, "trial_status": t.status})


class SessionAddObservationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTherapist, CanAccessSession]

    def post(self, request, session_id: int):
        s = TherapySession.objects.select_related("child__user", "therapist").prefetch_related("trials").get(id=session_id)
        self.check_object_permissions(request, s)

        ser = ObservationSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        trial_obj = None
        trial_id = ser.validated_data.get("trial")
        if trial_id is not None:
            # serializer gives trial PK, not object
            # DRF ModelSerializer provides raw PK here; fetch safely
            try:
                trial_obj = SessionTrial.objects.get(id=trial_id.id, session=s)
            except Exception:
                return Response({"detail": "Trial not found for this session"}, status=status.HTTP_400_BAD_REQUEST)

        obs = Observation.objects.create(
            session=s,
            trial=trial_obj,
            therapist=request.user,
            note=ser.validated_data["note"],
            tags=ser.validated_data.get("tags", []),
            rating=ser.validated_data.get("rating", None),
        )

        return Response({"status": "ok", "observation_id": obs.id}, status=status.HTTP_201_CREATED)


class GameSessionListCreateView(APIView):
    """Create and list game sessions for a child"""
    permission_classes = [IsAuthenticated, IsAdminOrTherapist]

    def get(self, request, child_id: int):
        """Get game sessions for a child"""
        child = ChildProfile.objects.get(id=child_id)
        
        # Check access
        if is_therapist(request.user) and not _ensure_therapist_can_access_child(request.user, child):
            return Response({"detail": "Not assigned to this child"}, status=status.HTTP_403_FORBIDDEN)
        
        from therapy.models import GameSession
        from therapy.serializers import GameSessionSerializer
        
        sessions = GameSession.objects.filter(child=child).select_related(
            "child__user", "game", "therapist"
        ).order_by("-created_at")
        
        return Response(GameSessionSerializer(sessions, many=True).data)

    def post(self, request, child_id: int):
        """Create a new game session"""
        from therapy.models import GameSession
        from therapy.serializers import CreateGameSessionSerializer, GameSessionSerializer
        
        child = ChildProfile.objects.get(id=child_id)
        
        # Check access
        if is_therapist(request.user) and not _ensure_therapist_can_access_child(request.user, child):
            return Response({"detail": "Not assigned to this child"}, status=status.HTTP_403_FORBIDDEN)
        
        ser = CreateGameSessionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        
        from therapy.models import GameImage
        game = GameImage.objects.get(id=ser.validated_data["game_id"])
        
        session = GameSession.objects.create(
            child=child,
            game=game,
            therapist=request.user,
            therapeutic_goals_targeted=ser.validated_data.get("therapeutic_goals_targeted", []),
        )
        
        return Response(GameSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class GameSessionDetailView(APIView):
    """Get, update, and record game session completion"""
    permission_classes = [IsAuthenticated, IsAdminOrTherapist]

    def get(self, request, session_id: int):
        """Get game session details"""
        from therapy.models import GameSession
        from therapy.serializers import GameSessionSerializer
        
        session = GameSession.objects.select_related(
            "child__user", "game", "therapist"
        ).get(id=session_id)
        
        # Check access
        if is_therapist(request.user) and not _ensure_therapist_can_access_child(request.user, session.child):
            return Response({"detail": "Not assigned to this child"}, status=status.HTTP_403_FORBIDDEN)
        
        return Response(GameSessionSerializer(session).data)

    def post(self, request, session_id: int):
        """Record game session completion with performance data"""
        from therapy.models import GameSession
        from therapy.serializers import RecordGameSessionSerializer, GameSessionSerializer
        
        session = GameSession.objects.select_related(
            "child__user", "game", "therapist"
        ).get(id=session_id)
        
        # Check access
        if is_therapist(request.user) and not _ensure_therapist_can_access_child(request.user, session.child):
            return Response({"detail": "Not assigned to this child"}, status=status.HTTP_403_FORBIDDEN)
        
        ser = RecordGameSessionSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        
        session.record_session_completion(
            performance_metrics=ser.validated_data.get("performance_metrics"),
            observations=ser.validated_data.get("observations"),
            therapist_notes=ser.validated_data.get("therapist_notes", ""),
        )
        
        if "child_engagement_level" in ser.validated_data:
            session.child_engagement_level = ser.validated_data["child_engagement_level"]
            session.save()
        
        return Response(GameSessionSerializer(session).data)


class ChildProgressMetricsView(APIView):
    """Get child's progress metrics"""
    permission_classes = [IsAuthenticated, IsAdminOrTherapist]

    def get(self, request, child_id: int):
        """Get child's progress metrics"""
        child = ChildProfile.objects.get(id=child_id)
        
        # Check access
        if is_therapist(request.user) and not _ensure_therapist_can_access_child(request.user, child):
            return Response({"detail": "Not assigned to this child"}, status=status.HTTP_403_FORBIDDEN)
        
        # Calculate progress metrics
        child.calculate_progress_metrics()
        
        from therapy.serializers import ChildProgressMetricsSerializer
        
        metrics_data = {
            "total_sessions": child.progress_metrics.get("total_sessions", 0),
            "average_score": child.progress_metrics.get("average_score", 0),
            "games_completed": child.progress_metrics.get("games_completed", 0),
            "therapeutic_goals_progress": child.progress_metrics.get("therapeutic_goals_progress", {}),
        }
        
        ser = ChildProgressMetricsSerializer(metrics_data)
        return Response(ser.data)
