"""
Static dataset metadata for therapy game images.

`data/labeled_game_images.json` is the source of truth for labels, licenses,
and canonical image URLs used during seeding. At runtime, serializers and
game plugins merge this file with database records (matched by name/title).
"""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

_DATA_PATH = Path(__file__).resolve().parent / "data" / "labeled_game_images.json"


def stable_fallback_image_url(name: str, w: int = 320, h: int = 320, tags: list = None) -> str:
    """Deterministic placeholder photo URL when no media file is seeded (Lorem Flickr with tags)."""
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", (name or "item").lower()).strip("-")[:48] or "item"
    # Use provided tags for better accuracy, fallback to name
    if tags and len(tags) > 0:
        # Join all tags with comma for better search
        tag_str = ",".join(tags[:3])  # Use up to 3 tags
    else:
        tag_str = slug
    # Use Lorem Flickr with multiple tags and a lock for consistency
    lock = hash(name) % 10000
    return f"https://loremflickr.com/{w}/{h}/{tag_str}?lock={lock}"


def wikimedia_commons_url(filename: str, width: int = 320) -> str:
    """Build Wikimedia Commons thumbnail URL from filename."""
    # Replace spaces with underscores and encode
    safe_name = filename.replace(" ", "_")
    # Wikimedia Commons thumb URL format
    return f"https://commons.wikimedia.org/wiki/Special:FilePath/{safe_name}?width={width}"


@lru_cache(maxsize=1)
def load_dataset() -> dict:
    if not _DATA_PATH.exists():
        return {}
    with open(_DATA_PATH, encoding="utf-8") as f:
        return json.load(f)


def get_game_item_metadata(game_key: str, name: str) -> dict:
    """Return merged metadata for a GameImage row (match by `name` or `title`)."""
    data = load_dataset()
    for item in data.get(game_key, []):
        key = item.get("name") or item.get("title")
        if key == name:
            meta = dict(item.get("metadata") or {})
            if item.get("label"):
                meta.setdefault("label", item["label"])
            if item.get("image_url"):
                meta.setdefault("source_image_url", item["image_url"])
            if item.get("loremflickr_tags"):
                meta.setdefault("loremflickr_tags", item["loremflickr_tags"])
            # Priority: 1) Wikimedia Commons, 2) Lorem Flickr with tags, 3) JSON fallback_url
            if item.get("commons_file"):
                meta["fallback_image_url"] = wikimedia_commons_url(item["commons_file"])
            elif item.get("loremflickr_tags"):
                meta["fallback_image_url"] = stable_fallback_image_url(
                    item.get("label") or name,
                    tags=item.get("loremflickr_tags")
                )
            elif item.get("fallback_image_url"):
                meta["fallback_image_url"] = item["fallback_image_url"]
            else:
                meta.setdefault("fallback_image_url", stable_fallback_image_url(
                    item.get("label") or name,
                    tags=item.get("loremflickr_tags")
                ))
            return meta
    return {
        "fallback_image_url": stable_fallback_image_url(name),
        "label": re.sub(r"[^a-zA-Z0-9]+", "-", (name or "item").lower()).strip("-") or "item",
    }


def get_scenario_metadata(title: str) -> dict:
    for item in load_dataset().get("scene_description", []):
        if item.get("title") == title:
            meta = dict(item.get("metadata") or {})
            if item.get("label"):
                meta.setdefault("label", item["label"])
            if item.get("image_url"):
                meta.setdefault("source_image_url", item["image_url"])
            if item.get("loremflickr_tags"):
                meta.setdefault("loremflickr_tags", item["loremflickr_tags"])
            if item.get("fallback_image_url"):
                meta["fallback_image_url"] = item["fallback_image_url"]
            else:
                meta.setdefault("fallback_image_url", stable_fallback_image_url(item.get("label") or title))
            return meta
    return {"fallback_image_url": stable_fallback_image_url(title)}


def get_problem_solving_metadata(title: str) -> dict:
    for item in load_dataset().get("problem_solving", []):
        if item.get("title") == title:
            meta = dict(item.get("metadata") or {})
            if item.get("label"):
                meta.setdefault("label", item["label"])
            if item.get("image_url"):
                meta.setdefault("source_image_url", item["image_url"])
            if item.get("loremflickr_tags"):
                meta.setdefault("loremflickr_tags", item["loremflickr_tags"])
            if item.get("fallback_image_url"):
                meta["fallback_image_url"] = item["fallback_image_url"]
            else:
                meta.setdefault("fallback_image_url", stable_fallback_image_url(item.get("label") or title))
            return meta
    return {"fallback_image_url": stable_fallback_image_url(title)}
