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
