# THIS_WEEK_PLAN

Týdenní plán (Po–Ne), každý den max **20–45 minut**. Zaměření na 3 cíle:
- **AI sprint**
- **Security baseline**
- **Idea → experiment pipeline**

## Pondělí (30–40 min)
- [ ] **AI sprint:** Vyber 1 konkrétní mikro-cíl týdne (např. automatizace jednoho opakovaného kroku).
- [ ] **Idea→experiment:** Zapiš 3 nápady, vyber 1 s nejvyšším dopadem/nejnižší náročností.
- [ ] Výstup: definovaný AI sprint cíl + vybraný experiment.

## Úterý (25–35 min)
- [ ] **Security baseline:** Zkontroluj branch protection na hlavní větvi (blokace přímého push, povinný PR).
- [ ] **Security baseline:** Ověř minimálně 1 pravidlo review gate (min. 1 reviewer).
- [ ] Výstup: stav nastavení + seznam mezer.

## Středa (30–45 min)
- [ ] **AI sprint:** Implementuj první malý krok (MVP level, bez polish).
- [ ] **Idea→experiment:** Připrav experiment podle šablony `EXPERIMENT_TEMPLATE.md`.
- [ ] Výstup: první funkční draft + připravený experiment.

## Čtvrtek (20–30 min)
- [ ] **Security baseline:** Ověř CI gate (required checks před merge).
- [ ] **Security baseline:** Proveď rychlý token hygiene audit (odstranění hardcoded tajemství, revokace starých tokenů).
- [ ] Výstup: potvrzené CI podmínky + vyčištěné/rotované tokeny.

## Pátek (30–45 min)
- [ ] **Idea→experiment:** Proveď 1h experiment v rozdělených blocích (např. 2×30 min), měř 1 hlavní metriku.
- [ ] **AI sprint:** Doplň lehké zlepšení podle výsledku experimentu.
- [ ] Výstup: naměřený výsledek + krátké doporučení.

## Sobota (20–30 min)
- [ ] **Security baseline:** Ověř 2FA na všech kritických účtech (GitHub, cloud, CI/CD, správce hesel).
- [ ] **Idea→experiment:** Rozhodni: pokračovat / upravit / zahodit.
- [ ] Výstup: rozhodnutí nad experimentem + 2FA status.

## Neděle (25–35 min)
- [ ] **AI sprint:** Týdenní retrospektiva (co fungovalo, co blokovalo, co příště jinak).
- [ ] **Execution plánování:** Připrav 1 konkrétní cíl na příští týden pro každý ze 3 proudů.
- [ ] Výstup: uzavření týdne + draft dalšího týdne.

---

## Definice „hotovo“ na konci týdne
- AI sprint: existuje minimálně 1 použitelný posun (funkce / automatizace / workflow krok).
- Security baseline: všechny položky checklistu mají stav (splněno / otevřeno s plánem).
- Idea→experiment pipeline: proběhl alespoň 1 experiment s metrikou a rozhodnutím.
