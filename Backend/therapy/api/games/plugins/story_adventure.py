"""
Story Adventure Game Plugin.

Provides metadata and a trial flow for the story_adventure game.
Scoring is based on response richness (length + vocabulary diversity),
not just character count.
"""
from __future__ import annotations

import random
from typing import Any, Dict, Optional

from therapy.models import SessionTrial
from therapy.api.games.registry import register


# ── Theme catalogue ──────────────────────────────────────────────────────────

THEMES = [
    {"id": "space",   "label": "Space Explorer",  "emoji": "🚀"},
    {"id": "forest",  "label": "Magical Forest",   "emoji": "🌳"},
    {"id": "ocean",   "label": "Deep Sea Diver",   "emoji": "🌊"},
    {"id": "castle",  "label": "Dragon Castle",    "emoji": "🏰"},
    {"id": "jungle",  "label": "Jungle Quest",     "emoji": "🦁"},
    {"id": "volcano", "label": "Volcano Island",   "emoji": "🌋"},
]

# Per-theme starter choices so the first turn always feels relevant
THEME_CHOICES: Dict[str, list] = {
    "space":   [
        {"label": "Fly to the nearest star",   "icon": "⭐"},
        {"label": "Scan for alien life",        "icon": "👽"},
        {"label": "Fix the rocket engine",      "icon": "🔧"},
    ],
    "forest":  [
        {"label": "Follow the glowing path",   "icon": "✨"},
        {"label": "Talk to the wise owl",       "icon": "🦉"},
        {"label": "Cross the magic bridge",     "icon": "🌉"},
    ],
    "ocean":   [
        {"label": "Dive deeper into the dark", "icon": "🔦"},
        {"label": "Follow the dolphin",         "icon": "🐬"},
        {"label": "Open the treasure chest",    "icon": "🪙"},
    ],
    "castle":  [
        {"label": "Sneak past the dragon",     "icon": "🐉"},
        {"label": "Find the secret door",       "icon": "🚪"},
        {"label": "Call for the wizard",        "icon": "🧙"},
    ],
    "jungle":  [
        {"label": "Climb the tallest tree",    "icon": "🌴"},
        {"label": "Follow the parrot",          "icon": "🦜"},
        {"label": "Cross the rope bridge",      "icon": "🌿"},
    ],
    "volcano": [
        {"label": "Explore the lava caves",    "icon": "🔥"},
        {"label": "Find the ancient map",       "icon": "🗺️"},
        {"label": "Befriend the fire spirit",   "icon": "🌟"},
    ],
}

FALLBACK_CHOICES = [
    {"label": "Look around",   "icon": "👀"},
    {"label": "Keep going",    "icon": "🚶"},
    {"label": "Find a friend", "icon": "🤝"},
]

# ── Level prompts ─────────────────────────────────────────────────────────────

LEVEL_PROMPTS = {
    1: (
        "You are in a {label}. Look around — what do you see? "
        "Describe one thing that catches your eye."
    ),
    2: (
        "You are exploring a {label}. You meet a friendly creature. "
        "What does it look like, and what does it say to you?"
    ),
    3: (
        "Something surprising just happened in the {label}! "
        "Describe what happened and how you feel about it."
    ),
    4: (
        "You are the hero of a {label} legend. A big challenge stands in your way. "
        "Describe the challenge and your first brave step to overcome it."
    ),
    5: (
        "Deep in the heart of the {label}, a great mystery awaits. "
        "Tell the story of how you discover the mystery and begin to solve it — "
        "include who helps you and what clues you find."
    ),
}


@register
class StoryAdventureGame:
    code       = "story_adventure"
    trial_type = "story_adventure"
    game_name  = "AI Story Adventures"

    # ── Level computation ─────────────────────────────────────────────────────

    def compute_level(self, session_id: int) -> int:
        completed = SessionTrial.objects.filter(session_id=session_id, status="completed")
        total     = completed.count()
        if total == 0:
            return 1
        correct  = completed.filter(success=True).count()
        accuracy = correct / total

        if accuracy >= 0.95 and total >= 8:
            return 5
        if accuracy >= 0.90 and total >= 5:
            return 4
        if accuracy >= 0.85 and total >= 3:
            return 3
        if accuracy >= 0.60:
            return 2
        return 1

    # ── Trial builder ─────────────────────────────────────────────────────────

    def build_trial(self, level: int, *, session_id: Optional[int] = None) -> Dict[str, Any]:
        if session_id:
            level = self.compute_level(session_id)

        theme   = random.choice(THEMES)
        choices = THEME_CHOICES.get(theme["id"], FALLBACK_CHOICES)

        prompt_template = LEVEL_PROMPTS.get(level, LEVEL_PROMPTS[1])
        prompt = prompt_template.format(label=theme["label"])

        # Time limit scales with level: more time for richer expected responses
        time_limit_ms = 20_000 + (level * 5_000)   # 25 s → 45 s

        return {
            "prompt":       prompt,
            "target":       "story_response",
            "target_id":    "story_response",
            "highlight":    None,
            "options":      choices,
            "time_limit_ms": time_limit_ms,
            "ai_hint":      _ai_hint(level),
            "ai_reason":    f"Level {level} narrative prompt for {theme['label']}",
            "extra": {
                "level":    level,
                "theme":    theme["id"],
                "theme_label": theme["label"],
                "emoji":    theme["emoji"],
            },
        }

    # ── Evaluator ─────────────────────────────────────────────────────────────

    def evaluate(
        self,
        *,
        target: str,
        submit: Dict[str, Any],
        level: int,
        session_id: Optional[int] = None,
        **kwargs,
    ) -> Dict[str, Any]:
        response_text = (
            submit.get("child_response")
            or submit.get("choice")
            or submit.get("clicked")
            or ""
        )
        response_text    = str(response_text).strip()
        timed_out        = bool(submit.get("timed_out", False))
        response_time_ms = int(submit.get("response_time_ms", 0))

        if timed_out:
            return {
                "success": False,
                "score":   0,
                "feedback": "Time's up! Let's keep the story going on the next turn.",
                "ai_recommendation": "Encourage the child to respond more quickly.",
                "ai_reason": "Timed out — no response recorded.",
                "telemetry": {
                    "response_time_ms": response_time_ms,
                    "timed_out":        True,
                    "response_length":  0,
                    "word_count":       0,
                    "level":            level,
                },
            }

        word_count    = len(response_text.split()) if response_text else 0
        unique_words  = len(set(response_text.lower().split())) if response_text else 0
        richness      = unique_words / max(word_count, 1)   # vocabulary diversity 0–1

        # Scoring rubric (out of 10)
        # - 0 words → 0
        # - 1–3 words → 2  (minimal)
        # - 4–9 words → 5  (partial)
        # - 10–19 words → 7  (good)
        # - 20+ words with decent richness → 9–10  (excellent)
        if word_count == 0:
            score, success = 0, False
            feedback = "No response recorded. Let's try again!"
        elif word_count < 4:
            score, success = 2, False
            feedback = "Good start! Can you tell me a little more about what happened?"
        elif word_count < 10:
            score, success = 5, True
            feedback = "Nice! You're building the story. Try adding more details next time."
        elif word_count < 20:
            score, success = 7, True
            feedback = "Great storytelling! Your adventure is really coming to life."
        else:
            bonus   = 1 if richness >= 0.6 else 0
            score   = min(10, 9 + bonus)
            success = True
            feedback = (
                "Incredible story! You used so many vivid details — the adventure feels real!"
                if richness >= 0.6
                else "Amazing response! Keep adding those colourful details."
            )

        # Bonus point for level 4–5 if response is long enough
        if level >= 4 and word_count >= 15:
            score = min(10, score + 1)

        return {
            "success": success,
            "score":   score,
            "feedback": feedback,
            "ai_recommendation": _ai_recommendation(level, word_count),
            "ai_reason": (
                f"Level {level} story response: {word_count} words, "
                f"vocabulary richness {richness:.2f}."
            ),
            "telemetry": {
                "response_time_ms": response_time_ms,
                "timed_out":        False,
                "response_length":  len(response_text),
                "word_count":       word_count,
                "unique_words":     unique_words,
                "richness":         round(richness, 3),
                "level":            level,
            },
        }

    # ── Metadata ──────────────────────────────────────────────────────────────

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "id":   self.code,
            "name": self.game_name,
            "therapeuticGoals": [
                "language-development",
                "narrative-sequencing",
                "creative-expression",
                "expressive-vocabulary",
            ],
            "difficultyLevel": 2,
            "evidenceBase": [],
            "adaptations": [
                {
                    "name":        "Structured Choice Prompts",
                    "description": "Theme-specific choices scaffold narrative for children who need support.",
                    "targetNeeds": ["expressive-language", "narrative-support"],
                    "evidenceBased": False,
                },
                {
                    "name":        "Adaptive Level Prompts",
                    "description": "Prompt complexity increases with accuracy across 5 levels.",
                    "targetNeeds": ["language-development", "cognitive-challenge"],
                    "evidenceBased": False,
                },
            ],
            "dataCollection": {
                "primaryMetrics":   ["word-count", "vocabulary-richness", "completion"],
                "secondaryMetrics": ["response-time", "timed-out-rate"],
            },
        }


# ── Private helpers ───────────────────────────────────────────────────────────

def _ai_hint(level: int) -> str:
    hints = {
        1: "Describe what you see — colours, sounds, smells!",
        2: "Tell me about the character: what do they look like? What do they want?",
        3: "Use feeling words — surprised, excited, scared — to bring the story alive.",
        4: "Describe the challenge in detail. What makes it hard? What's your plan?",
        5: "Include who helps you, what clues you find, and how you feel as the mystery unfolds.",
    }
    return hints.get(level, hints[1])


def _ai_recommendation(level: int, word_count: int) -> str:
    if word_count < 5:
        return (
            "Encourage the child to use full sentences. "
            "Try asking: 'What did you see? What happened next?'"
        )
    if word_count < 15:
        return (
            "Prompt for more detail: 'Can you describe the colours, sounds, or feelings?'"
        )
    if level >= 4:
        return (
            "Excellent narrative depth. Consider introducing a plot twist or a new character "
            "to challenge the child further."
        )
    return (
        "Strong response. Encourage the child to use more descriptive adjectives "
        "and action verbs in the next turn."
    )
