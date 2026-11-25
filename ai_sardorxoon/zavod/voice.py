"""ElevenLabs orqali o'zbekcha ovoz yaratish (ixtiyoriy)."""
from __future__ import annotations

import hashlib
import logging
from pathlib import Path

import requests

from .config import Config

log = logging.getLogger("voice")
API = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"


def voice_for(cfg: Config, speaker: str) -> str:
    vc = cfg["voice"]
    vid = (vc.get("voices") or {}).get(speaker) or vc.get("default_voice_id") or ""
    if not vid:
        raise RuntimeError(
            f"'{speaker}' uchun voice_id config.yaml'da (voice.voices) ko'rsatilmagan")
    return vid


def synthesize(cfg: Config, text: str, speaker: str, out_dir: Path) -> Path:
    """Bitta satr uchun mp3 yaratadi. Bir xil matn qayta pul sarflamaydi (kesh)."""
    voice_id = voice_for(cfg, speaker)
    model = cfg["voice"].get("model_id", "eleven_v3")
    key = hashlib.sha1(f"{voice_id}|{model}|{text}".encode()).hexdigest()[:16]
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{key}.mp3"
    if out.exists() and out.stat().st_size > 0:
        return out
    api_key = cfg.env("ELEVENLABS_API_KEY")
    r = requests.post(
        API.format(voice_id=voice_id),
        params={"output_format": "mp3_44100_128"},
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        json={"text": text, "model_id": model},
        timeout=120,
    )
    if r.status_code != 200:
        raise RuntimeError(f"ElevenLabs xatosi {r.status_code}: {r.text[:300]}")
    out.write_bytes(r.content)
    log.info("🎙  %s: %s", speaker, text[:40])
    return out
