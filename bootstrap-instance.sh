#!/bin/bash

# bootstrap-instance.sh — One-time EC2 instance hardening
#
# Configures:
#   1. 1GB swap file (防 OOM 兜底)
#   2. Docker log rotation (10MB × 3 files per container, 防磁盘填爆)
#
# Idempotent — safe to run on every deploy. Each step checks if its
# configuration is already in place and skips if so.

set -e

echo "### Bootstrap: checking instance-level hardening ..."

# ── 1. Swap file (1GB) ────────────────────────────────────────────────
if swapon --show | grep -q /swapfile; then
  echo "  ✓ swap already enabled, skipping"
else
  echo "  → creating 1GB swap file at /swapfile ..."
  sudo dd if=/dev/zero of=/swapfile bs=1M count=1024 status=none
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile >/dev/null
  sudo swapon /swapfile
  echo "  ✓ swap enabled"
fi

if grep -q "^/swapfile " /etc/fstab; then
  echo "  ✓ /etc/fstab already has swap entry"
else
  echo "  → adding swap to /etc/fstab for persistence ..."
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  echo "  ✓ fstab updated"
fi

# ── 2. Docker log rotation (10MB × 3) ─────────────────────────────────
DOCKER_DAEMON_JSON=/etc/docker/daemon.json
DESIRED_DAEMON_JSON='{ "log-driver": "json-file", "log-opts": { "max-size": "10m", "max-file": "3" } }'

if [ -f "$DOCKER_DAEMON_JSON" ] && grep -q '"max-size"' "$DOCKER_DAEMON_JSON"; then
  echo "  ✓ docker log rotation already configured"
else
  echo "  → writing $DOCKER_DAEMON_JSON ..."
  sudo mkdir -p /etc/docker
  echo "$DESIRED_DAEMON_JSON" | sudo tee "$DOCKER_DAEMON_JSON" >/dev/null
  echo "  → restarting dockerd (containers will be recreated by deploy step) ..."
  sudo systemctl restart docker
  echo "  ✓ docker log rotation enabled"
fi

echo "### Bootstrap complete."
