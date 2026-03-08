# VF Ops Watch v0.1

Lokální health-check runner pro OpenClaw stack.

## Co kontroluje

1. **Gateway reachability** přes `openclaw gateway status`
2. **Telegram channel status** přes `openclaw channels status`
3. **Recent log errors** v `/tmp/openclaw/openclaw-*.log` (poslední N řádků)

## Výstupy

- JSON report: `projects/vf-ops-watch/out/latest.json`
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

- `checks.gateway_command` — příkaz pro kontrolu gateway
- `checks.channels_command` — příkaz pro kontrolu channelů
- `checks.log_file_glob` — log pattern
- `checks.log_tail_lines` — počet posledních řádků pro scan
- `thresholds.warning_error_lines` — od kolika error řádků WARNING
- `thresholds.critical_error_lines` — od kolika error řádků CRITICAL
- `paths.output_json` — cesta k reportu

> Runner používá pouze Python standard library (bez externích závislostí).

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

## Cron alternativa (volitelně)

Pokud nechceš systemd timer, můžeš použít cron:

```cron
* * * * * cd /home/ubuntu/vector-forge/projects/vf-ops-watch && /usr/bin/python3 runner.py --config config.yaml >> /tmp/vf-ops-watch.log 2>&1
```

## Poznámky k robustnosti

- Pokud chybí `openclaw` CLI nebo timeoutne command, check je `CRITICAL`.
- Pokud nenajde logy, check je `WARNING` (není to hard fail).
- Při chybě konfigurace je výstup `CRITICAL` a fallback report se zapíše do `out/latest.json`.
