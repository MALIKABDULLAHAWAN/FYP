"""
Dashboard & Analytics API endpoints for DHYAN.
Provides aggregated stats for admin & therapist dashboards.
"""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from accounts.models import UserRole
from patients.models import ChildProfile, TherapistChildAssignment
from therapy.models import TherapySession, SessionTrial, Observation
from patients.permissions import user_has_role

User = get_user_model()


class DashboardStatsView(APIView):
    """
    GET /api/v1/therapy/dashboard/stats
    Returns high-level stats for the authenticated user's dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        is_admin = user.is_staff or user_has_role(user, "admin")
        is_therapist = user_has_role(user, "therapist")
        is_parent = user_has_role(user, "parent")

        from therapy.models import GameSession
        if is_admin:
            total_children = ChildProfile.objects.filter(deleted_at__isnull=True).count()
            total_therapists = UserRole.objects.filter(role__slug="therapist").values("user").distinct().count()
            
            total_sessions = TherapySession.objects.count() + GameSession.objects.count()
            completed_sessions = TherapySession.objects.filter(status="completed").count() + GameSession.objects.exclude(completed_at__isnull=True).count()
            active_sessions = TherapySession.objects.filter(status="in_progress").count() + GameSession.objects.filter(completed_at__isnull=True).count()
        elif is_therapist:
            assigned_child_users = TherapistChildAssignment.objects.filter(
                therapist=user
            ).values_list("child_user_id", flat=True)
            
            fleet_children = ChildProfile.objects.filter(
                user_id__in=assigned_child_users, deleted_at__isnull=True
            )

            total_children = fleet_children.count()
            total_therapists = 1
            
            # Combine sessions for the entire fleet, regardless of owner
            total_sessions = (
                TherapySession.objects.filter(child__in=fleet_children).count() + 
                GameSession.objects.filter(child__in=fleet_children).count()
            )
            completed_sessions = (
                TherapySession.objects.filter(child__in=fleet_children, status="completed").count() + 
                GameSession.objects.filter(child__in=fleet_children).exclude(completed_at__isnull=True).count()
            )
            active_sessions = (
                TherapySession.objects.filter(child__in=fleet_children, status="in_progress").count() + 
                GameSession.objects.filter(child__in=fleet_children, completed_at__isnull=True).count()
            )
        elif is_parent:
            from patients.models import Guardian
            child_profiles = ChildProfile.objects.filter(guardian__email=user.email, deleted_at__isnull=True)
            total_children = child_profiles.count()
            total_therapists = 0 
            
            total_sessions = TherapySession.objects.filter(child__in=child_profiles).count() + GameSession.objects.filter(child__in=child_profiles).count()
            completed_sessions = TherapySession.objects.filter(child__in=child_profiles, status="completed").count() + GameSession.objects.filter(child__in=child_profiles).exclude(completed_at__isnull=True).count()
            active_sessions = TherapySession.objects.filter(child__in=child_profiles, status="in_progress").count() + GameSession.objects.filter(child__in=child_profiles, completed_at__isnull=True).count()
        else:
            # Child role: see only their own stats
            try:
                child = user.child_profile
                total_children = 1
                total_therapists = TherapistChildAssignment.objects.filter(child_user=user).count()
                
                total_sessions = TherapySession.objects.filter(child=child).count() + GameSession.objects.filter(child=child).count()
                completed_sessions = TherapySession.objects.filter(child=child, status="completed").count() + GameSession.objects.filter(child=child).exclude(completed_at__isnull=True).count()
                active_sessions = TherapySession.objects.filter(child=child, status="in_progress").count() + GameSession.objects.filter(child=child, completed_at__isnull=True).count()
            except:
                total_children = total_therapists = total_sessions = completed_sessions = active_sessions = 0

        # Recent 7 days activity vs Previous 7 days
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        two_weeks_ago = now - timedelta(days=14)

        recent_sessions = 0
        recent_trials = 0
        recent_correct = 0

        prev_sessions = 0
        prev_trials = 0
        prev_correct = 0

        # Stats filtering based on role
        ts_filter = Q(created_at__gte=week_ago)
        trial_filter = Q(session__created_at__gte=week_ago, status="completed")
        gs_filter = Q(created_at__gte=week_ago)
        
        prev_ts_filter = Q(created_at__gte=two_weeks_ago, created_at__lt=week_ago)
        prev_trial_filter = Q(session__created_at__gte=two_weeks_ago, session__created_at__lt=week_ago, status="completed")
        prev_gs_filter = Q(created_at__gte=two_weeks_ago, created_at__lt=week_ago)

        if is_admin:
            pass # No extra filters for admin
        elif is_therapist:
            ts_filter &= Q(child__in=fleet_children)
            trial_filter &= Q(session__child__in=fleet_children)
            gs_filter &= Q(child__in=fleet_children)
            
            prev_ts_filter &= Q(child__in=fleet_children)
            prev_trial_filter &= Q(session__child__in=fleet_children)
            prev_gs_filter &= Q(child__in=fleet_children)
        elif is_parent:
            ts_filter &= Q(child__in=child_profiles)
            trial_filter &= Q(session__child__in=child_profiles)
            gs_filter &= Q(child__in=child_profiles)
            
            prev_ts_filter &= Q(child__in=child_profiles)
            prev_trial_filter &= Q(session__child__in=child_profiles)
            prev_gs_filter &= Q(child__in=child_profiles)
        else:
            # Child role
            try:
                ts_filter &= Q(child=user.child_profile)
                trial_filter &= Q(session__child=user.child_profile)
                gs_filter &= Q(child=user.child_profile)
                
                prev_ts_filter &= Q(child=user.child_profile)
                prev_trial_filter &= Q(session__child=user.child_profile)
                prev_gs_filter &= Q(child=user.child_profile)
            except:
                pass

        # 1. Stats from TherapySession/SessionTrial (This Week)
        recent_sessions += TherapySession.objects.filter(ts_filter).count()
        recent_trials += SessionTrial.objects.filter(trial_filter).count()
        recent_correct += SessionTrial.objects.filter(trial_filter, success=True).count()

        # 1b. Stats from TherapySession/SessionTrial (Last Week)
        prev_sessions += TherapySession.objects.filter(prev_ts_filter).count()
        prev_trials += SessionTrial.objects.filter(prev_trial_filter).count()
        prev_correct += SessionTrial.objects.filter(prev_trial_filter, success=True).count()

        # 2. Stats from GameSession performance_metrics (This Week)
        recent_gs = GameSession.objects.filter(gs_filter)
        recent_sessions += recent_gs.count()
        for gs in recent_gs:
            m = gs.performance_metrics or {}
            gs_t = m.get("total_trials", 0)
            gs_a = m.get("accuracy", 0)
            recent_trials += gs_t
            recent_correct += round(gs_t * gs_a)
            
        # 2b. Stats from GameSession performance_metrics (Last Week)
        prev_gs = GameSession.objects.filter(prev_gs_filter)
        prev_sessions += prev_gs.count()
        for gs in prev_gs:
            m = gs.performance_metrics or {}
            gs_t = m.get("total_trials", 0)
            gs_a = m.get("accuracy", 0)
            prev_trials += gs_t
            prev_correct += round(gs_t * gs_a)

        weekly_accuracy = (recent_correct / recent_trials) if recent_trials else 0.0
        prev_weekly_accuracy = (prev_correct / prev_trials) if prev_trials else 0.0
        
        accuracy_trend = round((weekly_accuracy - prev_weekly_accuracy) * 100, 1)
        session_trend = recent_sessions - prev_sessions

        # 3. Fleet Insight (Therapist Only)
        fleet_insight = None
        is_deep_dive = request.query_params.get('deep_dive') == 'true'
        
        if is_therapist:
            try:
                from therapy.ai_services.unified_ai_service import get_ai_service
                ai_service = get_ai_service()
                from therapy.models import GameSession

                # Build mastery bucket data
                all_fleet_gs = GameSession.objects.filter(child__in=fleet_children).order_by("-created_at")
                game_type_counts = {}
                high_performers = 0
                low_performers = 0
                for gs in all_fleet_gs[:100]:  # sample last 100 sessions for performance
                    m = gs.performance_metrics or {}
                    acc = m.get("accuracy", 0)
                    gtype = gs.game.game_type if gs.game_id else "unknown"
                    if gtype not in game_type_counts:
                        game_type_counts[gtype] = {"sessions": 0, "accuracy_sum": 0}
                    game_type_counts[gtype]["sessions"] += 1
                    game_type_counts[gtype]["accuracy_sum"] += acc
                    if acc >= 0.8: high_performers += 1
                    elif acc < 0.5: low_performers += 1

                game_breakdown_str = "\n".join(
                    f"  - {k.replace('_',' ').title()}: {v['sessions']} sessions, avg accuracy {round(v['accuracy_sum']/v['sessions']*100)}%"
                    for k, v in game_type_counts.items() if v['sessions'] > 0
                ) or "  No standalone game data this week."

                brief_instruction = "Provide a 2-sentence clinical high-level summary and one specific recommendation."
                deep_dive_instruction = """Provide a STRUCTURED Clinical Audit with:
1. Fleet Overview (trajectory assessment)
2. High Performers (who/what is working well)
3. Risk Flags (concerning patterns or low performers)
4. Intervention Priorities (3 specific actions for this week)"""

                prompt = f"""You are Buddy, a clinical AI analyst for a children's therapeutic platform.

Generate a fleet-level clinical audit for a therapist managing {total_children} children.

=== THIS WEEK'S METRICS ===
- Total Sessions: {recent_sessions}
- Total Trials: {recent_trials}
- Fleet Accuracy: {round(weekly_accuracy * 100, 1)}%
- High-accuracy sessions (≥80%): {high_performers}
- Low-accuracy sessions (<50%): {low_performers}

=== TREND vs LAST WEEK ===
- Accuracy Change: {'+' if accuracy_trend > 0 else ''}{accuracy_trend}%
- Session Volume Change: {'+' if session_trend > 0 else ''}{session_trend} sessions

=== GAME ACTIVITY BREAKDOWN ===
{game_breakdown_str}

{deep_dive_instruction if is_deep_dive else brief_instruction}
Tone: Professional, clinical, data-driven. Write for a medical team."""

                ai_response = ai_service.generate_response(prompt, agent_key="clinical_analyst")
                fleet_insight = ai_response.text
            except Exception as e:
                print(f"Fleet AI error: {e}")
                fleet_insight = f"Fleet accuracy this week: {round(weekly_accuracy * 100, 1)}%. {'Positive' if accuracy_trend >= 0 else 'Declining'} trend detected ({'+' if accuracy_trend >= 0 else ''}{accuracy_trend}%). {recent_sessions} sessions recorded across {total_children} children."

        # Calculate AI Mastery Index (Real data for the 99.2% mock)
        # Based on accuracy, session volume, and growth
        base_mastery = weekly_accuracy * 100
        vol_bonus = min(recent_sessions * 0.5, 5.0) # More sessions = higher confidence
        ai_mastery_index = round(min(base_mastery + vol_bonus, 99.8), 1)

        return Response({
            "total_children": total_children,
            "total_therapists": total_therapists,
            "total_sessions": total_sessions,
            "completed_sessions": completed_sessions,
            "active_sessions": active_sessions,
            "recent_sessions_7d": recent_sessions,
            "recent_trials_7d": recent_trials,
            "weekly_accuracy": round(weekly_accuracy, 3),
            "accuracy_trend": accuracy_trend,
            "session_trend": session_trend,
            "fleet_insight": fleet_insight,
            "is_deep_dive": is_deep_dive,
            "ai_mastery_index": ai_mastery_index
        })


class ChildProgressView(APIView):
    """
    GET /api/v1/therapy/children/<child_id>/progress
    Returns aggregated progress for a specific child across all games.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, child_id: int):
        user = request.user
        is_admin = user.is_staff or user_has_role(user, "admin")
        is_therapist = user_has_role(user, "therapist")
        is_parent = user_has_role(user, "parent")

        try:
            child = ChildProfile.objects.select_related("user").get(id=child_id)
        except ChildProfile.DoesNotExist:
            return Response({"detail": "Child not found"}, status=404)

        # Check access
        if not is_admin:
            if is_therapist:
                assigned = TherapistChildAssignment.objects.filter(therapist=user, child_user=child.user).exists()
                if not assigned:
                    return Response({"detail": "Not assigned to this child"}, status=403)
            elif is_parent:
                from patients.models import Guardian
                is_guardian = Guardian.objects.filter(child_profile=child, email=user.email).exists()
                if not is_guardian:
                    return Response({"detail": "You are not a guardian of this child"}, status=403)
            else:
                return Response({"detail": "Permission denied"}, status=403)

        # 1. Therapy Session Data
        sessions = TherapySession.objects.filter(child=child)
        total_sessions = sessions.count()
        completed_sessions = sessions.filter(status="completed").count()

        trials = SessionTrial.objects.filter(session__child=child, status="completed")
        total_trials = trials.count()
        correct_trials = trials.filter(success=True).count()

        # 2. Game Session Data (Standalone Adventures)
        from therapy.models import GameSession
        game_sessions = GameSession.objects.filter(child=child)
        total_game_sessions = game_sessions.count()
        completed_game_sessions = game_sessions.exclude(completed_at__isnull=True).count()

        # Calculate combined stats
        combined_total_sessions = total_sessions + total_game_sessions
        combined_completed = completed_sessions + completed_game_sessions

        # Extract trials from GameSessions performance_metrics
        for gs in game_sessions:
            metrics = gs.performance_metrics or {}
            gs_trials = metrics.get("total_trials", 0)
            gs_accuracy = metrics.get("accuracy", 0)
            total_trials += gs_trials
            correct_trials += round(gs_trials * gs_accuracy)

        overall_accuracy = (correct_trials / total_trials) if total_trials else 0.0

        # Per-game breakdown
        game_stats = []
        # Combine game types from both sources
        trial_types = set(trials.values_list("trial_type", flat=True).distinct())
        game_types = set(game_sessions.values_list("game__game_type", flat=True).distinct())
        all_game_keys = trial_types.union(game_types)

        for gt in all_game_keys:
            # Stats from TherapySessions
            gt_trials = trials.filter(trial_type=gt)
            gt_total = gt_trials.count()
            gt_correct = gt_trials.filter(success=True).count()

            # Stats from GameSessions
            gt_game_sessions = game_sessions.filter(game__game_type=gt)
            for gs in gt_game_sessions:
                metrics = gs.performance_metrics or {}
                gs_trials = metrics.get("total_trials", 0)
                gs_accuracy = metrics.get("accuracy", 0)
                gt_total += gs_trials
                gt_correct += round(gs_trials * gs_accuracy)

            gt_accuracy = (gt_correct / gt_total) if gt_total else 0.0

            # Calculate actual avg speed from GameSessions if available
            speeds = [gs.performance_metrics.get("avg_response_time_ms") for gs in gt_game_sessions if gs.performance_metrics.get("avg_response_time_ms")]
            gt_avg_speed = sum(speeds) / len(speeds) if speeds else 0

            # Pull real latest observation
            latest_session = gt_game_sessions.order_by("-created_at").first()
            gt_observation = (latest_session.observations or {}).get("buddy_observation") if latest_session else None
            if not gt_observation and gt_total > 0:
                gt_observation = "Mastery is developing. Patterns suggest consistent target acquisition." if gt_accuracy > 0.8 else "Stability is increasing. Recommend sensory reinforcement."

            game_stats.append({
                "game": gt,
                "total_trials": gt_total,
                "correct": gt_correct,
                "accuracy": round(gt_accuracy, 3),
                "sessions": sessions.filter(trials__trial_type=gt).distinct().count() + gt_game_sessions.count(),
                "avg_response_time_ms": gt_avg_speed,
                "observation": gt_observation
            })

        # Recent sessions timeline (Combined)
        recent_therapy = sessions.order_by("-created_at")[:10]
        recent_list = []
        for s in recent_therapy:
            s_trials_all = SessionTrial.objects.filter(session=s)
            s_trials_completed = SessionTrial.objects.filter(session=s, status="completed")
            s_total = s_trials_all.count()
            s_completed_count = s_trials_completed.count()
            s_correct = s_trials_completed.filter(success=True).count()
            recent_list.append({
                "session_id": s.id,
                "date": str(s.session_date),
                "status": s.status,
                "title": s.title or f"Adventure with {s.therapist.full_name or 'Buddy'}",
                "total_trials": s_total,
                "correct": s_correct,
                "accuracy": round((s_correct / s_completed_count), 3) if s_completed_count else 0.0,
                "type": "managed"
            })
        
        for gs in game_sessions.order_by("-created_at")[:10]:
            metrics = gs.performance_metrics or {}
            recent_list.append({
                "session_id": gs.id,
                "date": str(gs.created_at.date()),
                "status": "completed" if gs.completed_at else "in_progress",
                "title": f"Standalone {gs.game.name}",
                "total_trials": metrics.get("total_trials", 0),
                "correct": round(metrics.get("total_trials", 0) * metrics.get("accuracy", 0)),
                "accuracy": metrics.get("accuracy", 0),
                "type": "standalone"
            })

        # Sort combined list by date
        recent_list.sort(key=lambda x: x["date"], reverse=True)
        recent_list = recent_list[:10]

        return Response({
            "child_id": child.id,
            "child_name": child.user.full_name or child.user.email,
            "total_sessions": combined_total_sessions,
            "completed_sessions": combined_completed,
            "total_trials": total_trials,
            "correct_trials": correct_trials,
            "overall_accuracy": round(overall_accuracy, 3),
            "game_breakdown": game_stats,
            "recent_sessions": recent_list,
        })


class SessionHistoryView(APIView):
    """
    GET /api/v1/therapy/sessions/history
    Returns all sessions for the current user (therapist) with summary data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        is_admin = user.is_staff or user_has_role(user, "admin")
        is_therapist = user_has_role(user, "therapist")
        is_parent = user_has_role(request.user, "parent")

        # 0. Resolve the fleet of children this user can monitor
        fleet_child_users = None
        if not is_admin:
            if is_therapist:
                from patients.models import TherapistChildAssignment
                fleet_child_users = TherapistChildAssignment.objects.filter(
                    therapist=user
                ).values_list("child_user_id", flat=True)
            elif is_parent:
                from patients.models import Guardian
                fleet_child_users = Guardian.objects.filter(
                    email=user.email
                ).values_list("child_profile__user_id", flat=True)
            else:
                # Default to self (Child account)
                fleet_child_users = [user.id]

        # 1. Base Querysets
        if is_admin:
            sessions = TherapySession.objects.all()
            from therapy.models import GameSession
            game_sessions = GameSession.objects.all()
        else:
            sessions = TherapySession.objects.filter(child__user_id__in=fleet_child_users)
            from therapy.models import GameSession
            game_sessions = GameSession.objects.filter(child__user_id__in=fleet_child_users)

        sessions = sessions.select_related("child__user", "therapist").order_by("-created_at")
        game_sessions = game_sessions.select_related("game", "child__user").order_by("-created_at")

        # Hide orphaned sessions (in_progress with zero completed trials)
        # unless explicitly requesting in_progress status
        hide_orphans = request.query_params.get("include_orphans") != "true"
        # Don't hide orphans for therapists in fleet overview
        if is_therapist and not request.query_params.get("child_id"):
            hide_orphans = False

        # Optional filters
        child_id = request.query_params.get("child_id")
        status_filter = request.query_params.get("status")
        game_type = request.query_params.get("game_type")
        limit = min(int(request.query_params.get("limit", 50)), 200)

        if child_id:
            sessions = sessions.filter(child_id=child_id)
            game_sessions = game_sessions.filter(child_id=child_id)

        if status_filter:
            sessions = sessions.filter(status=status_filter)
            game_sessions = game_sessions.filter(completed_at__isnull=(status_filter != "completed"))
        
        if game_type:
            sessions = sessions.filter(trials__trial_type=game_type).distinct()
            game_sessions = game_sessions.filter(Q(game__game_type=game_type) | Q(game__name__icontains=game_type.replace('_', ' ')))

        # 1. Process Therapy Sessions (Managed)
        if hide_orphans:
            sessions = sessions.annotate(
                completed_trial_count=Count("trials", filter=Q(trials__status="completed")),
            ).exclude(completed_trial_count=0)

        result = []
        for s in sessions[:limit]:
            s_trials_all = SessionTrial.objects.filter(session=s)
            s_trials_completed = s_trials_all.filter(status="completed")
            
            s_total = s_trials_all.count()
            s_completed_count = s_trials_completed.count()
            s_correct = s_trials_completed.filter(success=True).count()
            trial_types = list(s_trials_all.values_list("trial_type", flat=True).distinct())

            result.append({
                "id": f"managed-{s.id}",
                "title": s.title or f"Managed Adventure",
                "status": s.status,
                "session_date": str(s.session_date),
                "child_id": s.child_id,
                "child_name": s.child.user.full_name or s.child.user.email,
                "therapist_name": s.therapist.full_name or s.therapist.email,
                "total_trials": s_total,
                "correct": s_correct,
                "accuracy": round((s_correct / s_completed_count), 3) if s_completed_count else 0.0,
                "game_types": trial_types,
                "type": "managed",
                "created_at": s.created_at.isoformat(),
                "duration_seconds": int((s.ended_at - s.started_at).total_seconds()) if s.ended_at and s.started_at else 0,
                "therapeutic_goals": [],
                "observations": s.notes,
                "buddy_observation": s.notes[:100] if s.notes else "Standard clinical managed session."
            })

        # Process Game Sessions (standalone) — fetch all, not capped by limit yet
        for gs in game_sessions:
            metrics = gs.performance_metrics or {}
            result.append({
                "id": f"standalone-{gs.id}",
                "title": gs.game.name,
                "status": "completed" if gs.completed_at else "in_progress",
                "session_date": str(gs.created_at.date()),
                "child_id": gs.child_id,
                "child_name": gs.child.user.full_name or gs.child.user.email,
                "therapist_name": "Buddy",
                "total_trials": metrics.get("total_trials", 0),
                "correct": round(metrics.get("total_trials", 0) * metrics.get("accuracy", 0)),
                "accuracy": metrics.get("accuracy", 0),
                "game_types": [gs.game.game_type],
                "type": "standalone",
                "created_at": gs.created_at.isoformat(),
                "duration_seconds": gs.duration_seconds,
                "therapeutic_goals": gs.therapeutic_goals_targeted,
                "observations": gs.therapist_notes,
                "buddy_observation": (gs.observations or {}).get("buddy_observation") or "Clinical pattern suggests steady engagement."
            })

        # Final Sort and Limit — interleaved by time so standalone games appear
        result.sort(key=lambda x: x["created_at"], reverse=True)
        return Response(result[:limit])
