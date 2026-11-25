"""Sozlamalarni (config.yaml) va maxfiy kalitlarni (.env) yuklash."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

import yaml
from dotenv import load_dotenv

PROJECT_DIR = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_DIR / ".env"


def _expand(p: str) -> Path:
    # Windows'dagi %USERPROFILE% ni Linux/Mac'da ham ishlatish uchun
    if "%USERPROFILE%" in p and "USERPROFILE" not in os.environ:
        p = p.replace("%USERPROFILE%", str(Path.home()))
    p = os.path.expandvars(os.path.expanduser(p))
    p = p.replace("\\", os.sep) if os.sep == "/" else p
    return Path(p)


@dataclass
class Config:
    raw: dict

    def __getitem__(self, key):
        return self.raw[key]

    # --- yo'llar ---
    @property
    def base_dir(self) -> Path:
        return _expand(self.raw["paths"]["base_dir"])

    @property
    def episodes_dir(self) -> Path:
        return self.base_dir / "episodes"

    @property
    def data_dir(self) -> Path:
        return self.base_dir / "data"

    @property
    def downloads_dir(self) -> Path:
        return _expand(self.raw["paths"]["downloads_dir"])

    @property
    def ffmpeg(self) -> str:
        return self.raw["paths"].get("ffmpeg", "ffmpeg")

    @property
    def ffprobe(self) -> str:
        return self.raw["paths"].get("ffprobe", "ffprobe")

    def font_path(self) -> Path:
        f = Path(self.raw["subtitles"]["font"])
        if not f.is_absolute():
            f = PROJECT_DIR / f
        if f.exists():
            return f
        for alt in (r"C:\Windows\Fonts\arialbd.ttf",
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"):
            if Path(alt).exists():
                return Path(alt)
        raise FileNotFoundError(f"Shrift topilmadi: {f}")

    @staticmethod
    def env(name: str, required: bool = True) -> str:
        val = os.environ.get(name, "").strip()
        if required and not val:
            raise RuntimeError(
                f"{name} .env faylida ko'rsatilmagan. .env.example'ga qarang.")
        return val


def load_config(path: Path | None = None) -> Config:
    load_dotenv(ENV_PATH)
    path = path or PROJECT_DIR / "config.yaml"
    with open(path, encoding="utf-8") as fh:
        raw = yaml.safe_load(fh)
    cfg = Config(raw)
    cfg.episodes_dir.mkdir(parents=True, exist_ok=True)
    cfg.data_dir.mkdir(parents=True, exist_ok=True)
    return cfg


def set_env_value(name: str, value: str) -> None:
    """.env ichidagi bitta qatorni yangilaydi (token yangilash uchun)."""
    lines = ENV_PATH.read_text(encoding="utf-8").splitlines() if ENV_PATH.exists() else []
    out, found = [], False
    for line in lines:
        if line.split("=", 1)[0].strip() == name:
            out.append(f"{name}={value}")
            found = True
        else:
            out.append(line)
    if not found:
        out.append(f"{name}={value}")
    ENV_PATH.write_text("\n".join(out) + "\n", encoding="utf-8")
    os.environ[name] = value
