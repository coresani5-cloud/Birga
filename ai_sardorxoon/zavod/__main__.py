"""Buyruqlar:  python -m zavod <buyruq>

  new <nom>         yangi epizod papkasi + joriy qilish
  use <nom>         joriy epizodni tanlash
  list              epizodlar ro'yxati
  watch             faqat Downloads kuzatuvchi
  build [nom] [--send]   montaj (va Telegram'ga tasdiqqa yuborish)
  send [nom]        tayyor final.mp4 ni Telegram'ga yuborish
  run               bot + kuzatuvchi (start.bat shuni ishga tushiradi)
  demo [--send]     sinov epizodini yasash (Instagram'ga joylamaydi)
  check             sozlamalarni tekshirish
  refresh-token     Instagram tokenini yangilash (.env'ga yoziladi)
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import shutil
import sys
from logging.handlers import RotatingFileHandler

from .config import Config, load_config
from . import episode as ep


def _setup_logging(cfg: Config) -> None:
    logs = cfg.base_dir / "logs"
    logs.mkdir(parents=True, exist_ok=True)
    fmt = logging.Formatter("%(asctime)s %(levelname)s [%(name)s] %(message)s", "%H:%M:%S")
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    for h in (logging.StreamHandler(sys.stdout),
              RotatingFileHandler(logs / "zavod.log", maxBytes=2_000_000, backupCount=3,
                                  encoding="utf-8")):
        h.setFormatter(fmt)
        root.addHandler(h)
    for noisy in ("httpx", "telegram", "apscheduler", "botocore", "urllib3"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def _resolve(cfg: Config, name: str | None) -> str:
    name = name or ep.get_current(cfg)
    if not name:
        sys.exit("Epizod nomi berilmagan va joriy epizod yo'q. 'new <nom>' bajaring.")
    if not ep.episode_dir(cfg, name).exists():
        sys.exit(f"Epizod topilmadi: {name}")
    return ep.safe_name(name)


def cmd_build(cfg, name, send):
    from .montage import build_episode
    d = ep.episode_dir(cfg, _resolve(cfg, name))
    final, cover = build_episode(cfg, d)
    print(f"\n✅ {final}\n🖼  {cover}")
    if send:
        _send(cfg, d.name)


def _send(cfg, name):
    from .telegram_bot import send_for_approval
    d = ep.episode_dir(cfg, name)
    final = d / "final.mp4"
    if not final.exists():
        sys.exit(f"{final} yo'q — avval 'build' qiling")
    pid = send_for_approval(cfg, d.name, final, d / "cover.jpg", ep.load_caption(d))
    print(f"📨 Telegram'ga yuborildi (post #{pid}). Tugmalar 'run' jarayoni ishlayotganda ishlaydi.")


def cmd_run(cfg):
    from telegram import Update
    from .telegram_bot import build_app, _chat_id
    from .watcher import start_watcher

    app = build_app(cfg)
    chat = _chat_id(cfg)

    async def post_init(application):
        loop = asyncio.get_running_loop()

        def on_moved(episode, target):
            asyncio.run_coroutine_threadsafe(application.bot.send_message(
                chat, f"📥 {episode}: {target.name} qabul qilindi"), loop)
        start_watcher(cfg, on_moved)
        await application.bot.send_message(
            chat, f"🟢 Zavod ishga tushdi. Joriy epizod: {ep.get_current(cfg) or '—'}")

    app.post_init = post_init
    logging.getLogger("zavod").info("Bot ishga tushdi. To'xtatish: Ctrl+C")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


def cmd_watch(cfg):
    import time
    from .watcher import start_watcher
    start_watcher(cfg)
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass


def cmd_demo(cfg, send):
    """Sinov: rangli 3 ta klip yasaydi (Flow kliplari o'rniga) va to'liq montaj qiladi."""
    import json
    from .montage import run
    d = ep.create_episode(cfg, "sinov_sobir_osh")
    clips = d / "clips"
    for old in clips.glob("*.mp4"):
        old.unlink()
    colors = ["0x6b4f2a", "0x2a4f6b", "0x3b6b2a"]
    for i, c in enumerate(colors, 1):
        # Flow 720p gorizontal klipga o'xshash: 1280x720, 8 soniya, ovozli
        run([cfg.ffmpeg, "-y", "-f", "lavfi", "-i", f"testsrc2=size=1280x720:rate=24,"
             f"colorbalance=rs=0.2,drawbox=c={c}@0.6:t=fill",
             "-f", "lavfi", "-i", f"sine=frequency={300 + i * 120}:sample_rate=44100",
             "-t", "8", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac",
             "-shortest", clips / f"{i}.mp4"])
    script = {
        "title": "Sobir aka oshda",
        "clips": [
            {"file": "1.mp4", "lines": [
                {"speaker": "Xotini", "text": "Sobir aka, qo'shnilar oshga chaqirdi!", "start": 0.3, "end": 3.8},
                {"speaker": "Sobir aka", "text": "Oshga? Hozir kostyumimni kiyaman!", "start": 4.0, "end": 7.8}]},
            {"file": "2.mp4", "lines": [
                {"speaker": "Sobir aka", "text": "Osh qani?", "start": 0.5, "end": 3.0},
                {"speaker": "Mezbon", "text": "Mana! Hammaga yetadi.", "start": 3.3, "end": 7.5}]},
            {"file": "3.mp4", "lines": [
                {"speaker": "Odam", "text": "SUVARAAAK!", "start": 0.3, "end": 2.8},
                {"speaker": "Sobir aka", "text": "Osh zo'r bo'ldi!", "start": 3.2, "end": 6.0},
                {"speaker": "", "text": "Davomi kerakmi? 👇", "start": 6.2, "end": 8.0}]},
        ],
    }
    (d / "script.json").write_text(json.dumps(script, ensure_ascii=False, indent=2), encoding="utf-8")
    (d / "caption.txt").write_text(
        "Sobir aka qo'shnining oshiga bordi… 🍚😂\nDavomi kerakmi? Izohda yozing 👇\n\n"
        "#suvarak #sobiraka #ozbekcha #multfilm #ai #prikol #uzbekistan #reels", encoding="utf-8")
    print("🧪 Sinov epizodi (SINOV — haqiqiy Flow kliplari emas):", d)
    cmd_build(cfg, d.name, send)
    if not send:
        print("ℹ️  Telegram'ga yuborish uchun: python -m zavod demo --send")


def cmd_check(cfg):
    ok = True

    def row(name, good, note=""):
        nonlocal ok
        ok &= bool(good)
        print(f"{'✅' if good else '❌'} {name} {note}")

    row("ffmpeg", shutil.which(cfg.ffmpeg), cfg.ffmpeg)
    row("ffprobe", shutil.which(cfg.ffprobe), cfg.ffprobe)
    try:
        row("shrift", True, str(cfg.font_path()))
    except FileNotFoundError as e:
        row("shrift", False, str(e))
    row("Downloads", cfg.downloads_dir.exists(), str(cfg.downloads_dir))
    print(f"📁 Epizodlar: {cfg.episodes_dir}")
    for k in ("TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "INSTAGRAM_ACCESS_TOKEN",
              "INSTAGRAM_USER_ID", "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID",
              "R2_SECRET_ACCESS_KEY", "R2_BUCKET"):
        row(k, cfg.env(k, required=False), "")
    if cfg["voice"].get("enabled"):
        row("ELEVENLABS_API_KEY", cfg.env("ELEVENLABS_API_KEY", required=False))
    if cfg.env("INSTAGRAM_ACCESS_TOKEN", required=False):
        from .instagram import whoami
        try:
            me = whoami(cfg)
            row("Instagram token", True, f"@{me.get('username')} ({me.get('account_type')})")
            if str(me.get("user_id")) != cfg.env("INSTAGRAM_USER_ID", required=False):
                print(f"   ⚠️ INSTAGRAM_USER_ID ni {me.get('user_id')} qilib qo'ying")
        except Exception as e:  # noqa: BLE001
            row("Instagram token", False, str(e))
    print("\nHammasi joyida ✅" if ok else "\nYuqoridagi ❌ larni tuzating")


def main(argv=None):
    p = argparse.ArgumentParser(prog="python -m zavod", description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("new").add_argument("name")
    sub.add_parser("use").add_argument("name")
    sub.add_parser("list")
    sub.add_parser("watch")
    b = sub.add_parser("build")
    b.add_argument("name", nargs="?")
    b.add_argument("--send", action="store_true")
    sub.add_parser("send").add_argument("name", nargs="?")
    sub.add_parser("run")
    sub.add_parser("demo").add_argument("--send", action="store_true")
    sub.add_parser("check")
    sub.add_parser("refresh-token")
    a = p.parse_args(argv)

    cfg = load_config()
    _setup_logging(cfg)

    if a.cmd == "new":
        print("📁", ep.create_episode(cfg, a.name), "(joriy epizod)")
    elif a.cmd == "use":
        ep.set_current(cfg, a.name)
        print("👉 Joriy epizod:", ep.get_current(cfg))
    elif a.cmd == "list":
        cur = ep.get_current(cfg)
        for n in ep.list_episodes(cfg):
            print(("👉 " if n == cur else "   ") + n)
    elif a.cmd == "watch":
        cmd_watch(cfg)
    elif a.cmd == "build":
        cmd_build(cfg, a.name, a.send)
    elif a.cmd == "send":
        _send(cfg, _resolve(cfg, a.name))
    elif a.cmd == "run":
        cmd_run(cfg)
    elif a.cmd == "demo":
        cmd_demo(cfg, a.send)
    elif a.cmd == "check":
        cmd_check(cfg)
    elif a.cmd == "refresh-token":
        from .instagram import refresh_token
        print(f"🔄 Token yangilandi, {refresh_token(cfg)} kun amal qiladi")


if __name__ == "__main__":
    main()
