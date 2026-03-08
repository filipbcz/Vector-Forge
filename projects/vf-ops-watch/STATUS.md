# STATUS — VF Ops Watch

## Co hotovo
- v0.2.1 stabilizace je integrovaná v branch (`runner.py` + config + service unit).
- Timeouty z `openclaw gateway status` a `openclaw channels status` už nespouští falešný **critical**:
  - `gateway` timeout => `WARNING (status_command_timeout)`
  - `telegram_channel` timeout => `WARNING (status_command_timeout)`
- Service unit má explicitní `PATH` pro OpenClaw CLI a `SuccessExitStatus=1 2` (warning/critical report neoznačí unit jako failed).
- Lokální report se zapisuje do `projects/vf-ops-watch/out/latest.json`.

## Co běží
- `vf-ops-watch.timer` je enabled + active a spouští `vf-ops-watch.service` periodicky.
- Poslední běh generuje report se stavem:
  - `gateway: CRITICAL (reported_unhealthy)`
  - `telegram_channel: WARNING (status_command_timeout)`
  - `logs: CRITICAL (scanned)`

## Co blokuje
- Gateway je fakticky unhealthy v tomto runtime (container/systemd-user omezení), takže `gateway` zůstává critical z validního důvodu.
- V OpenClaw logu je pořád hodně relevantních ERROR řádků, takže `logs` check drží celkový stav na critical.
