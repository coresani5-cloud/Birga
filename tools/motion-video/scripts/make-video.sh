#!/usr/bin/env bash
# Butun qo'llanmani bitta buyruqda bajaradi:
#   o'rnatish -> fayllarni joylash -> SFX -> sahna vaqtlari -> render
#
# Foydalanish:
#   bash scripts/make-video.sh <video.json> [audio.mp3] [chiqish.mp4]
#
# Muhit o'zgaruvchilari:
#   AUTO_TIMING=0   sceneStarts ni audiodan avtomatik hisoblamaslik
#   BROWSER=<yo'l>  Chrome/Chromium yo'li (bo'lmasa Remotion o'zi yuklaydi)
set -euo pipefail
cd "$(dirname "$0")/.."

CFG="${1:?video.json faylini bering}"
AUDIO="${2:-}"
OUT="${3:-out/reels.mp4}"

[ -d node_modules/remotion ] || npm i --loglevel=error --no-audit --no-fund

cp "$CFG" src/video.json.tmp && mv src/video.json.tmp src/video.json

[ -f public/sfx/pop.wav ] || bash scripts/make-sfx.sh public/sfx

N=$(node -e 'console.log(require("./src/video.json").scenes.length)')

if [ -n "$AUDIO" ]; then
  EXT="${AUDIO##*.}"
  rm -f public/audio.*
  cp "$AUDIO" "public/audio.$EXT"
  node -e '
    const fs=require("fs"),f="src/video.json",c=JSON.parse(fs.readFileSync(f));
    c.audio=process.argv[1]; fs.writeFileSync(f,JSON.stringify(c,null,2)+"\n");' "audio.$EXT"
  HAS_STARTS=$(node -e 'const c=require("./src/video.json");console.log(Array.isArray(c.sceneStarts)&&c.sceneStarts.length>=c.scenes.length?1:0)')
  if [ "${AUTO_TIMING:-1}" = "1" ] && [ "$HAS_STARTS" = "0" ]; then
    node scripts/detect-scenes.mjs "public/audio.$EXT" "$N" --write src/video.json
  else
    DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "public/audio.$EXT")
    node -e '
      const fs=require("fs"),f="src/video.json",c=JSON.parse(fs.readFileSync(f));
      c.durationInSeconds=+(+process.argv[1]).toFixed(2); fs.writeFileSync(f,JSON.stringify(c,null,2)+"\n");' "$DUR"
  fi
else
  node -e '
    const fs=require("fs"),f="src/video.json",c=JSON.parse(fs.readFileSync(f));
    c.audio=null; fs.writeFileSync(f,JSON.stringify(c,null,2)+"\n");'
fi

mkdir -p "$(dirname "$OUT")"
ARGS=()
if [ -n "${BROWSER:-}" ]; then
  ARGS+=(--browser-executable="$BROWSER")
else
  # Claude bulut muhitida oldindan o'rnatilgan brauzer bor
  for b in /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell; do
    [ -x "$b" ] && ARGS+=(--browser-executable="$b") && break
  done
fi
npx remotion render Reels "$OUT" "${ARGS[@]}"
case "$OUT" in /*) echo "Tayyor: $OUT";; *) echo "Tayyor: $(pwd)/$OUT";; esac
