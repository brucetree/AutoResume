#!/bin/bash

# setup-ssl.sh — First-time SSL certificate setup for autoresume.org
# Supports any ACME-compatible CA (ZeroSSL, Let's Encrypt, etc.)
#
# Usage:
#   ZEROSSL_EAB_KID=<kid> ZEROSSL_EAB_HMAC_KEY=<hmac> bash setup-ssl.sh
#
# Required environment variables:
#   ZEROSSL_EAB_KID       — EAB Key ID from ZeroSSL dashboard (Developer > EAB Credentials)
#   ZEROSSL_EAB_HMAC_KEY  — EAB HMAC Key from ZeroSSL dashboard

set -e

# Validate required credentials
if [ -z "$ZEROSSL_EAB_KID" ] || [ -z "$ZEROSSL_EAB_HMAC_KEY" ]; then
  echo "ERROR: ZEROSSL_EAB_KID and ZEROSSL_EAB_HMAC_KEY must be set."
  echo "Usage: ZEROSSL_EAB_KID=<kid> ZEROSSL_EAB_HMAC_KEY=<hmac> bash setup-ssl.sh"
  exit 1
fi

domains=(autoresume.org www.autoresume.org)
email="yy.bruceliu@gmail.com"
data_path="/home/ec2-user/autoresume/ssl"
acme_server="https://acme.zerossl.com/v2/DV90"

echo "### Creating required directories ..."
mkdir -p "$data_path/certs"
mkdir -p "$data_path/www"
mkdir -p "$data_path/lib"

echo "### Downloading recommended TLS parameters ..."
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/certs/options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/certs/ssl-dhparams.pem"

echo "### Creating dummy certificate for ${domains[0]} ..."
path="/etc/ssl/acme/live/${domains[0]}"
mkdir -p "$data_path/certs/live/${domains[0]}"
docker run --rm -v "$data_path/certs:/etc/ssl/acme" \
  --entrypoint openssl alpine/openssl \
  req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$path/privkey.pem" \
  -out "$path/fullchain.pem" \
  -subj "/CN=localhost"

echo "### Starting nginx with dummy certificate ..."
cd /home/ec2-user/autoresume
docker-compose -f docker-compose.prod.yml up -d nginx

echo "### Waiting for nginx to start ..."
sleep 5

echo "### Deleting dummy certificate ..."
docker run --rm -v "$data_path/certs:/etc/ssl/acme" \
  --entrypoint rm alpine/openssl \
  -rf "/etc/ssl/acme/live/${domains[0]}" \
       "/etc/ssl/acme/archive/${domains[0]}" \
       "/etc/ssl/acme/renewal/${domains[0]}.conf"

echo "### Requesting SSL certificate for ${domains[0]} via ZeroSSL ..."

# Build domain args
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

docker run --rm \
  -v "$data_path/certs:/etc/ssl/acme" \
  -v "$data_path/www:/var/www/certbot" \
  -v "$data_path/lib:/var/lib/letsencrypt" \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  --config-dir /etc/ssl/acme \
  --server "$acme_server" \
  --eab-kid "$ZEROSSL_EAB_KID" \
  --eab-hmac-key "$ZEROSSL_EAB_HMAC_KEY" \
  --email "$email" \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  $domain_args

# Check if certificate was obtained successfully
# Use docker to verify (archive dir is root-owned, not readable by ec2-user directly)
if ! docker run --rm -v "$data_path/certs:/etc/ssl/acme" alpine \
    test -f "/etc/ssl/acme/live/${domains[0]}/fullchain.pem"; then
  echo "### ERROR: Failed to obtain certificate. Restoring dummy certificate so nginx can start ..."
  mkdir -p "$data_path/certs/live/${domains[0]}"
  docker run --rm -v "$data_path/certs:/etc/ssl/acme" \
    --entrypoint openssl alpine/openssl \
    req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$path/privkey.pem" \
    -out "$path/fullchain.pem" \
    -subj "/CN=localhost"
  echo "### Dummy certificate restored. Re-run this script once the issue is resolved."
  exit 1
fi

echo "### Reloading nginx ..."
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "### Done! SSL certificate installed for ${domains[0]}"
