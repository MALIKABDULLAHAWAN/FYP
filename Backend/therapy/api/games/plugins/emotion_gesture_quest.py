from __future__ import annotations

import random
from typing import Dict, Any, List, Optional
from therapy.api.games.registry import register

@register
class EmotionGestureQuestGame:
    """
    Emotion & Gesture Quest Plugin.
    Recognizes emotions and hand gestures for social-emotional learning.
    """
    code = "emotion_gesture_quest"
    trial_type = "emotion_gesture"
    game_name = "Emotion & Gesture Quest"

    def compute_level(self, session_id: int) -> int:
        # Simple progression based on session_id if needed, 
        # but the frontend handles level switching currently.
        return 1

    def build_trial(self, level: int, *, session_id: Optional[int] = None) -> Dict[str, Any]:
        # This is used if the backend decides the tasks.
        # For now, we'll return a stub as the frontend has its own task pool.
        return {
            "level": level,
            "game_type": "interactive_vision"
        }

    def evaluate(
        self,
        *,
        target: str,
        submit: Dict[str, Any],
        level: int,
        session_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        success = bool(submit.get("success", False))
        score = 10 if success else 0
        
        telemetry = {
            "game": self.code,
            "trial_type": submit.get("type", "unknown"),
            "value": submit.get("value", "unknown"),
            "response_time_ms": submit.get("response_time_ms", 0),
            "success": success
        }

        return {
            "success": success,
            "score": score,
            "feedback": "Great job!" if success else "Try again!",
            "telemetry": telemetry,
            "ai_recommendation": "Continue",
            "ai_reason": "Manual progress"
        }

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "id": self.code,
            "name": self.game_name,
            "therapeuticGoals": ["emotion-recognition", "gesture-imitation", "motor-control", "engagement"],
            "difficultyLevel": 2,
            "evidenceBase": [
                {
                    "title": "Computer-based emotion recognition training for children with autism",
                    "authors": "Silver, M., & Oakes, P.",
                    "journal": "Autism",
                    "year": 2001,
                    "doi": "10.1177/1362361301005003002"
                }
            ],
            "dataCollection": {
                "primaryMetrics": ["emotion-accuracy", "gesture-accuracy", "response-latency"],
                "secondaryMetrics": ["smile-frequency"]
            }
        }
