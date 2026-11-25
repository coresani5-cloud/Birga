"""Downloads papkasini kuzatib, yangi Flow kliplarini joriy epizodga ko'chiradi."""
from __future__ import annotations

import fnmatch
import logging
import shutil
import threading
import time
from pathlib import Path

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from .config import Config
from .episode import episode_dir, get_current, next_clip_number

log = logging.getLogger("watcher")


def _wait_stable(path: Path, stable_seconds: float, timeout: float = 600) -> bool:
    """Brauzer faylni yozib bo'lguncha kutadi (hajm o'zgarmay qolguncha)."""
    last, stable_since, start = -1, time.time(), time.time()
    while time.time() - start < timeout:
        if not path.exists():
            return False
        size = path.stat().st_size
        if size != last:
            last, stable_since = size, time.time()
        elif size > 0 and time.time() - stable_since >= stable_seconds:
            try:  # Windows'da fayl hali band bo'lsa ochib bo'lmaydi
                with open(path, "rb"):
                    return True
            except OSError:
                pass
        time.sleep(0.5)
    return False


class _Handler(FileSystemEventHandler):
    def __init__(self, cfg: Config, on_moved=None):
        self.cfg = cfg
        self.patterns = cfg["watcher"]["patterns"]
        self.stable = float(cfg["watcher"].get("stable_seconds", 3))
        self.callback = on_moved
        self._lock = threading.Lock()
        self._seen: set[str] = set()

    def _matches(self, path: Path) -> bool:
        name = path.name.lower()
        if name.endswith((".crdownload", ".part", ".tmp")):
            return False
        return any(fnmatch.fnmatch(name, p.lower()) for p in self.patterns)

    def on_created(self, event):
        if not event.is_directory:
            self._handle(Path(event.src_path))

    def on_moved(self, event):  # Chrome .crdownload -> .mp4 qilib qayta nomlaydi
        if not event.is_directory:
            self._handle(Path(event.dest_path))

    def _handle(self, path: Path):
        if not self._matches(path) or str(path) in self._seen:
            return
        self._seen.add(str(path))
        threading.Thread(target=self._move, args=(path,), daemon=True).start()

    def _move(self, path: Path):
        if not _wait_stable(path, self.stable):
            log.warning("Fayl tayyor bo'lmadi: %s", path)
            return
        current = get_current(self.cfg)
        if not current:
            log.warning("Joriy epizod tanlanmagan, %s ko'chirilmadi. "
                        "'python -m zavod new <nom>' yoki 'use <nom>' bajaring.", path.name)
            return
        with self._lock:
            ep = episode_dir(self.cfg, current)
            n = next_clip_number(ep)
            target = ep / "clips" / f"{n}.mp4"
            shutil.move(str(path), target)
        log.info("✅ %s -> %s/clips/%s", path.name, current, target.name)
        if self.callback:
            try:
                self.callback(current, target)
            except Exception:  # noqa: BLE001
                log.exception("on_moved xatosi")


def start_watcher(cfg: Config, on_moved=None) -> Observer:
    cfg.downloads_dir.mkdir(parents=True, exist_ok=True)
    obs = Observer()
    obs.schedule(_Handler(cfg, on_moved), str(cfg.downloads_dir), recursive=False)
    obs.daemon = True
    obs.start()
    log.info("👀 Kuzatilmoqda: %s", cfg.downloads_dir)
    return obs
