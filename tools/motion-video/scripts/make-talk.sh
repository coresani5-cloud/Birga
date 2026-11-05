#!/usr/bin/env bash
# Odam gapirayotgan videoga so'zlariga mos motion emoji + subtitr qo'yadi.
#
# Foydalanish:
#   bash scripts/make-talk.sh <video.mp4> <chiqish.mp4> [words.json|subs.srt] [cues.json]
#
#  - words.json/srt berilmasa: faster-whisper bilan avtomatik transkripsiya (internet kerak)
#  - cues.json berilmasa: scripts/auto-cues.mjs lug'ati bilan avtomatik emoji tanlanadi
# Muhit: LANG_CODE=uz (standart), WHISPER_MODEL=small, CAPTIONS=0 (subtitrni o'chirish),
#        OUT_HEIGHT=1920 (chiqish balandligi; kichik videoni kattalashtirish uchun)
set -euo pipefail
cd "$(dirname "$0")/.."
abs() { case "$1" in /*) echo "$1";; *) echo "$OLDPWD/$1";; esac; }

IN="$(abs "${1:?video faylini bering}")"
OUT="$(abs "${2:?chiqish faylini bering}")"
WORDS_IN="${3:-}"; [ -n "$WORDS_IN" ] && WORDS_IN="$(abs "$WORDS_IN")"
CUES_IN="${4:-}";  [ -n "$CUES_IN" ] && CUES_IN="$(abs "$CUES_IN")"
WORK="out/talk-work"; mkdir -p "$WORK" "$(dirname "$OUT")"

[ -d node_modules/remotion ] || npm i --loglevel=error --no-audit --no-fund
[ -f public/sfx/pop.wav ] || bash scripts/make-sfx.sh public/sfx

# 1) videoni joylash (h264 ga o'tkazib — brauzer har qanday formatni o'qiy olishi uchun)
ffmpeg -hide_banner -loglevel error -y -i "$IN" -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k public/input.mp4

# 2) so'zlar
if [ -z "$WORDS_IN" ]; then
  python3 -c "import faster_whisper" 2>/dev/null || pip install -q faster-whisper || pip install -q --break-system-packages faster-whisper
  python3 scripts/transcribe.py public/input.mp4 "$WORK/words.json" --lang "${LANG_CODE:-uz}" --model "${WHISPER_MODEL:-small}"
elif [[ "$WORDS_IN" == *.srt ]]; then
  node scripts/srt-to-words.mjs "$WORDS_IN" "$WORK/words.json"
else
  cp "$WORDS_IN" "$WORK/words.json"
fi

# 3) emoji cue'lar
if [ -z "$CUES_IN" ]; then node scripts/auto-cues.mjs "$WORK/words.json" "$WORK/cues.json"; else cp "$CUES_IN" "$WORK/cues.json"; fi

# 4) talk.json ni yig'ish (o'lcham, fps, uzunlik videodan)
node - "$WORK" <<'JS'
const { execFileSync } = require("child_process");
const fs = require("fs");
const work = process.argv[2];
const p = JSON.parse(execFileSync("ffprobe", ["-v","error","-select_streams","v:0","-show_entries","stream=width,height,r_frame_rate:stream_side_data=rotation:format=duration","-of","json","public/input.mp4"]));
const s = p.streams[0];
const [a, b] = s.r_frame_rate.split("/").map(Number);
let w = s.width, h = s.height;
const rot = Math.abs((s.side_data_list || []).find(d => d.rotation !== undefined)?.rotation || 0);
if (rot === 90) [w, h] = [h, w];
// OUT_HEIGHT=1920 -> sifat uchun kattalashtirib render qilish
const target = Number(process.env.OUT_HEIGHT || 0);
if (target && target !== h) { w = Math.round((w * target) / h / 2) * 2; h = target; }
const cfg = {
  width: w, height: h, fps: Math.min(60, Math.round(a / b)) || 30,
  video: "input.mp4",
  durationInSeconds: +(+p.format.duration).toFixed(2),
  words: JSON.parse(fs.readFileSync(`${work}/words.json`, "utf8")),
  cues: JSON.parse(fs.readFileSync(`${work}/cues.json`, "utf8")),
  captions: { enabled: process.env.CAPTIONS !== "0" },
};
fs.writeFileSync("src/talk.json", JSON.stringify(cfg, null, 1));
console.log(`video ${w}x${h} @${cfg.fps}fps, ${cfg.durationInSeconds}s, ${cfg.words.length} so'z, ${cfg.cues.length} emoji`);
JS

# 5) render
ARGS=()
if [ -n "${BROWSER:-}" ]; then ARGS+=(--browser-executable="$BROWSER")
else for b in /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell; do [ -x "$b" ] && ARGS+=(--browser-executable="$b") && break; done; fi
npx remotion render Talk "$OUT" "${ARGS[@]}"
echo "Tayyor: $OUT"
