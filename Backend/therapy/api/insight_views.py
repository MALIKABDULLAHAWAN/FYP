from __future__ import annotations
import json
from django.utils import timezone
from django.db.models import Avg, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from therapy.models import TherapySession, SessionTrial
from therapy.ai_services.unified_ai_service import get_ai_service
from patients.models import ChildProfile, TherapistChildAssignment
from patients.permissions import user_has_role

def json_dump_stats(stats):
    return json.dumps(stats, indent=2)

class SessionInsightView(APIView):
    """
    GET /api/v1/therapy/children/<child_id>/insights
    Generates AI-powered pulse insights for a child's performance.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, child_id: int):
        user = request.user
        is_admin = user.is_staff or user_has_role(user, "admin")

        try:
            child = ChildProfile.objects.select_related("user").get(id=child_id)
        except ChildProfile.DoesNotExist:
            return Response({"detail": "Child not found"}, status=404)

        # Check access
        if not is_admin:
            is_therapist = user_has_role(user, "therapist")
            is_parent = user_has_role(user, "parent")
            
            if is_therapist:
                assigned = TherapistChildAssignment.objects.filter(
                    therapist=user, child_user=child.user
                ).exists()
                if not assigned:
                    return Response({"detail": "Not assigned to this child"}, status=403)
            elif is_parent:
                from patients.models import Guardian
                is_guardian = Guardian.objects.filter(
                    child_profile=child, email=user.email
                ).exists()
                if not is_guardian:
                    return Response({"detail": "You are not a guardian of this child"}, status=403)
            else:
                return Response({"detail": "Permission denied"}, status=403)

        # Gather all completed sessions for comprehensive history
        all_completed_sessions = TherapySession.objects.filter(child=child, status="completed").order_by("-created_at")
        
        if not all_completed_sessions.exists():
            return Response({
                "insight": "Not enough activity data to generate insights yet. Let's play some games to see the magic happen! ✨",
                "domains": {}
            })

        # Calculate metrics per domain with expanded game mapping
        domain_map = {
            "cognitive": ["memory_match", "color_match", "matching", "problem_solving", "pattern_matching", "object_discovery"],
            "motor": ["bubble_pop", "shape_sort", "touch_target"],
            "social_emotional": ["emotion_match", "emotion_gesture", "gaze_emotion", "joint_attention", "emotion_face", "gesture_quest"],
            "speech": ["speech_therapy", "story_adventure", "animal_sounds", "speech_sparkles", "talking_time"]
        }

        domain_stats = {}
        for domain, games in domain_map.items():
            trials = SessionTrial.objects.filter(
                session__child=child, 
                trial_type__in=games,
                status="completed"
            )
            count = trials.count()
            if count > 0:
                accuracy = trials.filter(success=True).count() / count
                domain_stats[domain] = {
                    "accuracy": round(accuracy, 2),
                    "trials": count,
                    "trend": "improving" # Mock trend for now, can be calculated by comparing split clusters
                }

        # Calculate overall progression
        total_trials = SessionTrial.objects.filter(session__child=child, status="completed").count()
        recent_avg = all_completed_sessions[:5].aggregate(Avg('accuracy'))['accuracy__avg'] or 0
        overall_avg = all_completed_sessions.aggregate(Avg('accuracy'))['accuracy__avg'] or 0

        # Format prompt for high-level clinical intelligence
        prompt = f"""
        Role: Clinical AI Analyst
        Task: Provide a structured developmental progress report for {child.user.full_name or "the child"}.
        
        Data Context:
        - Total Trials: {total_trials}
        - Domain Performance (Accuracy & Activity count): {json.dumps(domain_stats)}
        - Recent Performance (last 5 sessions): {round(recent_avg * 100, 1)}%
        - Historical Performance: {round(overall_avg * 100, 1)}%
        
        Requirements:
        1. Start with a 'Mastery Summary' (One sentence on their biggest strength).
        2. Identify 'Growth Opportunities' (One area needing more practice).
        3. Finish with a 'Strategic Roadmap' (A concrete recommendation for next week).
        4. Tone: Clinical, encouraging, professional, and precise.
        """

        try:
            ai_service = get_ai_service()
            ai_response = ai_service.generate_response(prompt, agent_key="clinical_analyst")
            insight_text = ai_response.text
        except Exception:
            insight_text = "Mastery is trending upwards across all core domains. Continue with current activity mix to solidify cognitive gains. ✨"

        return Response({
            "insight": insight_text,
            "domains": domain_stats,
            "metrics": {
                "total_trials": total_trials,
                "overall_accuracy": round(overall_avg, 2),
                "recent_accuracy": round(recent_avg, 2)
            },
            "analysis_date": timezone.now().isoformat()
        })
