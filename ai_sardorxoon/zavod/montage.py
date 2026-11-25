"""ffmpeg montaj: kliplarni 9:16 ga moslash, ulash, subtitr, suv belgisi, ovoz, muqova."""
from __future__ import annotations

import json
import logging
import re
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageStat

from .config import Config
from .episode import load_script

log = logging.getLogger("montage")


# ---------------------------------------------------------------- yordamchilar
def run(cmd: list[str]) -> None:
    log.debug(" ".join(map(str, cmd)))
    p = subprocess.run([str(c) for c in cmd], capture_output=True, text=True,
                       encoding="utf-8", errors="replace")
    if p.returncode != 0:
        raise RuntimeError(f"ffmpeg xatosi:\n{p.stderr[-2000:]}")


def probe(cfg: Config, path: Path) -> dict:
    p = subprocess.run(
        [cfg.ffprobe, "-v", "error", "-print_format", "json",
         "-show_format", "-show_streams", str(path)],
        capture_output=True, text=True, encoding="utf-8", errors="replace")
    if p.returncode != 0:
        raise RuntimeError(f"ffprobe o'qiy olmadi: {path}\n{p.stderr}")
    return json.loads(p.stdout)


def duration(cfg: Config, path: Path) -> float:
    return float(probe(cfg, path)["format"]["duration"])


def has_audio(cfg: Config, path: Path) -> bool:
    return any(s.get("codec_type") == "audio" for s in probe(cfg, path)["streams"])


def _hex(c: str, alpha: int = 255) -> tuple[int, int, int, int]:
    c = c.lstrip("#")
    return int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16), alpha


# ---------------------------------------------------------------- 1) moslash
def normalize_clip(cfg: Config, src: Path, dst: Path) -> None:
    v = cfg["video"]
    W, H, fps = v["width"], v["height"], v["fps"]
    if v.get("fit_mode", "blur") == "crop":
        vf = (f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,"
              f"crop={W}:{H},setsar=1,fps={fps},format=yuv420p[v]")
    else:
        vf = (f"[0:v]split[a][b];"
              f"[a]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
              f"boxblur=40:4,eq=brightness=-0.08[bg];"
              f"[b]scale={W}:{H}:force_original_aspect_ratio=decrease[fg];"
              f"[bg][fg]overlay=(W-w)/2:(H-h)/2,setsar=1,fps={fps},format=yuv420p[v]")
    cmd = [cfg.ffmpeg, "-y", "-i", src]
    if has_audio(cfg, src):
        af = "[0:a]aresample=44100,aformat=channel_layouts=stereo[a]"
    else:
        cmd += ["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100"]
        af = "[1:a]aformat=channel_layouts=stereo[a]"
    cmd += ["-filter_complex", f"{vf};{af}", "-map", "[v]", "-map", "[a]",
            "-t", f"{duration(cfg, src):.3f}",
            "-c:v", "libx264", "-preset", "medium", "-crf", str(v["crf"]),
            "-c:a", "aac", "-b:a", v["audio_bitrate"], "-ar", "44100", dst]
    run(cmd)


# ---------------------------------------------------------------- 2) ulash
def concat(cfg: Config, parts: list[Path], dst: Path) -> None:
    lst = dst.with_suffix(".txt")
    lst.write_text("".join(
        "file '" + p.resolve().as_posix().replace("'", r"'\''") + "'\n" for p in parts),
        encoding="utf-8")
    run([cfg.ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy",
         "-movflags", "+faststart", dst])


# ---------------------------------------------------------------- 3) matn rasmlari
def _wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = f"{cur} {w}".strip()
        if draw.textlength(test, font=font) <= max_w or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


_EMOJI = re.compile("[\U0001F000-\U0001FFFF\u2600-\u27BF\uFE0F\u200D]")


def text_png(cfg: Config, text: str, color: str, out: Path) -> tuple[int, int]:
    """Subtitr uchun shaffof PNG yasaydi va kadrdagi (x, y) joyini qaytaradi."""
    text = re.sub(r"\s+", " ", _EMOJI.sub("", text)).strip() or " "  # shrift emoji chiqarmaydi
    s, W, H = cfg["subtitles"], cfg["video"]["width"], cfg["video"]["height"]
    font = ImageFont.truetype(str(cfg.font_path()), s["font_size"])
    stroke = int(s.get("outline_width", 6))
    tmp = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    lines = _wrap(tmp, text, font, W * s.get("max_width_ratio", 0.88))
    asc, desc = font.getmetrics()
    lh = asc + desc + 10
    bw = int(max(tmp.textlength(l, font=font) for l in lines)) + stroke * 2 + 8
    bh = lh * len(lines) + stroke * 2
    img = Image.new("RGBA", (bw, bh), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i, line in enumerate(lines):
        lw = d.textlength(line, font=font)
        d.text(((bw - lw) / 2, stroke + i * lh), line, font=font, fill=_hex(color),
               stroke_width=stroke, stroke_fill=_hex(s.get("outline_color", "#000000")))
    img.save(out)
    x = (W - bw) // 2
    y = int(H * s.get("position_y", 0.72) - bh / 2)
    return x, max(0, min(y, H - bh))


def watermark_png(cfg: Config, out: Path) -> tuple[int, int]:
    wm, W, H = cfg["watermark"], cfg["video"]["width"], cfg["video"]["height"]
    font = ImageFont.truetype(str(cfg.font_path()), wm["font_size"])
    alpha = int(255 * float(wm.get("opacity", 0.75)))
    tmp = ImageDraw.Draw(Image.new("RGBA", (1, 1)))
    l, t, r, b = tmp.textbbox((0, 0), wm["text"], font=font, stroke_width=3)
    img = Image.new("RGBA", (r - l + 4, b - t + 4), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((2 - l, 2 - t), wm["text"], font=font,
                             fill=(255, 255, 255, alpha), stroke_width=3,
                             stroke_fill=(0, 0, 0, int(alpha * 0.8)))
    img.save(out)
    m, corner = wm.get("margin", 40), wm.get("corner", "top-right")
    x = m if "left" in corner else W - img.width - m
    y = m + 60 if "top" in corner else H - img.height - m - 200  # IG UI ostida qolmasin
    return x, y


# ---------------------------------------------------------------- 4) vaqtlar
def plan_lines(cfg: Config, script: dict, durations: list[float],
               voice_files: dict[tuple[int, int], Path]) -> list[dict]:
    """Har satrning umumiy videodagi boshlanish/tugash vaqtini hisoblaydi."""
    events, offset = [], 0.0
    for ci, (clip, dur) in enumerate(zip(script["clips"], durations)):
        lines = clip.get("lines", [])
        n = len(lines)
        for li, line in enumerate(lines):
            start = line.get("start")
            end = line.get("end")
            if start is None:
                start = dur * li / max(n, 1) + 0.2
            vf = voice_files.get((ci, li))
            if end is None:
                if vf is not None:
                    end = start + duration(cfg, vf) + 0.3
                else:
                    end = dur * (li + 1) / max(n, 1) - 0.1
            end = min(float(end), dur)
            events.append({"speaker": line.get("speaker", ""), "text": line["text"],
                           "start": offset + float(start), "end": offset + end,
                           "voice": vf})
        offset += dur
    return events


# ---------------------------------------------------------------- 5) muqova
def best_cover(cfg: Config, video: Path, out: Path, work: Path, samples: int = 12) -> None:
    """Videodan bir nechta kadr olib, eng tiniq va yorug'ini muqova qiladi."""
    dur = duration(cfg, video)
    best, best_score = None, -1.0
    for i in range(samples):
        t = dur * (i + 0.5) / samples
        f = work / f"frame_{i:02d}.jpg"
        run([cfg.ffmpeg, "-y", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1",
             "-q:v", "2", f])
        img = Image.open(f).convert("L")
        sharp = ImageStat.Stat(img.filter(ImageFilter.FIND_EDGES)).var[0]
        bright = ImageStat.Stat(img).mean[0]
        score = sharp * (1.0 if 50 < bright < 210 else 0.4)
        if score > best_score:
            best, best_score = f, score
    shutil.copy(best, out)


# ---------------------------------------------------------------- asosiy
def build_episode(cfg: Config, ep_dir: Path) -> tuple[Path, Path]:
    script = load_script(ep_dir)
    clips_dir = ep_dir / "clips"
    clips = script.get("clips") or [{"file": p.name, "lines": []} for p in
                                    sorted(clips_dir.glob("*.mp4"), key=lambda p: int(p.stem) if p.stem.isdigit() else 0)]
    script["clips"] = clips
    if not clips:
        raise RuntimeError(f"{clips_dir} papkasida klip yo'q")
    for c in clips:
        if not (clips_dir / c["file"]).exists():
            raise FileNotFoundError(f"Klip topilmadi: {clips_dir / c['file']}")

    work = ep_dir / "_work"
    if work.exists():
        shutil.rmtree(work)
    work.mkdir()

    # 1) moslash + ulash
    parts = []
    for i, c in enumerate(clips):
        dst = work / f"norm_{i:02d}.mp4"
        log.info("🎞  Moslanmoqda: %s", c["file"])
        normalize_clip(cfg, clips_dir / c["file"], dst)
        parts.append(dst)
    durations = [duration(cfg, p) for p in parts]
    joined = work / "joined.mp4"
    concat(cfg, parts, joined)

    # 2) ovoz (ixtiyoriy)
    voice_files: dict[tuple[int, int], Path] = {}
    if cfg["voice"].get("enabled"):
        from .voice import synthesize
        for ci, c in enumerate(clips):
            for li, line in enumerate(c.get("lines", [])):
                if line.get("voice", True):
                    voice_files[(ci, li)] = synthesize(
                        cfg, line["text"], line.get("speaker", ""), ep_dir / "voice")

    events = plan_lines(cfg, script, durations, voice_files)

    # 3) yakuniy filtr
    inputs: list = ["-i", joined]
    vchain, label, idx = [], "0:v", 1
    if cfg["subtitles"].get("enabled", True):
        s = cfg["subtitles"]
        colors = s.get("speaker_colors") or {}
        for k, ev in enumerate(events):
            txt = ev["text"]
            if s.get("show_speaker_name") and ev["speaker"]:
                txt = f"{ev['speaker']}: {txt}"
            png = work / f"sub_{k:02d}.png"
            x, y = text_png(cfg, txt, colors.get(ev["speaker"], s["default_color"]), png)
            inputs += ["-i", png]
            vchain.append(f"[{label}][{idx}:v]overlay={x}:{y}:"
                          f"enable='between(t,{ev['start']:.2f},{ev['end']:.2f})'[v{idx}]")
            label, idx = f"v{idx}", idx + 1
    if cfg["watermark"].get("enabled", True):
        png = work / "watermark.png"
        x, y = watermark_png(cfg, png)
        inputs += ["-i", png]
        vchain.append(f"[{label}][{idx}:v]overlay={x}:{y}[v{idx}]")
        label, idx = f"v{idx}", idx + 1
    if not vchain:
        vchain.append("[0:v]null[vout]")
    else:
        vchain[-1] = vchain[-1].rsplit("[", 1)[0] + "[vout]"

    achain = []
    voiced = [ev for ev in events if ev["voice"] is not None]
    if voiced:
        vc = cfg["voice"]
        achain.append(f"[0:a]volume={vc.get('original_volume', 0.25)}[a0]")
        mix = ["[a0]"]
        for j, ev in enumerate(voiced):
            inputs += ["-i", ev["voice"]]
            ms = int(ev["start"] * 1000)
            achain.append(f"[{idx}:a]aresample=44100,aformat=channel_layouts=stereo,"
                          f"adelay={ms}|{ms},volume={vc.get('voice_volume', 1.0)}[av{j}]")
            mix.append(f"[av{j}]")
            idx += 1
        achain.append(f"{''.join(mix)}amix=inputs={len(mix)}:duration=first:"
                      f"normalize=0,alimiter=limit=0.95[aout]")
        amap = "[aout]"
    else:
        amap = "0:a"

    final = ep_dir / "final.mp4"
    v = cfg["video"]
    run([cfg.ffmpeg, "-y", *inputs, "-filter_complex", ";".join(vchain + achain),
         "-map", "[vout]", "-map", amap,
         "-c:v", "libx264", "-preset", "medium", "-crf", str(v["crf"]),
         "-pix_fmt", "yuv420p", "-r", str(v["fps"]),
         "-c:a", "aac", "-b:a", v["audio_bitrate"], "-ar", "44100",
         "-movflags", "+faststart", final])

    cover = ep_dir / "cover.jpg"
    best_cover(cfg, joined, cover, work)
    total = sum(durations)
    log.info("✅ Tayyor: %s (%.1f s), muqova: %s", final, total, cover)
    return final, cover
