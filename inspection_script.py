import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FYP.settings')
django.setup()

from therapy.models import GameImage, GameSession

print("--- Current Game Images ---")
for gi in GameImage.objects.all():
    print(f"ID: {gi.id}, Name: '{gi.name}', Type: {gi.game_type}")

print("\n--- Recent Game Sessions ---")
for gs in GameSession.objects.all().order_by('-created_at')[:10]:
    print(f"ID: {gs.id}, Game: '{gs.game.name}', Accuracy: {gs.performance_metrics.get('accuracy', 0)}")
