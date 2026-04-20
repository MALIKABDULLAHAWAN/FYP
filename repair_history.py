import os
import django

import sys

# Ensure the Backend directory is in path
sys.path.append(os.path.join(os.path.dirname(__file__), 'Backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from therapy.models import GameImage, GameSession

def repair():
    print("Starting Clinical History Repair...")
    
    all_images = GameImage.objects.all()
    print(f"Total GameImages found: {all_images.count()}")
    
    images_renamed = 0
    sessions_fixed = 0

    # Broad categories to fix
    fixes = {
        "emotion_gesture": "Emotion & Gesture Quest",
        "matching": "Bubble Pop",
        "speech_prompt": "Animal Sounds",
    }
    
    for img in all_images:
        norm_name = img.name.lower().strip()
        print(f"Checking image: '{img.name}' (normalized: '{norm_name}')")
        
        for key, new_name in fixes.items():
            if norm_name == key or norm_name == key.replace('_', ' '):
                print(f"  -> Matching '{key}'. Renaming to '{new_name}'")
                img.name = new_name
                img.save()
                images_renamed += 1
                break

    print(f"Repair complete. Images renamed: {images_renamed}, Sessions updated: {sessions_fixed}")

if __name__ == "__main__":
    repair()
