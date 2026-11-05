#!/usr/bin/env python3
"""Mualliflik huquqisiz fon musiqasini noldan sintez qiladi (numpy).

Foydalanish:
  python3 scripts/make-music.py <chiqish.wav> <soniya> [--bpm 112] [--mood upbeat|chill]

upbeat: tetik "tech/motivatsiya" ritmi (Reels uchun); chill: sokin lo-fi.
"""
import argparse
import wave

import numpy as np

p = argparse.ArgumentParser()
p.add_argument("out")
p.add_argument("seconds", type=float)
p.add_argument("--bpm", type=float, default=112)
p.add_argument("--mood", default="upbeat", choices=["upbeat", "chill"])
p.add_argument("--seed", type=int, default=7)
a = p.parse_args()

SR = 44100
rng = np.random.default_rng(a.seed)
beat = 60.0 / a.bpm
bar = beat * 4
n = int((a.seconds + 1.0) * SR)
L = np.zeros(n)
R = np.zeros(n)


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(length, attack=0.005, decay=0.2, sustain=0.0, release=0.05):
    t = np.arange(length) / SR
    e = np.minimum(1.0, t / max(attack, 1e-4))
    d = np.exp(-np.maximum(0, t - attack) / max(decay, 1e-4))
    e = e * (sustain + (1 - sustain) * d)
    r = int(release * SR)
    if r and length > r:
        e[-r:] *= np.linspace(1, 0, r)
    return e


def add(sig, start, pan=0.0, gain=1.0):
    i = int(start * SR)
    if i >= n:
        return
    sig = sig[: n - i] * gain
    L[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    R[i : i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


def lowpass(x, cutoff):
    # bir qutbli filtr (yumshoq tembr uchun)
    alpha = 1 - np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += alpha * (v - acc)
        y[i] = acc
    return y


def saw(freq, length, detune=0.0):
    t = np.arange(length) / SR
    out = np.zeros(length)
    for d in (-detune, 0.0, detune):
        ph = (t * freq * (1 + d)) % 1.0
        out += 2 * ph - 1
    return out / 3


# Akkordlar: Am - F - C - G (pop/motivatsiya)
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
BASS = [45, 41, 48, 43]

# Tayyor tovushlar
kick_len = int(0.35 * SR)
tk = np.arange(kick_len) / SR
kick = np.sin(2 * np.pi * (45 * tk + 60 * (1 - np.exp(-tk * 30)) / 30)) * np.exp(-tk * 9)
hat_len = int(0.05 * SR)
hat = lowpass(np.diff(rng.standard_normal(hat_len + 1)), 9000) * env(hat_len, 0.001, 0.012)
clap_len = int(0.25 * SR)
clap = lowpass(lowpass(rng.standard_normal(clap_len), 2200), 2200) * env(clap_len, 0.002, 0.08)

nbars = int(np.ceil((a.seconds + 1) / bar))
upbeat = a.mood == "upbeat"
for b in range(nbars):
    t0 = b * bar
    ci = b % 4
    # pad (cho'zilgan akkord)
    plen = int(bar * SR)
    pad = sum(saw(midi(m), plen, 0.004) for m in CHORDS[ci])
    pad = lowpass(pad, 900 if upbeat else 600) * env(plen, 0.25, 10, 1.0, 0.3)
    add(pad, t0, -0.2, 0.10)
    add(pad, t0 + 0.012, 0.2, 0.10)
    # bas (sakkizlik notalar)
    for k in range(8 if upbeat else 4):
        step = bar / (8 if upbeat else 4)
        blen = int(step * 0.9 * SR)
        tb = np.arange(blen) / SR
        f = midi(BASS[ci])
        bs = (np.sin(2 * np.pi * f * tb) + 0.3 * np.sin(4 * np.pi * f * tb)) * env(blen, 0.004, 0.18, 0.4, 0.03)
        add(bs, t0 + k * step, 0, 0.22)
    # arpedjio (pluck)
    notes = CHORDS[ci] + [CHORDS[ci][0] + 12]
    for k in range(16 if upbeat else 8):
        step = bar / (16 if upbeat else 8)
        m = notes[[0, 1, 2, 3, 2, 1, 2, 3][k % 8]] + 12
        plen2 = int(0.22 * SR)
        tp = np.arange(plen2) / SR
        pl = np.sign(np.sin(2 * np.pi * midi(m) * tp)) * 0.12 + np.sin(2 * np.pi * midi(m) * tp)
        pl = lowpass(pl, 1800) * env(plen2, 0.002, 0.09)
        add(pl, t0 + k * step, 0.35 if k % 2 else -0.35, 0.05)
    # baraban
    for k in range(4):
        tb = t0 + k * beat
        if upbeat or k in (0, 2):
            add(kick, tb, 0, 0.55)
        if k in (1, 3):
            add(clap, tb, 0.05, 0.16 if upbeat else 0.09)
        add(hat, tb + beat / 2, 0.3, 0.06)
        if upbeat:
            add(hat, tb + beat / 4 * 3, -0.3, 0.03)

# oxirida yumshoq tugash, normalizatsiya
total = int(a.seconds * SR)
L, R = L[:total], R[:total]
fade = int(1.5 * SR)
for ch in (L, R):
    ch[:int(0.3 * SR)] *= np.linspace(0, 1, int(0.3 * SR))
    ch[-fade:] *= np.linspace(1, 0, fade) ** 1.5
peak = max(np.abs(L).max(), np.abs(R).max(), 1e-9)
stereo = np.stack([L, R], axis=1) / peak * 0.9
pcm = (np.tanh(stereo * 1.2) / np.tanh(1.2) * 32767).astype("<i2")
with wave.open(a.out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"musiqa: {a.seconds:.1f}s, {a.bpm} BPM, {a.mood} -> {a.out}")
