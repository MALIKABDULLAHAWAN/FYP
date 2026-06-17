"""
Management command: fix_game_session_types
Retroactively fixes GameSession records that were saved with incorrect game_type
because the old code defaulted everything to 'matching'.

Run once:
  python manage.py fix_game_session_types
"""
from django.core.management.base import BaseCommand
from therapy.models import GameSession, GameImage


GAME_NAME_TO_TYPE = {
    "bubble pop": "matching",
    "bubble_pop": "matching",
    "color match": "matching",
    "color_match": "matching",
    "shape sort": "problem_solving",
    "shape_sort": "problem_solving",
    "emotion face": "object_discovery",
    "emotion_face": "object_discovery",
    "emotion match": "object_discovery",
    "emotion_match": "object_discovery",
    "animal sounds": "speech_prompt",
    "animal_sounds": "speech_prompt",
    "animal sound": "speech_prompt",
    "memory match": "memory_match",
    "memory_match": "memory_match",
    "object discovery": "object_discovery",
    "problem solving": "problem_solving",
    "speech therapy": "speech_prompt",
    "story adventure": "speech_prompt",
}


class Command(BaseCommand):
    help = "Fix standalone GameSession records that were saved with wrong game_type."

    def handle(self, *args, **options):
        fixed = 0
        for gs in GameSession.objects.select_related("game").all():
            if not gs.game:
                continue
            name = gs.game.name.lower().strip()
            correct_type = GAME_NAME_TO_TYPE.get(name)
            if correct_type and gs.game.game_type != correct_type:
                self.stdout.write(
                    f"  Fixing GameSession #{gs.id}: '{gs.game.name}' "
                    f"[{gs.game.game_type}] → [{correct_type}]"
                )
                gs.game.game_type = correct_type
                gs.game.save()
                fixed += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Fixed {fixed} game session(s) with wrong game_type."
        ))
