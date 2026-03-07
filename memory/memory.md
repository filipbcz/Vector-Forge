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
