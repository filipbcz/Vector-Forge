#!/usr/bin/env python3
"""VF Ops Watch v0.2.1

Local health-check runner for OpenClaw stack.
- Checks gateway reachability
- Checks telegram channel status
- Scans recent OpenClaw logs for relevant errors
- Emits JSON report and human-readable summary
- Optional Telegram alerting for warning/critical with anti-spam cooldown
- Exit code: 0 OK, 1 WARNING, 2 CRITICAL
"""

from __future__ import annotations

import argparse
import datetime as dt
import glob
import hashlib
import json
import os
import re
import shlex
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests

SEVERITY_ORDER = {"ok": 0, "warning": 1, "critical": 2}
EXIT_CODE = {"ok": 0, "warning": 1, "critical": 2}


def _strip_quotes(s: str) -> str:
    s = s.strip()
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        return s[1:-1]
    return s


def _parse_scalar(value: str) -> Any:
    v = _strip_quotes(value)
    low = v.lower()
    if low in {"true", "false"}:
        return low == "true"
    if low in {"null", "none", "~"}:
        return None
    if re.fullmatch(r"-?\d+", v):
        try:
            return int(v)
        except ValueError:
            return v
    if re.fullmatch(r"-?\d+\.\d+", v):
        try:
            return float(v)
        except ValueError:
            return v
    return v


def _next_nonempty(lines: List[str], start_idx: int) -> Optional[Tuple[int, str, int]]:
    for j in range(start_idx + 1, len(lines)):
        line = lines[j].split("#", 1)[0].rstrip()
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip(" "))
        return j, line.strip(), indent
    return None


def parse_simple_yaml(text: str) -> Dict[str, Any]:
    """Very small YAML subset parser (dict/list/scalars, 2-space indentation)."""
    root: Dict[str, Any] = {}
    stack: List[Tuple[int, Any]] = [(-1, root)]
    lines = text.splitlines()

    for idx, raw in enumerate(lines):
        lineno = idx + 1
        line = raw.split("#", 1)[0].rstrip()
        if not line.strip():
            continue

        indent = len(line) - len(line.lstrip(" "))
        stripped = line.strip()

        while stack and indent <= stack[-1][0]:
            stack.pop()
        if not stack:
            raise ValueError(f"Invalid indentation near line {lineno}")

        parent = stack[-1][1]

        if stripped.startswith("- "):
            if not isinstance(parent, list):
                raise ValueError(f"List item without list parent at line {lineno}")
            item_text = stripped[2:].strip()
            if not item_text:
                parent.append({})
                stack.append((indent, parent[-1]))
            elif ":" in item_text and not item_text.startswith(('"', "'")):
                k, v = item_text.split(":", 1)
                item = {k.strip(): _parse_scalar(v.strip()) if v.strip() else {}}
                parent.append(item)
                if v.strip() == "":
                    stack.append((indent, item[k.strip()]))
            else:
                parent.append(_parse_scalar(item_text))
            continue

        if ":" not in stripped:
            raise ValueError(f"Expected key:value at line {lineno}")

        key, value = stripped.split(":", 1)
        key = key.strip()
        value = value.strip()

        if not isinstance(parent, dict):
            raise ValueError(f"Key/value in non-dict context at line {lineno}")

        if value == "":
            nxt = _next_nonempty(lines, idx)
            if nxt and nxt[2] > indent and nxt[1].startswith("- "):
                parent[key] = []
            else:
                parent[key] = {}
            stack.append((indent, parent[key]))
        elif value == "[]":
            parent[key] = []
        elif value == "{}":
            parent[key] = {}
        else:
            parent[key] = _parse_scalar(value)

    return root


def normalize_config(raw: Dict[str, Any], base_dir: Path) -> Dict[str, Any]:
    checks = raw.get("checks", {}) if isinstance(raw.get("checks", {}), dict) else {}
    paths = raw.get("paths", {}) if isinstance(raw.get("paths", {}), dict) else {}
    thresholds = raw.get("thresholds", {}) if isinstance(raw.get("thresholds", {}), dict) else {}
    notify = raw.get("notify", {}) if isinstance(raw.get("notify", {}), dict) else {}

    notify_min_severity = str(notify.get("notify_min_severity", "warning")).lower()
    if notify_min_severity not in {"warning", "critical"}:
        notify_min_severity = "warning"

    log_ignore_raw = raw.get("log_ignore_patterns", [])
    if isinstance(log_ignore_raw, list):
        log_ignore_patterns = [str(x) for x in log_ignore_raw if str(x).strip()]
    elif isinstance(log_ignore_raw, str) and log_ignore_raw.strip():
        log_ignore_patterns = [log_ignore_raw.strip()]
    else:
        log_ignore_patterns = []

    cfg = {
        "checks": {
            "gateway_command": checks.get("gateway_command", "openclaw gateway status"),
            "gateway_health_url": checks.get("gateway_health_url", ""),
            "gateway_timeout_sec": int(checks.get("gateway_timeout_sec", 8)),
            "channels_command": checks.get("channels_command", "openclaw channels status"),
            "channels_timeout_sec": int(checks.get("channels_timeout_sec", 8)),
            "log_tail_lines": int(checks.get("log_tail_lines", 300)),
            "log_file_glob": checks.get("log_file_glob", "/tmp/openclaw/openclaw-*.log"),
            "log_ignore_patterns": log_ignore_patterns,
        },
        "thresholds": {
            "warning_error_lines": int(thresholds.get("warning_error_lines", 1)),
            "critical_error_lines": int(thresholds.get("critical_error_lines", 5)),
        },
        "notify": {
            "enabled": bool(notify.get("enabled", False)),
            "telegram_bot_token": str(notify.get("telegram_bot_token", "")).strip(),
            "telegram_chat_id": str(notify.get("telegram_chat_id", "")).strip(),
            "notify_min_severity": notify_min_severity,
            "cooldown_seconds_warning": int(notify.get("cooldown_seconds_warning", 600)),
            "cooldown_seconds_critical": int(notify.get("cooldown_seconds_critical", 300)),
        },
        "paths": {
            "output_json": paths.get("output_json", str(base_dir / "out" / "latest.json")),
        },
    }
    return cfg


def run_cmd(command: str, timeout_sec: int) -> Dict[str, Any]:
    try:
        proc = subprocess.run(
            shlex.split(command),
            capture_output=True,
            text=True,
            timeout=timeout_sec,
            check=False,
        )
        return {
            "ok": proc.returncode == 0,
            "returncode": proc.returncode,
            "stdout": proc.stdout.strip(),
            "stderr": proc.stderr.strip(),
            "error": None,
        }
    except FileNotFoundError as e:
        return {"ok": False, "returncode": 127, "stdout": "", "stderr": "", "error": str(e)}
    except subprocess.TimeoutExpired as e:
        return {
            "ok": False,
            "returncode": 124,
            "stdout": (e.stdout or "").strip() if isinstance(e.stdout, str) else "",
            "stderr": (e.stderr or "").strip() if isinstance(e.stderr, str) else "",
            "error": f"timeout after {timeout_sec}s",
        }


def check_http_health(url: str, timeout_sec: int) -> Dict[str, Any]:
    if not url:
        return {"checked": False, "ok": False, "status_code": None, "error": "health_url_not_configured"}
    try:
        resp = requests.get(url, timeout=max(1, timeout_sec))
        ok = 200 <= resp.status_code < 300
        return {
            "checked": True,
            "ok": ok,
            "status_code": resp.status_code,
            "error": None if ok else "non_2xx_status",
        }
    except Exception as e:
        return {"checked": True, "ok": False, "status_code": None, "error": str(e)}


def check_gateway(cfg: Dict[str, Any]) -> Dict[str, Any]:
    result = run_cmd(cfg["gateway_command"], cfg["gateway_timeout_sec"])
    combined = f"{result['stdout']}\n{result['stderr']}".lower()

    healthy_words = ["running", "active", "healthy", "online", "ok"]
    unhealthy_words = ["inactive", "dead", "failed", "offline", "stopped", "error"]

    details: Dict[str, Any] = {"command": result}

    if result["ok"]:
        if any(w in combined for w in unhealthy_words):
            return {"name": "gateway", "severity": "critical", "status": "reported_unhealthy", "details": details}
        if any(w in combined for w in healthy_words):
            return {"name": "gateway", "severity": "ok", "status": "reachable", "details": details}

        health = check_http_health(cfg.get("gateway_health_url", ""), min(5, cfg["gateway_timeout_sec"]))
        details["health_url"] = health
        if health.get("ok"):
            return {"name": "gateway", "severity": "ok", "status": "health_url_ok", "details": details}
        return {"name": "gateway", "severity": "warning", "status": "unclear_status", "details": details}

    is_timeout = result.get("returncode") == 124 or "timeout" in str(result.get("error", "")).lower()
    health = check_http_health(cfg.get("gateway_health_url", ""), min(5, cfg["gateway_timeout_sec"]))
    details["health_url"] = health

    if is_timeout:
        return {"name": "gateway", "severity": "warning", "status": "status_command_timeout", "details": details}

    if health.get("ok"):
        return {"name": "gateway", "severity": "warning", "status": "status_command_failed_health_ok", "details": details}

    return {"name": "gateway", "severity": "critical", "status": "unreachable", "details": details}


def check_telegram_channel(cfg: Dict[str, Any]) -> Dict[str, Any]:
    result = run_cmd(cfg["channels_command"], cfg["channels_timeout_sec"])
    combined = f"{result['stdout']}\n{result['stderr']}".lower()

    is_timeout = result.get("returncode") == 124 or "timeout" in str(result.get("error", "")).lower()
    if is_timeout:
        return {"name": "telegram_channel", "severity": "warning", "status": "status_command_timeout", "details": result}

    if not result["ok"]:
        return {"name": "telegram_channel", "severity": "critical", "status": "status_command_failed", "details": result}

    tele_lines = [ln.strip().lower() for ln in (result["stdout"] + "\n" + result["stderr"]).splitlines() if "telegram" in ln.lower()]
    if not tele_lines:
        if "telegram" not in combined:
            return {"name": "telegram_channel", "severity": "warning", "status": "telegram_not_found", "details": result}
        tele_lines = [combined]

    tele_text = " | ".join(tele_lines)

    healthy_patterns = [
        r"\bconnected\b",
        r"\brunning\b",
        r"\bactive\b",
        r"\bready\b",
        r"\benabled\b",
        r"\bok\b",
    ]
    unhealthy_patterns = [
        r"\bdisconnected\b",
        r"\boffline\b",
        r"\bstopped\b",
        r"\bdisabled\b",
        r"\bfailed\b",
        r"\berror\b",
        r"\bnot\s+connected\b",
    ]

    if any(re.search(pat, tele_text, flags=re.IGNORECASE) for pat in unhealthy_patterns):
        return {"name": "telegram_channel", "severity": "critical", "status": "not_running", "details": result}

    if any(re.search(pat, tele_text, flags=re.IGNORECASE) for pat in healthy_patterns):
        return {"name": "telegram_channel", "severity": "ok", "status": "running", "details": result}

    return {"name": "telegram_channel", "severity": "warning", "status": "unknown_state", "details": result}


def tail_file(path: Path, max_lines: int) -> List[str]:
    try:
        data = path.read_text(errors="replace")
    except Exception:
        return []
    lines = data.splitlines()
    return lines[-max_lines:] if max_lines > 0 else lines


def _is_relevant_error_line(line: str) -> bool:
    s = line.strip()

    # Prefer structured OpenClaw JSON log level when available.
    if s.startswith("{"):
        try:
            obj = json.loads(s)
            meta = obj.get("_meta", {}) if isinstance(obj, dict) else {}
            level = str(meta.get("logLevelName", "")).upper()
            if level in {"ERROR", "FATAL", "CRITICAL", "PANIC"}:
                return True
            if level and level in {"TRACE", "DEBUG", "INFO", "WARN", "WARNING"}:
                return False
        except Exception:
            pass

    fallback_patterns = [
        r"\btraceback\b",
        r"\bfatal\b",
        r"\bpanic\b",
        r"\bcritical\b",
        r"\berror\b",
        r"\bexception\b",
    ]
    return any(re.search(pat, s, flags=re.IGNORECASE) for pat in fallback_patterns)


def check_logs(cfg: Dict[str, Any], thresholds: Dict[str, Any]) -> Dict[str, Any]:
    pattern = cfg["log_file_glob"]
    log_paths = sorted(glob.glob(pattern), key=lambda p: os.path.getmtime(p) if os.path.exists(p) else 0, reverse=True)

    if not log_paths:
        return {
            "name": "logs",
            "severity": "warning",
            "status": "no_logs_found",
            "details": {"pattern": pattern, "error_lines": 0, "matched_files": []},
        }

    selected = [Path(p) for p in log_paths[:3]]
    scanned_lines = 0
    ignored_lines = 0
    error_lines: List[str] = []

    ignore_res: List[re.Pattern[str]] = []
    for pat in cfg.get("log_ignore_patterns", []):
        try:
            ignore_res.append(re.compile(pat, re.IGNORECASE))
        except re.error:
            continue

    for p in selected:
        lines = tail_file(p, cfg["log_tail_lines"])
        scanned_lines += len(lines)
        for ln in lines:
            if not _is_relevant_error_line(ln):
                continue
            if any(rx.search(ln) for rx in ignore_res):
                ignored_lines += 1
                continue
            error_lines.append(ln.strip())

    count = len(error_lines)
    if count >= thresholds["critical_error_lines"]:
        sev = "critical"
    elif count >= thresholds["warning_error_lines"]:
        sev = "warning"
    else:
        sev = "ok"

    return {
        "name": "logs",
        "severity": sev,
        "status": "scanned",
        "details": {
            "pattern": pattern,
            "matched_files": [str(p) for p in selected],
            "scanned_lines": scanned_lines,
            "ignored_error_lines": ignored_lines,
            "relevant_error_lines": count,
            "error_lines": count,
            "samples": error_lines[:10],
        },
    }


def max_severity(items: List[Dict[str, Any]]) -> str:
    sev = "ok"
    for item in items:
        if SEVERITY_ORDER[item["severity"]] > SEVERITY_ORDER[sev]:
            sev = item["severity"]
    return sev


def build_summary(report: Dict[str, Any]) -> str:
    ts = report["timestamp"]
    overall = report["overall_severity"].upper()
    lines = [f"VF Ops Watch [{overall}] @ {ts}"]
    for c in report["checks"]:
        lines.append(f"- {c['name']}: {c['severity'].upper()} ({c['status']})")
    return "\n".join(lines)


def write_json_report(path: Path, report: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")


def load_json_file(path: Path, fallback: Dict[str, Any]) -> Dict[str, Any]:
    try:
        if not path.exists():
            return fallback
        return json.loads(path.read_text())
    except Exception:
        return fallback


def save_json_file(path: Path, value: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def build_alert_payload(report: Dict[str, Any]) -> Dict[str, Any]:
    failing_checks = [c for c in report["checks"] if c["severity"] != "ok"]
    signature_src = {
        "overall": report["overall_severity"],
        "issues": [
            {
                "name": c["name"],
                "severity": c["severity"],
                "status": c["status"],
                "error_lines": c.get("details", {}).get("error_lines"),
            }
            for c in failing_checks
        ],
    }
    signature = hashlib.sha1(json.dumps(signature_src, sort_keys=True).encode("utf-8")).hexdigest()

    return {
        "severity": report["overall_severity"],
        "timestamp": report["timestamp"],
        "host": report.get("meta", {}).get("host", "unknown"),
        "summary": report.get("summary", ""),
        "issues": [f"{c['name']}: {c['severity'].upper()} ({c['status']})" for c in failing_checks],
        "signature": signature,
    }


def should_notify(overall: str, notify_cfg: Dict[str, Any]) -> bool:
    min_sev = notify_cfg["notify_min_severity"]
    return SEVERITY_ORDER[overall] >= SEVERITY_ORDER[min_sev]


def alert_cooldown_seconds(severity: str, notify_cfg: Dict[str, Any]) -> int:
    if severity == "critical":
        return max(0, int(notify_cfg["cooldown_seconds_critical"]))
    return max(0, int(notify_cfg["cooldown_seconds_warning"]))


def render_alert_text(payload: Dict[str, Any]) -> str:
    emoji = "🟠" if payload["severity"] == "warning" else "🔴"
    issues_text = "\n".join(f"- {i}" for i in payload["issues"]) or "- no details"
    return (
        f"{emoji} VF Ops Watch {payload['severity'].upper()}\n"
        f"Host: {payload['host']}\n"
        f"Time: {payload['timestamp']}\n"
        f"Issues:\n{issues_text}\n"
        f"\nSummary:\n{payload['summary']}"
    )


def send_telegram_alert(text: str, token: str, chat_id: str, timeout_sec: int = 10) -> Dict[str, Any]:
    if not token or not chat_id:
        return {"sent": False, "error": "missing_telegram_credentials"}

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    body = {"chat_id": chat_id, "text": text}

    try:
        resp = requests.post(url, json=body, timeout=timeout_sec)
        ok = resp.status_code == 200
        data = {}
        try:
            data = resp.json()
        except Exception:
            data = {"raw": resp.text[:400]}

        if ok and data.get("ok"):
            return {"sent": True, "status_code": resp.status_code, "response": data}

        return {
            "sent": False,
            "status_code": resp.status_code,
            "error": "telegram_api_error",
            "response": data,
        }
    except Exception as e:
        return {"sent": False, "error": str(e)}


def process_alerting(report: Dict[str, Any], config: Dict[str, Any], state_path: Path) -> Dict[str, Any]:
    notify_cfg = config["notify"]
    overall = report["overall_severity"]

    result: Dict[str, Any] = {
        "enabled": bool(notify_cfg["enabled"]),
        "eligible": False,
        "sent": False,
        "suppressed": False,
        "reason": None,
    }

    if not notify_cfg["enabled"]:
        result["reason"] = "notify_disabled"
        return result

    if not should_notify(overall, notify_cfg):
        result["reason"] = "below_notify_min_severity"
        return result

    payload = build_alert_payload(report)
    result["eligible"] = True
    result["payload"] = payload

    now_ts = int(dt.datetime.now(dt.timezone.utc).timestamp())
    state = load_json_file(state_path, {"last_sent_by_severity": {}})
    last_sent = state.get("last_sent_by_severity", {}).get(overall, {})
    last_ts = int(last_sent.get("ts", 0) or 0)
    last_sig = str(last_sent.get("signature", ""))
    cooldown = alert_cooldown_seconds(overall, notify_cfg)

    if last_sig == payload["signature"] and (now_ts - last_ts) < cooldown:
        result["suppressed"] = True
        result["reason"] = "duplicate_within_cooldown"
        result["cooldown_seconds"] = cooldown
        result["next_allowed_in_seconds"] = max(0, cooldown - (now_ts - last_ts))
        return result

    text = render_alert_text(payload)
    send_result = send_telegram_alert(text, notify_cfg["telegram_bot_token"], notify_cfg["telegram_chat_id"])
    result["send_result"] = send_result

    if not send_result.get("sent", False):
        result["reason"] = "send_failed"
        return result

    state.setdefault("last_sent_by_severity", {})[overall] = {
        "ts": now_ts,
        "signature": payload["signature"],
    }
    save_json_file(state_path, state)

    result["sent"] = True
    result["reason"] = "sent"
    return result


def load_config(config_path: Path) -> Dict[str, Any]:
    if not config_path.exists():
        raise FileNotFoundError(f"Config not found: {config_path}")
    raw = parse_simple_yaml(config_path.read_text())
    return normalize_config(raw, config_path.parent)


def main() -> int:
    parser = argparse.ArgumentParser(description="VF Ops Watch health-check runner")
    parser.add_argument("--config", default="config.yaml", help="Path to config YAML")
    args = parser.parse_args()

    start = dt.datetime.now(dt.timezone.utc)
    config_path = Path(args.config).resolve()

    try:
        config = load_config(config_path)
    except Exception as e:
        report = {
            "timestamp": start.isoformat(),
            "overall_severity": "critical",
            "checks": [],
            "summary": f"Configuration error: {e}",
            "meta": {"config_path": str(config_path)},
        }
        fallback = config_path.parent / "out" / "latest.json"
        write_json_report(fallback, report)
        print(report["summary"])
        return 2

    checks_cfg = config["checks"]
    thresholds = config["thresholds"]

    checks = [
        check_gateway(checks_cfg),
        check_telegram_channel(checks_cfg),
        check_logs(checks_cfg, thresholds),
    ]

    overall = max_severity(checks)
    report = {
        "timestamp": start.isoformat(),
        "overall_severity": overall,
        "exit_code": EXIT_CODE[overall],
        "checks": checks,
        "meta": {
            "host": os.uname().nodename,
            "config_path": str(config_path),
            "runner": "vf-ops-watch/0.2.1",
        },
    }
    report["summary"] = build_summary(report)

    alert_state_path = config_path.parent / "out" / "state.json"
    report["alerting"] = process_alerting(report, config, alert_state_path)

    output_path = Path(config["paths"]["output_json"]).expanduser()
    if not output_path.is_absolute():
        output_path = (config_path.parent / output_path).resolve()

    try:
        write_json_report(output_path, report)
    except Exception as e:
        print(f"Failed writing report: {e}", file=sys.stderr)
        return 2

    print(report["summary"])
    return EXIT_CODE[overall]


if __name__ == "__main__":
    sys.exit(main())
