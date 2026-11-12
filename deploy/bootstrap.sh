#!/usr/bin/env bash
# Установка Live Football на Ubuntu: статический сайт + CMS (Payload).
# Запуск: curl -fsSL https://raw.githubusercontent.com/amithaver/matchcenter-ru/main/deploy/bootstrap.sh | bash
set -euo pipefail

APP_DIR=/opt/livefootball
REPO=https://github.com/amithaver/matchcenter-ru.git
LOG=/var/log/livefootball-bootstrap.log
exec > >(tee -a "$LOG") 2>&1

echo "=== $(date) старт установки ==="
export DEBIAN_FRONTEND=noninteractive

if [ "$(id -u)" -ne 0 ]; then echo "нужен root"; exit 1; fi

echo "--- память и диск ---"
free -m | head -2
df -h / | tail -1
echo "--- занятые порты ---"
ss -tlnp | awk 'NR==1 || /:80 |:443 |:3000 |:3001 /'

echo "--- пакеты ---"
apt-get update -qq
apt-get install -y -qq nginx git curl ca-certificates

if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 20 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi
node -v

echo "--- код ---"
rm -rf "$APP_DIR"
git clone --depth 1 "$REPO" "$APP_DIR"

echo "--- статический сайт ---"
cd "$APP_DIR"
node scripts/build-static.mjs

echo "--- nginx: сайт на 80 ---"
cat >/etc/nginx/sites-available/livefootball <<'NGINX'
server {
    listen 80 default_server;
    server_name _;
    root /opt/livefootball/dist;
    index index.html;
    location / { try_files $uri $uri/ $uri/index.html =404; }
    location = /healthz { return 200 "ok\n"; }
}
NGINX
ln -sf /etc/nginx/sites-available/livefootball /etc/nginx/sites-enabled/livefootball
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "--- ufw: открыть 80/443, если включён ---"
if ufw status 2>/dev/null | grep -q "Status: active"; then ufw allow 80/tcp; ufw allow 443/tcp; fi

echo "=== ГОТОВО ==="
echo "Сайт: http://$(curl -s -4 ifconfig.me || hostname -I | awk '{print $1}')"
echo "Лог: $LOG"
echo "CMS ещё не установлена (нужен отдельный шаг после проверки памяти)."
