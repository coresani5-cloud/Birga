#!/usr/bin/env bash
# OmniRoute AI-shlyuzi — Ubuntu serverga o'rnatish (1–3-qadamlar)
#   sudo bash setup.sh
# - Docker yo'q bo'lsa o'rnatadi (get.docker.com)
# - Maxfiy kalitlarni /opt/omniroute/omniroute.env ga yaratadi (chmod 600, chatga chiqmaydi)
# - Konteynerni FAQAT 127.0.0.1:20128 da ochadi — internetga ochiq emas
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then echo "❌ sudo bilan ishga tushiring: sudo bash setup.sh"; exit 1; fi
DIR=/opt/omniroute
ENVF=$DIR/omniroute.env
IMAGE=diegosouzapw/omniroute:latest

# 1. Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "📦 Docker o'rnatilmoqda…"
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null 2>&1 || true
docker --version

# Maxfiy kalitlar (bir marta yaratiladi, keyin qayta ishlatiladi)
mkdir -p "$DIR"
if [ ! -f "$ENVF" ]; then
  umask 077
  cat > "$ENVF" <<ENV
JWT_SECRET=$(openssl rand -base64 48)
API_KEY_SECRET=$(openssl rand -hex 32)
INITIAL_PASSWORD=$(openssl rand -base64 16)
OMNIROUTE_WS_BRIDGE_SECRET=$(openssl rand -base64 32)
REQUIRE_API_KEY=true
ALLOW_API_KEY_REVEAL=false
ENV
  echo "🔐 Kalitlar yaratildi: $ENVF"
fi
chmod 600 "$ENVF"

# 2. OmniRoute
if ! docker pull "$IMAGE"; then
  # Docker Hub limit (429) bo'lsa — Google mirror
  docker pull "mirror.gcr.io/$IMAGE" && docker tag "mirror.gcr.io/$IMAGE" "$IMAGE"
fi
if docker ps -a --format '{{.Names}}' | grep -qx omniroute; then
  echo "ℹ️  'omniroute' konteyneri allaqachon bor — tegmayapman."
  echo "    Qayta yaratish kerak bo'lsa, o'zingiz: docker rm -f omniroute  (ma'lumotlar omniroute-data volume'da qoladi)"
else
  docker run -d --name omniroute --restart unless-stopped \
    -p 127.0.0.1:20128:20128 \
    --env-file "$ENVF" \
    -v omniroute-data:/app/data \
    "$IMAGE"
fi

# 3. Tekshiruv
echo "⏳ Ishga tushishini kutyapman…"
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:20128/ || true)
  [ "$code" != "000" ] && break; sleep 2
done
echo "HTTP $code  (307/200 = ishlayapti)"
docker port omniroute

if docker port omniroute | grep -vq '127.0.0.1'; then
  echo "⚠️  20128-port tashqariga ochiq! Konteynerni -p 127.0.0.1:20128:20128 bilan qayta yarating."
else
  echo "✅ 20128 faqat localhost'da."
fi
echo
echo "Dashboard parolini ko'rish (faqat o'zingiz, serverda): sudo grep INITIAL_PASSWORD $ENVF"
echo "Kompyuteringizdan ochish: ssh -L 20128:127.0.0.1:20128 USER@SERVER_IP  →  http://localhost:20128"
