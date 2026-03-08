# VF Ops Watch

## Cíl projektu
Praktický interní projekt pro průběžný dohled nad provozem stacku **OpenClaw + Home Assistant + Telegram + multi-agent workflow**.

Smysl: mít jedno místo, kde se sleduje stav služeb, chyby, fronty úloh a zdraví hostu; při problému se pošle jasné upozornění do Telegramu a založí se interní incident task.

## Proč to dává smysl pro Vector Forge
- OpenClaw orchestrace je už teď kritická vrstva; chybí konzistentní „ops“ přehled.
- Home Assistant umí sbírat stavové signály a automatizace.
- Telegram je hlavní operativní kanál pro rychlou reakci.
- Multi-agent tým (Astra, Daedalus, Forge, Sentinel, Hydra, Mnemosyne) může mít jasné role při incidentu.

---

## Roadmapa verzí

## v0.1 — Minimal viable operations watch (jedna iterace dnes)
### Návrh
Lehká implementace bez velké infrastruktury navíc:
- sběr základních health signálů přes shell skript + systemd timer,
- publikace stavu do jednoduchého JSON souboru,
- Telegram alerty při překročení prahů,
- základní HA entita (binary_sensor/sensor) nad tímto stavem.

### Funkce
- Kontrola:
  - dostupnost OpenClaw gateway procesu,
  - stav klíčových služeb (např. HA core, případně další systemd units),
  - load average, RAM, disk využití,
  - poslední neúspěšné běhy agentních úloh (pokud dostupné logy/markery).
- Při problému:
  - Telegram zpráva se stručným summary + host + timestamp,
  - deduplikace alertu (neposílat stejný alert každou minutu).
- Při návratu do normálu:
  - „recovery“ zpráva do Telegramu.

### DoD (Definition of Done)
- `projects/vf-ops-watch` obsahuje běžící skript + konfiguraci prahů.
- systemd timer běží na Ubuntu hostu a zapisuje stav každou minutu.
- Minimálně 3 simulované incidenty (disk, service down, load) odešlou alert.
- Recovery notifikace funguje.
- Krátký runbook „co dělat při alertu“ je součástí projektu.

### Rizika
- Falešné poplachy při špatně nastavených prazích.
- Alert fatigue bez deduplikace a cooldownu.
- Křehkost parseru logů mezi verzemi služeb.

---

## v0.2 — Incident workflow + agentní triage
### Návrh
Rozšířit monitoring o řízený incident tok:
- standardizované severity (S1/S2/S3),
- automatická triage přes interní agenty,
- záznam incidentu do projektové paměti.

### Funkce
- K alertu se přidá severity + doporučený první krok.
- Astra/Daedalus dostane strukturovaný payload pro triage.
- Sentinel/Hydra mohou být přizváni podle typu incidentu.
- Mnemosyne zapíše incident summary do `memory/memory.md` a projektového logu.

### DoD
- Každý alert má severity a incident ID.
- Triage šablona existuje a je používaná konzistentně.
- Incident má uzavírací záznam (root cause / workaround / next action).

### Rizika
- Příliš složitý flow zpomalí reakci.
- Nekonzistentní klasifikace severity mezi agenty.
- Chybějící disciplína v uzavírání incidentů.

---

## v0.3 — Prediktivní ops dashboard + SLA signály
### Návrh
Posun od reaktivního monitoringu k prediktivnímu přístupu:
- trendování metrik,
- jednoduché anomálie,
- reporty spolehlivosti.

### Funkce
- Denní/weekly report do Telegramu: dostupnost, počet incidentů, MTTR.
- Trend disk/RAM/load a varování před dosažením limitu.
- Jednoduchý dashboard (HA Lovelace nebo statická web stránka).
- SLA/SLO signály pro klíčové interní workflow.

### DoD
- Report chodí pravidelně a je čitelný.
- Dashboard ukazuje minimálně 7 dní historie.
- Existují minimálně 2 prediktivní alert pravidla s ověřením v praxi.

### Rizika
- Přecenění kvality dat bez stabilního sběru ve v0.1/v0.2.
- Noise z anomálií bez kalibrace.
- Vyšší nároky na údržbu vizualizace.

---

## Deployment on Ubuntu

## Cílové umístění
`/home/ubuntu/vector-forge/projects/vf-ops-watch`

## Doporučená struktura
- `scripts/healthcheck.sh` — sběr metrik a stavů
- `config/thresholds.env` — prahy a chování alertů
- `state/status.json` — poslední stav
- `state/alerts.db` — deduplikace/cooldown alertů
- `systemd/vf-ops-watch.service`
- `systemd/vf-ops-watch.timer`
- `RUNBOOK.md`

## Kroky nasazení (v0.1)
1. Vytvořit adresáře a skript + konfiguraci.
2. Přidat systemd service/timer a aktivovat (`daemon-reload`, `enable --now`).
3. Nastavit Telegram token/chat ID přes env (bez hardcode).
4. Ověřit běh: ruční spuštění skriptu + kontrola `journalctl`.
5. Simulovat incidenty a ověřit alert + recovery zprávy.
6. Zapsat baseline prahy a provozní poznámky do `RUNBOOK.md`.

## Provozní poznámky
- Nejprve konzervativní prahy, po týdnu kalibrace.
- Alerty držet krátké: co se stalo, jak kritické, co udělat teď.
- Každá změna prahů musí být verzovaná v git.

---

## Shrnutí
`VF Ops Watch` je malý, praktický a okamžitě nasaditelný interní projekt. v0.1 řeší dnešní potřebu (health + alerting), v0.2 zavádí disciplinovaný incident workflow a v0.3 přidává prediktivní vrstvu a SLA pohled.