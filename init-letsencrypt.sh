#!/bin/bash

# init-letsencrypt.sh — First-time SSL certificate setup for autoresume.org
# Run on EC2: chmod +x init-letsencrypt.sh && sudo ./init-letsencrypt.sh

domains=(autoresume.org www.autoresume.org)
email="yy.bruceliu@gmail.com"
staging=0 # Set to 1 for testing to avoid rate limits
data_path="/home/ec2-user/autoresume/certbot"

echo "### Creating required directories ..."
mkdir -p "$data_path/conf"
mkdir -p "$data_path/www"
mkdir -p "$data_path/lib"

echo "### Downloading recommended TLS parameters ..."
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"

echo "### Creating dummy certificate for ${domains[0]} ..."
path="/etc/letsencrypt/live/${domains[0]}"
mkdir -p "$data_path/conf/live/${domains[0]}"
docker run --rm -v "$data_path/conf:/etc/letsencrypt" \
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
docker run --rm -v "$data_path/conf:/etc/letsencrypt" \
  --entrypoint rm alpine/openssl \
  -rf "/etc/letsencrypt/live/${domains[0]}" \
  "/etc/letsencrypt/archive/${domains[0]}" \
  "/etc/letsencrypt/renewal/${domains[0]}.conf"

echo "### Requesting Let's Encrypt certificate for ${domains[0]} ..."

# Build domain args
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Select staging or production
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker run --rm \
  -v "$data_path/conf:/etc/letsencrypt" \
  -v "$data_path/www:/var/www/certbot" \
  -v "$data_path/lib:/var/lib/letsencrypt" \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  $staging_arg \
  --email $email \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  $domain_args

# Check if certificate was obtained successfully
if [ ! -f "$data_path/conf/live/${domains[0]}/fullchain.pem" ]; then
  echo "### ERROR: Failed to obtain certificate. Restoring dummy certificate for nginx to start..."
  mkdir -p "$data_path/conf/live/${domains[0]}"
  docker run --rm -v "$data_path/conf:/etc/letsencrypt" \
    --entrypoint openssl alpine/openssl \
    req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$path/privkey.pem" \
    -out "$path/fullchain.pem" \
    -subj "/CN=localhost"
  echo "### Dummy certificate restored. Re-run this script later to get a real certificate."
  exit 1
fi

echo "### Reloading nginx ..."
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "### Done! SSL certificate installed for ${domains[0]}"
