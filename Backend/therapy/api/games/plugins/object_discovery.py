"""
Object Discovery Plugin – Receptive Language & Categorization
ABA Level 2: Identify objects by category, build vocabulary.
"""
from __future__ import annotations

import random
from typing import Any, Dict, Optional

from therapy.models import GameImage, SessionTrial
from therapy.api.games.registry import register
from therapy.dataset_metadata import get_game_item_metadata, stable_fallback_image_url

CATEGORIES = {
    "animals": {
        "label": "Animals",
        "items": [
            {"id": "dog", "label": "Dog"},
            {"id": "cat", "label": "Cat"},
            {"id": "fish", "label": "Fish"},
            {"id": "bird", "label": "Bird"},
            {"id": "rabbit", "label": "Rabbit"},
            {"id": "bear", "label": "Bear"},
            {"id": "penguin", "label": "Penguin"},
            {"id": "dolphin", "label": "Dolphin"},
        ],
    },
    "fruits": {
        "label": "Fruits",
        "items": [
            {"id": "apple", "label": "Apple"},
            {"id": "banana", "label": "Banana"},
            {"id": "grape", "label": "Grape"},
            {"id": "orange", "label": "Orange"},
            {"id": "cherry", "label": "Cherry"},
            {"id": "pear", "label": "Pear"},
            {"id": "watermelon", "label": "Watermelon"},
            {"id": "strawberry", "label": "Strawberry"},
        ],
    },
    "vehicles": {
        "label": "Vehicles",
        "items": [
            {"id": "car", "label": "Car"},
            {"id": "bus", "label": "Bus"},
            {"id": "truck", "label": "Truck"},
            {"id": "airplane", "label": "Airplane"},
            {"id": "boat", "label": "Boat"},
            {"id": "bicycle", "label": "Bicycle"},
            {"id": "train", "label": "Train"},
            {"id": "helicopter", "label": "Helicopter"},
        ],
    },
    "shapes": {
        "label": "Shapes",
        "items": [
            {"id": "circle", "label": "Circle"},
            {"id": "square", "label": "Square"},
            {"id": "triangle", "label": "Triangle"},
            {"id": "star", "label": "Star"},
            {"id": "heart", "label": "Heart"},
            {"id": "diamond", "label": "Diamond"},
        ],
    },
    "food": {
        "label": "Food",
        "items": [
            {"id": "pizza", "label": "Pizza"},
            {"id": "cake", "label": "Cake"},
            {"id": "cookie", "label": "Cookie"},
            {"id": "bread", "label": "Bread"},
            {"id": "icecream", "label": "Ice Cream"},
            {"id": "candy", "label": "Candy"},
        ],
    },
    "nature": {
        "label": "Nature",
        "items": [
            {"id": "tree", "label": "Tree"},
            {"id": "flower", "label": "Flower"},
            {"id": "sun", "label": "Sun"},
            {"id": "moon", "label": "Moon"},
            {"id": "cloud", "label": "Cloud"},
            {"id": "rainbow", "label": "Rainbow"},
        ],
    },
}

CAT_KEYS = list(CATEGORIES.keys())


def _object_discovery_image_url(item_id: str, seed: int = 0) -> str:
    """Photo URL from seeded media, or deterministic placeholder from dataset metadata."""
    label = item_id.replace("_", " ").strip().title()
    gi = GameImage.objects.filter(
        game_type="object_discovery",
        is_active=True,
        name__iexact=label,
    ).first()
    if gi and gi.image:
        return gi.image.url
    meta = get_game_item_metadata("object_discovery", label, seed=seed)
    return meta.get("fallback_image_url") or stable_fallback_image_url(label, seed=seed)


def _cats_for_level(level: int) -> int:
    if level <= 1:
        return 1
    elif level <= 2:
        return 2
    elif level <= 4:
        return 3
    return 4


def _target_count(level: int) -> int:
    if level <= 1:
        return 2
    elif level <= 2:
        return 3
    elif level <= 4:
        return 4
    return 5


@register
class ObjectDiscoveryGame:
    code = "object_discovery"
    trial_type = "object_discovery"
    game_name = "Object Discovery"

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
        elif accuracy >= 0.60:
            return 2
        return 1

    def build_trial(self, level: int, *, session_id: Optional[int] = None) -> Dict[str, Any]:
        target_cat_key = random.choice(CAT_KEYS)
        target_cat = CATEGORIES[target_cat_key]
        
        # Generate a random seed for image variety in this trial
        seed = random.randint(1, 10000)

        n_correct = _target_count(level)
        n_distractor_cats = _cats_for_level(level)

        correct_items = random.sample(
            target_cat["items"], min(n_correct, len(target_cat["items"]))
        )

        distractor_cat_keys = [k for k in CAT_KEYS if k != target_cat_key]
        random.shuffle(distractor_cat_keys)
        chosen_distractor_keys = distractor_cat_keys[:n_distractor_cats]

        distractor_items = []
        # Increase number of items per distractor category for higher levels
        items_per_dist = 2 if level <= 3 else 3
        
        for dk in chosen_distractor_keys:
            items = CATEGORIES[dk]["items"]
            distractor_items.extend(random.sample(items, min(items_per_dist, len(items))))

        all_options = correct_items + distractor_items
        random.shuffle(all_options)

        target_ids = [i["id"] for i in correct_items]

        if level <= 1:
            prompt = f"Find all the {target_cat['label']}! Tap each one you see."
            highlight = target_ids[0] if target_ids else None
            ai_hint = f"Look for things that are {target_cat_key}"
        elif level == 2:
            prompt = f"Can you find all the {target_cat['label']}?"
            highlight = None
            ai_hint = f"How many {target_cat_key} can you spot?"
        elif level == 3:
            prompt = f"Select all the {target_cat['label']}!"
            highlight = None
            ai_hint = None
        else:
            prompt = f"Identify every {target_cat['label']} in the group."
            highlight = None
            ai_hint = None

        options_out = []
        for o in all_options:
            row = {
                "id": o["id"],
                "label": o["label"],
                "image_url": _object_discovery_image_url(o["id"], seed=seed),
            }
            options_out.append(row)

        return {
            "prompt": prompt,
            "target": ",".join(target_ids),
            "target_id": ",".join(target_ids),
            "highlight": highlight,
            "options": options_out,
            "time_limit_ms": max(6000, 15000 - (level * 1800)),
            "ai_hint": ai_hint,
            "ai_reason": f"Level {level} object discovery \u2013 category: {target_cat_key}",
            "extra": {
                "level": level,
                "category": target_cat_key,
                "category_label": target_cat["label"],
                "correct_count": len(target_ids),
                "game_mode": "category_select",
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

        target_ids = set(target.split(","))
        clicked_ids = set(clicked.split(",")) if clicked else set()

        if timed_out:
            success = False
            score = 0
        else:
            correct_picks = clicked_ids & target_ids
            wrong_picks = clicked_ids - target_ids
            success = len(correct_picks) >= len(target_ids) and len(wrong_picks) == 0
            if success:
                score = 10
            else:
                ratio = max(0, len(correct_picks) - len(wrong_picks)) / max(1, len(target_ids))
                score = max(0, min(10, round(ratio * 10)))

        if success:
            feedback = "Perfect! You found them all!"
        elif timed_out:
            feedback = "Time's up! Let's try again."
        elif score >= 5:
            feedback = "Good try! You found some of them."
        else:
            feedback = "Let's look more carefully next time!"

        if success:
            ai_recommendation = "Increase category complexity or add more distractors."
            ai_reason = "Child correctly identified all items."
        elif timed_out:
            ai_recommendation = "Increase time limit or reduce number of items."
            ai_reason = "Child needed more time."
        else:
            ai_recommendation = "Reduce distractors or highlight category label."
            ai_reason = f"Child selected {len(clicked_ids)} items, {len(clicked_ids & target_ids)} correct."

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
                "correct_picks": list(clicked_ids & target_ids),
                "wrong_picks": list(clicked_ids - target_ids),
                "missed": list(target_ids - clicked_ids),
            },
        }

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "id": self.code,
            "name": self.game_name,
            "therapeuticGoals": ["vocabulary-expansion", "categorization", "receptive-language"],
            "difficultyLevel": 2,
            "evidenceBase": [
                {
                    "title": "Categorization Skills in Autism: Intervention Approaches",
                    "authors": "Roberts, S., et al.",
                    "journal": "Research in Autism Spectrum Disorders",
                    "year": 2022,
                    "doi": "10.1016/j.rasd.2022.101987"
                }
            ],
            "adaptations": [
                {
                    "name": "Category Highlighting",
                    "description": "Provide a visual cue for the target category.",
                    "targetNeeds": ["visual-processing", "comprehension-support"],
                    "evidenceBased": True
                }
            ],
            "dataCollection": {
                "primaryMetrics": ["accuracy", "response_time_ms"],
                "secondaryMetrics": ["category_accuracy"]
            }
        }
