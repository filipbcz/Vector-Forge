import os
from typing import Any, Dict, List, Optional, Tuple

import requests
from flask import Flask, jsonify, request

app = Flask(__name__)


class GatewayDispatchError(RuntimeError):
    def __init__(self, message: str, details: Dict[str, Any]):
        super().__init__(message)
        self.details = details


def _get_env(name: str, required: bool = False, default: str = "") -> str:
    value = os.getenv(name, default)
    if required and not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def _get_bool_env(name: str, default: bool = False) -> bool:
    raw = os.getenv(name, "1" if default else "0").strip().lower()
    return raw in {"1", "true", "yes", "on"}


def _load_config() -> Dict[str, Any]:
    return {
        "mode": _get_env("MODE", default="gateway").strip().lower() or "gateway",
        "openclaw_base_url": _get_env("OPENCLAW_BASE_URL", default="").strip(),
        "openclaw_token": _get_env("OPENCLAW_TOKEN", default="").strip(),
        "openclaw_to": _get_env("OPENCLAW_TO", default="").strip(),
        "openclaw_channel": _get_env("OPENCLAW_CHANNEL", default="telegram").strip() or "telegram",
        "openclaw_account_id": _get_env("OPENCLAW_ACCOUNT_ID", default="default").strip()
        or "default",
        "openclaw_dispatch_path": _get_env("OPENCLAW_DISPATCH_PATH", default="/message/send").strip()
        or "/message/send",
        "debug_logging": _get_bool_env("DEBUG_LOGGING", default=True),
        "telegram_forward": _get_bool_env("TELEGRAM_FORWARD", default=False),
        "telegram_bot_token": _get_env("TELEGRAM_BOT_TOKEN", default="").strip(),
        "telegram_chat_id": _get_env("TELEGRAM_CHAT_ID", default="").strip(),
        "ha_shared_token": _get_env("HA_SHARED_TOKEN", required=False, default=""),
        "listen_port": int(_get_env("LISTEN_PORT", required=False, default="8099")),
        "http_timeout_seconds": int(_get_env("HTTP_TIMEOUT_SECONDS", default="20")),
    }


def _validate_config(config: Dict[str, Any]) -> None:
    mode = config["mode"]
    if mode not in {"gateway", "telegram"}:
        raise RuntimeError("Invalid MODE. Allowed values: gateway | telegram")

    if mode == "gateway":
        if not config["openclaw_base_url"]:
            raise RuntimeError("OPENCLAW_BASE_URL is required when MODE=gateway")
        if not config["openclaw_to"]:
            raise RuntimeError("OPENCLAW_TO is required when MODE=gateway")

    if mode == "telegram" or config["telegram_forward"]:
        if not config["telegram_bot_token"]:
            raise RuntimeError(
                "TELEGRAM_BOT_TOKEN is required when MODE=telegram or TELEGRAM_FORWARD=true"
            )
        if not config["telegram_chat_id"]:
            raise RuntimeError(
                "TELEGRAM_CHAT_ID is required when MODE=telegram or TELEGRAM_FORWARD=true"
            )


def _validate_ha_token(expected: str) -> bool:
    if not expected:
        return True
    provided = request.headers.get("X-HA-Token", "")
    return provided == expected


def _normalize_base_url(base_url: str) -> str:
    return base_url.rstrip("/")


def _normalize_dispatch_path(dispatch_path: str) -> str:
    path = (dispatch_path or "").strip()
    if not path:
        return "/message/send"
    segments = [segment for segment in path.split("/") if segment]
    if not segments:
        return "/"
    return "/" + "/".join(segments)


def _join_url(base_url: str, path: str) -> str:
    return f"{base_url}{path}"


def _parse_json_response(response: requests.Response) -> Dict[str, Any]:
    try:
        data = response.json()
        if isinstance(data, dict):
            return data
        return {"_raw": data}
    except ValueError:
        return {"_raw_text": response.text[:500] if response.text else ""}


def _truncate_text(value: Optional[str], max_len: int = 300) -> str:
    if not value:
        return ""
    return value[:max_len]


def _attempt_gateway_dispatch(
    *,
    url: str,
    path: str,
    payload: Dict[str, Any],
    headers: Dict[str, str],
    timeout: int,
    debug_logging: bool,
) -> Dict[str, Any]:
    attempt: Dict[str, Any] = {"url": url, "path": path, "status": None, "body": "", "error": ""}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=timeout)
        attempt["status"] = response.status_code
        data = _parse_json_response(response)

        body_summary = data.get("error") or data.get("message") or data.get("_raw_text") or ""
        attempt["body"] = _truncate_text(str(body_summary))

        print(f"[voice-task-bridge] final_url={url} status_code={response.status_code}")

        return {"response": response, "data": data, "attempt": attempt}
    except requests.RequestException as exc:
        attempt["error"] = _truncate_text(str(exc))
        if debug_logging:
            print(f"[voice-task-bridge] final_url={url} status_code=network_error")
        return {"response": None, "data": {}, "attempt": attempt}


def _send_to_openclaw_gateway(config: Dict[str, Any], text: str) -> Dict[str, Any]:
    base_url = _normalize_base_url(config["openclaw_base_url"])
    dispatch_path = _normalize_dispatch_path(config.get("openclaw_dispatch_path", "/message/send"))
    timeout = config["http_timeout_seconds"]
    debug_logging = bool(config.get("debug_logging", True))

    headers: Dict[str, str] = {"Content-Type": "application/json"}
    auth_used = bool(config["openclaw_token"])
    if auth_used:
        headers["Authorization"] = f"Bearer {config['openclaw_token']}"

    payload = {
        "channel": config["openclaw_channel"],
        "accountId": config["openclaw_account_id"],
        "account_id": config["openclaw_account_id"],
        "target": config["openclaw_to"],
        "to": config["openclaw_to"],
        "message": text,
    }

    if debug_logging:
        print(
            f"[voice-task-bridge] selected_base_url={base_url} dispatch_path={dispatch_path}"
        )

    known_fallback_paths: List[str] = ["/api/v1/message/send", "/v1/message/send", "/message/send"]
    fallback_paths = [p for p in known_fallback_paths if p != dispatch_path]

    attempts: List[Dict[str, Any]] = []

    primary_url = _join_url(base_url, dispatch_path)
    primary_result = _attempt_gateway_dispatch(
        url=primary_url,
        path=dispatch_path,
        payload=payload,
        headers=headers,
        timeout=timeout,
        debug_logging=debug_logging,
    )
    attempts.append(primary_result["attempt"])

    primary_response = primary_result["response"]
    primary_data = primary_result["data"]

    if primary_response is not None and primary_response.status_code < 400:
        return {
            "endpoint": dispatch_path,
            "status_code": primary_response.status_code,
            "response": primary_data,
        }

    should_try_fallback = debug_logging

    if should_try_fallback:
        for fallback_path in fallback_paths:
            fallback_url = _join_url(base_url, fallback_path)
            fallback_result = _attempt_gateway_dispatch(
                url=fallback_url,
                path=fallback_path,
                payload=payload,
                headers=headers,
                timeout=timeout,
                debug_logging=debug_logging,
            )
            attempts.append(fallback_result["attempt"])

            fallback_response = fallback_result["response"]
            fallback_data = fallback_result["data"]

            if fallback_response is not None and fallback_response.status_code < 400:
                return {
                    "endpoint": fallback_path,
                    "status_code": fallback_response.status_code,
                    "response": fallback_data,
                }

    raise GatewayDispatchError(
        "Unable to dispatch task to OpenClaw Gateway",
        {
            "attempted_urls": [attempt["url"] for attempt in attempts],
            "attempts": attempts,
            "auth_used": auth_used,
        },
    )


def _send_to_telegram(config: Dict[str, Any], text: str) -> Dict[str, Any]:
    telegram_url = f"https://api.telegram.org/bot{config['telegram_bot_token']}/sendMessage"
    payload = {
        "chat_id": config["telegram_chat_id"],
        "text": f"[HA Voice Task] {text}",
    }
    response = requests.post(
        telegram_url,
        json=payload,
        timeout=config["http_timeout_seconds"],
    )
    data = _parse_json_response(response)

    if response.status_code != 200 or not data.get("ok"):
        description = data.get("description") or data.get("_raw_text") or "Unknown Telegram API error"
        raise RuntimeError(
            f"Telegram API error: status={response.status_code}, description={description}"
        )

    return data


def _dispatch_task(config: Dict[str, Any], text: str) -> Tuple[str, Dict[str, Any]]:
    mode = config["mode"]

    if mode == "telegram":
        return "telegram", _send_to_telegram(config, text)

    try:
        return "gateway", _send_to_openclaw_gateway(config, text)
    except Exception:
        if not config["telegram_forward"]:
            raise
        return "telegram_fallback", _send_to_telegram(config, text)


@app.route("/health", methods=["GET"])
def health() -> Any:
    return jsonify({"status": "ok"}), 200


@app.route("/task", methods=["POST"])
def task() -> Any:
    try:
        config = _load_config()
        _validate_config(config)
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

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return (
            jsonify(
                {
                    "error": "invalid_request",
                    "message": "Request body must be a JSON object",
                }
            ),
            400,
        )

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

    normalized_text = text.strip()

    try:
        dispatch_mode, dispatch_result = _dispatch_task(config, normalized_text)
    except requests.RequestException as exc:
        return (
            jsonify(
                {
                    "error": "upstream_network_error",
                    "message": f"Failed to reach upstream service: {exc}",
                }
            ),
            502,
        )
    except GatewayDispatchError as exc:
        return (
            jsonify(
                {
                    "error": "dispatch_error",
                    "message": str(exc),
                    **exc.details,
                }
            ),
            502,
        )
    except Exception as exc:
        return jsonify({"error": "dispatch_error", "message": str(exc)}), 502

    response_payload: Dict[str, Any] = {
        "status": "sent",
        "mode": dispatch_mode,
    }

    if dispatch_mode == "gateway":
        response_payload["message"] = "Task delivered to OpenClaw Gateway as inbound message"
        response_payload["gateway_endpoint"] = dispatch_result.get("endpoint")
    elif dispatch_mode == "telegram_fallback":
        response_payload["message"] = "Gateway dispatch failed, task forwarded to Telegram fallback"
        response_payload["telegram_message_id"] = dispatch_result.get("result", {}).get("message_id")
    else:
        response_payload["message"] = "Task forwarded to Telegram"
        response_payload["telegram_message_id"] = dispatch_result.get("result", {}).get("message_id")

    return jsonify(response_payload), 200


if __name__ == "__main__":
    cfg = _load_config()
    _validate_config(cfg)
    app.run(host="0.0.0.0", port=cfg["listen_port"])
