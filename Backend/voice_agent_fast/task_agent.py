import os
import sys
from pathlib import Path
from asgiref.sync import sync_to_async

# Force Allow Async Query to be set early
os.environ["DJANGO_ALLOW_ASYNC_QUERY"] = "true"

def ensure_django():
    if not os.environ.get('DJANGO_SETTINGS_MODULE'):
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
        sys.path.append(str(Path(__file__).parent.parent))
        import django
        django.setup()

class TaskAgent:
    async def get_child_summary(self, child_id: int):
        """Fetch a summary of a child's progress for the AI to explain"""
        # Run in a separate thread to ensure we don't block the async loop
        return await sync_to_async(self._get_child_summary_sync, thread_sensitive=False)(child_id)

    def _get_child_summary_sync(self, child_id: int):
        ensure_django()
        from patients.models import ChildProfile
        try:
            # Query within the sync thread
            profile = ChildProfile.objects.select_related('user').get(id=child_id)
            metrics = profile.progress_metrics or {}
            
            summary = {
                "name": profile.user.get_full_name() or profile.user.username,
                "total_sessions": metrics.get("total_sessions", 0),
                "avg_score": f"{metrics.get('average_score', 0):.1f}%",
                "games_completed": metrics.get("games_completed", 0),
                "recent_goals": metrics.get("therapeutic_goals_progress", {})
            }
            return summary
        except Exception as e:
            print(f"Error fetching child summary: {e}")
            return None

    async def get_app_status(self):
        """Get some general app stats for the AI"""
        return await sync_to_async(self._get_app_status_sync, thread_sensitive=False)()

    def _get_app_status_sync(self):
        ensure_django()
        from patients.models import ChildProfile
        from therapy.models import TherapySession
        try:
            return {
                "active_sessions": TherapySession.objects.filter(status='active').count(),
                "total_students": ChildProfile.objects.count()
            }
        except Exception as e:
            print(f"Error fetching app status: {e}")
            return {}

task_agent = TaskAgent()
