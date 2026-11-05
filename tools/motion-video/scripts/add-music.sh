#!/usr/bin/env bash
# Tayyor videoga fon musiqasini qo'shadi. Odam gapirganda musiqa avtomatik pasayadi (ducking).
#
# Foydalanish:
#   bash scripts/add-music.sh <video.mp4> <chiqish.mp4> [musiqa.wav|mp3]
#
# Musiqa berilmasa scripts/make-music.py bilan video uzunligida sintez qilinadi.
# Muhit: MUSIC_VOL=0.22 (musiqa balandligi), MOOD=upbeat|chill, BPM=112
set -euo pipefail
IN="${1:?video bering}"; OUT="${2:?chiqish faylini bering}"; MUSIC="${3:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$IN")
if [ -z "$MUSIC" ]; then
  MUSIC="$TMP/music.wav"
  python3 "$HERE/make-music.py" "$MUSIC" "$DUR" --mood "${MOOD:-upbeat}" --bpm "${BPM:-112}"
fi
VOL="${MUSIC_VOL:-0.22}"
ffmpeg -hide_banner -loglevel error -y -i "$IN" -stream_loop -1 -i "$MUSIC" -filter_complex \
 "[1:a]atrim=0:${DUR},afade=t=out:st=$(python3 -c "print(max(0,$DUR-1.5))"):d=1.5,volume=${VOL},aformat=channel_layouts=stereo[m];\
  [0:a]aformat=channel_layouts=stereo,asplit=2[v][sc];\
  [m][sc]sidechaincompress=threshold=0.02:ratio=4:attack=15:release=350:makeup=1[md];\
  [v][md]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo "Tayyor: $OUT"
