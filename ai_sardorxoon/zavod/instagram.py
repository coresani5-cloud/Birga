"""Instagram Graph API (Instagram Login) orqali Reels joylash."""
from __future__ import annotations

import logging
import time
from pathlib import Path

import requests

from .config import Config, set_env_value
from . import storage

log = logging.getLogger("instagram")


class InstagramError(RuntimeError):
    pass


def _check(r: requests.Response) -> dict:
    try:
        data = r.json()
    except ValueError:
        raise InstagramError(f"HTTP {r.status_code}: {r.text[:300]}")
    if r.status_code != 200 or "error" in data:
        err = data.get("error", {})
        raise InstagramError(f"{err.get('message', data)} (kod {err.get('code')})")
    return data


def full_caption(cfg: Config, caption: str) -> str:
    tag = (cfg["instagram"].get("ai_disclosure_text") or "").strip()
    if tag and tag not in caption:
        caption = f"{caption}\n\n{tag}"
    return caption[:2200]  # Instagram cheklovi


def publish_reel(cfg: Config, video: Path, caption: str, cover: Path | None = None,
                 progress=None) -> str:
    """Reels joylaydi va post havolasini (permalink) qaytaradi."""
    ig = cfg["instagram"]
    base = ig["api_base"].rstrip("/")
    token = cfg.env("INSTAGRAM_ACCESS_TOKEN")
    user_id = cfg.env("INSTAGRAM_USER_ID")
    say = progress or (lambda m: log.info(m))

    say("☁️ Video vaqtinchalik serverga yuklanmoqda…")
    video_url, video_key = storage.upload_public(cfg, video)
    keys = [video_key]
    cover_url = None
    if cover and cover.exists():
        cover_url, ck = storage.upload_public(cfg, cover)
        keys.append(ck)
    try:
        params = {
            "media_type": "REELS",
            "video_url": video_url,
            "caption": full_caption(cfg, caption),
            "share_to_feed": "true" if ig.get("share_to_feed", True) else "false",
            "access_token": token,
        }
        if cover_url:
            params["cover_url"] = cover_url
        say("📦 Instagram konteyner yaratilmoqda…")
        cid = _check(requests.post(f"{base}/{user_id}/media", data=params, timeout=60))["id"]

        say("⏳ Instagram videoni qayta ishlamoqda…")
        deadline = time.time() + int(ig.get("publish_timeout_seconds", 600))
        while True:
            st = _check(requests.get(f"{base}/{cid}", params={
                "fields": "status_code,status", "access_token": token}, timeout=30))
            code = st.get("status_code")
            if code == "FINISHED":
                break
            if code in ("ERROR", "EXPIRED"):
                raise InstagramError(f"Konteyner holati {code}: {st.get('status')}")
            if time.time() > deadline:
                raise InstagramError("Instagram videoni o'z vaqtida qayta ishlamadi")
            time.sleep(8)

        say("🚀 Joylanmoqda…")
        mid = _check(requests.post(f"{base}/{user_id}/media_publish", data={
            "creation_id": cid, "access_token": token}, timeout=60))["id"]
        info = _check(requests.get(f"{base}/{mid}", params={
            "fields": "permalink", "access_token": token}, timeout=30))
        return info.get("permalink") or f"media_id={mid}"
    finally:
        if cfg["storage"].get("delete_after_publish", True):
            for k in keys:
                storage.delete(cfg, k)


def refresh_token(cfg: Config) -> int:
    """60 kunlik tokenni yangilaydi va .env ga yozadi. Necha kun amal qilishini qaytaradi."""
    token = cfg.env("INSTAGRAM_ACCESS_TOKEN")
    data = _check(requests.get("https://graph.instagram.com/refresh_access_token", params={
        "grant_type": "ig_refresh_token", "access_token": token}, timeout=30))
    set_env_value("INSTAGRAM_ACCESS_TOKEN", data["access_token"])
    return int(data.get("expires_in", 0)) // 86400


def whoami(cfg: Config) -> dict:
    base = cfg["instagram"]["api_base"].rstrip("/")
    return _check(requests.get(f"{base}/me", params={
        "fields": "user_id,username,account_type",
        "access_token": cfg.env("INSTAGRAM_ACCESS_TOKEN")}, timeout=30))
