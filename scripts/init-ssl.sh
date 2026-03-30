#!/bin/bash
# =============================================================================
# LifeSpan — SSL setup with Cloudflare Origin Certificate
# =============================================================================
# This project uses Cloudflare Origin Certificates (NOT Let's Encrypt/certbot).
#
# To set up SSL:
#   1. Generate an Origin Certificate in Cloudflare dashboard:
#      SSL/TLS → Origin Server → Create Certificate
#   2. Copy the certificate and key to the server:
#      /opt/lifespan/ssl/fullchain.pem   (Origin Certificate)
#      /opt/lifespan/ssl/privkey.pem     (Private Key)
#   3. Set Cloudflare SSL mode to Full (Strict)
#   4. Restart nginx:  docker compose restart nginx
#
# Origin Certificates are valid for up to 15 years.
# No automated renewal (certbot/cron) is needed.
# =============================================================================

set -euo pipefail

echo "This script is a placeholder."
echo ""
echo "SSL is handled via Cloudflare Origin Certificates."
echo "See DEPLOYMENT.md section 9 for setup instructions."
echo ""
echo "Required files on server:"
echo "  /opt/lifespan/ssl/fullchain.pem"
echo "  /opt/lifespan/ssl/privkey.pem"
