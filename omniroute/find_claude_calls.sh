#!/usr/bin/env bash
# 7-qadam: bot papkasida Claude chaqiruvlarini topadi va o'zgartirishdan OLDIN zaxira oladi.
#   bash find_claude_calls.sh /yo'l/jarvis
set -euo pipefail
ROOT=${1:?Bot papkasini bering}
PAT='anthropic|Anthropic\(|AsyncAnthropic|messages\.create|claude-|ANTHROPIC_API_KEY|x-api-key|api\.anthropic\.com'
FILES=$(grep -rlE "$PAT" "$ROOT" --include='*.py' --include='.env*' --include='*.toml' --include='requirements*.txt' \
        --exclude-dir=venv --exclude-dir=.venv --exclude-dir=__pycache__ --exclude-dir='.backup-*' || true)
[ -n "$FILES" ] || { echo "Claude chaqiruvlari topilmadi."; exit 0; }

echo "== Topilgan joylar =="
grep -nE "$PAT" $FILES | sed -E 's/(sk-ant-[A-Za-z0-9_-]{4})[A-Za-z0-9_-]+/\1…/g'

BK="$ROOT/.backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BK"
for f in $FILES; do
  mkdir -p "$BK/$(dirname "${f#$ROOT/}")"
  cp -p "$f" "$BK/${f#$ROOT/}"
done
echo; echo "✅ Zaxira: $BK  ($(echo "$FILES" | wc -l) fayl)"
