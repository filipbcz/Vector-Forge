# Mulda Language Roadmap

## Aktuální stav
- Stabilní verze: **v0.9.0**
- Směr: **Pascal-first syntax**, primární runtime/backend: **C**
- JS backend zůstává zachovaný jako **dev/debug path** (rychlé iterace, trace, IDE experimenty)

## v0.8 — C backend generator (MVP)
Cíl: generovat validní C kód z Mulda AST a spustit ho přes gcc.

**Definition of Done (DoD):**
- `muldac --target c` generuje přeložitelný `.c` výstup pro core subset jazyka.
- MVP pokrývá minimálně: `Hokna`, deklarace proměnných, assignment, `vyblij`, `dyz`, `opakuj`, základní funkce/return.
- Runtime trace parity na základní úrovni (min. `DECLARE`, `ASSIGN`, `PRINT`, `IF`, `RETURN`) dostupná i pro C cestu.
- E2E testy projdou na Linuxu přes gcc (CI/local) a porovnají výstup s očekáváním.
- Dokumentace obsahuje workflow „Mulda -> C -> binárka“.

## v0.9 — Cross-compile Linux/Windows (gcc + mingw-w64)
Cíl: standardizovat build pipeline pro nativní výstupy na Linux a Windows.

**Definition of Done (DoD):**
- Build skripty podporují Linux target (gcc) a Windows target (mingw-w64).
- `muldac` umí explicitně volit target/platformu (`linux-x64`, `windows-x64` minimálně).
- CI ověří, že oba targety se úspěšně zkompilují z referenčních fixture.
- Artefakty buildů jsou verzované a dohledatelné (naming + metadata).
- Dokumentace má stručný cross-compile návod včetně závislostí.

**Status v0.9:** ✅ Implementováno (sjednocený cross-build command, CI workflow, artifact manifest+checksums).

## v1.0-rc — Release candidate
Cíl: stabilní kandidát na 1.0 s produkčně použitelným toolchainem.

**Definition of Done (DoD):**
- Stabilita: žádné známé blocker bugy v parser/compiler/runtime pro deklarovaný rozsah jazyka.
- Release artifact: připravený installer nebo distribuční balíček pro Linux/Windows (jasně popsané instalační kroky).
- Debugger parity: klíčové debug scénáře (run/step/trace/variables) funkčně srovnané mezi C a JS dev/debug cestou.
- Upgrade/migration docs z 0.7.x/0.8/0.9 jsou dokončené.
- RC checklist (testy, docs, release notes) je uzavřený a auditovatelný.

## Migration note
- **JS backend se nemaže.** Zůstává oficiálně jako vývojová a debugovací větev.
- Primární produkční směr je nově C backend (Pascal-first stack), JS slouží pro rychlé experimenty, IDE debugging a porovnávání trace chování.
