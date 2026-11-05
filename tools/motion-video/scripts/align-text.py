#!/usr/bin/env python3
"""Foydalanuvchi yozgan aniq matnni Whisper so'z vaqtlariga moslaydi.

Matn sizniki (imlo to'g'ri), vaqt esa ovozdan olinadi. Moslash HARF darajasida
qilinadi, shuning uchun Whisper so'zni buzib tanisa ham ("tizimlaştırma" ~ "tizimlashtirma")
vaqt tayanchi bo'lib xizmat qiladi. Tayanchlar orasidagi so'zlar harf soniga qarab joylanadi.

Foydalanish: python3 scripts/align-text.py matn.txt asr_words.json words.json [--cuts 0,6.5,15.2,...]
"""
import difflib
import json
import re
import sys

txt_path, asr_path, out_path = sys.argv[1:4]
raw_text = open(txt_path, encoding="utf-8").read()
# "|" belgisi bilan bo'lak chegaralarini qo'lda berish mumkin (--cuts bilan birga)
manual = [part.split() for part in raw_text.split("|")] if "|" in raw_text else None
text_words = raw_text.replace("|", " ").split()
asr = json.load(open(asr_path, encoding="utf-8"))


def canon(s):
    """Talaffuzi yaqin harflarni bir xil qilish (o'zbek/turk/rus aralash tanishlar uchun)."""
    s = s.lower()
    s = re.sub(r"[’ʻʼ‘`']", "", s)
    for a, b in (("sh", "s"), ("ş", "s"), ("ch", "c"), ("ç", "c"), ("x", "h"), ("kh", "h"),
                 ("q", "k"), ("ğ", "g"), ("ı", "i"), ("ö", "o"), ("ü", "u"), ("y", "i"),
                 ("w", "v"), ("e", "a")):
        s = s.replace(a, b)
    return re.sub(r"[^a-z0-9]", "", s)


def local_align(words, asr_sub, t0, t1):
    """Bitta bo'lak ichida harf darajasida moslash."""
    achars, atimes = [], []
    for w in asr_sub:
        c = canon(w["word"])
        for k, ch in enumerate(c):
            achars.append(ch)
            atimes.append(w["start"] + (w["end"] - w["start"]) * (k + 0.5) / max(1, len(c)))
    tchars, owner = [], []
    for i, w in enumerate(words):
        for ch in canon(w) or "_":
            tchars.append(ch)
            owner.append(i)
    ctime = [None] * len(tchars)
    sm = difflib.SequenceMatcher(None, "".join(tchars), "".join(achars), autojunk=False)
    for blk in sm.get_matching_blocks():
        if blk.size >= 3:  # qisqa mosliklar tasodifiy bo'lishi mumkin
            for k in range(blk.size):
                ctime[blk.a + k] = atimes[blk.b + k]
    pts = [(-1, t0)] + [(i, t) for i, t in enumerate(ctime) if t is not None] + [(len(ctime), t1)]
    # Tayanchlarni tozalash: monoton bo'lsin va gapirish tezligi aql bovar qiladigan bo'lsin
    # (o'rtacha tezlikdan 3 baravar tez yoki sekin bo'lsa — tasodifiy moslik)
    avg = len(tchars) / max(0.3, t1 - t0)

    def plausible(a, b):
        (ia, ta), (ib, tb) = a, b
        if tb < ta:
            return False
        dc, dt = ib - ia, tb - ta
        if dc < 6 and dt < 1.0:
            return True
        r = dc / max(dt, 0.05)
        return avg / 3 <= r <= avg * 3

    mono = [pts[0]]
    for p in pts[1:-1]:
        if plausible(mono[-1], p):
            mono.append(p)
    while len(mono) > 1 and not plausible(mono[-1], pts[-1]):
        mono.pop()
    mono.append(pts[-1])
    for (i0, ta), (i1, tb) in zip(mono, mono[1:]):
        for i in range(i0 + 1, i1):
            ctime[i] = ta + (tb - ta) * (i - i0) / (i1 - i0)
        if 0 <= i1 < len(ctime):
            ctime[i1] = tb
    res = []
    for i, w in enumerate(words):
        ts = [ctime[k] for k, o in enumerate(owner) if o == i]
        res.append({"word": w, "start": round(min(ts), 2), "end": round(max(ts) + 0.05, 2)})
    return res


# 1) ASR so'zlarini bo'laklarga ajratish: --cuts berilsa o'sha, bo'lmasa 0.6s+ pauzalar
cuts = None
if "--cuts" in sys.argv:
    cuts = [float(x) for x in sys.argv[sys.argv.index("--cuts") + 1].split(",")]
segs = []
if cuts:
    for a, b in zip(cuts, cuts[1:]):
        sub = [w for w in asr if a <= w["start"] < b]
        if sub:
            segs.append((sub, a, b))
else:
    cur = []
    for w in asr:
        if cur and w["start"] - cur[-1]["end"] > 0.6:
            segs.append((cur, cur[0]["start"], cur[-1]["end"]))
            cur = []
        cur.append(w)
    if cur:
        segs.append((cur, cur[0]["start"], cur[-1]["end"]))

# 2) Matn so'zlarini bo'laklarga taqsimlash (dinamik dasturlash, harf o'xshashligi bo'yicha)
n, m = len(text_words), len(segs)
seg_c = [canon(" ".join(w["word"] for w in sub)) for sub, _, _ in segs]
tw_c = [canon(w) for w in text_words]


durs = [b - a for _, a, b in segs]
rate = sum(len(c) for c in tw_c) / max(1e-6, sum(durs))  # harf / soniya


def cost(i, j, k):
    t = "".join(tw_c[i:j])
    r = difflib.SequenceMatcher(None, t, seg_c[k], autojunk=False).ratio()
    # bo'lak uzunligiga mos miqdordagi matn tushsin (ASR so'z tushirib qoldirgan bo'lsa ham)
    return (1 - r) * (len(t) + len(seg_c[k])) + 0.25 * abs(len(t) - rate * durs[k])


INF = float("inf")
dp = [[INF] * (n + 1) for _ in range(m + 1)]
back = [[0] * (n + 1) for _ in range(m + 1)]
dp[0][0] = 0
for k in range(1, m + 1) if not manual else []:
    for j in range(k, n + 1):
        for i in range(k - 1, j):
            if dp[k - 1][i] == INF:
                continue
            c = dp[k - 1][i] + cost(i, j, k - 1)
            if c < dp[k][j]:
                dp[k][j], back[k][j] = c, i
bounds, j = [], n
for k in range(m, 0, -1):
    i = back[k][j]
    bounds.append((i, j))
    j = i
bounds.reverse()
if manual:
    if len(manual) != m:
        sys.exit(f"'|' bilan {len(manual)} bo'lak berildi, lekin ASR bo'laklari {m} ta")
    bounds, i = [], 0
    for part in manual:
        bounds.append((i, i + len(part)))
        i += len(part)

out = []
for (i, j), (sub, a, b) in zip(bounds, segs):
    s0 = a if (cuts and sub[0]["start"] - a > 1.0) else sub[0]["start"]
    s1 = b if (cuts and b - sub[-1]["end"] > 1.0) else sub[-1]["end"]
    out.extend(local_align(text_words[i:j], sub, s0, s1))
for i in range(len(out) - 1):
    out[i]["end"] = round(max(out[i]["end"], min(out[i + 1]["start"], out[i]["start"] + 0.6)), 2)
json.dump(out, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"{len(out)} so'z, {len(segs)} bo'lakka moslandi -> {out_path}")
for (i, j), (sub, a, b) in zip(bounds, segs):
    print(f"  {sub[0]['start']:5.1f}-{sub[-1]['end']:5.1f}: {' '.join(text_words[i:j])}")
