# VF Ops Watch — Release plán (v0.4 → v1.0-rc)

## Cíl plánu
Dovést projekt od stabilního základu (v0.4) k release kandidátovi (v1.0-rc) s jasnými quality gate, bezpečnostními kontrolami a provozní připraveností.

## Prioritizace (globální)

### Must-have (pro dosažení v1.0-rc)
- Stabilní sběr dat a deterministické vyhodnocení pravidel.
- Auditovatelné alerty (trace ID, historie změn, důvod vyhodnocení).
- Základní role/opr. model (min. admin/operator/reader) + bezpečné secrets.
- Testovací pipeline: Forge testy + Sentinel review gate + Hydra bezpečnost/chaos gate.
- Runbooky pro rollout/rollback, incident response a provozní metriky.
- SLO, monitoring, logování a minimální HA strategie.

### Nice-to-have (neblokuje RC)
- Pokročilé dashboardy a custom widgety.
- Prediktivní/anomální modely nad rámec pravidel.
- Multi-region active-active režim.
- Rozšířené integrace (nad prioritní top 3).
- Automatizované cost-optimization doporučení.

---

## v0.4 — Core ingestion a baseline observability

### Cíle
- Zprovoznit základní ingest pipeline a jednotný datový model.
- Mít funkční minimální observability (logs/metrics/health).

### Hlavní funkce
- Konektory pro klíčové zdroje (MVP sada).
- Normalizace událostí do interního schématu.
- Health endpointy + základní dashboard služeb.

### DoD
- Ingest běží kontinuálně bez manuálních zásahů v test prostředí.
- Validace schématu na vstupu i po transformaci.
- Dokumentovaný seznam podporovaných zdrojů a limitů.

### Test/Gate požadavky (Forge + Sentinel + Hydra)
- **Forge:** unit testy transformací, integrační test ingest→store, základní smoke test.
- **Sentinel:** kontrola čitelnosti kódu, chybové cesty, logování bez citlivých dat.
- **Hydra:** sken dependency zranitelností, základní hardening konfigurace, rate-limit sanity test.

### Rollout / Rollback
- **Rollout:** canary na 10 % zdrojů, 24h sledování chybovosti, poté 100 %.
- **Rollback:** přepnutí na předchozí parser/transform verzi, replay fronty z checkpointu.

---

## v0.5 — Rules engine a alerting MVP

### Cíle
- Zavést pravidla a generování alertů s minimem false negatives.

### Hlavní funkce
- Pravidlový engine (threshold + jednoduché korelace).
- Alert lifecycle (open/ack/resolve).
- Notifikace (min. 1 kanál) s deduplikací.

### DoD
- Pravidla jsou verzovaná a auditovatelná.
- Alert obsahuje kontext a důvod vyhodnocení.
- Potvrzená latence alertu v definovaném limitu pro MVP.

### Test/Gate požadavky
- **Forge:** test matice pravidel (pozitivní/negativní hrany), end-to-end scénáře alertů.
- **Sentinel:** review determinismu pravidel, fail-safe chování, UX textů alertů.
- **Hydra:** test odolnosti proti alert storm, abuse test notifikačního endpointu.

### Rollout / Rollback
- **Rollout:** shadow mode (bez notifikací) → omezené notifikace interně → plné zapnutí.
- **Rollback:** vypnutí nových pravidel feature flagem, návrat na předchozí rule set.

---

## v0.6 — Operability, RBAC a audit

### Cíle
- Zvýšit provozní bezpečnost a dohledatelnost změn.

### Hlavní funkce
- RBAC (admin/operator/reader).
- Audit log změn pravidel, konfigurace a zásahů operátora.
- Základní runbooky a on-call provozní postupy.

### DoD
- Každá citlivá akce je auditovaná s identitou a časem.
- Přístupová práva jsou vynutitelná napříč API/UI.
- Runbook pokrývá top incident scénáře.

### Test/Gate požadavky
- **Forge:** testy autorizace, regresní testy audit trailu, API contract testy.
- **Sentinel:** review privilege boundaries, konzistence error handlingu.
- **Hydra:** pokusy o privilege escalation, kontrola secrets managementu.

### Rollout / Rollback
- **Rollout:** postupná migrace účtů do rolí, read-only validace před enforce režimem.
- **Rollback:** dočasný návrat na compatibility auth mód + obnova předchozí role mapy.

---

## v0.7 — Resilience a výkon

### Cíle
- Zlepšit odolnost vůči špičkám a selháním závislostí.

### Hlavní funkce
- Queue backpressure, retry policy, circuit breaker.
- Performance tuning kritických cest.
- Lepší observability (latence per stage, saturation metriky).

### DoD
- Systém zvládne definovanou špičkovou zátěž bez kritické degradace.
- Řízené selhání závislosti nevede ke ztrátě dat.
- Dokumentovaný kapacitní profil.

### Test/Gate požadavky
- **Forge:** load testy, soak testy, testy retry/idempotence.
- **Sentinel:** review bottlenecků, anti-patternů a memory leak rizik.
- **Hydra:** chaos testy (výpadek DB/fronty/API), fault injection.

### Rollout / Rollback
- **Rollout:** modro-zelené nasazení s load compare, postupné přesměrování provozu.
- **Rollback:** okamžité přepnutí trafficu na předchozí verzi + drain nových workerů.

---

## v0.8 — Integrace a reporting

### Cíle
- Posílit využitelnost pro operace a management.

### Hlavní funkce
- Integrace s ticketingem/komunikačním nástrojem (prioritní top 3).
- Exporty/reporting (SLA incidentů, trendy alertů).
- Dashboardy pro operátory a leady.

### DoD
- Integrace mají retry, observability a jasné chybové stavy.
- Reporty jsou reprodukovatelné ze stejných dat.
- Dashboard odpovídá prioritním use-case operací.

### Test/Gate požadavky
- **Forge:** contract testy integrací, testy exportů a reportních výpočtů.
- **Sentinel:** review datové konzistence mezi UI/report/API.
- **Hydra:** testy úniku dat přes integrace, kontrola oprávnění exportů.

### Rollout / Rollback
- **Rollout:** aktivace integrací po jedné, monitorování chybovosti a latence.
- **Rollback:** deaktivace konkrétní integrace feature flagem bez dopadu na core.

---

## v0.9 — Pre-RC hardening

### Cíle
- Uzavřít otevřené kritické nedostatky a stabilizovat vydání.

### Hlavní funkce
- Bugfix wave (P0/P1), stabilizace API kontraktů.
- Kompletní provozní dokumentace a DR postup.
- Release kandidátní checklist a governance.

### DoD
- Žádné otevřené P0, P1 jen s explicitním akceptačním rozhodnutím.
- Freeze veřejných kontraktů pro RC.
- DR cvičení provedeno a vyhodnoceno.

### Test/Gate požadavky
- **Forge:** plná regresní sada + E2E kritických toků, migration testy.
- **Sentinel:** final code quality gate, dokumentační audit, maintainability score.
- **Hydra:** pen-test lite, supply-chain kontrola, chaos re-run kritických scénářů.

### Rollout / Rollback
- **Rollout:** release candidate rehearsal v produkčně podobném prostředí.
- **Rollback:** návrat na poslední stabilní tag + obnova dat dle recovery runbooku.

---

## v1.0-rc — Release Candidate

### Cíle
- Potvrdit připravenost na GA z hlediska stability, provozu a dokumentace.

### Hlavní funkce
- Uzavřená sada funkcí (feature freeze).
- Stabilní API/UI chování, final UX a final ops flows.
- Připravené release artefakty a runbooky pro GA.

### DoD
- Splněny RC podmínky (viz sekce „Definition of RC“).
- Žádné neakceptované kritické defekty.
- Schválení release boardem (Forge + Sentinel + Hydra + vlastník produktu).

### Test/Gate požadavky
- **Forge:** full regression, performance baseline potvrzena, upgrade/downgrade test.
- **Sentinel:** finální review kvality, konzistence dokumentace, stop-ship kritéria.
- **Hydra:** finální security gate, opakování chaos scénářů, ověření incident response.

### Rollout / Rollback
- **Rollout:** staged rollout (interní → omezený produkční segment), průběžné go/no-go body.
- **Rollback:** trigger na SLO breach nebo kritický incident, návrat na v0.9 stable + postmortem do 48h.

---

## Definition of RC (v1.0-rc)

### 1) Stability
- 14 dní bez P0 incidentu v RC režimu.
- Crash-free run kritických služeb v dohodnutém cíli (např. ≥ 99,9 % intervalů bez pádu).
- Deterministické chování pravidel při replay testech.

### 2) SLO
- Definované a měřené SLO pro ingest latenci, alert latenci a dostupnost API.
- Žádný SLO breach delší než schválený error budget v RC okně.
- On-call dashboard zobrazuje SLI/SLO v reálném čase.

### 3) Operace
- On-call rotace, eskalační matice a incident runbooky jsou aktuální.
- Ověřený backup/restore + DR scénář s evidencí výsledků.
- Release/rollback postup byl minimálně 1× natrénován end-to-end.

### 4) Dokumentace
- Technická dokumentace (architektura, API, limity, known issues) je kompletní.
- Provozní dokumentace (runbooky, troubleshooting, FAQ) je použitelná bez tribal knowledge.
- Release notes pro GA jsou připravené v draftu.

---

## Poznámky k řízení změn
- Každá verze končí formálním go/no-go rozhodnutím.
- Scope creep po v0.9 pouze přes explicitní výjimku; jinak přesun do post-GA backlogu.
- Při konfliktu termín vs. kvalita má přednost splnění gate kritérií.