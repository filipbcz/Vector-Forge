import os
import time
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


def _get_int_env(name: str, default: int) -> int:
    raw = _get_env(name, default=str(default)).strip()
    try:
        return int(raw)
    except ValueError as exc:
        raise RuntimeError(f"Invalid integer for {name}: {raw}") from exc


def _load_config() -> Dict[str, Any]:
    mode = _get_env("MODE", default="gateway_rpc").strip().lower() or "gateway_rpc"

    # New keys
    gateway_url = _get_env("GATEWAY_URL", default="").strip()
    gateway_token = _get_env("GATEWAY_TOKEN", default="").strip()
    gateway_method = _get_env("GATEWAY_METHOD", default="openresponses").strip().lower() or "openresponses"
    gateway_target = _get_env("GATEWAY_TARGET", default="").strip()
    account_id = _get_env("ACCOUNT_ID", default="default").strip() or "default"
    channel = _get_env("CHANNEL", default="telegram").strip() or "telegram"

    # Backward compatibility aliases (deprecated)
    legacy_openclaw_base_url = _get_env("OPENCLAW_BASE_URL", default="").strip()
    legacy_openclaw_token = _get_env("OPENCLAW_TOKEN", default="").strip()
    legacy_openclaw_to = _get_env("OPENCLAW_TO", default="").strip()
    legacy_openclaw_channel = _get_env("OPENCLAW_CHANNEL", default="").strip()
    legacy_openclaw_account_id = _get_env("OPENCLAW_ACCOUNT_ID", default="").strip()

    if not gateway_url and legacy_openclaw_base_url:
        gateway_url = legacy_openclaw_base_url
    if not gateway_token and legacy_openclaw_token:
        gateway_token = legacy_openclaw_token
    if not gateway_target and legacy_openclaw_to:
        gateway_target = legacy_openclaw_to
    if channel == "telegram" and legacy_openclaw_channel:
        channel = legacy_openclaw_channel
    if account_id == "default" and legacy_openclaw_account_id:
        account_id = legacy_openclaw_account_id

    return {
        "mode": mode,
        "gateway_url": gateway_url,
        "gateway_token": gateway_token,
        "gateway_method": gateway_method,
        "gateway_target": gateway_target,
        "account_id": account_id,
        "channel": channel,
        "debug_logging": _get_bool_env("DEBUG_LOGGING", default=True),
        "telegram_forward": _get_bool_env("TELEGRAM_FORWARD", default=False),
        "telegram_bot_token": _get_env("TELEGRAM_BOT_TOKEN", default="").strip(),
        "telegram_chat_id": _get_env("TELEGRAM_CHAT_ID", default="").strip(),
        "deliver_agent_reply_to_telegram": _get_bool_env("DELIVER_AGENT_REPLY_TO_TELEGRAM", default=True),
        "agent_reply_prefix": _get_env("AGENT_REPLY_PREFIX", default="[Astra Reply]").strip() or "[Astra Reply]",
        "ha_shared_token": _get_env("HA_SHARED_TOKEN", default=""),
        "listen_port": _get_int_env("LISTEN_PORT", default=8099),
        "http_timeout_seconds": _get_int_env("HTTP_TIMEOUT_SECONDS", default=20),
        "dispatch_retries": max(1, _get_int_env("DISPATCH_RETRIES", default=2)),
        "retry_backoff_seconds": max(0, _get_int_env("RETRY_BACKOFF_SECONDS", default=1)),
        "agent_id": _get_env("AGENT_ID", default="main").strip() or "main",
        "session_key": _get_env("SESSION_KEY", default="").strip(),
        "deprecated_keys_used": {
            "openclaw_base_url": bool(legacy_openclaw_base_url),
            "openclaw_token": bool(legacy_openclaw_token),
            "openclaw_to": bool(legacy_openclaw_to),
            "openclaw_channel": bool(legacy_openclaw_channel),
            "openclaw_account_id": bool(legacy_openclaw_account_id),
        },
    }


def _validate_config(config: Dict[str, Any]) -> None:
    if config["mode"] not in {"gateway_rpc", "telegram", "gateway"}:
        raise RuntimeError("Invalid MODE. Allowed values: gateway_rpc | telegram | gateway")

    if config["mode"] == "gateway":
        config["mode"] = "gateway_rpc"

    if config["mode"] == "gateway_rpc":
        if not config["gateway_url"]:
            raise RuntimeError("GATEWAY_URL is required when MODE=gateway_rpc")
        if config["gateway_method"] not in {"openresponses", "chat_completions", "tools_invoke_message"}:
            raise RuntimeError(
                "Invalid GATEWAY_METHOD. Allowed: openresponses | chat_completions | tools_invoke_message"
            )

    if config["mode"] == "telegram" or config["telegram_forward"]:
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


def _normalize_gateway_base_url(gateway_url: str) -> str:
    normalized = gateway_url.strip().rstrip("/")
    if normalized.startswith("ws://"):
        return "http://" + normalized[5:]
    if normalized.startswith("wss://"):
        return "https://" + normalized[6:]
    return normalized


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


def _post_json(
    *,
    url: str,
    payload: Dict[str, Any],
    headers: Dict[str, str],
    timeout: int,
    retries: int,
    backoff_seconds: int,
    method_name: str,
) -> Dict[str, Any]:
    attempts: List[Dict[str, Any]] = []

    for attempt_idx in range(1, retries + 1):
        attempt: Dict[str, Any] = {
            "method": method_name,
            "url": url,
            "attempt": attempt_idx,
            "status": None,
            "body": "",
            "error": "",
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=timeout)
            data = _parse_json_response(response)
            attempt["status"] = response.status_code
            attempt["body"] = _truncate_text(
                str(data.get("error") or data.get("message") or data.get("_raw_text") or "")
            )
            attempts.append(attempt)

            if response.status_code < 500:
                return {
                    "ok": response.status_code < 400,
                    "response": response,
                    "data": data,
                    "attempts": attempts,
                }
        except requests.RequestException as exc:
            attempt["error"] = _truncate_text(str(exc))
            attempts.append(attempt)

        if attempt_idx < retries and backoff_seconds > 0:
            time.sleep(backoff_seconds)

    return {"ok": False, "response": None, "data": {}, "attempts": attempts}


def _build_gateway_headers(token: str) -> Dict[str, str]:
    headers: Dict[str, str] = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _dispatch_via_openresponses(config: Dict[str, Any], text: str) -> Dict[str, Any]:
    base_url = _normalize_gateway_base_url(config["gateway_url"])
    url = f"{base_url}/v1/responses"
    headers = _build_gateway_headers(config["gateway_token"])

    payload: Dict[str, Any] = {
        "model": f"openclaw:{config['agent_id']}",
        "input": text,
        "stream": False,
        "user": config["gateway_target"] or None,
    }

    result = _post_json(
        url=url,
        payload=payload,
        headers=headers,
        timeout=config["http_timeout_seconds"],
        retries=config["dispatch_retries"],
        backoff_seconds=config["retry_backoff_seconds"],
        method_name="openresponses",
    )

    if result["ok"]:
        return {"transport": "http", "method": "openresponses", "attempts": result["attempts"], "response": result["data"]}

    raise GatewayDispatchError(
        "Gateway openresponses dispatch failed",
        {
            "attempted_transport": "http",
            "attempted_method": "openresponses",
            "attempts": result["attempts"],
        },
    )


def _dispatch_via_chat_completions(config: Dict[str, Any], text: str) -> Dict[str, Any]:
    base_url = _normalize_gateway_base_url(config["gateway_url"])
    url = f"{base_url}/v1/chat/completions"
    headers = _build_gateway_headers(config["gateway_token"])

    if config["agent_id"]:
        headers["x-openclaw-agent-id"] = config["agent_id"]
    if config["session_key"]:
        headers["x-openclaw-session-key"] = config["session_key"]

    payload = {
        "model": "openclaw",
        "messages": [{"role": "user", "content": text}],
        "stream": False,
        "user": config["gateway_target"] or None,
    }

    result = _post_json(
        url=url,
        payload=payload,
        headers=headers,
        timeout=config["http_timeout_seconds"],
        retries=config["dispatch_retries"],
        backoff_seconds=config["retry_backoff_seconds"],
        method_name="chat_completions",
    )

    if result["ok"]:
        return {
            "transport": "http",
            "method": "chat_completions",
            "attempts": result["attempts"],
            "response": result["data"],
        }

    raise GatewayDispatchError(
        "Gateway chat_completions dispatch failed",
        {
            "attempted_transport": "http",
            "attempted_method": "chat_completions",
            "attempts": result["attempts"],
        },
    )


def _dispatch_via_tools_invoke_message(config: Dict[str, Any], text: str) -> Dict[str, Any]:
    base_url = _normalize_gateway_base_url(config["gateway_url"])
    url = f"{base_url}/tools/invoke"
    headers = _build_gateway_headers(config["gateway_token"])

    payload: Dict[str, Any] = {
        "tool": "message",
        "action": "send",
        "args": {
            "channel": config["channel"],
            "target": config["gateway_target"],
            "message": text,
            "accountId": config["account_id"],
        },
    }

    result = _post_json(
        url=url,
        payload=payload,
        headers=headers,
        timeout=config["http_timeout_seconds"],
        retries=config["dispatch_retries"],
        backoff_seconds=config["retry_backoff_seconds"],
        method_name="tools_invoke_message",
    )

    if result["ok"]:
        return {
            "transport": "http",
            "method": "tools_invoke_message",
            "attempts": result["attempts"],
            "response": result["data"],
        }

    raise GatewayDispatchError(
        "Gateway tools_invoke message dispatch failed",
        {
            "attempted_transport": "http",
            "attempted_method": "tools_invoke_message",
            "attempts": result["attempts"],
        },
    )


def _send_to_openclaw_gateway_rpc(config: Dict[str, Any], text: str) -> Dict[str, Any]:
    method = config["gateway_method"]

    method_order = {
        "openresponses": [_dispatch_via_openresponses, _dispatch_via_chat_completions],
        "chat_completions": [_dispatch_via_chat_completions, _dispatch_via_openresponses],
        "tools_invoke_message": [_dispatch_via_tools_invoke_message],
    }[method]

    errors: List[Dict[str, Any]] = []
    for fn in method_order:
        try:
            return fn(config, text)
        except GatewayDispatchError as exc:
            errors.append({"method": exc.details.get("attempted_method"), "attempts": exc.details.get("attempts", [])})

    raise GatewayDispatchError(
        "Unable to dispatch task to OpenClaw Gateway RPC",
        {
            "attempted_transport": "http",
            "attempted_method": method,
            "fallbacks": errors,
        },
    )


def _extract_text_from_content_node(node: Any) -> str:
    if isinstance(node, str):
        return node.strip()

    if isinstance(node, dict):
        text_value = node.get("text")
        if isinstance(text_value, str) and text_value.strip():
            return text_value.strip()
        if isinstance(text_value, dict):
            nested = text_value.get("value")
            if isinstance(nested, str) and nested.strip():
                return nested.strip()
        for key in ("content", "message"):
            if key in node:
                extracted = _extract_text_from_content_node(node.get(key))
                if extracted:
                    return extracted
        return ""

    if isinstance(node, list):
        chunks: List[str] = []
        for item in node:
            extracted = _extract_text_from_content_node(item)
            if extracted:
                chunks.append(extracted)
        return "\n".join(chunks).strip()

    return ""


def _extract_reply_text_from_gateway(method: str, data: Dict[str, Any]) -> str:
    if method == "openresponses":
        output_text = data.get("output_text")
        if isinstance(output_text, str) and output_text.strip():
            return output_text.strip()

        output_items = data.get("output")
        extracted = _extract_text_from_content_node(output_items)
        if extracted:
            return extracted

        nested_response = data.get("response")
        if isinstance(nested_response, dict):
            nested_extracted = _extract_reply_text_from_gateway("openresponses", nested_response)
            if nested_extracted:
                return nested_extracted

    if method == "chat_completions":
        choices = data.get("choices")
        if isinstance(choices, list):
            for choice in choices:
                if not isinstance(choice, dict):
                    continue
                message = choice.get("message", {})
                content = message.get("content")
                extracted = _extract_text_from_content_node(content)
                if extracted:
                    return extracted

        nested_response = data.get("response")
        if isinstance(nested_response, dict):
            nested_extracted = _extract_reply_text_from_gateway("chat_completions", nested_response)
            if nested_extracted:
                return nested_extracted

    return ""


def _send_telegram_message(config: Dict[str, Any], text: str) -> Dict[str, Any]:
    telegram_url = f"https://api.telegram.org/bot{config['telegram_bot_token']}/sendMessage"
    payload = {"chat_id": config["telegram_chat_id"], "text": text}

    response = requests.post(telegram_url, json=payload, timeout=config["http_timeout_seconds"])
    data = _parse_json_response(response)

    if response.status_code != 200 or not data.get("ok"):
        description = data.get("description") or data.get("_raw_text") or "Unknown Telegram API error"
        raise RuntimeError(f"Telegram API error: status={response.status_code}, description={description}")

    return data


def _send_to_telegram(config: Dict[str, Any], text: str) -> Dict[str, Any]:
    return _send_telegram_message(config, f"[HA Voice Task] {text}")


def _dispatch_task(config: Dict[str, Any], text: str) -> Tuple[str, Dict[str, Any]]:
    mode = config["mode"]

    if mode == "telegram":
        return "telegram", _send_to_telegram(config, text)

    try:
        return "gateway_rpc", _send_to_openclaw_gateway_rpc(config, text)
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
        return jsonify({"error": "unauthorized", "message": "Missing or invalid X-HA-Token header"}), 401

    if not request.is_json:
        return jsonify({"error": "invalid_request", "message": "Content-Type must be application/json"}), 400

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "invalid_request", "message": "Request body must be a JSON object"}), 400

    text = payload.get("text")
    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "validation_error", "message": "JSON field 'text' is required and must be a non-empty string"}), 400

    normalized_text = text.strip()

    try:
        dispatch_mode, dispatch_result = _dispatch_task(config, normalized_text)
    except requests.RequestException as exc:
        return jsonify({"error": "upstream_network_error", "message": f"Failed to reach upstream service: {exc}"}), 502
    except GatewayDispatchError as exc:
        return jsonify({"error": "dispatch_error", "message": str(exc), **exc.details}), 502
    except Exception as exc:
        return jsonify({"error": "dispatch_error", "message": str(exc)}), 502

    response_payload: Dict[str, Any] = {
        "status": "sent",
        "mode": dispatch_mode,
        "diagnostics": {
            "deprecated_keys_used": config.get("deprecated_keys_used", {}),
            "attempted_transport": dispatch_result.get("transport"),
            "attempted_method": dispatch_result.get("method"),
            "attempts": dispatch_result.get("attempts", []),
            "reply_extracted": False,
            "reply_delivered": False,
        },
    }

    if dispatch_mode == "gateway_rpc":
        reply_text = _extract_reply_text_from_gateway(
            dispatch_result.get("method", ""),
            dispatch_result.get("response", {}) if isinstance(dispatch_result.get("response"), dict) else {},
        )
        response_payload["diagnostics"]["reply_extracted"] = bool(reply_text)

        can_deliver_reply = (
            config.get("deliver_agent_reply_to_telegram", True)
            and bool(config.get("telegram_bot_token"))
            and bool(config.get("telegram_chat_id"))
        )
        if can_deliver_reply:
            reply_body = reply_text or "Úkol přijat a zpracován."
            prefix = config.get("agent_reply_prefix", "[Astra Reply]")
            prefixed_reply = f"{prefix} {reply_body}".strip() if prefix else reply_body
            try:
                _send_telegram_message(config, prefixed_reply)
                response_payload["diagnostics"]["reply_delivered"] = True
            except Exception:
                response_payload["diagnostics"]["reply_delivered"] = False

        response_payload["message"] = "Task delivered to OpenClaw Gateway RPC"
    elif dispatch_mode == "telegram_fallback":
        response_payload["message"] = "Gateway RPC dispatch failed, task forwarded to Telegram fallback"
        response_payload["telegram_message_id"] = dispatch_result.get("result", {}).get("message_id")
    else:
        response_payload["message"] = "Task forwarded to Telegram"
        response_payload["telegram_message_id"] = dispatch_result.get("result", {}).get("message_id")

    return jsonify(response_payload), 200


if __name__ == "__main__":
    cfg = _load_config()
    _validate_config(cfg)
    app.run(host="0.0.0.0", port=cfg["listen_port"])
