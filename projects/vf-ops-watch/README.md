# VF Ops Watch v0.3

Lokální health-check runner pro OpenClaw stack.

## Co kontroluje

1. **Gateway reachability** přes `openclaw gateway status`
2. **Telegram channel status** přes `openclaw channels status`
3. **Recent log errors** v `/tmp/openclaw/openclaw-*.log` (poslední N řádků)

## Výstupy po každém běhu

Runner ve v0.3 po každém spuštění zapíše:

- `out/latest.json` — poslední report (včetně `trends_24h`)
- `out/history/<timestamp>.json` — snapshot konkrétního běhu
- `out/timeline.md` — incident timeline generovaná z historie
- `out/state.json` — anti-spam/rate-limit stav alertingu

## Trendy (24h)

Pole `trends_24h` v `latest.json` obsahuje jednoduché agregace za posledních 24 hodin z historie běhů:

- `warning_runs` — počet běhů s overall severity `warning`
- `critical_runs` — počet běhů s overall severity `critical`
- `top_check_failures` — top 3 checky, které nejčastěji failovaly

Příklad:

```json
"trends_24h": {
  "window": "24h",
  "runs": 12,
  "warning_runs": 4,
  "critical_runs": 3,
  "top_check_failures": [
    {"check": "logs", "failures": 7},
    {"check": "gateway", "failures": 5},
    {"check": "telegram_channel", "failures": 4}
  ]
}
```

## Incident timeline

`out/timeline.md` obsahuje:

1. **Severity changes** — změny mezi běhy (např. `ok → warning → critical`)
2. **Incident events** — chronologický seznam warning/critical běhů s failing checky

Jak to číst:

- část *Severity changes* rychle ukazuje eskalace/deeskalace stavu
- část *Incident events* dává detail, které checky incident způsobily

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
- `paths.output_json` — cesta k reportu (`latest.json`)

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

- Porovnává se fingerprint problému (kombinace failing checků + severity)
- Pokud přijde stejný problém v cooldown okně pro danou severity, alert se **nepošle**
- Po úspěšném odeslání se aktualizuje timestamp + fingerprint v `state.json`

## Smoke test

```bash
cd /home/ubuntu/vector-forge/projects/vf-ops-watch
python3 runner.py --config config.yaml || true
python3 runner.py --config config.yaml || true
ls -1 out/history | tail -n 5
sed -n '1,80p' out/timeline.md
```

Očekávání: vzniknou minimálně 2 nové snapshoty v `out/history/` a aktualizuje se `out/timeline.md`.

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
