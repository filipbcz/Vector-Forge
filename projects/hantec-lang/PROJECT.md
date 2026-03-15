# PROJECT.md — hantec-lang (Mulda)

## Cíl
Experimentální jazyk (Mulda/Hantec) + web IDE pro rychlé iterace syntaxe a runtime.

## Aktuální scope (schválený směr)
- Iterativně dodávat roadmapu po malých verzích
- Každý běh: návrh → implementace → test/re-test → review (Sentinel/Hydra) → commit/push

## Stav
- Verze: `0.5.0`
- Dodáno: základní řízení toku (`kdyz`, `opakuj`, `konec`) + funkce (`funkce`, `vrat`, `konec`) + rozšířená stdlib (`delka`, `cislo`, `text`, `minimum`, `maximum`, `obsahuje`)
- Nově ve v0.5.0: bytecode prototyp (`.bytecode.json`) + VM runner (`runtime/src/vm.js`) + CLI cesta `hantec run-bc`
- Otevřené body po v0.5.0: fixture sada + publishing strategie
