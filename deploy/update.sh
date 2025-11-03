#!/usr/bin/env bash
set -euo pipefail

# Site Survey Tool update script
# Pulls latest from Git, installs deps, builds, and restarts the systemd service.

APP_DIR="${1:-/opt/site_survey_tool}"
SERVICE_NAME="${SERVICE_NAME:-site-survey.service}"

echo "[update] Using APP_DIR=$APP_DIR"
echo "[update] Service name: $SERVICE_NAME"

if [ ! -d "$APP_DIR" ]; then
  echo "[update] ERROR: Directory $APP_DIR does not exist" >&2
  exit 1
fi

cd "$APP_DIR"

echo "[update] Git status before update:"
git status --short || true

echo "[update] Pulling latest changes..."
git pull --ff-only || {
  echo "[update] 'git pull' failed. Trying 'git fetch' + 'reset --hard origin/main'..."
  git fetch origin
  git reset --hard origin/main
}

echo "[update] Installing dependencies per package (shared/server/client)..."
# Prefer npm ci; on older npm, --prefix must come before the subcommand and may not be supported for 'ci'.
# Fallback to 'npm install' if 'ci' fails or is unsupported.
for pkg in shared server client; do
  echo "[update] Installing deps in $pkg..."
  npm --prefix "$pkg" ci \
    || (cd "$pkg" && npm ci) \
    || npm --prefix "$pkg" install \
    || (cd "$pkg" && npm install)
done

echo "[update] Building packages..."
for pkg in shared server client; do
  echo "[update] Building $pkg..."
  npm --prefix "$pkg" run build \
    || (cd "$pkg" && npm run build)
done

restart_cmd=(systemctl restart "$SERVICE_NAME")
status_cmd=(systemctl status "$SERVICE_NAME" --no-pager --full)

if [ "$EUID" -ne 0 ]; then
  # Not root: attempt with sudo (non-interactive)
  if command -v sudo >/dev/null 2>&1; then
    echo "[update] Restarting service with sudo..."
    if ! sudo -n "${restart_cmd[@]}"; then
      echo "[update] sudo needed. You may be prompted for password."
      sudo "${restart_cmd[@]}"
    fi
    echo "[update] Service status:"
    sudo "${status_cmd[@]}" || true
  else
    echo "[update] WARNING: sudo not found. Please restart the service manually:" >&2
    echo "  sudo systemctl restart $SERVICE_NAME" >&2
  fi
else
  echo "[update] Running as root. Restarting service..."
  "${restart_cmd[@]}"
  echo "[update] Service status:"
  "${status_cmd[@]}" || true
fi

echo "[update] Done."
