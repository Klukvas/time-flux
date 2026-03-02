#!/bin/bash
# =============================================================================
# LifeSpan — First-time SSL setup with Let's Encrypt
# =============================================================================
# Usage:  ./scripts/init-ssl.sh yourdomain.com your@email.com
# Run on: Production server (inside /opt/lifespan)
# =============================================================================

set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain> <email>}"
EMAIL="${2:?Usage: $0 <domain> <email>}"
COMPOSE="docker compose"

echo "==> Setting up SSL for ${DOMAIN}"

# ── Step 1: Create a temporary self-signed cert so nginx can start ──────────
echo "==> Creating temporary self-signed certificate..."
$COMPOSE run --rm --entrypoint "" certbot sh -c "
  mkdir -p /etc/letsencrypt/live/${DOMAIN}
  openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
    -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
    -out    /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
    -subj   '/CN=localhost'
"

# ── Step 2: Start nginx with the temporary cert ────────────────────────────
echo "==> Starting nginx..."
$COMPOSE up -d nginx

# ── Step 3: Remove the temporary cert ──────────────────────────────────────
echo "==> Removing temporary certificate..."
$COMPOSE run --rm --entrypoint "" certbot sh -c "
  rm -rf /etc/letsencrypt/live/${DOMAIN}
  rm -rf /etc/letsencrypt/archive/${DOMAIN}
  rm -rf /etc/letsencrypt/renewal/${DOMAIN}.conf
"

# ── Step 4: Get the real certificate from Let's Encrypt ────────────────────
echo "==> Requesting certificate from Let's Encrypt..."
$COMPOSE run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email "${EMAIL}" \
  --agree-tos \
  --no-eff-email \
  -d "${DOMAIN}"

# ── Step 5: Reload nginx with the real cert ────────────────────────────────
echo "==> Reloading nginx with real certificate..."
$COMPOSE exec nginx nginx -s reload

echo ""
echo "==> SSL setup complete!"
echo "    https://${DOMAIN} is now live."
echo ""
echo "    To set up auto-renewal, add this cron job:"
echo "    0 3 * * * cd /opt/lifespan && docker compose run --rm certbot renew --quiet && docker compose exec nginx nginx -s reload"
