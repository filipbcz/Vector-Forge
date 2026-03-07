import os
from typing import Any, Dict

import requests
from flask import Flask, jsonify, request

app = Flask(__name__)


def _get_env(name: str, required: bool = False, default: str = "") -> str:
    value = os.getenv(name, default)
    if required and not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _load_config() -> Dict[str, Any]:
    return {
        "telegram_bot_token": _get_env("TELEGRAM_BOT_TOKEN", required=True),
        "telegram_chat_id": _get_env("TELEGRAM_CHAT_ID", required=True),
        "ha_shared_token": _get_env("HA_SHARED_TOKEN", required=False, default=""),
        "listen_port": int(_get_env("LISTEN_PORT", required=False, default="8099")),
    }


def _validate_ha_token(expected: str) -> bool:
    if not expected:
        return True
    provided = request.headers.get("X-HA-Token", "")
    return provided == expected


def _send_to_telegram(bot_token: str, chat_id: str, text: str) -> Dict[str, Any]:
    telegram_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": f"[HA Voice Task] {text}",
    }
    response = requests.post(telegram_url, json=payload, timeout=15)
    try:
        data = response.json()
    except ValueError as exc:
        raise RuntimeError(
            f"Telegram API returned non-JSON response (status={response.status_code})"
        ) from exc

    if response.status_code != 200 or not data.get("ok"):
        description = data.get("description", "Unknown Telegram API error")
        raise RuntimeError(
            f"Telegram API error: status={response.status_code}, description={description}"
        )

    return data


@app.route("/health", methods=["GET"])
def health() -> Any:
    return jsonify({"status": "ok"}), 200


@app.route("/task", methods=["POST"])
def task() -> Any:
    try:
        config = _load_config()
    except Exception as exc:
        return jsonify({"error": "configuration_error", "message": str(exc)}), 500

    if not _validate_ha_token(config["ha_shared_token"]):
        return (
            jsonify(
                {
                    "error": "unauthorized",
                    "message": "Missing or invalid X-HA-Token header",
                }
            ),
            401,
        )

    if not request.is_json:
        return (
            jsonify(
                {
                    "error": "invalid_request",
                    "message": "Content-Type must be application/json",
                }
            ),
            400,
        )

    payload = request.get_json(silent=True) or {}
    text = payload.get("text")

    if not isinstance(text, str) or not text.strip():
        return (
            jsonify(
                {
                    "error": "validation_error",
                    "message": "JSON field 'text' is required and must be a non-empty string",
                }
            ),
            400,
        )

    try:
        telegram_response = _send_to_telegram(
            config["telegram_bot_token"],
            config["telegram_chat_id"],
            text.strip(),
        )
    except requests.RequestException as exc:
        return (
            jsonify(
                {
                    "error": "telegram_network_error",
                    "message": f"Failed to connect to Telegram API: {exc}",
                }
            ),
            502,
        )
    except Exception as exc:
        return jsonify({"error": "telegram_api_error", "message": str(exc)}), 502

    return (
        jsonify(
            {
                "status": "sent",
                "message": "Task forwarded to Telegram",
                "telegram_message_id": telegram_response.get("result", {}).get("message_id"),
            }
        ),
        200,
    )


if __name__ == "__main__":
    cfg = _load_config()
    app.run(host="0.0.0.0", port=cfg["listen_port"])
