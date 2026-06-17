"""
Scene Description Game - Describe an Image with Groq LLM Evaluation
ABA Level 1-3: Receptive language, descriptive language, communication development.

Flow:
  - System shows a scenario image to the child
  - Child types what they see
  - Backend sends (child text + expected description + key elements) to Groq as LLM judge
  - Groq returns STRICT JSON evaluation:
      clarity_score (0-10), completeness_score (0-10), overall_score (0-100),
      key_elements_found, strengths, areas_for_improvement, feedback
  - Difficulty adapts based on avg overall_score across completed trials
  - Stores full evaluation in SceneDescriptionResponse
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from django.conf import settings

from therapy.models import SessionTrial, ScenarioImage, SceneDescriptionResponse
from therapy.api.games.registry import register

logger = logging.getLogger("therapy.scene_description")


# -----------------------------------------------------------------
# Groq LLM Judge
# -----------------------------------------------------------------

def evaluate_scene_description(
    *,
    child_response: str,
    expected_description: str,
    key_elements: List[str],
    scenario_title: str = "",
    model_name: Optional[str] = None,
    # kept for API compatibility (Groq is text-only, image bytes ignored)
    image_bytes: bytes = b"",
    image_mime: str = "",
) -> Dict[str, Any]:
    """
    Evaluate child's scene description using Groq as an LLM judge.

    Returns:
    {
      "llm_score": 0-100,
      "feedback": str,
      "clarity_score": 0-10,
      "completeness_score": 0-10,
      "key_elements_found": [str],
      "strengths": str,
      "areas_for_improvement": str,
      "error": None | str
    }
    """
    api_key = getattr(settings, "GROQ_API_KEY", None)
    if not api_key:
        return {
            "llm_score": 50,
            "feedback": "LLM evaluation not available (Groq API key not configured).",
            "clarity_score": 5,
            "completeness_score": 5,
            "key_elements_found": [],
            "strengths": "",
            "areas_for_improvement": "",
            "error": "Groq API key not configured",
        }

    try:
        from groq import Groq
    except ImportError:
        return {
            "llm_score": 50,
            "feedback": "Groq package not installed.",
            "clarity_score": 5,
            "completeness_score": 5,
            "key_elements_found": [],
            "strengths": "",
            "areas_for_improvement": "",
            "error": "groq package not installed",
        }

    model = model_name or getattr(settings, "AI_MODEL_DEFAULT", "llama-3.3-70b-versatile")
    elements_str = ", ".join(key_elements) if key_elements else "any relevant details"
    scene_context = f'Scene title: "{scenario_title}"\n' if scenario_title else ""

    system_prompt = (
        "You are an autism therapy evaluation assistant. "
        "You evaluate children's image descriptions in a warm, encouraging way. "
        "Always respond with STRICT JSON only — no markdown, no extra text."
    )

    user_prompt = f"""{scene_context}
Expected key elements in the image:
{elements_str}

Reference description (therapist's expected answer):
{expected_description or "Not provided — evaluate based on key elements and child language quality."}

Child's response:
"{child_response}"

Return STRICT JSON ONLY using this exact structure:
{{
  "clarity_score": <integer 0-10>,
  "completeness_score": <integer 0-10>,
  "overall_score": <integer 0-100>,
  "key_elements_found": [<strings from the expected key elements that the child mentioned>],
  "feedback": "<encouraging, constructive feedback addressed to the child, 1-2 sentences>",
  "strengths": "<what the child did well, 1 sentence>",
  "areas_for_improvement": "<gentle suggestion for next time, 1 sentence>"
}}

Rules:
- Be encouraging and supportive for autistic children.
- Score generously for partial matches and effort.
- Keep all text fields short and child-friendly.
""".strip()

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=512,
        )

        raw_text = (completion.choices[0].message.content or "").strip()
        logger.info(f"Groq raw response: {raw_text}")

        # Strip markdown fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        try:
            result = json.loads(raw_text)
        except json.JSONDecodeError:
            start = raw_text.find("{")
            end = raw_text.rfind("}") + 1
            if start >= 0 and end > start:
                result = json.loads(raw_text[start:end])
            else:
                result = {
                    "clarity_score": 5,
                    "completeness_score": 5,
                    "overall_score": 50,
                    "key_elements_found": [],
                    "feedback": raw_text,
                    "strengths": "",
                    "areas_for_improvement": "",
                }

        logger.info(f"Groq parsed result: {result}")

        clarity = max(0, min(10, int(result.get("clarity_score", 5))))
        completeness = max(0, min(10, int(result.get("completeness_score", 5))))
        overall = max(0, min(100, int(result.get("overall_score", 50))))

        return {
            "llm_score": overall,
            "feedback": result.get("feedback", "Great effort!"),
            "clarity_score": clarity,
            "completeness_score": completeness,
            "key_elements_found": result.get("key_elements_found", []) or [],
            "strengths": result.get("strengths", "") or "",
            "areas_for_improvement": result.get("areas_for_improvement", "") or "",
            "error": None,
        }

    except Exception as e:
        logger.error(f"Groq evaluation error: {e}")
        return {
            "llm_score": 50,
            "feedback": f"Evaluation error: {e}",
            "clarity_score": 5,
            "completeness_score": 5,
            "key_elements_found": [],
            "strengths": "",
            "areas_for_improvement": "",
            "error": str(e),
        }


# -----------------------------------------------------------------
# Game Plugin
# -----------------------------------------------------------------

@register
class SceneDescriptionGame:
    code = "scene_description"
    trial_type = "scene_description"
    game_name = "Scene Description"

    def compute_level(self, session_id: int) -> int:
        """Adapt difficulty based on average LLM score of completed trials."""
        completed = SessionTrial.objects.filter(
            session_id=session_id,
            trial_type=self.trial_type,
            status="completed",
        )

        total = completed.count()
        if total == 0:
            return 1

        scores = []
        for trial in completed:
            resp = SceneDescriptionResponse.objects.filter(trial=trial).first()
            if resp and resp.llm_score is not None:
                scores.append(resp.llm_score)

        if not scores:
            return 1

        avg_score = sum(scores) / len(scores)

        if avg_score >= 90 and total >= 6:
            return 5
        elif avg_score >= 85 and total >= 4:
            return 4
        elif avg_score >= 80 and total >= 2:
            return 3
        elif avg_score >= 60:
            return 2
        return 1

    def build_trial(self, level: int, *, session_id: Optional[int] = None) -> Dict[str, Any]:
        """Select a random scenario image and adapt prompt complexity to level."""
        if session_id:
            level = self.compute_level(session_id)

        scenarios = ScenarioImage.objects.filter(is_active=True).order_by("?")[:1]

        if not scenarios:
            return {
                "target": "placeholder",
                "scenario_id": None,
                "image_url": None,
                "prompt": "Please describe what you see in the image.",
                "ai_hint": "Take your time and describe as much as you can see.",
            }

        scenario = scenarios[0]
        image_url = scenario.image.url if scenario.image else None

        if level <= 1:
            prompt = "Look at this picture. Can you tell me what you see?"
            ai_hint = "Describe the main things \u2014 colors, objects, people, actions."
        elif level == 2:
            prompt = "Tell me a story about what's happening in this picture."
            ai_hint = "What are the people doing? How do they feel?"
        elif level == 3:
            prompt = "Please describe the scene in detail. What is in the foreground and background?"
            ai_hint = "Try to use complete sentences to describe the whole setting."
        elif level == 4:
            prompt = "Observe the image carefully. Describe the actions, the weather, and the small details."
            ai_hint = "Think about the relationship between the objects and people in the scene."
        else:
            prompt = "Perform an expert analysis of this scene. Describe the narrative, the context, and any hidden details."
            ai_hint = "Focus on the 'why' and 'how' of what you see. Use descriptive adjectives."

        return {
            "target": f"scenario_{scenario.id}",
            "scenario_id": scenario.id,
            "image_url": image_url,
            "title": getattr(scenario, "title", ""),
            "prompt": prompt,
            "ai_hint": ai_hint,
            "extra": {"level": level},
        }

    def evaluate(
        self,
        *,
        target: str,
        submit: Dict[str, Any],
        level: int,
        session_id: Optional[int] = None,
        trial=None,
    ) -> Dict[str, Any]:
        """
        Evaluate the child's description using Groq as LLM judge.

        submit = {
          "scenario_id": <id>,
          "child_response": "child's description text"
        }
        """
        scenario_id = submit.get("scenario_id")
        child_response = (submit.get("child_response") or "").strip()

        if not scenario_id or not child_response:
            return {
                "success": False,
                "score": 0,
                "feedback": "Please provide a description.",
                "llm_score": 0,
                "clarity_score": 0,
                "completeness_score": 0,
                "key_elements_found": [],
                "strengths": "",
                "areas_for_improvement": "",
            }

        try:
            scenario = ScenarioImage.objects.get(id=scenario_id)
        except ScenarioImage.DoesNotExist:
            return {
                "success": False,
                "score": 0,
                "feedback": "Scenario not found.",
                "llm_score": 0,
                "clarity_score": 0,
                "completeness_score": 0,
                "key_elements_found": [],
                "strengths": "",
                "areas_for_improvement": "",
            }

        eval_result = evaluate_scene_description(
            child_response=child_response,
            expected_description=getattr(scenario, "expected_description", "") or "",
            key_elements=getattr(scenario, "key_elements", None) or [],
            scenario_title=getattr(scenario, "title", "") or "",
        )

        llm_score = int(eval_result.get("llm_score", 50))
        success = llm_score >= 60

        feedback = eval_result.get("feedback", "")
        if eval_result.get("error"):
            feedback = f"{feedback} [Note: {eval_result['error']}]"

        if trial is not None:
            SceneDescriptionResponse.objects.create(
                trial=trial,
                scenario=scenario,
                child_response=child_response,
                llm_feedback=eval_result.get("feedback", ""),
                llm_score=llm_score,
                key_elements_found=eval_result.get("key_elements_found", []),
                clarity_score=eval_result.get("clarity_score", 0),
                completeness_score=eval_result.get("completeness_score", 0),
            )

        return {
            "success": success,
            "score": llm_score // 10,  # 0-100 -> 0-10
            "feedback": feedback,
            "llm_score": llm_score,
            "clarity_score": eval_result.get("clarity_score", 5),
            "completeness_score": eval_result.get("completeness_score", 5),
            "key_elements_found": eval_result.get("key_elements_found", []),
            "strengths": eval_result.get("strengths", ""),
            "areas_for_improvement": eval_result.get("areas_for_improvement", ""),
        }
