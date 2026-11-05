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
p.add_argument("--model", default="small", help="tiny/base/small/medium/large-v3")
a = p.parse_args()

from faster_whisper import WhisperModel  # noqa: E402

model = WhisperModel(a.model, device="auto", compute_type="int8")
segments, info = model.transcribe(a.src, language=a.lang, word_timestamps=True, vad_filter=True)
words = []
for seg in segments:
    for w in seg.words or []:
        t = w.word.strip()
        if t:
            words.append({"word": t, "start": round(w.start, 2), "end": round(w.end, 2)})
with open(a.out, "w", encoding="utf-8") as f:
    json.dump(words, f, ensure_ascii=False, indent=1)
print(f"{len(words)} so'z, til: {info.language} -> {a.out}")
