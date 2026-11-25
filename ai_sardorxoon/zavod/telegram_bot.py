"""Telegram bot: tayyor videoni yuboradi, [✅ Joylash] [🕐 Rejalashtirish] [❌ Bekor]."""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from telegram import Bot, InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (Application, CallbackQueryHandler, CommandHandler,
                          ContextTypes, MessageHandler, filters)

from .config import Config
from .db import DB
from . import episode as ep_mod

log = logging.getLogger("telegram")


def _tz(cfg: Config) -> ZoneInfo:
    return ZoneInfo(cfg["telegram"].get("timezone", "Asia/Tashkent"))


def _chat_id(cfg: Config) -> int:
    return int(cfg.env("TELEGRAM_CHAT_ID"))


def _main_kb(pid: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[
        InlineKeyboardButton("✅ Joylash", callback_data=f"pub:{pid}"),
        InlineKeyboardButton("🕐 Rejalashtirish", callback_data=f"sch:{pid}"),
        InlineKeyboardButton("❌ Bekor", callback_data=f"can:{pid}"),
    ]])


def _time_kb(cfg: Config, pid: int) -> InlineKeyboardMarkup:
    now = datetime.now(_tz(cfg))
    rows, row = [], []
    for hhmm in cfg["telegram"].get("quick_times", []):
        h, m = map(int, hhmm.split(":"))
        t = now.replace(hour=h, minute=m, second=0, microsecond=0)
        day = 0 if t > now + timedelta(minutes=5) else 1
        label = f"{'Bugun' if day == 0 else 'Ertaga'} {hhmm}"
        row.append(InlineKeyboardButton(label, callback_data=f"at:{pid}:{day}:{h:02d}{m:02d}"))
        if len(row) == 2:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    rows.append([InlineKeyboardButton("+1 soat", callback_data=f"in:{pid}:60"),
                 InlineKeyboardButton("✍️ Boshqa vaqt", callback_data=f"ask:{pid}")])
    rows.append([InlineKeyboardButton("⬅️ Orqaga", callback_data=f"back:{pid}")])
    return InlineKeyboardMarkup(rows)


# ------------------------------------------------------------ tasdiqqa yuborish
async def send_for_approval_async(cfg: Config, bot: Bot, episode: str, video: Path,
                                  cover: Path | None, caption: str) -> int:
    db = DB(cfg)
    pid = db.add(episode, video, cover, caption)
    chat = _chat_id(cfg)
    head = f"🎬 <b>{episode}</b> (#{pid})\n\n"
    preview = head + _esc(caption)
    long_caption = len(preview) > 1000
    with open(video, "rb") as fh:
        await bot.send_video(
            chat, fh, caption=head + "Caption pastda 👇" if long_caption else preview,
            parse_mode="HTML", supports_streaming=True,
            reply_markup=None if long_caption else _main_kb(pid),
            read_timeout=300, write_timeout=300)
    if long_caption:
        await bot.send_message(chat, _esc(caption)[:4000], parse_mode="HTML",
                               reply_markup=_main_kb(pid))
    return pid


def send_for_approval(cfg: Config, episode: str, video: Path, cover: Path | None,
                      caption: str) -> int:
    """CLI'dan chaqiriladi (bot jarayoni alohida ishlayotgan bo'lsa ham)."""
    async def _go():
        async with Bot(cfg.env("TELEGRAM_BOT_TOKEN")) as bot:
            return await send_for_approval_async(cfg, bot, episode, video, cover, caption)
    return asyncio.run(_go())


def _esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


# ------------------------------------------------------------ joylash
async def _publish(cfg: Config, app: Application, pid: int, from_status=("pending",)):
    db = DB(cfg)
    if not db.claim(pid, from_status):
        row = db.get(pid)
        await app.bot.send_message(_chat_id(cfg), f"ℹ️ #{pid} holati: {row['status'] if row else 'topilmadi'}")
        return
    row = db.get(pid)
    chat = _chat_id(cfg)
    loop = asyncio.get_running_loop()
    status_msg = await app.bot.send_message(chat, f"⏳ #{pid} joylanmoqda…")

    def progress(text: str):
        asyncio.run_coroutine_threadsafe(
            status_msg.edit_text(f"#{pid}: {text}"), loop)

    from .instagram import publish_reel
    try:
        link = await asyncio.to_thread(
            publish_reel, cfg, Path(row["video"]), row["caption"],
            Path(row["cover"]) if row["cover"] else None, progress)
        db.update(pid, status="published", permalink=link)
        await app.bot.send_message(chat, f"✅ #{pid} joylandi!\n{link}")
    except Exception as e:  # noqa: BLE001
        log.exception("Joylash xatosi")
        db.update(pid, status="failed", error=str(e)[:1000])
        await app.bot.send_message(
            chat, f"❌ #{pid} joylanmadi:\n{_esc(str(e))[:3000]}\n\nQayta urinish: /qayta {pid}",
            parse_mode="HTML")


# ------------------------------------------------------------ handlerlar
def build_app(cfg: Config) -> Application:
    owner = _chat_id(cfg)
    app = Application.builder().token(cfg.env("TELEGRAM_BOT_TOKEN")).build()
    only_owner = filters.Chat(chat_id=owner)

    def schedule(pid: int, when_local: datetime) -> str:
        db = DB(cfg)
        row = db.get(pid)
        if not row or row["status"] not in ("pending", "scheduled", "failed"):
            return f"ℹ️ #{pid} ni rejalashtirib bo'lmaydi ({row['status'] if row else 'yo‘q'})"
        db.update(pid, status="scheduled",
                  scheduled_at=when_local.astimezone(timezone.utc).isoformat(timespec="seconds"))
        return f"🕐 #{pid} {when_local:%Y-%m-%d %H:%M} da joylanadi. Navbat: /navbat"

    async def on_button(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        q = update.callback_query
        if q.message.chat_id != owner:
            await q.answer("Ruxsat yo'q", show_alert=True)
            return
        await q.answer()
        parts = q.data.split(":")
        action, pid = parts[0], int(parts[1])
        db = DB(cfg)
        tz = _tz(cfg)
        if action == "pub":
            await q.edit_message_reply_markup(None)
            await _publish(cfg, ctx.application, pid, ("pending", "failed"))
        elif action == "can":
            db.update(pid, status="cancelled")
            await q.edit_message_reply_markup(None)
            await q.message.reply_text(f"❌ #{pid} bekor qilindi")
        elif action == "sch":
            await q.edit_message_reply_markup(_time_kb(cfg, pid))
        elif action == "back":
            await q.edit_message_reply_markup(_main_kb(pid))
        elif action == "at":
            day, hhmm = int(parts[2]), parts[3]
            t = (datetime.now(tz) + timedelta(days=day)).replace(
                hour=int(hhmm[:2]), minute=int(hhmm[2:]), second=0, microsecond=0)
            await q.edit_message_reply_markup(None)
            await q.message.reply_text(schedule(pid, t))
        elif action == "in":
            t = datetime.now(tz) + timedelta(minutes=int(parts[2]))
            await q.edit_message_reply_markup(None)
            await q.message.reply_text(schedule(pid, t))
        elif action == "ask":
            ctx.chat_data["await_time"] = pid
            await q.message.reply_text(
                f"#{pid} uchun vaqtni yozing:\n<code>20:30</code> yoki <code>2026-11-27 20:30</code>",
                parse_mode="HTML")
        elif action == "unsch":
            db.update(pid, status="pending", scheduled_at=None)
            await q.edit_message_reply_markup(_main_kb(pid))

    async def on_text(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        pid = ctx.chat_data.get("await_time")
        if not pid:
            await update.message.reply_text("Buyruqlar: /help")
            return
        txt, tz = update.message.text.strip(), _tz(cfg)
        try:
            if len(txt) <= 5:
                h, m = map(int, txt.split(":"))
                t = datetime.now(tz).replace(hour=h, minute=m, second=0, microsecond=0)
                if t <= datetime.now(tz):
                    t += timedelta(days=1)
            else:
                t = datetime.strptime(txt, "%Y-%m-%d %H:%M").replace(tzinfo=tz)
        except ValueError:
            await update.message.reply_text("Format noto'g'ri. Masalan: 20:30 yoki 2026-11-27 20:30")
            return
        ctx.chat_data.pop("await_time", None)
        await update.message.reply_text(schedule(pid, t))

    async def cmd_help(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(
            "🤖 AI_SARDORXOON video zavodi\n\n"
            "/epizodlar — barcha epizodlar\n"
            "/epizod <nom> — joriy epizodni tanlash (yangi kliplar shunga tushadi)\n"
            "/yangi <nom> — yangi epizod ochish\n"
            "/yasash [nom] — montaj qilib, tasdiqqa yuborish\n"
            "/navbat — rejalashtirilgan postlar\n"
            "/qayta <id> — xato bo'lgan postni qayta joylash\n"
            f"\nSizning chat_id: {update.effective_chat.id}")

    async def cmd_episodes(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        cur = ep_mod.get_current(cfg)
        names = ep_mod.list_episodes(cfg)
        lines = []
        for n in names:
            clips = len(list((ep_mod.episode_dir(cfg, n) / "clips").glob("*.mp4")))
            lines.append(f"{'👉 ' if n == cur else '• '}{n} — {clips} klip")
        await update.message.reply_text("\n".join(lines) or "Epizod yo'q. /yangi <nom>")

    async def cmd_use(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        if not ctx.args:
            await update.message.reply_text(f"Joriy: {ep_mod.get_current(cfg)}")
            return
        try:
            ep_mod.set_current(cfg, " ".join(ctx.args))
            await update.message.reply_text(f"👉 Joriy epizod: {ep_mod.get_current(cfg)}")
        except FileNotFoundError as e:
            await update.message.reply_text(str(e))

    async def cmd_new(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        if not ctx.args:
            await update.message.reply_text("Nom yozing: /yangi sobir_osh")
            return
        d = ep_mod.create_episode(cfg, " ".join(ctx.args))
        await update.message.reply_text(
            f"📁 {d}\nscript.json va caption.txt ni to'ldiring. Flow'dan yuklangan kliplar shu yerga tushadi.")

    async def cmd_build(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        name = " ".join(ctx.args) if ctx.args else ep_mod.get_current(cfg)
        if not name:
            await update.message.reply_text("Epizod tanlanmagan")
            return
        await update.message.reply_text(f"🎞 {name} montaj qilinmoqda…")
        from .montage import build_episode
        d = ep_mod.episode_dir(cfg, name)
        try:
            final, cover = await asyncio.to_thread(build_episode, cfg, d)
        except Exception as e:  # noqa: BLE001
            log.exception("Montaj xatosi")
            await update.message.reply_text(f"❌ Montaj xatosi:\n{str(e)[:3500]}")
            return
        await send_for_approval_async(cfg, ctx.bot, d.name, final, cover, ep_mod.load_caption(d))

    async def cmd_queue(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        rows = DB(cfg).scheduled()
        if not rows:
            await update.message.reply_text("Navbat bo'sh")
            return
        tz = _tz(cfg)
        for r in rows:
            t = datetime.fromisoformat(r["scheduled_at"]).astimezone(tz)
            await update.message.reply_text(
                f"🕐 #{r['id']} {r['episode']} — {t:%Y-%m-%d %H:%M}",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton(
                    "Navbatdan olish", callback_data=f"unsch:{r['id']}")]]))

    async def cmd_retry(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        if not ctx.args or not ctx.args[0].isdigit():
            await update.message.reply_text("/qayta <id>")
            return
        await _publish(cfg, ctx.application, int(ctx.args[0]), ("failed", "pending"))

    async def tick(ctx: ContextTypes.DEFAULT_TYPE):
        for row in DB(cfg).due():
            await _publish(cfg, ctx.application, row["id"], ("scheduled",))

    async def cmd_whoami(update: Update, ctx: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(f"chat_id: {update.effective_chat.id}")

    app.add_handler(CommandHandler("chatid", cmd_whoami))  # chat_id'ni bilish uchun hammaga ochiq
    app.add_handler(CommandHandler(["start", "help"], cmd_help, filters=only_owner))
    app.add_handler(CommandHandler("epizodlar", cmd_episodes, filters=only_owner))
    app.add_handler(CommandHandler("epizod", cmd_use, filters=only_owner))
    app.add_handler(CommandHandler("yangi", cmd_new, filters=only_owner))
    app.add_handler(CommandHandler("yasash", cmd_build, filters=only_owner))
    app.add_handler(CommandHandler("navbat", cmd_queue, filters=only_owner))
    app.add_handler(CommandHandler("qayta", cmd_retry, filters=only_owner))
    app.add_handler(CallbackQueryHandler(on_button))
    app.add_handler(MessageHandler(only_owner & filters.TEXT & ~filters.COMMAND, on_text))
    app.job_queue.run_repeating(tick, interval=int(cfg["telegram"].get("queue_check_seconds", 30)),
                                first=10)
    return app
