#!/usr/bin/env python3
"""Foydalanuvchi yozgan aniq matnni Whisper so'z vaqtlariga moslaydi.

Matn sizniki (imlo to'g'ri), vaqt esa ovozdan olinadi.
Foydalanuvchi: python3 scripts/align-text.py matn.txt asr_words.json words.json
"""
import difflib
import json
import re
import sys

txt_path, asr_path, out_path = sys.argv[1:4]
text_words = open(txt_path, encoding="utf-8").read().split()
asr = json.load(open(asr_path, encoding="utf-8"))

# Whisper ba'zan "o" + "'zingiz" deb bo'ladi — qo'shib yuboramiz
merged = []
for w in asr:
    if merged and re.match(r"^['’ʻ`]", w["word"]):
        merged[-1] = {"word": merged[-1]["word"] + w["word"], "start": merged[-1]["start"], "end": w["end"]}
    else:
        merged.append(dict(w))

norm = lambda s: re.sub(r"[^\w]", "", s.lower().replace("’", "'"))
a = [norm(w) for w in text_words]
b = [norm(w["word"]) for w in merged]
times = [None] * len(text_words)
sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal" or (tag == "replace" and i2 - i1 == j2 - j1):
        for k in range(i2 - i1):
            times[i1 + k] = (merged[j1 + k]["start"], merged[j1 + k]["end"])
    elif tag == "replace" and j2 > j1:
        # turli sondagi so'zlar: vaqt oralig'ini harf soniga qarab bo'lamiz
        s, e = merged[j1]["start"], merged[j2 - 1]["end"]
        total = sum(len(w) for w in text_words[i1:i2]) or 1
        cur = s
        for k in range(i1, i2):
            d = (e - s) * len(text_words[k]) / total
            times[k] = (cur, cur + d)
            cur += d

# moslanmagan so'zlar: qo'shnilar orasiga joylash
for i, t in enumerate(times):
    if t is None:
        prev = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), 0.0)
        nxt = next((times[j][0] for j in range(i + 1, len(times)) if times[j]), prev + 0.4)
        times[i] = (prev, max(prev + 0.05, (prev + nxt) / 2))

out = [{"word": w, "start": round(s, 2), "end": round(e, 2)} for w, (s, e) in zip(text_words, times)]
json.dump(out, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(out)} so'z moslandi, {sm.ratio():.0%} o'xshashlik -> {out_path}")
