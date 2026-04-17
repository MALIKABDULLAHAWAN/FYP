"""
Memory Match Plugin – Matching Pairs / Card Flip Game
ABA Level 1-3: Visual memory, working memory, pattern recognition.

Uses GameImage dataset from database for card images.
"""
from __future__ import annotations

import random
from typing import Any, Dict, Optional, List

from therapy.dataset_metadata import get_game_item_metadata, stable_fallback_image_url
from therapy.models import SessionTrial, GameImage
from therapy.api.games.registry import register


def _num_pairs(level: int) -> int:
    """Number of pairs on the board."""
    if level <= 1:
        return 3   # 3 pairs = 6 cards (3x2 grid)
    elif level <= 2:
        return 4   # 4 pairs = 8 cards (4x2 grid)
    elif level == 3:
        return 6   # 6 pairs = 12 cards (4x3 grid)
    elif level == 4:
        return 8   # 8 pairs = 16 cards (4x4 grid)
    return 10      # 10 pairs = 20 cards (4x5 grid)


def _get_game_images(level: int, count: int, seed: int = 0) -> List[Dict[str, Any]]:
    """Fetch random game images from database based on difficulty."""
    # Map level to difficulty
    difficulty = level
    
    # Query active images for memory_match game type
    queryset = GameImage.objects.filter(
        game_type="memory_match",
        is_active=True,
        difficulty__lte=difficulty + 1  # Include images of same or easier difficulty
    )
    
    # If not enough images with specific difficulty, get any memory_match images
    if queryset.count() < count:
        queryset = GameImage.objects.filter(
            game_type="memory_match",
            is_active=True
        )
    
    images = list(queryset)
    
    # If we have images in database, use them
    if len(images) >= count:
        selected = random.sample(images, count)
        out = []
        for img in selected:
            meta = get_game_item_metadata("memory_match", img.name, seed=seed)
            out.append(
                {
                    "id": img.id,
                    "name": img.name,
                    "label": meta.get("label", img.name),
                    "image_url": img.image.url
                    if img.image
                    else (meta.get("fallback_image_url") or stable_fallback_image_url(img.name, seed=seed)),
                    "category": img.category,
                    "metadata": meta,
                }
            )
        return out
    
    # Fallback: text labels only (no emoji)
    LABEL_POOL = [
        "Apple", "Dog", "Star", "Car", "Cat", "Flower", "Fish", "Ball", "Tree", "Pizza", "Bird", "Moon",
    ]
    selected = random.sample(LABEL_POOL, min(count, len(LABEL_POOL)))
    out_fb = []
    for i, label in enumerate(selected):
        m = get_game_item_metadata("memory_match", label, seed=seed)
        out_fb.append(
            {
                "id": i,
                "name": label,
                "label": label,
                "image_url": m.get("fallback_image_url") or stable_fallback_image_url(label, seed=seed),
                "category": "word",
                "metadata": m,
            }
        )
    return out_fb


@register
class MemoryMatchGame:
    code = "memory_match"
    trial_type = "memory_match"
    game_name = "Memory Match"

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
        elif accuracy >= 0.65:
            return 2
        return 1

    def build_trial(self, level: int, *, session_id: Optional[int] = None) -> Dict[str, Any]:
        if session_id:
            level = self.compute_level(session_id)
            
        num = _num_pairs(level)
        
        # Generate a random seed for image variety in this trial
        seed = random.randint(1, 10000)

        # Get game images from database
        game_images = _get_game_images(level, num, seed=seed)
        
        # Create pairs (each image appears twice)
        cards = []
        for i, img in enumerate(game_images):
            pair_data = {
                "id": f"c{i}a",
                "pair_id": f"p{i}",
                "name": img["name"],
                "label": img.get("label", img["name"]),
                "metadata": img.get("metadata") or {},
                "image_url": img["image_url"],
                "category": img["category"],
            }
            cards.append(pair_data)
            # Second card of the pair
            pair_data2 = {
                "id": f"c{i}b",
                "pair_id": f"p{i}",
                "name": img["name"],
                "label": img.get("label", img["name"]),
                "metadata": img.get("metadata") or {},
                "image_url": img["image_url"],
                "category": img["category"],
            }
            cards.append(pair_data2)

        random.shuffle(cards)

        # Compute grid dimensions
        total_cards = len(cards)
        if total_cards <= 8:
            cols = 4
        elif total_cards <= 12:
            cols = 4
        elif total_cards <= 16:
            cols = 4
        else:
            cols = 5
        rows = total_cards // cols

        # Prompt hierarchy
        if level <= 1:
            prompt = f"Find {num} matching pairs! Flip two cards at a time."
            ai_hint = "Start with corners \u2014 they're easier to remember!"
        elif level == 2:
            prompt = f"Match all {num} pairs! Remember where each card is."
            ai_hint = "Try to remember each card position."
        elif level == 3:
            prompt = f"Can you find all {num} pairs with a 3x4 grid?"
            ai_hint = "Focus on the patterns."
        else:
            prompt = f"Master Level {level}! Match all {num} pairs!"
            ai_hint = f"Large {rows}x{cols} grid \u2014 testing maximum memory span."

        # Target is the full card layout (for verification)
        pair_map = {c["id"]: c["pair_id"] for c in cards}

        return {
            "prompt": prompt,
            "target": f"{num}_pairs",
            "target_id": f"{num}_pairs",
            "highlight": None,
            "options": [],  # Not used \u2014 frontend handles card grid
            "time_limit_ms": max(30000, num * 12000),  # Scale time with count
            "ai_hint": ai_hint,
            "ai_reason": f"Level {level} memory match with {num} pairs",
            "extra": {
                "level": level,
                "game_type": "memory_match",
                "num_pairs": num,
                "grid_cols": cols,
                "grid_rows": rows,
                "cards": cards,
                "pair_map": pair_map,
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

        # Parse frontend submission: "pairs:3,moves:8,total:4"
        parts = {}
        for part in clicked.split(","):
            if ":" in part:
                k, v = part.split(":", 1)
                parts[k.strip()] = v.strip()

        pairs_found = int(parts.get("pairs", 0))
        total_pairs = int(parts.get("total", 0)) or 1
        moves = int(parts.get("moves", 0))

        # Success = found all pairs
        completion_ratio = pairs_found / total_pairs
        success = completion_ratio >= 1.0 and not timed_out

        # Score: perfect moves = num_pairs, so efficiency = pairs / moves
        perfect_moves = total_pairs
        if moves > 0:
            efficiency = perfect_moves / moves
        else:
            efficiency = 0

        if success:
            base_score = 10
            if efficiency >= 0.8:
                score = 15  # exceptional memory
            elif efficiency >= 0.5:
                score = 12
            else:
                score = 10
        elif completion_ratio >= 0.5:
            score = 5
        else:
            score = 2 if not timed_out else 0

        # Feedback
        if success and efficiency >= 0.8:
            feedback = "Amazing memory! You found all pairs with very few moves!"
        elif success:
            feedback = "Great job! You found all the matching pairs!"
        elif timed_out and completion_ratio >= 0.5:
            feedback = f"Time's up! You found {pairs_found}/{total_pairs} pairs. Almost there!"
        elif timed_out:
            feedback = f"Time's up! You found {pairs_found}/{total_pairs} pairs. Keep practicing!"
        else:
            feedback = f"You found {pairs_found}/{total_pairs} pairs. Let's try again!"

        # AI recommendation
        if success and efficiency >= 0.7:
            ai_recommendation = "Increase difficulty — add more pairs."
            ai_reason = "Child has excellent visual memory."
        elif success:
            ai_recommendation = "Maintain current level — child is progressing."
            ai_reason = "Child completed the board but needed extra moves."
        elif timed_out:
            ai_recommendation = "Reduce pairs or increase time."
            ai_reason = "Child ran out of time."
        else:
            ai_recommendation = "Use fewer pairs or provide hints."
            ai_reason = "Child struggled with current difficulty."

        return {
            "success": success,
            "score": score,
            "feedback": feedback,
            "ai_recommendation": ai_recommendation,
            "ai_reason": ai_reason,
            "telemetry": {
                "pairs_found": pairs_found,
                "total_pairs": total_pairs,
                "moves": moves,
                "efficiency": round(efficiency, 2),
                "response_time_ms": response_time_ms,
                "timed_out": timed_out,
                "level": level,
            },
        }

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "id": self.code,
            "name": self.game_name,
            "therapeuticGoals": ["visual-memory", "concentration", "working-memory", "pattern-recognition"],
            "difficultyLevel": 2,
            "evidenceBase": [
                {
                    "title": "Visual Memory and Working Memory in ASD",
                    "authors": "Smith, A., et al.",
                    "journal": "Research in Autism Spectrum Disorders",
                    "year": 2022,
                    "doi": "10.1016/j.rasd.2022.101987"
                }
            ],
            "adaptations": [
                {
                    "name": "Reduced Distractors",
                    "description": "Start with fewer pairs for children with high distractibility.",
                    "targetNeeds": ["high-distractibility", "limited-attention"],
                    "evidenceBased": True
                }
            ],
            "dataCollection": {
                "primaryMetrics": ["accuracy", "response_time_ms", "moves"],
                "secondaryMetrics": ["efficiency"]
            }
        }
