"""
Management command to seed scenario images using REAL photos from media/scenarios/.
Maps each existing photo to a proper ScenarioImage record with rich metadata.

Usage:
    python manage.py seed_real_scenarios
"""
import os
from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand
from therapy.models import ScenarioImage


SCENARIO_DATA = [
    {
        "filename": "birthday_party.jpg",
        "title": "Birthday Party",
        "level": 1,
        "expected": "A birthday party with people celebrating, balloons, cake, and gifts.",
        "elements": ["birthday cake", "candles", "balloons", "gifts", "people", "celebration", "happy"],
    },
    {
        "filename": "city_traffic.jpg",
        "title": "City Traffic",
        "level": 3,
        "expected": "A busy city street with cars, buses, traffic lights, pedestrians, and tall buildings.",
        "elements": ["cars", "buses", "traffic lights", "pedestrians", "buildings", "road", "traffic"],
    },
    {
        "filename": "construction_site.jpg",
        "title": "Construction Site",
        "level": 3,
        "expected": "A construction site with workers, machinery, cranes, building materials, and safety equipment.",
        "elements": ["workers", "crane", "machinery", "bricks", "helmets", "scaffolding", "building"],
    },
    {
        "filename": "doctor_office.jpg",
        "title": "Doctor's Office",
        "level": 2,
        "expected": "A doctor's office with a doctor, a patient, medical equipment, and a clean room.",
        "elements": ["doctor", "patient", "stethoscope", "medical equipment", "chair", "clinic"],
    },
    {
        "filename": "farm_life.jpg",
        "title": "Farm Life",
        "level": 1,
        "expected": "A farm with animals, crops, a barn, and a farmer working in the fields.",
        "elements": ["animals", "crops", "barn", "farmer", "fields", "tractor", "fence"],
    },
    {
        "filename": "sports_day.jpg",
        "title": "Sports Day",
        "level": 2,
        "expected": "A sports day event with children running, playing, and competing in various activities.",
        "elements": ["children", "running", "field", "sports", "competition", "teams", "cheering"],
    },
    {
        "filename": "supermarket.jpg",
        "title": "Supermarket",
        "level": 2,
        "expected": "A busy supermarket with shelves of products, shoppers, carts, and checkout counters.",
        "elements": ["shelves", "products", "shoppers", "cart", "checkout", "food", "shopping"],
    },
    {
        "filename": "zoo_visit.jpg",
        "title": "Zoo Visit",
        "level": 1,
        "expected": "A zoo with various animals in enclosures, visitors looking at them, and signage.",
        "elements": ["animals", "enclosures", "visitors", "children", "zoo", "signs", "path"],
    },
]


class Command(BaseCommand):
    help = "Seed real scenario images from media/scenarios/ folder"

    def handle(self, *args, **options):
        scenarios_dir = os.path.join(settings.MEDIA_ROOT, "scenarios")

        if not os.path.isdir(scenarios_dir):
            self.stdout.write(self.style.ERROR(f"Scenarios directory not found: {scenarios_dir}"))
            return

        created = 0
        skipped = 0

        for data in SCENARIO_DATA:
            filepath = os.path.join(scenarios_dir, data["filename"])
            if not os.path.exists(filepath):
                self.stdout.write(self.style.WARNING(f"  WARN: File not found: {data['filename']} - skipping"))
                skipped += 1
                continue

            if ScenarioImage.objects.filter(title=data["title"]).exists():
                self.stdout.write(f"  -- {data['title']} (already exists)")
                skipped += 1
                continue

            with open(filepath, "rb") as f:
                scenario = ScenarioImage(
                    title=data["title"],
                    level=data["level"],
                    expected_description=data["expected"],
                    key_elements=data["elements"],
                    is_active=True,
                )
                scenario.image.save(data["filename"], File(f), save=True)

            self.stdout.write(self.style.SUCCESS(
                f"  OK: {scenario.title} (Level {scenario.level}) - ID {scenario.id}"
            ))
            created += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nDone: {created} created, {skipped} skipped."
        ))
