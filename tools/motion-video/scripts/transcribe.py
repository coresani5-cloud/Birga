#!/usr/bin/env python3
"""Videodagi nutqni so'zma-so'z vaqt bilan matnga aylantiradi (faster-whisper).

Foydalanish:
  python3 scripts/transcribe.py <video_yoki_audio> <words.json> [--lang uz] [--model small]

O'rnatish (bir marta):  pip install faster-whisper
Model birinchi ishga tushishda HuggingFace'dan yuklanadi (internet kerak).
Natija: [{"word": "Salom", "start": 0.42, "end": 0.80}, ...]
"""
import argparse
import json

p = argparse.ArgumentParser()
p.add_argument("src")
p.add_argument("out")
p.add_argument("--lang", default=None, help="uz, ru, en ... (bo'lmasa avtomatik)")
p.add_argument("--model", default="small", help="tiny/base/small/medium/large-v3 yoki model papkasi yo'li")
a = p.parse_args()

import subprocess  # noqa: E402

import numpy as np  # noqa: E402
from faster_whisper import WhisperModel  # noqa: E402

# Audioni ffmpeg bilan o'qiymiz (PyAV versiya muammolarini chetlab o'tadi)
raw = subprocess.run(
    ["ffmpeg", "-nostdin", "-loglevel", "error", "-i", a.src, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
    check=True, capture_output=True,
).stdout
audio = np.frombuffer(raw, dtype=np.float32)

model = WhisperModel(a.model, device="auto", compute_type="int8")
segments, info = model.transcribe(audio, language=a.lang, word_timestamps=True, vad_filter=True)
words = []
for seg in segments:
    for w in seg.words or []:
        t = w.word.strip()
        if t:
            words.append({"word": t, "start": round(w.start, 2), "end": round(w.end, 2)})
with open(a.out, "w", encoding="utf-8") as f:
    json.dump(words, f, ensure_ascii=False, indent=1)
print(f"{len(words)} so'z, til: {info.language} -> {a.out}")
