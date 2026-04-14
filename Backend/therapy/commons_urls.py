"""Build Wikimedia Commons thumbnail URLs from a filename (for optional real-photo seeding)."""
from __future__ import annotations

import hashlib
from urllib.parse import quote


def wikimedia_thumb_url(commons_file: str, width: int = 512) -> str:
    """
    Direct thumbnail URL (see https://commons.wikimedia.org/wiki/Commons:FAQ#What_are_the_hash_letters_for_the_file_path?).
    """
    fn = commons_file.replace(" ", "_")
    d = hashlib.md5(fn.encode("utf-8")).hexdigest()
    enc = quote(fn, safe="()")
    return (
        f"https://upload.wikimedia.org/wikipedia/commons/thumb/{d[0]}/{d[0:2]}/"
        f"{enc}/{width}px-{enc}"
    )
