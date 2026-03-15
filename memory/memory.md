# Paměť Vector Forge

## Konvence psaní kódu uživatele
- Pojmenování Lazarus/FPC: `lowerCamelCase`
- prefix lokální proměnné: `p`
- prefix pole (field): `f`
- prefix globální proměnné: `g`
- prefix parametru: `a`
- volitelná písmena typu:
  - `s` = string
  - `i` = numerická hodnota
  - `b` = boolean
- používat pouze anglické názvy

## Provozní principy
- Pokud je to možné, vracej funkční řešení připravené k nasazení.
- Neměň veřejná API, pokud to není výslovně povoleno.
- Po dokončení každého úkolu zaznamenej důležitá rozhodnutí.

## Projektová rozhodnutí
- Identity agentů jsou rozdělené do samostatných souborů v `agents/<agent>/IDENTITY.md`.
- Kořenový `IDENTITY.md` zůstává sdílenou šablonou veřejné persony pro celý workspace.
- Hlavní agent byl přejmenován na **Astra** a převzal roli „koordinátorka všeho“.
- Samostatný agent `agents/astra` byl zrušen, aby nevznikaly duplicitní role.
- Routing mezi specialisty je formalizovaný v `agents/ROUTING.md`.
- Model policy agentů je formalizovaná v `agents/ROUTING.md` podle jednotlivých rolí.
- Astra je jediný vstupní orchestrátor; specialisté běží přes interní dispatch pipeline.
- Tvrdé pravidlo spolupráce: agenti si nesmí přebírat role; každý vykonává pouze svoji roli.
- Zápisy do projektové paměti (`memory/memory.md`) provádí výhradně Mnemosyne.
- Korekce procesu: předchozí zápis provedla Astra; nově je to opraveno a zapisuje Mnemosyne.
- Astra odpovídá za řízení spolupráce, správné delegování a finální odpovědnost za výsledek.
- Před odevzdáním technického výstupu musí proběhnout kompletní kontrola (Sentinel: code review, Forge: testy/ověření běhu, Hydra: security review, je-li relevantní); Astra smí reportovat „hotovo“ až po potvrzení těchto kontrol.
- Režim „default execute“ je schválen: tým jedná autonomně na běžných úkolech bez čekání na potvrzení.
- Eskalace na Filipa probíhá jen při blokerech, přístupech/tajnech, externích nevratných akcích nebo strategickém rozhodnutí.
- Standard finálního reportu: co je hotovo, rizika a další krok.
- Trvalé procesní pravidlo: po každé změně kódu musí proběhnout kompletní re-run kontrolního cyklu (Sentinel review + Forge testy + Hydra security review, pokud relevantní) ještě před označením úkolu jako „hotovo“.
- Nové tvrdé pravidlo od Filipa: vždy dodržet vývojový cyklus `návrh -> realizace -> test/re-test -> Sentinel review -> Hydra security review -> teprve potom stav hotovo/nasazení`; Astra tento cyklus vynucuje bez výjimek.
- Nové tvrdé pravidlo od Filipa: Astra musí řídit exekuci autonomně a proaktivně bez nutnosti, aby se Filip ptal, zda někdo pracuje; sama spouští další kroky podle plánu a posílá stručné checkpointy (co běží / co je hotovo / co blokuje). Toto pravidlo je závazné pro všechny další iterace projektu.
- VF Ops Watch postoupil na v0.4.0: přidán normalizovaný ingestion model (`ingestion.events`) + deterministická schema validace (`ingestion_schema` check), s testy a gate PASS (Forge/Sentinel/Hydra).
- VF Ops Watch postoupil na v0.5.0: přidán rules engine MVP (`evaluate_rules`) + lifecycle incidentů `open/ack/resolve` (`apply_lifecycle`) a shadow mode alertingu pro bezpečný rollout; test/gate PASS (Forge/Sentinel/Hydra).
- Tvrdé rozhodnutí Filipa: projekt **VF Ops Watch** je pozastaven.
- Veškeré cron joby související s projektem VF Ops Watch zůstávají pozastavené.
- Projekt VF Ops Watch se nesmí znovu instalovat ani spouštět bez explicitního pokynu Filipa.
- Mulda/Hantec v0.5.2 uzavřel publishing strategii: whitelist `files`, `pack:check` dry-run validace balíčku a `prepublishOnly` gate (`npm test` + packaging check) před publikací.
- Mulda v0.6.2 zavedla entry-point guardrails: parser vyžaduje start keyword (`Hokna` nebo legacy alias) jako první non-comment statement a odmítá duplicitní/pozdní start token.
- Mulda v0.8.0 doručila C backend MVP: `muldac --target c` generuje C, `mulda run-c` kompiluje a spouští přes gcc, s baseline trace eventy i pro C cestu.
- Tvrdé pravidlo od Filipa pro projekt Mulda: prioritně a dlouhodobě podporovat pouze C větev; JS/VM větev udržovat jen v nezbytném kompatibilním režimu (bez nových feature).
- Mulda v0.9 groundwork: `muldac`/`mulda compile` podporuje `--platform linux-x64|windows-x64` pro C target a mapuje toolchain (`gcc` / `x86_64-w64-mingw32-gcc`) pro nativní artefakty.
- GitHub autentizace pro git operace je trvale přes PAT (`x-access-token`), nikdy username+heslo; u Google účtu je token povinný a při auth chybě na `push` se jako první ověřuje token flow.
- Trvalé pravidlo push workflow: vždy používat PAT (`x-access-token`) a před delšími běhy ověřit autentizaci přes `git push --dry-run origin main`; pokud dry-run selže, release checkpoint se okamžitě označí jako BLOKUJE a nejdřív se opraví credentials; Astra toto pravidlo povinně vynucuje, aby se neopakovaly falešné blokace push.
- Mulda v1.0.0-rc.2 (C větev): opraven edge-case parser argumentů v C normalizaci volání (`splitCallArgs`), aby escaped quote + čárka uvnitř string literálu nerozbila mapování builtinů (`obsahuje/minimum/maximum`); kryto regresním testem a cross-build gate PASS.
- Mulda v1.0.0-rc.2 (C/release stabilita): `scripts/build-cross-c.js` nyní transpile do C provede jen jednou a pak kompiluje linux/windows artefakty přes `compileCToNative`; metadata sidecary zůstávají zachované přes explicitní `writeNativeArtifactMetadata`, gate (`npm test`, cross-build, `release-rc`) PASS.
