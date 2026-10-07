#!/usr/bin/env bash
# Birga — Ubuntu 22.04/24.04 serverga bir buyruq bilan o'rnatish
#   sudo bash install.sh
# O'rnatadi: Node.js 22, ffmpeg, Caddy (bepul HTTPS), coturn (o'z TURN serveringiz), systemd xizmati.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then echo "❌ sudo bilan ishga tushiring: sudo bash install.sh"; exit 1; fi
SRC="$(cd "$(dirname "$0")" && pwd)"
APP=/opt/birga
DATA=/var/lib/birga

echo "🟣 Birga o'rnatilmoqda…"
IP=$(curl -fsS https://api.ipify.org || curl -fsS https://ifconfig.me)
read -rp "Domen (masalan birga.uz). Domen bo'lmasa Enter bosing: " DOMAIN
if [ -z "$DOMAIN" ]; then
  DOMAIN="$(echo "$IP" | tr . -).sslip.io"   # bepul domen: IP manzil asosida
  echo "ℹ️  Bepul manzil ishlatiladi: $DOMAIN"
fi

echo
echo "SMS orqali kod yuborish usuli:"
echo "  1) Test rejimi (kod ekranda chiqadi — faqat sinov uchun)"
echo "  2) O'z Android telefoningiz + SIM karta (SMS Gateway for Android — eng arzon)"
echo "  3) Eskiz.uz (O'zbekiston)"
echo "  4) Twilio (barcha davlatlar)"
read -rp "Tanlang [1-4]: " SMSCH
SMS_ENV="SMS_PROVIDER=console"
case "$SMSCH" in
  2) read -rp "Gateway login: " GU; read -rp "Gateway parol: " GP
     SMS_ENV=$'SMS_PROVIDER=gateway\nGATEWAY_URL=https://api.sms-gate.app/3rdparty/v1\nGATEWAY_USER='"$GU"$'\nGATEWAY_PASS='"$GP" ;;
  3) read -rp "Eskiz email: " EE; read -rp "Eskiz parol: " EP
     SMS_ENV=$'SMS_ROUTES=998:eskiz,*:console\nESKIZ_EMAIL='"$EE"$'\nESKIZ_PASSWORD='"$EP" ;;
  4) read -rp "Twilio Account SID: " TS; read -rp "Twilio Auth Token: " TT; read -rp "Twilio raqam yoki Messaging Service SID: " TF
     if [[ "$TF" == MG* ]]; then TFL="TWILIO_MESSAGING_SERVICE=$TF"; else TFL="TWILIO_FROM=$TF"; fi
     SMS_ENV=$'SMS_PROVIDER=twilio\nTWILIO_SID='"$TS"$'\nTWILIO_TOKEN='"$TT"$'\n'"$TFL" ;;
esac

echo "📦 Paketlar…"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y curl ca-certificates gnupg build-essential python3 ffmpeg coturn openssl \
  debian-keyring debian-archive-keyring apt-transport-https

if ! command -v node >/dev/null || [ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi

echo "📁 Ilova…"
id -u birga >/dev/null 2>&1 || useradd --system --home "$APP" --shell /usr/sbin/nologin birga
mkdir -p "$APP" "$DATA/data" "$DATA/uploads"
cp -r "$SRC"/. "$APP"/
rm -rf "$APP/node_modules" "$APP/data" "$APP/demo"
cd "$APP" && npm ci --omit=dev

TURN_SECRET=$(openssl rand -hex 24)
if [ ! -f "$APP/.env" ]; then
  cat > "$APP/.env" <<EOF
PORT=3000
JWT_SECRET=$(openssl rand -hex 32)
DATA_DIR=$DATA/data
UPLOAD_DIR=$DATA/uploads
MAX_UPLOAD_MB=100
$SMS_ENV
TURN_HOST=$DOMAIN
TURN_SECRET=$TURN_SECRET
EOF
else
  TURN_SECRET=$(grep '^TURN_SECRET=' "$APP/.env" | cut -d= -f2- || echo "$TURN_SECRET")
fi
chown -R birga:birga "$APP" "$DATA"; chmod 600 "$APP/.env"

echo "📞 TURN server (coturn) — turli davlat va tarmoqlar orasida qo'ng'iroq ulanishi uchun…"
cat > /etc/turnserver.conf <<EOF
listening-port=3478
fingerprint
use-auth-secret
static-auth-secret=$TURN_SECRET
realm=$DOMAIN
external-ip=$IP
min-port=49152
max-port=65535
total-quota=1000
stale-nonce=600
no-multicast-peers
no-cli
no-tlsv1
no-tlsv1_1
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=169.254.0.0-169.254.255.255
EOF
sed -i 's/^#\?TURNSERVER_ENABLED=.*/TURNSERVER_ENABLED=1/' /etc/default/coturn 2>/dev/null || true
systemctl enable coturn && systemctl restart coturn

echo "⚙️  Xizmat…"
cat > /etc/systemd/system/birga.service <<EOF
[Unit]
Description=Birga messenjer
After=network.target

[Service]
User=birga
WorkingDirectory=$APP
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=3
Environment=NODE_ENV=production
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable birga
systemctl restart birga

echo "🔒 HTTPS (Caddy + Let's Encrypt, bepul)…"
cat > /etc/caddy/Caddyfile <<EOF
$DOMAIN {
  encode gzip
  request_body {
    max_size 110MB
  }
  reverse_proxy localhost:3000
}
EOF
systemctl reload caddy || systemctl restart caddy

if command -v ufw >/dev/null && ufw status | grep -q active; then
  ufw allow 80/tcp; ufw allow 443/tcp; ufw allow 3478/tcp; ufw allow 3478/udp; ufw allow 49152:65535/udp
fi

sleep 3
echo
echo "✅ Tayyor!  Birga manzili:  https://$DOMAIN"
echo "   Bulut provayderingiz panelida (firewall/security group) shu portlarni oching:"
echo "   80, 443 (TCP) · 3478 (TCP+UDP) · 49152-65535 (UDP)"
echo "   Loglar: journalctl -u birga -f    Sozlamalar: $APP/.env"
