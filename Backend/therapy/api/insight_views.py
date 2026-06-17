from __future__ import annotations
import json
from django.utils import timezone
from django.db.models import Avg, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from therapy.models import TherapySession, SessionTrial, GameSession
from therapy.ai_services.unified_ai_service import get_ai_service
from patients.models import ChildProfile, TherapistChildAssignment
from patients.permissions import user_has_role


class SessionInsightView(APIView):
    """
    GET /api/v1/therapy/children/<child_id>/insights
    Generates deeply personalized, AI-powered clinical insights for a child.
    Combines managed TherapySession trials AND standalone GameSession data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, child_id: int):
        user = request.user
        is_admin = user.is_staff or user_has_role(user, "admin")

        try:
            child = ChildProfile.objects.select_related("user").get(id=child_id)
        except ChildProfile.DoesNotExist:
            return Response({"detail": "Child not found"}, status=404)

        # Access control
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

        # ── 1. Domain Mapping (Managed Sessions) ──────────────────────────────
        domain_map = {
            "Cognitive": ["memory_match", "color_match", "matching", "problem_solving",
                          "pattern_matching", "object_discovery"],
            "Motor": ["bubble_pop", "shape_sort", "touch_target"],
            "Social & Emotional": ["emotion_match", "emotion_gesture", "gaze_emotion",
                                   "joint_attention", "emotion_face", "gesture_quest"],
            "Speech & Language": ["speech_therapy", "story_adventure", "animal_sounds",
                                  "speech_sparkles"]
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
                correct = trials.filter(success=True).count()
                accuracy = correct / count
                domain_stats[domain] = {
                    "accuracy": round(accuracy, 3),
                    "trials": count,
                    "correct": correct,
                }

        # ── 2. Pull Standalone GameSession Data ────────────────────────────────
        game_sessions = GameSession.objects.filter(child=child).order_by("-created_at")
        total_standalone = game_sessions.count()
        standalone_summary = {}

        for gs in game_sessions:
            gtype = gs.game.game_type if gs.game_id else "unknown"
            metrics = gs.performance_metrics or {}
            trials = metrics.get("total_trials", 0)
            acc = metrics.get("accuracy", 0)
            if gtype not in standalone_summary:
                standalone_summary[gtype] = {"sessions": 0, "total_trials": 0, "accuracy_sum": 0}
            standalone_summary[gtype]["sessions"] += 1
            standalone_summary[gtype]["total_trials"] += trials
            standalone_summary[gtype]["accuracy_sum"] += acc * trials

        # Format standalone stats
        standalone_display = {}
        for gtype, data in standalone_summary.items():
            tt = data["total_trials"]
            standalone_display[gtype.replace("_", " ").title()] = {
                "sessions": data["sessions"],
                "total_trials": tt,
                "accuracy": round(data["accuracy_sum"] / tt, 3) if tt > 0 else 0,
            }

        # ── 3. Recent AI Observations (from GameSession observations) ──────────
        recent_observations = []
        for gs in game_sessions[:8]:
            obs = (gs.observations or {}).get("buddy_observation")
            if obs:
                recent_observations.append(f"- [{gs.game.game_type}]: {obs}")

        # ── 4. Combined Accuracy Metrics ───────────────────────────────────────
        # Managed session totals
        all_managed_trials = SessionTrial.objects.filter(session__child=child, status="completed")
        total_managed_trials = all_managed_trials.count()
        total_managed_correct = all_managed_trials.filter(success=True).count()

        # Standalone totals
        total_standalone_trials = sum(v["total_trials"] for v in standalone_summary.values())
        total_standalone_correct = sum(
            round(v["accuracy_sum"]) for v in standalone_summary.values()
        )

        combined_trials = total_managed_trials + total_standalone_trials
        combined_correct = total_managed_correct + total_standalone_correct
        overall_accuracy = combined_correct / combined_trials if combined_trials > 0 else 0

        # Recent accuracy (last 5 game sessions)
        recent_acc_list = []
        for gs in game_sessions[:5]:
            m = gs.performance_metrics or {}
            if m.get("accuracy") is not None:
                recent_acc_list.append(m["accuracy"])
        recent_accuracy = sum(recent_acc_list) / len(recent_acc_list) if recent_acc_list else overall_accuracy

        if combined_trials == 0 and total_standalone == 0:
            return Response({
                "insight": "No activity data yet! Let's start some Bubble Pop or Emotion Match games to unlock Buddy's full analysis. 🎮✨",
                "domains": {},
                "metrics": {"total_trials": 0, "overall_accuracy": 0, "recent_accuracy": 0}
            })

        # ── 5. Child Profile Context ───────────────────────────────────────────
        child_name = child.user.full_name or "this child"
        diagnosis = child.diagnosis_notes or "No specific diagnosis notes on file."
        focus_areas = ", ".join(child.therapeutic_focus_areas) if child.therapeutic_focus_areas else "general therapeutic engagement"
        age_group = child.age_group or "unknown"

        # ── 6. Trend Detection ─────────────────────────────────────────────────
        trend_note = ""
        if recent_accuracy > overall_accuracy + 0.05:
            trend_note = f"Performance is IMPROVING — recent accuracy ({round(recent_accuracy*100)}%) is significantly above the historical average ({round(overall_accuracy*100)}%)."
        elif recent_accuracy < overall_accuracy - 0.05:
            trend_note = f"Performance shows a DECLINING trend — recent accuracy ({round(recent_accuracy*100)}%) is below the historical average ({round(overall_accuracy*100)}%)."
        else:
            trend_note = f"Performance is STABLE — recent accuracy ({round(recent_accuracy*100)}%) is consistent with historical average ({round(overall_accuracy*100)}%)."

        # ── 7. Build Rich AI Prompt ────────────────────────────────────────────
        prompt = f"""You are Buddy, a world-class clinical AI embedded in a therapeutic platform for children with autism and developmental challenges.

Generate a STRUCTURED, DETAILED clinical progress report for a therapist. Be specific, actionable, and data-driven. 

=== CHILD CLINICAL PROFILE ===
Name: {child_name}
Age Group: {age_group}
Therapeutic Focus: {focus_areas}
Clinical Notes: {diagnosis}

=== PERFORMANCE METRICS ===
Overall Accuracy (All Time): {round(overall_accuracy * 100, 1)}%
Recent Accuracy (Last 5 sessions): {round(recent_accuracy * 100, 1)}%
Total Trials Tracked: {combined_trials}
Trend: {trend_note}

=== DOMAIN PERFORMANCE (Managed Sessions) ===
{json.dumps(domain_stats, indent=2) if domain_stats else "No managed session data yet."}

=== STANDALONE GAME PERFORMANCE ===
{json.dumps(standalone_display, indent=2) if standalone_display else "No standalone game data yet."}

=== RECENT AI OBSERVATIONS (Last 8 Sessions) ===
{chr(10).join(recent_observations) if recent_observations else "No observations recorded yet."}

=== REPORT REQUIREMENTS ===
Write a structured report with exactly these 4 sections:

**1. Clinical Summary**
One paragraph summarizing the child's overall trajectory and engagement pattern.

**2. Breakthrough Indicators**  
What is {child_name} clearly excelling at? Name specific games/domains with evidence.

**3. Persistent Barriers**
What is stalling progress? Be specific about which domains or game types show weakness.

**4. Strategic Recommendations**
Give 2-3 CONCRETE, actionable recommendations for this week. Mention specific game types, difficulty adjustments, or session frequency changes.

Tone: Clinical, precise, evidence-based. Write as if presenting to a medical team.
"""

        try:
            ai_service = get_ai_service()
            ai_response = ai_service.generate_response(prompt, agent_key="clinical_analyst")
            insight_text = ai_response.text
        except Exception as e:
            print(f"AI Insight error: {e}")
            trend_emoji = "📈" if recent_accuracy > overall_accuracy else "📊"
            insight_text = (
                f"**1. Clinical Summary**\n"
                f"{child_name} has completed {combined_trials} total trials with an overall accuracy of {round(overall_accuracy*100)}%. {trend_note}\n\n"
                f"**2. Breakthrough Indicators**\n"
                f"Engagement is highest in: {', '.join(list(standalone_display.keys())[:2]) or 'general activities'}. {trend_emoji}\n\n"
                f"**3. Persistent Barriers**\n"
                f"Domains with limited data may need more targeted sessions.\n\n"
                f"**4. Strategic Recommendations**\n"
                f"Continue current activity schedule and monitor accuracy trends weekly."
            )

        return Response({
            "insight": insight_text,
            "domains": domain_stats,
            "standalone": standalone_display,
            "metrics": {
                "total_trials": combined_trials,
                "overall_accuracy": round(overall_accuracy, 3),
                "recent_accuracy": round(recent_accuracy, 3),
                "managed_trials": total_managed_trials,
                "standalone_trials": total_standalone_trials,
            },
            "recent_observations": recent_observations,
            "analysis_date": timezone.now().isoformat()
        })
