#!/bin/bash
# =============================================================================
# LifeSpan — SSL certificate renewal (NOT USED)
# =============================================================================
# This project uses Cloudflare Origin Certificates which are valid for up to
# 15 years. Automated renewal via certbot is not needed.
#
# When the Origin Certificate expires:
#   1. Generate a new one in Cloudflare dashboard (SSL/TLS → Origin Server)
#   2. Replace /opt/lifespan/ssl/fullchain.pem and privkey.pem
#   3. Restart nginx:  docker compose restart nginx
#
# See DEPLOYMENT.md section 9 for details.
# =============================================================================

set -euo pipefail

echo "This script is no longer used."
echo ""
echo "SSL is handled via Cloudflare Origin Certificates (valid up to 15 years)."
echo "See DEPLOYMENT.md section 9 for manual renewal instructions."
