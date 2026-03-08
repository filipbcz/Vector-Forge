#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

make_cfg() {
  local mode="$1"
  local critical_threshold="5"
  local log_content="INFO all good\nERROR something happened\n"

  if [[ "$mode" == "critical" ]]; then
    critical_threshold="1"
    log_content="ERROR hard failure\n"
  fi

  printf "%b" "$log_content" > "$TMPDIR/openclaw-test.log"

  cat > "$TMPDIR/config-$mode.yaml" <<EOF
checks:
  gateway_command: "bash -lc 'echo running'"
  gateway_timeout_sec: 5
  channels_command: "bash -lc 'echo telegram connected'"
  channels_timeout_sec: 5
  log_file_glob: "$TMPDIR/openclaw-test.log"
  log_tail_lines: 100

thresholds:
  warning_error_lines: 1
  critical_error_lines: $critical_threshold

notify:
  enabled: true
  telegram_bot_token: "fake-token"
  telegram_chat_id: "fake-chat"
  notify_min_severity: "warning"
  cooldown_seconds_warning: 600
  cooldown_seconds_critical: 300

paths:
  output_json: "$ROOT/out/latest.json"
EOF
}

run_case() {
  local mode="$1"
  make_cfg "$mode"
  python3 "$ROOT/runner.py" --config "$TMPDIR/config-$mode.yaml" >/dev/null || true

  python3 - "$mode" "$ROOT/out/latest.json" <<'PY'
import json, sys
mode, path = sys.argv[1], sys.argv[2]
data = json.load(open(path))
alert = data.get("alerting", {})
payload = alert.get("payload")
if not payload:
    raise SystemExit(f"[{mode}] missing alert payload")
if payload.get("severity") != mode:
    raise SystemExit(f"[{mode}] payload severity mismatch: {payload.get('severity')}")
print(f"ok: {mode} payload generated")
PY
}

run_case warning
run_case critical

echo "Smoke alert test passed (warning + critical payload generated)."
