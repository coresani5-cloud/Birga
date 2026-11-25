"""SQLite: yuborilgan postlar va rejalashtirilgan navbat."""
from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from .config import Config

SCHEMA = """
CREATE TABLE IF NOT EXISTS posts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    episode      TEXT NOT NULL,
    video        TEXT NOT NULL,
    cover        TEXT,
    caption      TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending',  -- pending|scheduled|publishing|published|cancelled|failed
    scheduled_at TEXT,                              -- UTC ISO
    permalink    TEXT,
    error        TEXT,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
);
"""


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


class DB:
    def __init__(self, cfg: Config):
        self.path: Path = cfg.data_dir / "zavod.sqlite3"
        with self._conn() as c:
            c.executescript(SCHEMA)

    def _conn(self):
        c = sqlite3.connect(self.path, timeout=30)
        c.row_factory = sqlite3.Row
        return c

    def add(self, episode: str, video: Path, cover: Path | None, caption: str) -> int:
        with self._conn() as c:
            cur = c.execute(
                "INSERT INTO posts(episode,video,cover,caption,created_at,updated_at) "
                "VALUES(?,?,?,?,?,?)",
                (episode, str(video), str(cover) if cover else None, caption, _now(), _now()))
            return cur.lastrowid

    def get(self, pid: int):
        with self._conn() as c:
            return c.execute("SELECT * FROM posts WHERE id=?", (pid,)).fetchone()

    def update(self, pid: int, **fields) -> None:
        fields["updated_at"] = _now()
        cols = ",".join(f"{k}=?" for k in fields)
        with self._conn() as c:
            c.execute(f"UPDATE posts SET {cols} WHERE id=?", (*fields.values(), pid))

    def claim(self, pid: int, from_status: tuple[str, ...]) -> bool:
        """Postni 'publishing' holatiga atomar o'tkazadi (ikki marta joylanmasin)."""
        q = ",".join("?" * len(from_status))
        with self._conn() as c:
            cur = c.execute(
                f"UPDATE posts SET status='publishing', updated_at=? WHERE id=? AND status IN ({q})",
                (_now(), pid, *from_status))
            return cur.rowcount == 1

    def due(self) -> list:
        with self._conn() as c:
            return c.execute(
                "SELECT * FROM posts WHERE status='scheduled' AND scheduled_at<=? ORDER BY scheduled_at",
                (_now(),)).fetchall()

    def scheduled(self) -> list:
        with self._conn() as c:
            return c.execute(
                "SELECT * FROM posts WHERE status='scheduled' ORDER BY scheduled_at").fetchall()
