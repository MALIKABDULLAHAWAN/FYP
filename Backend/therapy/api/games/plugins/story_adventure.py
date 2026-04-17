"""
Story Adventure Game Plugin.

Provides metadata and a lightweight generic trial flow so backend game APIs
remain stable if the frontend requests story_adventure through generic routes.
"""
from __future__ import annotations

import random
from typing import Any, Dict, Optional

from therapy.models import SessionTrial
from therapy.api.games.registry import register


THEMES = [
    {"id": "space", "label": "Space Explorer"},
    {"id": "forest", "label": "Magical Forest"},
    {"id": "ocean", "label": "Deep Sea Diver"},
    {"id": "castle", "label": "Dragon Castle"},
]

CHOICES = [
    "I want to explore further!",
    "I try to talk to them.",
    "I look for a secret path.",
]


@register
class StoryAdventureGame:
    code = "story_adventure"
    trial_type = "story_adventure"
    game_name = "AI Story Adventures"

    def compute_level(self, session_id: int) -> int:
        completed = SessionTrial.objects.filter(session_id=session_id, status="completed")
        total = completed.count()
        if total == 0:
            return 1
        correct = completed.filter(success=True).count()
        accuracy = correct / total if total else 0.0
        
        if accuracy >= 0.95 and total >= 8:
            return 5
        if accuracy >= 0.90 and total >= 5:
            return 4
        if accuracy >= 0.85 and total >= 3:
            return 3
        if accuracy >= 0.6:
            return 2
        return 1

    def build_trial(self, level: int, *, session_id: Optional[int] = None) -> Dict[str, Any]:
        if session_id:
            level = self.compute_level(session_id)
            
        theme = random.choice(THEMES)
        
        if level <= 1:
            prompt = f"Imagine you are in a {theme['label']}. What do you see around you?"
        elif level == 2:
            prompt = f"You are exploring a {theme['label']}. Tell me about a friend you meet there."
        elif level == 3:
            prompt = f"Something surprising happened in the {theme['label']}! Can you describe the adventure?"
        elif level == 4:
            prompt = f"You are the hero of a {theme['label']} legend. Describe your first grand challenge."
        else:
            prompt = f"In the heart of the {theme['label']}, a deep mystery awaits. Tell a complex story of how you solve it."

        return {
            "prompt": prompt,
            "target": "story_response",
            "target_id": "story_response",
            "highlight": None,
            "options": [{"id": c, "label": c} for c in CHOICES],
            "time_limit_ms": max(20000, 30000 - (level * 2000)),
            "ai_hint": "Use your imagination and describe the story with detail.",
            "ai_reason": f"Level {level} narrative continuation",
            "extra": {"level": level, "theme": theme["id"]},
        }

    def evaluate(
        self,
        *,
        target: str,
        submit: Dict[str, Any],
        level: int,
        session_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        response_text = (
            submit.get("child_response")
            or submit.get("choice")
            or submit.get("clicked")
            or ""
        )
        response_text = str(response_text).strip()
        timed_out = bool(submit.get("timed_out", False))
        response_time_ms = int(submit.get("response_time_ms", 0))

        if timed_out:
            success = False
            score = 0
            feedback = "Time's up. Let's keep the story going on the next turn."
        elif len(response_text) >= 8:
            success = True
            score = 10 if len(response_text) >= 20 else 7
            feedback = "Great storytelling! Nice idea for the next part."
        else:
            success = False
            score = 3 if response_text else 0
            feedback = "Good start. Try adding a little more detail next time."

        return {
            "success": success,
            "score": score,
            "feedback": feedback,
            "ai_recommendation": "Encourage richer narrative responses with who/what/where details.",
            "ai_reason": "Story game scoring is based on response completeness for now.",
            "telemetry": {
                "response_time_ms": response_time_ms,
                "timed_out": timed_out,
                "response_length": len(response_text),
                "level": level,
            },
        }

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "id": self.code,
            "name": self.game_name,
            "therapeuticGoals": ["language-development", "sequencing", "creative-expression"],
            "difficultyLevel": 2,
            "evidenceBase": [],
            "adaptations": [
                {
                    "name": "Choice Prompts",
                    "description": "Offer structured next-step options for children needing scaffolding.",
                    "targetNeeds": ["expressive-language", "narrative-support"],
                    "evidenceBased": False,
                }
            ],
            "dataCollection": {
                "primaryMetrics": ["response-length", "completion", "engagement"],
                "secondaryMetrics": [],
            },
        }
