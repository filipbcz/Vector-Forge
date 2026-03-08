# VF Ops Watch v0.3 — Skeleton

Cíl v0.3: posunout watch z "snapshot checku" na kontinuální provozní přehled (trendy + incident timeline).

## TODO checklist

### Trendy (time-series pohled)
- [ ] Definovat metriky pro trendování (gateway dostupnost, channel latency, error-lines/min).
- [ ] Ukládat běhy do historie (nejen `latest.json`) s retenční politikou.
- [ ] Přidat agregace za 1h / 24h / 7d (min/avg/max, počty warning/critical).
- [ ] Přidat jednoduchý trend summary do reportu (`improving/stable/degrading`).
- [ ] Připravit export pro dashboard (JSONL/CSV endpoint nebo soubor).

### Incident timeline
- [ ] Zavrhnout model incidentu (start, eskalace, mitigace, resolved).
- [ ] Detekovat přechody stavu (`ok -> warning -> critical -> ok`) a ukládat události.
- [ ] Přidat deduplikaci opakujících se eventů v krátkém okně.
- [ ] Generovat timeline výstup za posledních 24h/7d.
- [ ] Napojit alert text na „incident context“ (odkaz na poslední timeline eventy).

### Operativa / kvalita
- [ ] Doplnit testy pro timeout klasifikaci (gateway/channel => warning).
- [ ] Doplnit test pro `SuccessExitStatus` behavior v deploy dokumentaci.
- [ ] Připravit migrační poznámky v `PROJECT.md` pro přechod 0.2.1 -> 0.3.
