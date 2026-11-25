"""Epizod papkalari: yaratish, joriy epizodni tanlash, script.json o'qish."""
from __future__ import annotations

import json
import re
from pathlib import Path

from .config import Config

SCRIPT_TEMPLATE = {
    "title": "",
    "clips": [
        {
            "file": "1.mp4",
            "lines": [
                {"speaker": "Sobir aka", "text": "Salom!", "start": 0.5, "end": 2.5}
            ],
        }
    ],
}

CAPTION_TEMPLATE = (
    "Sobir aka yana qiziq vaziyatda 😂\n"
    "Davomi kerakmi? Izohda yozing 👇\n\n"
    "#suvarak #ozbekcha #multfilm #ai #prikol #uzbekistan #reels\n"
)


def safe_name(name: str) -> str:
    name = name.strip().replace(" ", "_")
    name = re.sub(r"[^\w\-]", "", name, flags=re.UNICODE)
    if not name:
        raise ValueError("Epizod nomi bo'sh bo'lmasligi kerak")
    return name


def episode_dir(cfg: Config, name: str) -> Path:
    return cfg.episodes_dir / safe_name(name)


def create_episode(cfg: Config, name: str) -> Path:
    d = episode_dir(cfg, name)
    (d / "clips").mkdir(parents=True, exist_ok=True)
    script = d / "script.json"
    if not script.exists():
        tpl = dict(SCRIPT_TEMPLATE, title=name)
        script.write_text(json.dumps(tpl, ensure_ascii=False, indent=2), encoding="utf-8")
    cap = d / "caption.txt"
    if not cap.exists():
        cap.write_text(CAPTION_TEMPLATE, encoding="utf-8")
    set_current(cfg, d.name)
    return d


def _state_file(cfg: Config) -> Path:
    return cfg.data_dir / "current_episode.txt"


def set_current(cfg: Config, name: str) -> None:
    d = episode_dir(cfg, name)
    if not d.exists():
        raise FileNotFoundError(f"Epizod topilmadi: {d}")
    _state_file(cfg).write_text(d.name, encoding="utf-8")


def get_current(cfg: Config) -> str | None:
    f = _state_file(cfg)
    if f.exists():
        name = f.read_text(encoding="utf-8").strip()
        if name and episode_dir(cfg, name).exists():
            return name
    return None


def list_episodes(cfg: Config) -> list[str]:
    return sorted(p.name for p in cfg.episodes_dir.iterdir() if p.is_dir())


def load_script(ep_dir: Path) -> dict:
    with open(ep_dir / "script.json", encoding="utf-8") as fh:
        return json.load(fh)


def load_caption(ep_dir: Path) -> str:
    f = ep_dir / "caption.txt"
    return f.read_text(encoding="utf-8").strip() if f.exists() else ""


def next_clip_number(ep_dir: Path) -> int:
    nums = [int(p.stem) for p in (ep_dir / "clips").glob("*.mp4") if p.stem.isdigit()]
    return max(nums, default=0) + 1
