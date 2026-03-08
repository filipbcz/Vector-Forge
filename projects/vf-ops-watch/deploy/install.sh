#!/usr/bin/env bash
set -euo pipefail

SERVICE_NAME="vf-ops-watch.service"
TIMER_NAME="vf-ops-watch.timer"
SYSTEMD_DIR="/etc/systemd/system"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ ! -f "$SCRIPT_DIR/$SERVICE_NAME" || ! -f "$SCRIPT_DIR/$TIMER_NAME" ]]; then
  echo "Missing unit files in $SCRIPT_DIR" >&2
  exit 1
fi

echo "Installing $SERVICE_NAME and $TIMER_NAME to $SYSTEMD_DIR"
sudo cp "$SCRIPT_DIR/$SERVICE_NAME" "$SYSTEMD_DIR/$SERVICE_NAME"
sudo cp "$SCRIPT_DIR/$TIMER_NAME" "$SYSTEMD_DIR/$TIMER_NAME"

sudo systemctl daemon-reload
sudo systemctl enable --now "$TIMER_NAME"

echo "Done. Current timer status:"
systemctl status "$TIMER_NAME" --no-pager || true

echo "To run immediately: sudo systemctl start $SERVICE_NAME"
