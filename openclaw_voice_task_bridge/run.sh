#!/usr/bin/with-contenv bashio
set -euo pipefail

OPTIONS_FILE="/data/options.json"

if [[ ! -f "${OPTIONS_FILE}" ]]; then
  echo "ERROR: Missing ${OPTIONS_FILE}"
  exit 1
fi

export MODE
export GATEWAY_URL
export GATEWAY_TOKEN
export GATEWAY_METHOD
export GATEWAY_TARGET
export AGENT_ID
export SESSION_KEY
export ACCOUNT_ID
export CHANNEL
export DEBUG_LOGGING
export TELEGRAM_FORWARD
export TELEGRAM_BOT_TOKEN
export TELEGRAM_CHAT_ID
export HA_SHARED_TOKEN
export LISTEN_PORT
export HTTP_TIMEOUT_SECONDS
export DISPATCH_RETRIES
export RETRY_BACKOFF_SECONDS

# Deprecated compatibility keys (still supported in app.py)
export OPENCLAW_BASE_URL
export OPENCLAW_TOKEN
export OPENCLAW_TO
export OPENCLAW_CHANNEL
export OPENCLAW_ACCOUNT_ID

MODE="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("mode","gateway_rpc") or "gateway_rpc").strip().lower())')"
GATEWAY_URL="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("gateway_url","") or "").strip())')"
GATEWAY_TOKEN="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("gateway_token","") or "").strip())')"
GATEWAY_METHOD="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("gateway_method","openresponses") or "openresponses").strip().lower())')"
GATEWAY_TARGET="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("gateway_target","") or "").strip())')"
AGENT_ID="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("agent_id","main") or "main").strip())')"
SESSION_KEY="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("session_key","") or "").strip())')"
ACCOUNT_ID="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("account_id","default") or "default").strip())')"
CHANNEL="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("channel","telegram") or "telegram").strip())')"
DEBUG_LOGGING="$(python3 -c 'import json;print("true" if bool(json.load(open("/data/options.json")).get("debug_logging", True)) else "false")')"
TELEGRAM_FORWARD="$(python3 -c 'import json;print("true" if bool(json.load(open("/data/options.json")).get("telegram_forward", False)) else "false")')"
TELEGRAM_BOT_TOKEN="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("telegram_bot_token","") or "").strip())')"
TELEGRAM_CHAT_ID="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("telegram_chat_id","") or "").strip())')"
HA_SHARED_TOKEN="$(python3 -c 'import json;print(json.load(open("/data/options.json")).get("ha_shared_token",""))')"
LISTEN_PORT="$(python3 -c 'import json;print(json.load(open("/data/options.json")).get("listen_port",8099))')"
HTTP_TIMEOUT_SECONDS="$(python3 -c 'import json;print(json.load(open("/data/options.json")).get("http_timeout_seconds",20))')"
DISPATCH_RETRIES="$(python3 -c 'import json;print(json.load(open("/data/options.json")).get("dispatch_retries",2))')"
RETRY_BACKOFF_SECONDS="$(python3 -c 'import json;print(json.load(open("/data/options.json")).get("retry_backoff_seconds",1))')"

OPENCLAW_BASE_URL="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("openclaw_base_url","") or "").strip())')"
OPENCLAW_TOKEN="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("openclaw_token","") or "").strip())')"
OPENCLAW_TO="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("openclaw_to","") or "").strip())')"
OPENCLAW_CHANNEL="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("openclaw_channel","") or "").strip())')"
OPENCLAW_ACCOUNT_ID="$(python3 -c 'import json;print((json.load(open("/data/options.json")).get("openclaw_account_id","") or "").strip())')"

if [[ "${MODE}" != "gateway_rpc" && "${MODE}" != "telegram" && "${MODE}" != "gateway" ]]; then
  echo "ERROR: mode must be 'gateway_rpc', 'gateway' (deprecated alias), or 'telegram'"
  exit 1
fi

if [[ "${MODE}" == "gateway_rpc" || "${MODE}" == "gateway" ]]; then
  if [[ -z "${GATEWAY_URL}" && -z "${OPENCLAW_BASE_URL}" ]]; then
    echo "ERROR: gateway_url (or deprecated openclaw_base_url) is required in gateway_rpc mode"
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

echo "Starting Home Assistant OpenClaw add-on v3 on port ${LISTEN_PORT} (mode=${MODE}, gateway_method=${GATEWAY_METHOD})"
exec python3 /app/app.py
