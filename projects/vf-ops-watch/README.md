# VF Ops Watch v0.2

Lokální health-check runner pro OpenClaw stack.

## Co kontroluje

1. **Gateway reachability** přes `openclaw gateway status`
2. **Telegram channel status** přes `openclaw channels status`
3. **Recent log errors** v `/tmp/openclaw/openclaw-*.log` (poslední N řádků)

## Výstupy

- JSON report: `projects/vf-ops-watch/out/latest.json`
- Rate-limit state: `projects/vf-ops-watch/out/state.json`
- Textový summary na stdout

Ukázka summary:

```text
VF Ops Watch [WARNING] @ 2026-03-08T18:00:00+00:00
- gateway: OK (reachable)
- telegram_channel: WARNING (unknown_state)
- logs: WARNING (scanned)
```

## Exit codes

- `0` = OK
- `1` = WARNING
- `2` = CRITICAL

## Ruční spuštění

```bash
cd /home/ubuntu/vector-forge/projects/vf-ops-watch
python3 runner.py --config config.yaml
echo $?   # exit code
```

## Konfigurace

Soubor `config.yaml`:

- `checks.*` — healthcheck příkazy a log scan
- `thresholds.warning_error_lines` — od kolika error řádků WARNING
- `thresholds.critical_error_lines` — od kolika error řádků CRITICAL
- `paths.output_json` — cesta k reportu

### Alerting (Telegram)

- `notify.enabled` — zapnutí/vypnutí alertingu
- `notify.telegram_bot_token` — Bot token (`12345:ABC...`)
- `notify.telegram_chat_id` — cílový chat / skupina
- `notify.notify_min_severity` — minimální závažnost pro notifikaci (`warning` / `critical`)
- `notify.cooldown_seconds_warning` — cooldown pro WARNING
- `notify.cooldown_seconds_critical` — cooldown pro CRITICAL

Alert text se sestaví při `severity >= notify_min_severity`.
Odeslání běží přes Telegram Bot API (`requests`), ne přes OpenClaw message tool.

### Rate limiting / anti-spam

Runner drží stav v `out/state.json` (per-severity).

- Porovnává se fingerprint problému (kombinace failing checků + severity).
- Pokud přijde stejný problém v cooldown okně pro danou severity, alert se **nepošle**.
- Po úspěšném odeslání se aktualizuje timestamp + fingerprint v `state.json`.

## Test alertu (smoke)

```bash
cd /home/ubuntu/vector-forge/projects/vf-ops-watch
./test/smoke_alerts.sh
```

Smoke test vygeneruje simulované warning/critical běhy a ověří, že se v `out/latest.json` vytvoří alert payload (`alerting.payload`) při splněném thresholdu.

## Nasazení na Ubuntu (systemd timer)

### 1) Instalace unitů

```bash
cd /home/ubuntu/vector-forge/projects/vf-ops-watch/deploy
chmod +x install.sh
./install.sh
```

### 2) Ověření

```bash
systemctl status vf-ops-watch.timer
systemctl list-timers --all | grep vf-ops-watch
```

### 3) Ruční trigger service

```bash
sudo systemctl start vf-ops-watch.service
journalctl -u vf-ops-watch.service -n 100 --no-pager
```
