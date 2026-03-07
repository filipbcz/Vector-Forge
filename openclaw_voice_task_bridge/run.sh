#!/usr/bin/with-contenv bashio
set -euo pipefail

OPTIONS_FILE="/data/options.json"

if [[ ! -f "${OPTIONS_FILE}" ]]; then
  echo "ERROR: Missing ${OPTIONS_FILE}"
  exit 1
fi

export MODE
export OPENCLAW_BASE_URL
export OPENCLAW_TOKEN
export OPENCLAW_TO
export OPENCLAW_CHANNEL
export OPENCLAW_ACCOUNT_ID
export TELEGRAM_FORWARD
export TELEGRAM_BOT_TOKEN
export TELEGRAM_CHAT_ID
export HA_SHARED_TOKEN
export LISTEN_PORT

MODE="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("mode","gateway") or "gateway").strip().lower())')"
OPENCLAW_BASE_URL="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("openclaw_base_url","") or "").strip())')"
OPENCLAW_TOKEN="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("openclaw_token","") or "").strip())')"
OPENCLAW_TO="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("openclaw_to","") or "").strip())')"
OPENCLAW_CHANNEL="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("openclaw_channel","telegram") or "telegram").strip())')"
OPENCLAW_ACCOUNT_ID="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("openclaw_account_id","default") or "default").strip())')"
TELEGRAM_FORWARD="$(python3 -c 'import json;print("true" if bool(json.load(open("/data/options.json")).get("telegram_forward", False)) else "false")')"
TELEGRAM_BOT_TOKEN="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("telegram_bot_token","") or "").strip())')"
TELEGRAM_CHAT_ID="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("telegram_chat_id","") or "").strip())')"
HA_SHARED_TOKEN="$(python3 -c 'import json;print(json.load(open("/data/options.json")).get("ha_shared_token",""))')"
LISTEN_PORT="$(python3 -c 'import json;print(json.load(open("/data/options.json")).get("listen_port",8099))')"

if [[ "${MODE}" != "gateway" && "${MODE}" != "telegram" ]]; then
  echo "ERROR: mode must be 'gateway' or 'telegram'"
  exit 1
fi

if [[ "${MODE}" == "gateway" ]]; then
  if [[ -z "${OPENCLAW_BASE_URL}" ]]; then
    echo "ERROR: openclaw_base_url is required in gateway mode"
    exit 1
  fi
  if [[ -z "${OPENCLAW_TO}" ]]; then
    echo "ERROR: openclaw_to is required in gateway mode"
    exit 1
  fi
fi

if [[ "${MODE}" == "telegram" || "${TELEGRAM_FORWARD}" == "true" ]]; then
  if [[ -z "${TELEGRAM_BOT_TOKEN}" ]]; then
    echo "ERROR: telegram_bot_token is required for telegram mode/fallback"
    exit 1
  fi
  if [[ -z "${TELEGRAM_CHAT_ID}" ]]; then
    echo "ERROR: telegram_chat_id is required for telegram mode/fallback"
    exit 1
  fi
fi

echo "Starting Home Assistant OpenClaw add-on v2 on port ${LISTEN_PORT} (mode=${MODE})"
exec python3 /app/app.py
