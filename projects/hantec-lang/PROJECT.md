# PROJECT.md — hantec-lang (Mulda)

## Cíl
Experimentální jazyk (Mulda/Hantec) + web IDE pro rychlé iterace syntaxe a runtime.

## Aktuální scope (schválený směr)
- Iterativně dodávat roadmapu po malých verzích
- Každý běh: návrh → implementace → test/re-test → review (Sentinel/Hydra) → commit/push

## Stav
- Verze: `0.5.2`
- Dodáno: základní řízení toku (`kdyz`, `opakuj`, `konec`) + funkce (`funkce`, `vrat`, `konec`) + rozšířená stdlib (`delka`, `cislo`, `text`, `minimum`, `maximum`, `obsahuje`)
- Nově ve v0.5.2: publishing strategie + release gates (`pack:check`, `prepublishOnly`, `docs/PUBLISHING.md`)
- Otevřené body po v0.5.2: první ostrý npm publish (po rozhodnutí Filipa)
