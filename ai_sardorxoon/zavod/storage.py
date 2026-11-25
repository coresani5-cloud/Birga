"""Videoni Cloudflare R2'ga vaqtincha yuklab, Instagram o'qiy oladigan URL berish."""
from __future__ import annotations

import logging
import time
from pathlib import Path

import boto3
from botocore.config import Config as BotoConfig

from .config import Config

log = logging.getLogger("storage")


def _client(cfg: Config):
    acc = cfg.env("R2_ACCOUNT_ID")
    return boto3.client(
        "s3",
        endpoint_url=f"https://{acc}.r2.cloudflarestorage.com",
        aws_access_key_id=cfg.env("R2_ACCESS_KEY_ID"),
        aws_secret_access_key=cfg.env("R2_SECRET_ACCESS_KEY"),
        region_name="auto",
        config=BotoConfig(signature_version="s3v4"),
    )


def upload_public(cfg: Config, path: Path, prefix: str = "reels") -> tuple[str, str]:
    """(url, key) qaytaradi."""
    bucket = cfg.env("R2_BUCKET")
    key = f"{prefix}/{int(time.time())}_{path.name}"
    s3 = _client(cfg)
    ctype = "video/mp4" if path.suffix == ".mp4" else "image/jpeg"
    s3.upload_file(str(path), bucket, key, ExtraArgs={"ContentType": ctype})
    base = cfg.env("R2_PUBLIC_BASE_URL", required=False).rstrip("/")
    if base:
        url = f"{base}/{key}"
    else:
        url = s3.generate_presigned_url(
            "get_object", Params={"Bucket": bucket, "Key": key},
            ExpiresIn=int(cfg["storage"].get("presigned_url_seconds", 3600)))
    log.info("☁️  Yuklandi: %s", key)
    return url, key


def delete(cfg: Config, key: str) -> None:
    try:
        _client(cfg).delete_object(Bucket=cfg.env("R2_BUCKET"), Key=key)
    except Exception:  # noqa: BLE001
        log.exception("R2'dan o'chirib bo'lmadi: %s", key)
