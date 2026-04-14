from __future__ import annotations

import random
import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from django.conf import settings
from django.utils import timezone

from therapy.models import Observation, GameImage
from therapy.api.games.registry import register
from therapy.dataset_metadata import get_game_item_metadata, stable_fallback_image_url

from gtts import gTTS

# =========================================================
# Backend TTS (Option B): create a file per prompt (cached)
# =========================================================

def _tts_cache_dir() -> Path:
    base = Path(getattr(settings, "MEDIA_ROOT", "media"))
    out = base / "tts" / "ja"
    out.mkdir(parents=True, exist_ok=True)
    return out

def tts_mp3_for_text(text: str, *, lang: str = "en") -> str:
    """
    Returns a MEDIA_URL path to an mp3 file for given text.
    Caches by hash so we don't regenerate.
    Uses gTTS by default (fast MVP). Replace with your own TTS later.
    """
    # hash stable key
    key = hashlib.md5(f"{lang}:{text}".encode("utf-8")).hexdigest()
    out_dir = _tts_cache_dir()
    file_path = out_dir / f"{key}.mp3"

    if not file_path.exists():
        try:
            # MVP: gTTS
            gTTS(text=text, lang=lang).save(str(file_path))
        except Exception:
            # If gTTS isn't available, fallback: no audio
            return ""

    media_url = getattr(settings, "MEDIA_URL", "/media/")
    if not media_url.endswith("/"):
        media_url += "/"
    # file is under MEDIA_ROOT/tts/ja/<hash>.mp3
    return f"{media_url}tts/ja/{file_path.name}"


# =========================================================
# GameImage dataset integration for real photos
# =========================================================

def _get_game_images_for_ja(category: str = "object", count: int = 10) -> List[Dict[str, Any]]:
    """
    Fetch real images from GameImage dataset for Joint Attention game.
    Falls back to object_discovery game type if no matching images found.
    """
    # Try to get images from object_discovery game type
    images = list(GameImage.objects.filter(
        game_type="object_discovery",
        is_active=True
    )[:count])
    
    # If not enough, also check memory_match
    if len(images) < count:
        additional = list(GameImage.objects.filter(
            game_type="memory_match",
            is_active=True
        )[:count - len(images)])
        images.extend(additional)
    
    result = []
    for img in images:
        image_url = img.image.url if img.image else None
        if not image_url:
            meta = get_game_item_metadata("object_discovery", img.name)
            if not meta.get("fallback_image_url"):
                meta = get_game_item_metadata("memory_match", img.name)
            image_url = meta.get("fallback_image_url") or stable_fallback_image_url(img.name)
        result.append({
            "id": img.name.lower().replace(" ", "_"),
            "name": img.name,
            "image_url": image_url,
            "category": img.category,
        })

    return result


def _img_url_from_gameimage(img_data: Dict[str, Any]) -> str:
    """Build image URL from GameImage data."""
    media_url = getattr(settings, "MEDIA_URL", "/media/")
    if not media_url.endswith("/"):
        media_url += "/"
    
    image_url = img_data.get("image_url")
    if image_url:
        return image_url
    
    # Fallback to static if needed
    static_url = getattr(settings, "STATIC_URL", "/static/")
    if not static_url.endswith("/"):
        static_url += "/"
    return f"{static_url}therapy/ja/{img_data['id']}.png"


# =========================================================
# State / AI policy
# =========================================================

@dataclass
class JAState:
    """Derived state from recent performance (no DB schema changes needed)."""
    level: int
    ema_acc: float
    ema_rt: float
    streak_correct: int
    streak_wrong: int
    time_limit_ms: int
    distractor_mode: str  # "easy" | "medium" | "hard"


@register
class JointAttentionGame:
    """
    AI-assisted Joint Attention module (speech prompt + image options):

    - L1: spoken+text prompt + highlight target
    - L2: spoken+text prompt, NO highlight
    - L3: spoken minimal cue ("Look where I point"), NO highlight (maintenance)

    AI adapts:
      - level (prompt fading)
      - time limit
      - distractor difficulty
    """
    code = "ja"
    trial_type = "joint_attention"
    game_name = "Look Where I Point"

    # Base time limits by level
    TIME_LIMIT_L1 = 12000
    TIME_LIMIT_L2 = 10000
    TIME_LIMIT_L3 = 8000

    EMA_ALPHA = 0.35
    WINDOW = 8

    # If you want Urdu prompts later, set lang="ur" and switch prompt text.
    TTS_LANG = "en"
    
    # Cache for game images
    _image_cache: List[Dict[str, Any]] = []
    
    def _get_images(self) -> List[Dict[str, Any]]:
        """Get images from database, with caching."""
        if not self._image_cache:
            self._image_cache = _get_game_images_for_ja(count=20)
        return self._image_cache

    # -----------------------------
    # Telemetry + state
    # -----------------------------

    def _recent_telemetry(self, session_id: int, limit: int = WINDOW) -> List[Dict[str, Any]]:
        qs = Observation.objects.filter(
            session_id=session_id,
            note="trial_telemetry",
        ).order_by("-id")[:limit]
        out: List[Dict[str, Any]] = []
        for o in qs:
            if isinstance(o.tags, dict):
                out.append(o.tags)
        return out

    def _compute_state(self, session_id: int) -> JAState:
        history = list(reversed(self._recent_telemetry(session_id)))  # oldest->newest

        if not history:
            return JAState(
                level=1,
                ema_acc=0.0,
                ema_rt=0.0,
                streak_correct=0,
                streak_wrong=0,
                time_limit_ms=self.TIME_LIMIT_L1,
                distractor_mode="easy",
            )

        ema_acc = 0.0
        ema_rt = 0.0
        streak_correct = 0
        streak_wrong = 0

        for t in history:
            success = bool(t.get("success", False))
            rt = int(t.get("response_time_ms", 0) or 0)

            ema_acc = (self.EMA_ALPHA * (1.0 if success else 0.0)) + ((1 - self.EMA_ALPHA) * ema_acc)
            ema_rt = (self.EMA_ALPHA * float(rt)) + ((1 - self.EMA_ALPHA) * ema_rt)

            if success:
                streak_correct += 1
                streak_wrong = 0
            else:
                streak_wrong += 1
                streak_correct = 0

        # Level decision
        if ema_acc >= 0.78 and (ema_rt <= 3200 or ema_rt == 0.0) and streak_correct >= 2:
            level = 2
        else:
            level = 1

        if ema_acc >= 0.88 and (ema_rt <= 2500 or ema_rt == 0.0) and streak_correct >= 3:
            level = 3

        # distractor difficulty
        if level == 1:
            distractor_mode = "easy" if ema_acc < 0.65 else "medium"
        elif level == 2:
            distractor_mode = "medium" if ema_acc < 0.85 else "hard"
        else:
            distractor_mode = "hard"

        # base time limit by level
        base = self.TIME_LIMIT_L1 if level == 1 else self.TIME_LIMIT_L2 if level == 2 else self.TIME_LIMIT_L3

        # adapt time limit
        if ema_rt and ema_rt > 4500:
            time_limit_ms = min(base + 2000, 15000)
        elif ema_rt and ema_rt < 2000 and ema_acc > 0.8:
            time_limit_ms = max(base - 1000, 5000)
        else:
            time_limit_ms = base

        return JAState(
            level=level,
            ema_acc=float(round(ema_acc, 3)),
            ema_rt=float(round(ema_rt, 1)),
            streak_correct=streak_correct,
            streak_wrong=streak_wrong,
            time_limit_ms=int(time_limit_ms),
            distractor_mode=distractor_mode,
        )

    def compute_level(self, session_id: int) -> int:
        return self._compute_state(session_id).level

    # -----------------------------
    # Stimuli + options + target (using GameImage dataset)
    # -----------------------------

    def _pick_options(self, mode: str, count: int = 4) -> List[Dict[str, Any]]:
        """Pick random images from GameImage dataset."""
        images = self._get_images()
        
        if len(images) < count:
            default_stimuli = [
                {"id": "car", "name": "Car", "image_url": stable_fallback_image_url("Car")},
                {"id": "ball", "name": "Ball", "image_url": stable_fallback_image_url("Ball")},
                {"id": "cat", "name": "Cat", "image_url": stable_fallback_image_url("Cat")},
                {"id": "cup", "name": "Cup", "image_url": stable_fallback_image_url("Cup")},
                {"id": "apple", "name": "Apple", "image_url": stable_fallback_image_url("Apple")},
                {"id": "book", "name": "Book", "image_url": stable_fallback_image_url("Book")},
                {"id": "fish", "name": "Fish", "image_url": stable_fallback_image_url("Fish")},
                {"id": "hat", "name": "Hat", "image_url": stable_fallback_image_url("Hat")},
            ]
            images = default_stimuli
        
        selected = random.sample(images, min(count, len(images)))
        return selected

    def _pick_target(self, options: List[Dict[str, Any]], session_id: int) -> Dict[str, Any]:
        last = Observation.objects.filter(session_id=session_id, note="trial_started").order_by("-id").first()
        last_target = None
        if last and isinstance(last.tags, dict):
            last_target = last.tags.get("target_id")

        candidates = [o for o in options if o["id"] != last_target] if last_target else options
        return random.choice(candidates) if candidates else random.choice(options)

    def _option_payload(self, img_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build option payload with real image URL."""
        image_url = img_data.get("image_url")
        
        return {
            "id": img_data["id"],
            "label": img_data["name"],
            "image": image_url or _img_url_from_gameimage(img_data),
        }

    # -----------------------------
    # Build trial (speech prompt + image options)
    # -----------------------------

    def build_trial(self, level: int, *, session_id: Optional[int] = None) -> Dict[str, Any]:
        # If we have session context, enforce AI state
        if session_id is not None:
            state = self._compute_state(session_id)
            mode = state.distractor_mode
            time_limit_ms = state.time_limit_ms
            level = state.level
        else:
            mode = "easy"
            time_limit_ms = self.TIME_LIMIT_L1

        # Get image options from GameImage dataset
        option_images = self._pick_options(mode, count=4)
        target_image = self._pick_target(option_images, session_id or 0)

        # Prompt hierarchy (text + audio)
        target_name = target_image["name"]
        if level == 1:
            prompt_text = f"Look at the {target_name}"
            highlight_id = target_image["id"]
            ai_hint = "Use highlight + speech + text (errorless learning)."
        elif level == 2:
            prompt_text = f"Look at the {target_name}"
            highlight_id = None
            ai_hint = "Fade prompt: speech + text only."
        else:
            prompt_text = "Look where I point"
            highlight_id = None
            ai_hint = "Minimal cue (maintenance)."

        prompt_audio = tts_mp3_for_text(prompt_text, lang=self.TTS_LANG)

        return {
            "prompt_text": prompt_text,
            "prompt_audio": prompt_audio,
            "options": [self._option_payload(x) for x in option_images],
            "target_id": target_image["id"],      # stable id
            "highlight_id": highlight_id,         # for level 1 only
            "time_limit_ms": int(time_limit_ms),
            "ai_hint": ai_hint,
            "ai_reason": f"mode={mode}",
            "extra": {
                "distractor_mode": mode,
                "level": level,
                "target_name": target_name,
            },
        }

    # -----------------------------
    # Evaluate (clicked id vs target id)
    # -----------------------------

    def evaluate(self, *, target: str, submit: dict, level: int, session_id: Optional[int] = None) -> dict:
        clicked_id = (submit.get("clicked_id") or submit.get("clicked") or "").strip().lower()
        target_id = (target or "").strip().lower()

        timed_out = bool(submit.get("timed_out", False))
        response_time_ms = int(submit.get("response_time_ms", 0) or 0)

        success = (not timed_out) and (clicked_id == target_id)
        score = 10 if success else 0

        rec, reason = self._ai_recommend_after_trial(
            session_id=session_id,
            level=level,
            success=success,
            timed_out=timed_out,
            rt=response_time_ms,
        )

        telemetry = {
            "game": self.code,
            "trial_type": self.trial_type,
            "level": level,
            "target_id": target_id,
            "clicked_id": clicked_id,
            "response_time_ms": response_time_ms,
            "timed_out": timed_out,
            "success": success,
            "ai_recommendation": rec,
            "ai_reason": reason,
            # Optional: store mode to analyze later
            "distractor_mode": self._compute_state(session_id).distractor_mode if session_id else None,
        }

        feedback = "Correct!" if success else ("Timed out" if timed_out else "Try again")

        return {
            "success": success,
            "score": score,
            "feedback": feedback,
            "telemetry": telemetry,
            "ai_recommendation": rec,
            "ai_reason": reason,
        }

    def _ai_recommend_after_trial(
        self,
        *,
        session_id: Optional[int],
        level: int,
        success: bool,
        timed_out: bool,
        rt: int,
    ) -> Tuple[str, str]:
        if session_id is None:
            return ("Continue", "No session context")

        state = self._compute_state(session_id)

        if timed_out or state.streak_wrong >= 2 or state.ema_acc < 0.55:
            return (
                "Recommendation: Increase prompting (Level 1), reduce distractor difficulty, slow pacing.",
                f"ema_acc={state.ema_acc}, streak_wrong={state.streak_wrong}, ema_rt={state.ema_rt}",
            )

        if state.ema_acc >= 0.8 and state.ema_rt <= 3200 and state.streak_correct >= 2:
            if level < 3:
                return (
                    "Recommendation: Fade prompt (move toward Level 2/3) and use harder distractors.",
                    f"ema_acc={state.ema_acc}, streak_correct={state.streak_correct}, ema_rt={state.ema_rt}",
                )

        return (
            "Recommendation: Maintain current level and continue trials.",
            f"ema_acc={state.ema_acc}, ema_rt={state.ema_rt}, level={state.level}",
        )
