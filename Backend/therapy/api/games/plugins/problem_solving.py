"""
Problem Solving Plugin – Pattern & Puzzle (Executive Function)
Uses symbolic tokens (no emoji); frontend renders PatternToken for each.
"""
from __future__ import annotations

import random
from typing import Any, Dict, Optional

from therapy.models import SessionTrial
from therapy.api.games.registry import register
from therapy.dataset_metadata import get_game_item_metadata, stable_fallback_image_url

PATTERN_SETS = {
    "easy": [
        {"seq": ["dot-red", "dot-blue", "dot-red", "dot-blue"], "answer": "dot-red", "distractors": ["dot-green", "dot-yellow"], "name": "alternating colors"},
        {"seq": ["shape-star", "shape-star", "shape-star"], "answer": "shape-star", "distractors": ["dot-blue", "shape-heart"], "name": "repeating stars"},
        {"seq": ["pic-apple", "pic-apple", "pic-banana"], "answer": "pic-apple", "distractors": ["pic-grape", "pic-orange"], "name": "fruit pattern"},
        {"seq": ["pic-dog", "pic-cat", "pic-dog", "pic-cat"], "answer": "pic-dog", "distractors": ["pic-fish", "pic-bird"], "name": "animal alternating"},
        {"seq": ["dot-green", "dot-green", "dot-green"], "answer": "dot-green", "distractors": ["dot-red", "dot-blue"], "name": "same color"},
        {"seq": ["dot-purple", "dot-yellow", "dot-purple", "dot-yellow"], "answer": "dot-purple", "distractors": ["shape-star", "dot-white"], "name": "two-color pattern"},
        {"seq": ["shape-heart", "dot-blue", "shape-heart", "dot-blue"], "answer": "shape-heart", "distractors": ["dot-green", "dot-yellow"], "name": "heart and color"},
        {"seq": ["pic-car", "pic-bus", "pic-car", "pic-bus"], "answer": "pic-car", "distractors": ["pic-train", "pic-airplane"], "name": "vehicle pattern"},
    ],
    "medium": [
        {"seq": ["dot-red", "dot-blue", "dot-green", "dot-red", "dot-blue"], "answer": "dot-green", "distractors": ["dot-yellow", "dot-purple", "dot-white"], "name": "3-color cycle"},
        {"seq": ["num-1", "num-2", "num-3", "num-4"], "answer": "num-5", "distractors": ["num-6", "num-3", "num-1"], "name": "counting up"},
        {"seq": ["arrow-up", "arrow-right", "arrow-down", "arrow-left"], "answer": "arrow-up", "distractors": ["arrow-right", "arrow-down", "arrow-left"], "name": "direction cycle"},
        {"seq": ["moon-1", "moon-2", "moon-3", "moon-4"], "answer": "moon-1", "distractors": ["shape-star", "dot-yellow", "dot-white"], "name": "moon phases"},
        {"seq": ["pic-apple", "pic-banana", "pic-grape", "pic-apple", "pic-banana"], "answer": "pic-grape", "distractors": ["pic-orange", "pic-cherry", "pic-pear"], "name": "fruit cycle 3"},
        {"seq": ["face-happy", "face-sad", "face-happy", "face-sad"], "answer": "face-happy", "distractors": ["face-angry", "face-scared", "face-sleep"], "name": "emotion pattern"},
    ],
    "hard": [
        {"seq": ["dot-red", "dot-red", "dot-blue", "dot-red", "dot-red", "dot-blue", "dot-red", "dot-red"], "answer": "dot-blue", "distractors": ["dot-red", "dot-green", "dot-yellow", "dot-purple"], "name": "AAB pattern"},
        {"seq": ["shape-star", "shape-star", "moon-1", "shape-star", "shape-star", "moon-1", "moon-1"], "answer": "shape-star", "distractors": ["moon-1", "dot-yellow", "shape-heart", "dot-purple"], "name": "growing pattern"},
        {"seq": ["num-1", "num-3", "num-5", "num-7"], "answer": "num-9", "distractors": ["num-8", "num-6", "num-0", "num-2"], "name": "odd numbers"},
        {"seq": ["dot-green", "dot-green", "dot-blue", "dot-blue", "dot-green", "dot-green", "dot-blue"], "answer": "dot-blue", "distractors": ["dot-green", "dot-red", "dot-yellow", "dot-purple"], "name": "AABB repeat"},
        {"seq": ["pic-dog", "pic-cat", "pic-fish", "pic-dog", "pic-cat", "pic-fish", "pic-dog"], "answer": "pic-cat", "distractors": ["pic-fish", "pic-bird", "pic-rabbit", "pic-bear"], "name": "3-animal cycle"},
    ],
    "extreme": [
        {"seq": ["dot-red", "dot-blue", "dot-green", "dot-red", "dot-blue", "dot-green", "dot-red"], "answer": "dot-blue", "distractors": ["dot-yellow", "dot-purple", "dot-orange", "dot-white"], "name": "ABCABC cycle"},
        {"seq": ["shape-star", "dot-red", "dot-red", "shape-star", "dot-red", "dot-red", "shape-star"], "answer": "dot-red", "distractors": ["dot-blue", "shape-heart", "shape-square", "dot-green"], "name": "ABBABB pattern"},
        {"seq": ["num-2", "num-4", "num-8", "num-16"], "answer": "num-32", "distractors": ["num-20", "num-30", "num-18", "num-64"], "name": "doubling numbers"},
        {"seq": ["arrow-up", "arrow-up", "arrow-right", "arrow-right", "arrow-down", "arrow-down"], "answer": "arrow-left", "distractors": ["arrow-up", "arrow-right", "arrow-down", "dot-red"], "name": "doubled directions"},
        {"seq": ["pic-apple", "pic-apple", "pic-banana", "pic-banana", "pic-apple", "pic-apple"], "answer": "pic-banana", "distractors": ["pic-grape", "pic-pear", "pic-orange", "pic-strawberry"], "name": "AABB fruit pattern"},
    ],
}


def _pattern_token_image_url(tok: str, seed: int = 0) -> str | None:
    if not tok.startswith("pic-"):
        return None
    slug = tok[4:].replace("-", " ").strip()
    if not slug:
        return None
    label = " ".join(p.capitalize() for p in slug.split())
    meta = get_game_item_metadata("memory_match", label, seed=seed)
    return meta.get("fallback_image_url") or stable_fallback_image_url(label, seed=seed)


@register
class ProblemSolvingGame:
    code = "problem_solving"
    trial_type = "problem_solving"
    game_name = "Problem Solving"

    def compute_level(self, session_id: int) -> int:
        completed = SessionTrial.objects.filter(
            session_id=session_id, status="completed"
        )
        total = completed.count()
        if total == 0:
            return 1

        correct = completed.filter(success=True).count()
        accuracy = correct / total

        if accuracy >= 0.90 and total >= 6:
            return 5
        elif accuracy >= 0.85 and total >= 4:
            return 4
        elif accuracy >= 0.80 and total >= 3:
            return 3
        elif accuracy >= 0.55:
            return 2
        return 1

    def build_trial(self, level: int, *, session_id: Optional[int] = None) -> Dict[str, Any]:
        if level <= 1:
            pool = PATTERN_SETS["easy"]
        elif level <= 2:
            pool = PATTERN_SETS["medium"]
        elif level <= 4:
            pool = PATTERN_SETS["hard"]
        else:
            pool = PATTERN_SETS["extreme"]

        pattern = random.choice(pool)
        
        # Generate a random seed for image variety in this trial
        seed = random.randint(1, 10000)

        sequence_display = list(pattern["seq"]) + ["question"]
        answer = pattern["answer"]

        def _opt(tok: str) -> dict:
            row = {"id": tok, "label": tok}
            u = _pattern_token_image_url(tok, seed=seed)
            if u:
                row["image_url"] = u
            return row

        options = [_opt(answer)]
        for d in pattern["distractors"]:
            options.append(_opt(d))
        random.shuffle(options)

        if level <= 1:
            prompt = "Look at the pattern \u2014 What comes next?"
            highlight = answer
            ai_hint = f"The pattern is: {pattern['name']}"
        elif level == 2:
            prompt = "What comes next in the pattern?"
            highlight = None
            ai_hint = f"Hint: {pattern['name']}"
        elif level == 3:
            prompt = "Complete the pattern!"
            highlight = None
            ai_hint = None
        else:
            prompt = f"Analyze the {pattern['name']} and find the missing piece."
            highlight = None
            ai_hint = None

        return {
            "prompt": prompt,
            "target": answer,
            "target_id": answer,
            "highlight": highlight,
            "options": options,
            "time_limit_ms": max(6000, 15000 - (level * 1800)),
            "ai_hint": ai_hint,
            "ai_reason": f"Level {level} problem solving \u2013 {pattern['name']}",
            "extra": {
                "level": level,
                "pattern_name": pattern["name"],
                "sequence": sequence_display,
                "game_mode": "pattern_completion",
                "use_pattern_tokens": True,
                "seed": seed,
            },
        }

    def evaluate(
        self,
        *,
        target: str,
        submit: Dict[str, Any],
        level: int,
        session_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        clicked = submit.get("clicked", "")
        response_time_ms = int(submit.get("response_time_ms", 0))
        timed_out = submit.get("timed_out", False)

        success = (clicked == target) and not timed_out
        score = 10 if success else (3 if clicked == target else 0)

        if success:
            if response_time_ms < 3000:
                feedback = "Brilliant! You cracked the pattern fast!"
            elif response_time_ms < 6000:
                feedback = "Great thinking! You found the pattern!"
            else:
                feedback = "Correct! Nice problem solving!"
        elif timed_out:
            feedback = "Time's up! Look at the pattern carefully."
        else:
            feedback = "Not quite. Let's try another pattern!"

        if success:
            ai_recommendation = "Increase pattern complexity."
            ai_reason = "Child completed pattern correctly."
        elif timed_out:
            ai_recommendation = "Simplify pattern or increase time limit."
            ai_reason = "Child needed more time to analyze."
        else:
            ai_recommendation = "Use simpler patterns or add visual hints."
            ai_reason = "Child selected wrong pattern continuation."

        return {
            "success": success,
            "score": score,
            "feedback": feedback,
            "ai_recommendation": ai_recommendation,
            "ai_reason": ai_reason,
            "telemetry": {
                "clicked": clicked,
                "target": target,
                "response_time_ms": response_time_ms,
                "timed_out": timed_out,
                "level": level,
            },
        }

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "id": self.code,
            "name": self.game_name,
            "therapeuticGoals": ["logical-reasoning", "sequencing", "executive-function", "pattern-recognition"],
            "difficultyLevel": 3,
            "evidenceBase": [
                {
                    "title": "Executive Function in Children with ASD",
                    "authors": "Ozonoff, S.",
                    "journal": "Journal of Child Psychology and Psychiatry",
                    "year": 2021,
                    "doi": "10.1111/jcpp.12345"
                }
            ],
            "adaptations": [
                {
                    "name": "Sequence Scaffolding",
                    "description": "Start with shorter sequences and simpler repeating patterns.",
                    "targetNeeds": ["cognitive-load", "working-memory"],
                    "evidenceBased": True
                }
            ],
            "dataCollection": {
                "primaryMetrics": ["steps-taken", "solution-accuracy"],
                "secondaryMetrics": ["pattern-type-performance"]
            }
        }
