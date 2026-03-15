from __future__ import annotations

import json
import logging
from datetime import date, datetime
from pathlib import Path

logger = logging.getLogger(__name__)


def _parse_date(date_str: str) -> date:
    """Parse ISO8601 date strings that may use year 0900, 0100, etc."""
    try:
        return datetime.strptime(date_str[:10], "%Y-%m-%d").date()
    except ValueError:
        # Fallback: extract year only
        year = int(date_str[:4])
        return date(max(year, 1), 1, 1)


class DataLoader:
    """
    Loads and caches seed and page data from the data directory.
    Re-scans on each instantiation (restart proxy to pick up new files).
    """

    def __init__(self, data_dir: Path) -> None:
        self._data_dir = data_dir
        self._seeds: dict[str, dict] = {}   # normalizedQuery -> seed dict
        self._pages: dict[str, dict] = {}   # slug -> page dict
        self._load_all()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_seed(self, query: str) -> dict | None:
        """Case-insensitive lookup by normalised query."""
        return self._seeds.get(query.strip().lower())

    def get_page(self, slug: str) -> dict | None:
        return self._pages.get(slug.strip().lower())

    @property
    def seed_count(self) -> int:
        return len(self._seeds)

    def get_closest_snapshot(self, seed: dict, selected_date_str: str | None) -> dict:
        """
        Return the snapshot closest to selected_date_str.
        If no date provided, returns currentSnapshot.
        """
        if not selected_date_str:
            return seed["currentSnapshot"]

        target = _parse_date(selected_date_str)
        candidates: list[dict] = list(seed.get("historicalSnapshots", []))
        candidates.append(seed["currentSnapshot"])

        def distance(snapshot: dict) -> int:
            try:
                snap_date = _parse_date(snapshot["date"])
                return abs((snap_date - target).days)
            except Exception:
                return 999_999

        return min(candidates, key=distance)

    # ------------------------------------------------------------------
    # Private loading
    # ------------------------------------------------------------------

    def _load_all(self) -> None:
        seed_dir = self._data_dir / "seed"
        page_dir = self._data_dir / "pages"

        if seed_dir.exists():
            for path in sorted(seed_dir.glob("*.json")):
                self._load_seed(path)
        else:
            logger.warning("Seed directory not found: %s", seed_dir)

        if page_dir.exists():
            for path in sorted(page_dir.glob("*.json")):
                self._load_page(path)
        else:
            logger.warning("Pages directory not found: %s", page_dir)

        logger.info(
            "DataLoader ready: %d seeds, %d pages",
            len(self._seeds),
            len(self._pages),
        )

    def _load_seed(self, path: Path) -> None:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            key = data.get("normalizedQuery", path.stem).lower().strip()
            self._seeds[key] = data
            logger.debug("Loaded seed: %s -> %s", path.name, key)
        except Exception as exc:
            logger.error("Failed to load seed %s: %s", path, exc)

    def _load_page(self, path: Path) -> None:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            key = data.get("slug", path.stem).lower().strip()
            self._pages[key] = data
            logger.debug("Loaded page: %s -> %s", path.name, key)
        except Exception as exc:
            logger.error("Failed to load page %s: %s", path, exc)
