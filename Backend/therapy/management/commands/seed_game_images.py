"""
Seed game images from therapy/data/labeled_game_images.json (labels + metadata).

Default: downloads real stock photos from LoremFlickr using curated tags (avoids
Wikimedia hotlink rate limits). Use --prefer-wikimedia to try Commons thumbnails
first when commons_file is set on an item.

Usage:
    python manage.py seed_game_images
    python manage.py seed_game_images --category memory_match
    python manage.py seed_game_images --clear
    python manage.py seed_game_images --prefer-wikimedia
"""
from __future__ import annotations

import json
import time
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import quote

import requests
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandParser
from PIL import Image, ImageDraw, ImageFont

from therapy.commons_urls import wikimedia_thumb_url
from therapy.models import GameImage, ScenarioImage


DATA_PATH = Path(__file__).resolve().parents[2] / "data" / "labeled_game_images.json"


def load_dataset() -> Dict[str, Any]:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Missing dataset file: {DATA_PATH}")
    with open(DATA_PATH, encoding="utf-8") as f:
        return json.load(f)


class Command(BaseCommand):
    help = "Seed labeled game images from JSON dataset (real photos via LoremFlickr or Wikimedia)"

    def add_arguments(self, parser: CommandParser):
        parser.add_argument(
            "--category",
            type=str,
            choices=["memory_match", "object_discovery", "scene_description", "problem_solving"],
            help="Only seed one category",
        )
        parser.add_argument("--clear", action="store_true", help="Delete all GameImage and ScenarioImage rows first")
        parser.add_argument(
            "--prefer-wikimedia",
            action="store_true",
            help="Try Wikimedia Commons thumbnails before LoremFlickr (when commons_file is set)",
        )
        parser.add_argument(
            "--delay",
            type=float,
            default=1.0,
            help="Seconds to wait between network downloads (default 1.0)",
        )

    def create_placeholder_image(
        self,
        name: str,
        color: Tuple[int, int, int],
        size: Tuple[int, int] = (400, 300),
    ) -> ContentFile:
        img = Image.new("RGB", size, color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        for y in range(size[1]):
            ratio = y / size[1]
            r = int(color[0] * (1 - ratio * 0.3))
            g = int(color[1] * (1 - ratio * 0.3))
            b = int(color[2] * (1 - ratio * 0.3))
            draw.line([(0, y), (size[0], y)], fill=(r, g, b))
        try:
            font = ImageFont.truetype("arial.ttf", 32)
        except OSError:
            font = ImageFont.load_default()
        text = name
        bbox = draw.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        x = (size[0] - tw) // 2
        y = size[1] - 60
        draw.text((x + 2, y + 2), text, fill=(40, 40, 40), font=font)
        draw.text((x, y), text, fill=(255, 255, 255), font=font)
        buf = BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        safe = name.lower().replace(" ", "_").replace("'", "")
        return ContentFile(buf.getvalue(), name=f"{safe}.png")

    def download_bytes(self, url: str, timeout: int = 25) -> Optional[bytes]:
        try:
            r = requests.get(
                url,
                timeout=timeout,
                headers={
                    "User-Agent": "DHYAN-FYP/1.0 (therapy game seeder; educational use)",
                    "Accept": "image/webp,image/apng,image/jpeg,image/png,image/*,*/*;q=0.8",
                },
            )
            if r.status_code != 200:
                return None
            return r.content
        except requests.RequestException:
            return None

    def bytes_to_content_file(self, data: bytes, base_name: str) -> Optional[ContentFile]:
        try:
            img = Image.open(BytesIO(data))
            img.load()
            fmt = (img.format or "PNG").upper()
            ext = "jpg" if fmt in ("JPEG", "JPG") else "png"
            return ContentFile(data, name=f"{base_name}.{ext}")
        except Exception:
            return None

    def loremflickr_url(self, tags: List[str], size: Tuple[int, int]) -> str:
        w, h = size
        tag_part = ",".join(quote(t.strip(), safe="") for t in tags if t.strip())
        return f"https://loremflickr.com/{w}/{h}/{tag_part}"

    def fetch_labeled_image(
        self,
        item: Dict[str, Any],
        size: Tuple[int, int],
        *,
        prefer_wikimedia: bool,
        delay: float,
    ) -> Tuple[Optional[ContentFile], str]:
        """
        Returns (ContentFile or None, source_note for logging).
        """
        base_name = (item.get("name") or item.get("title") or "image").lower().replace(" ", "_")
        tags: List[str] = list(item.get("loremflickr_tags") or [])
        commons_file = item.get("commons_file")

        urls: List[Tuple[str, str]] = []
        if prefer_wikimedia and commons_file:
            urls.append((wikimedia_thumb_url(commons_file, width=min(512, max(size))), "wikimedia_thumb"))
        if tags:
            urls.append((self.loremflickr_url(tags, size), "loremflickr"))

        for url, src in urls:
            self.stdout.write(f"  Fetching ({src}) …")
            data = self.download_bytes(url)
            if delay:
                time.sleep(delay)
            if not data:
                self.stdout.write(self.style.WARNING(f"    failed: {src}"))
                continue
            cf = self.bytes_to_content_file(data, base_name)
            if cf:
                return cf, src
        return None, "none"

    def seed_memory_match(self, data: Dict[str, Any], **kwargs) -> int:
        self.stdout.write("\nSeeding Memory Match…")
        created = 0
        for item in data.get("memory_match", []):
            if GameImage.objects.filter(name=item["name"], game_type="memory_match").exists():
                self.stdout.write(f"  SKIP {item['name']}")
                continue
            image_content, src = self.fetch_labeled_image(item, (300, 300), **kwargs)
            if not image_content:
                self.stdout.write(self.style.WARNING(f"  PLACEHOLDER {item['name']}"))
                image_content = self.create_placeholder_image(item["name"], tuple(item["color"]), (300, 300))
                src = "placeholder"
            tag_list = [
                item["category"],
                "memory_match",
                "matching",
                item.get("label", item["name"]),
                f"source:{src}",
            ]
            GameImage.objects.create(
                name=item["name"],
                game_type="memory_match",
                category=item["category"],
                image=image_content,
                emoji=item.get("emoji", ""),
                difficulty=1,
                tags=tag_list,
            )
            self.stdout.write(self.style.SUCCESS(f"  OK {item['name']} ({src})"))
            created += 1
        return created

    def seed_object_discovery(self, data: Dict[str, Any], **kwargs) -> int:
        self.stdout.write("\nSeeding Object Discovery…")
        created = 0
        for item in data.get("object_discovery", []):
            if GameImage.objects.filter(name=item["name"], game_type="object_discovery").exists():
                self.stdout.write(f"  SKIP {item['name']}")
                continue
            image_content, src = self.fetch_labeled_image(item, (400, 400), **kwargs)
            if not image_content:
                self.stdout.write(self.style.WARNING(f"  PLACEHOLDER {item['name']}"))
                image_content = self.create_placeholder_image(item["name"], tuple(item["color"]), (400, 400))
                src = "placeholder"
            tag_list = [
                item["category"],
                "object_discovery",
                "identification",
                item.get("label", item["name"]),
                f"source:{src}",
            ]
            GameImage.objects.create(
                name=item["name"],
                game_type="object_discovery",
                category=item["category"],
                image=image_content,
                emoji=item.get("emoji", ""),
                difficulty=1,
                tags=tag_list,
            )
            self.stdout.write(self.style.SUCCESS(f"  OK {item['name']} ({src})"))
            created += 1
        return created

    def seed_scene_description(self, data: Dict[str, Any], **kwargs) -> int:
        self.stdout.write("\nSeeding Scene Description…")
        created = 0
        for item in data.get("scene_description", []):
            if ScenarioImage.objects.filter(title=item["title"]).exists():
                self.stdout.write(f"  SKIP {item['title']}")
                continue
            image_content, src = self.fetch_labeled_image(item, (600, 450), **kwargs)
            if not image_content:
                self.stdout.write(self.style.WARNING(f"  PLACEHOLDER {item['title']}"))
                image_content = self.create_placeholder_image(item["title"], tuple(item["color"]), (600, 450))
                src = "placeholder"
            ScenarioImage.objects.create(
                title=item["title"],
                level=item["level"],
                expected_description=item["expected"],
                key_elements=item["elements"],
                image=image_content,
            )
            self.stdout.write(self.style.SUCCESS(f"  OK {item['title']} ({src})"))
            created += 1
        return created

    def seed_problem_solving(self, data: Dict[str, Any], **kwargs) -> int:
        self.stdout.write("\nSeeding Problem Solving…")
        created = 0
        for item in data.get("problem_solving", []):
            if GameImage.objects.filter(name=item["title"], game_type="problem_solving").exists():
                self.stdout.write(f"  SKIP {item['title']}")
                continue
            image_content, src = self.fetch_labeled_image(item, (500, 350), **kwargs)
            if not image_content:
                self.stdout.write(self.style.WARNING(f"  PLACEHOLDER {item['title']}"))
                image_content = self.create_placeholder_image(item["title"], tuple(item["color"]), (500, 350))
                src = "placeholder"
            tag_list = list(item.get("tags") or []) + [
                item.get("label", item["title"]),
                "problem_solving",
                f"source:{src}",
            ]
            GameImage.objects.create(
                name=item["title"],
                game_type="problem_solving",
                category="scenario",
                image=image_content,
                difficulty=item["level"],
                question=item["question"],
                correct_answer=item["answer"],
                options=item["options"],
                hint=item["hint"],
                tags=tag_list,
            )
            self.stdout.write(self.style.SUCCESS(f"  OK {item['title']} ({src})"))
            created += 1
        return created

    def handle(self, *args, **options):
        category = options.get("category")
        clear = options.get("clear")
        prefer = options.get("prefer_wikimedia")
        delay = float(options.get("delay") or 1.0)

        self.stdout.write("=" * 60)
        self.stdout.write("DHYAN labeled image dataset seeder")
        self.stdout.write(f"Data file: {DATA_PATH}")
        self.stdout.write("=" * 60)

        data = load_dataset()
        self.stdout.write(f"Dataset version: {data.get('version', '?')}")

        fetch_kw = {"prefer_wikimedia": prefer, "delay": delay}

        if clear:
            n = GameImage.objects.count() + ScenarioImage.objects.count()
            GameImage.objects.all().delete()
            ScenarioImage.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(f"Cleared {n} rows"))

        total = 0
        if category == "memory_match":
            total += self.seed_memory_match(data, **fetch_kw)
        elif category == "object_discovery":
            total += self.seed_object_discovery(data, **fetch_kw)
        elif category == "scene_description":
            total += self.seed_scene_description(data, **fetch_kw)
        elif category == "problem_solving":
            total += self.seed_problem_solving(data, **fetch_kw)
        else:
            total += self.seed_memory_match(data, **fetch_kw)
            total += self.seed_object_discovery(data, **fetch_kw)
            total += self.seed_scene_description(data, **fetch_kw)
            total += self.seed_problem_solving(data, **fetch_kw)

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS(f"Done. Created or attempted {total} new items (see log above)."))
        self.stdout.write("=" * 60)
        for gt in ["memory_match", "object_discovery", "problem_solving"]:
            self.stdout.write(f"  {gt}: {GameImage.objects.filter(game_type=gt).count()}")
        self.stdout.write(f"  scene_description (ScenarioImage): {ScenarioImage.objects.count()}")
