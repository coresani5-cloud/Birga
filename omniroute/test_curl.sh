#!/usr/bin/env bash
# 6-qadam + "tayyor" sharti №1: modellar ro'yxati va Claude'ga test so'rov.
# Kalit chatga/tarixga chiqmasligi uchun yashirin so'raladi:
#   bash test_curl.sh            # modelni o'zi topadi
#   bash test_curl.sh <model-id> # aniq model bilan
set -euo pipefail
BASE=${OMNIROUTE_BASE_URL:-http://127.0.0.1:20128/v1}
if [ -z "${OMNIROUTE_API_KEY:-}" ]; then
  read -rsp "OmniRoute API kalit: " OMNIROUTE_API_KEY; echo
fi
AUTH="Authorization: Bearer $OMNIROUTE_API_KEY"

echo "== /v1/models (claude) =="
MODELS=$(curl -fsS "$BASE/models" -H "$AUTH")
echo "$MODELS" | grep -oE '"id":"[^"]*claude[^"]*"' | cut -d'"' -f4 | sort -u | tee /tmp/omniroute-claude-models.txt
MODEL=${1:-$(head -n1 /tmp/omniroute-claude-models.txt)}
[ -n "$MODEL" ] || { echo "❌ Claude modeli topilmadi — Dashboard → Providers'da Anthropic ulanganini tekshiring."; exit 1; }

echo; echo "== Test so'rov: $MODEL =="
curl -fsS "$BASE/chat/completions" -H "$AUTH" -H "Content-Type: application/json" -d @- <<JSON
{"model":"$MODEL","max_tokens":50,"messages":[{"role":"user","content":"Faqat 'salom' deb javob ber."}]}
JSON
echo
