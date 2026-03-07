#!/usr/bin/with-contenv bashio
set -euo pipefail

OPTIONS_FILE="/data/options.json"

if [[ ! -f "${OPTIONS_FILE}" ]]; then
  echo "ERROR: Missing ${OPTIONS_FILE}"
  exit 1
fi

export TELEGRAM_BOT_TOKEN
export TELEGRAM_CHAT_ID
export HA_SHARED_TOKEN
export LISTEN_PORT

TELEGRAM_BOT_TOKEN="$(python3 -c 'import json;print(json.load(open("/data/options.json")).get("telegram_bot_token",""))')"
TELEGRAM_CHAT_ID="$(python3 -c 'import json;print(json.load(open("/data/options.json")).get("telegram_chat_id",""))')"
HA_SHARED_TOKEN="$(python3 -c 'import json;print(json.load(open("/data/options.json")).get("ha_shared_token",""))')"
LISTEN_PORT="$(python3 -c 'import json;print(json.load(open("/data/options.json")).get("listen_port",8099))')"

if [[ -z "${TELEGRAM_BOT_TOKEN}" ]]; then
  echo "ERROR: telegram_bot_token is required"
  exit 1
fi

if [[ -z "${TELEGRAM_CHAT_ID}" ]]; then
  echo "ERROR: telegram_chat_id is required"
  exit 1
fi

echo "Starting Home Assistant OpenClaw add-on on port ${LISTEN_PORT}"
exec python3 /app/app.py
