#!/bin/bash
# =============================================================================
# LifeSpan — SSL certificate renewal (run via cron)
# =============================================================================
# Cron: 0 3 * * * /opt/lifespan/scripts/renew-ssl.sh >> /var/log/ssl-renew.log 2>&1
# =============================================================================

set -euo pipefail
cd /opt/lifespan

docker compose run --rm certbot renew --quiet
docker compose exec nginx nginx -s reload
