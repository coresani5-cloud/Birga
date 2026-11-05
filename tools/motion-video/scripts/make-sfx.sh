#!/usr/bin/env bash
# Ovoz effektlarini ffmpeg bilan sintez qiladi (sfx.zip kerak emas).
set -euo pipefail
OUT="${1:-public/sfx}"
mkdir -p "$OUT"
ff() { ffmpeg -hide_banner -loglevel error -y "$@"; }
# pop: tez pasayadigan qisqa ton
ff -f lavfi -i "sine=f=600:d=0.12" -af "asetrate=44100*1.0,aresample=44100,afade=t=out:st=0.02:d=0.10,volume=1.6,vibrato=f=40:d=0.3" "$OUT/pop.wav"
# ding: qo'ng'iroq (ikki garmonika, uzun so'nish)
ff -f lavfi -i "sine=f=1318:d=0.9" -f lavfi -i "sine=f=2637:d=0.9" \
  -filter_complex "[0][1]amix=inputs=2:weights=1 0.35,afade=t=out:st=0.05:d=0.85,volume=1.4" "$OUT/ding.wav"
# click: klaviatura tugmasi
ff -f lavfi -i "anoisesrc=d=0.04:c=white:a=0.6" -af "highpass=f=2000,afade=t=out:st=0.005:d=0.035" "$OUT/click.wav"
# whoosh: shovqin + filtr
ff -f lavfi -i "anoisesrc=d=0.45:c=pink:a=0.5" -af "bandpass=f=900:w=600,afade=t=in:d=0.15,afade=t=out:st=0.2:d=0.25,volume=1.5" "$OUT/whoosh.wav"
echo "SFX tayyor: $OUT"
