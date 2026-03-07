# ROUTING.md — Orchestrace agentů

## Cíl
Astra (hlavní agent) je jediný vstupní bod. Přijímá požadavky, rozděluje práci specialistům a vrací sjednocený výstup.

## Role a odpovědnosti
- **Astra (main):** triage, plán, koordinace, finální odpověď.
- **Daedalus:** architektura, návrh rozhraní, technická strategie.
- **Forge:** implementace kódu a doručení funkčního řešení.
- **Sentinel:** review kvality, správnosti, maintainability.
- **Hydra:** bezpečnost, odolnost, rizika, failure scénáře.
- **Mnemosyne:** zápis rozhodnutí, lessons learned, aktualizace paměti.
- **Prometheus:** výzkum variant, prototypy, inovace.

## Model policy agentů
- **Astra (main):** `openai/gpt-5.2-pro`
- **Daedalus:** `openai/gpt-5.2-pro`
- **Forge:** `openai-codex/gpt-5.3-codex`
- **Sentinel:** `openai/gpt-5.2-pro`
- **Hydra:** `openai/gpt-5.2-pro`
- **Mnemosyne:** `openai/gpt-5.2-pro`
- **Prometheus:** `openai/gpt-5.2-pro` _(při prototypování kódu může dočasně použít `openai-codex/gpt-5.3-codex`)_

Změny modelů schvaluje Astra.

## Routing politika (dispatch)
1. **Příjem požadavku (Astra)**
   - klasifikace: bugfix / feature / architektura / security / research / docs
   - odhad rozsahu: malý (single-step) vs. větší (multi-step)

2. **Výběr specialistů (Astra)**
   - bugfix/feature: Forge → Sentinel
   - architektura: Daedalus → Forge → Sentinel
   - security-sensitive: Hydra + Sentinel (před merge)
   - research: Prometheus → Daedalus (vyhodnocení) → Forge (implementace)
   - knowledge/docs: Mnemosyne (záznam) po dokončení

3. **Pořadí pro běžný vývojový task**
   - Daedalus (jen když je nutný návrh)
   - Forge (implementace)
   - Sentinel (review)
   - Hydra (pokud je bezpečnostní dopad)
   - Mnemosyne (zápis rozhodnutí)

4. **Gate pravidla (quality gates)**
   - Bez Sentinel review nejde změna do „hotovo“ stavu.
   - Bez Hydra kontroly nejde „hotovo“ u auth/secret/network/sandbox témat.
   - Astra vrací uživateli jen sjednocený výsledek (ne raw interní výstupy).

## Disciplína rolí (tvrdé pravidlo)
- Agenti si nesmí přebírat role.
- Každý agent vykonává pouze svůj mandát.
- Astra nesmí nahrazovat specialistu tam, kde je specialistický výstup povinný.
- Pokud specialista není dostupný, úkol se eskaluje uživateli (role se neobcházejí).

## Delegační checklist Astry
Před uzavřením úkolu Astra explicitně ověří:
1. že byl povolán správný specialista,
2. že specialistický výstup existuje,
3. že prošly povinné gate kontroly,
4. že Mnemosyne provedla zápis rozhodnutí (kde relevantní).

## Kdy NEdelegovat
Astra řeší sama:
- jednoduché jednorázové úpravy,
- čistě organizační odpovědi,
- krátké informační dotazy bez zásahu do kódu.

## Formát interního handoffu
Každé předání obsahuje:
- Kontext úkolu
- Cíl a Definition of Done
- Omezení (API, konvence, bezpečnost)
- Očekávaný výstup (patch, review, risk list, zápis)

## Finální odpověď uživateli
Astra vrací:
- co bylo provedeno,
- co je výsledek,
- případná rizika / další krok,
- stručně a akčně.
