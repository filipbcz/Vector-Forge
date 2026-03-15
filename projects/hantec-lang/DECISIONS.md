# DECISIONS.md — hantec-lang

## 2026-03-14 — v0.3 control flow jako bloková syntaxe
- Přidána bloková pravidla `kdyz <expr>` a `opakuj <expr>` uzavíraná klíčovým slovem `konec`.
- Parser používá stack AST bloků, aby podporoval zanoření a explicitní chyby při chybějícím/neočekávaném `konec`.
- Generátor JS mapuje:
  - `kdyz` → `if ((expr)) { ... }`
  - `opakuj` → `for` smyčka s interním čítačem `__hantec_iN`
- Důvod: minimální, čitelný krok roadmapy v0.3 bez zavádění složitých parser-combinatorů.
- Dopad: zpětně kompatibilní pro dosavadní v0.2 skripty.

## 2026-03-15 — v0.4 funkce jako další blokový konstruktor
- Přidána syntaxe `funkce <name>(<params>)` ... `konec` s podporou deklarací na top-level i vnořeně v blocích.
- `vrat <expr>` je povolen pouze uvnitř funkce; parser vrací explicitní chybu při použití mimo `funkce`.
- Validace podpisu kontroluje identifikátor jména funkce i všech parametrů a vrací konkrétní syntax error zprávy.
- Generátor JS mapuje funkce na standardní `function name(params) { ... }` deklarace a zachovává blokové odsazení těla.
- Verzovací markery transpileru a bytecode placeholderu byly posunuty na `v0.4`.

## 2026-03-15 — v0.4.1 web IDE syntax highlighting (MVP)
- Editor v `ide-web/index.html` byl přepracován na dvouvrstvý model (`textarea` + `pre`), aby šlo zachovat editaci i zvýraznění bez externích knihoven.
- Přidáno zvýraznění klíčových slov jazyka (`dej`, `rekni`, `spocitej`, `kdyz`, `opakuj`, `konec`, `funkce`, `vrat`), čísel a komentářů (`# ...`).
- Přidána synchronizace scrollu mezi vrstvami a handling `Tab` pro odsazení dvěma mezerami.
- Důvod: dokončit zbývající bod roadmapy v0.3 s minimální složitostí a bez zavádění editor frameworku.
- Dopad: IDE je čitelnější při psaní delších skriptů; runtime/kompilátor zůstaly beze změn.

## 2026-03-15 — v0.4.2 stdlib základy (MVP)
- Do generovaného JS byl přidán stdlib prelude se třemi funkcemi: `delka(value)`, `cislo(value)`, `text(value)`.
- Implementace je záměrně malá a zero-dependency: helpery jsou emitované přímo transpilerem, bez změny runtime vrstvy.
- `cislo` validuje převod pomocí `Number.isNaN` a vyhazuje explicitní chybu pro nečíselné vstupy.
- Marker transpileru/bytecode placeholderu byl posunut na `v0.4.2`.
- Důvod: uzavřít „Standard library basics“ bod roadmapy konzistentně s dosavadní architekturou (line-based parser + JS backend).
- Dopad: skripty mohou používat základní utility bez ručního psaní helper funkcí v každém programu.

## 2026-03-15 — v0.4.3 rozšíření stdlib o agregační a membership helpery
- Do stdlib prelude přidány funkce `minimum(...values)`, `maximum(...values)` a `obsahuje(container, needle)`.
- `minimum/maximum` interně používají `cislo` pro konzistentní konverzi a fail-fast chování na nečíselných vstupech.
- U obou agregačních funkcí je explicitní guard na prázdné argumenty (`requires at least one argument`) kvůli čitelnému runtime erroru.
- `obsahuje` podporuje string/array přes `.includes(...)` a objekty přes `hasOwnProperty`; pro ostatní typy vrací `false`.
- Marker transpileru/bytecode placeholderu byl posunut na `v0.4.3` a příklady/testy byly rozšířeny o nové helpery.
- Důvod: navázat na otevřený bod po v0.4.2 (rozšíření stdlib) bez rozbití jednoduchého line-based kompilátoru.
- Dopad: jazyk má praktičtější vestavěné utility pro běžné skriptovací scénáře v CLI i IDE.

## 2026-03-15 — v0.5.0 bytecode prototyp + VM runner
- Bytecode emitter už není placeholder podle velikosti JS; nově generuje strukturované instrukce (`DECLARE`, `PRINT_TEXT`, `PRINT_EXPR`, `IF`, `REPEAT`, `FUNCTION`, `RETURN`) z AST.
- Přidán VM interpreter (`runtime/src/vm.js`) s vyhodnocením výrazů nad scope a rekurzivním během bloků, včetně return-signal mechaniky uvnitř funkcí.
- Runtime runner (`runtime/src/run.js`) umí spouštět jak `.js`, tak `.bytecode.json` vstupy.
- CLI rozšířeno o `hantec run-bc <file.hantec>` pro bytecode execution path.
- Test suite rozšířena o integrační test bytecode běhu s funkcí + bloky + stdlib.
- Důvod: uzavřít první část roadmapy v0.5 (reálný VM prototyp) bez rozbití stávající JS backend kompatibility.
- Dopad: projekt má dvě spustitelné backend cesty (JS transpile a interní VM), což odemyká další práci na fixture sadě a publikaci.

## 2026-03-15 — v0.5.1 fixture test suite + backend parity checks
- Přidán fixtures harness (`tests/fixtures.test.js`) načítající JSON scénáře z `tests/fixtures/*.json`.
- Každý fixture se spouští dvakrát: nad JS backendem (`vm.runInNewContext`) i nad bytecode VM backendem (`runBytecodeObject`) a porovnává stejný očekávaný výstup.
- Do repozitáře přidány první tři scénáře (`basic-flow`, `functions-stdlib`, `text-and-length`) jako základ rozšiřitelné sady.
- `npm test` nově běží jak unit testy transpileru, tak fixture parity testy.
- Sentinel review: změna je modulární (oddělený test harness), bez zásahu do parser/runtime logiky.
- Hydra security review: test harness používá izolovaný `vm` kontext s timeoutem; neotvírá nové síťové/file capability a nemění existující threat model (`new Function` zůstává pouze ve stávajícím runtime/transpileru).
- Důvod: uzavřít roadmap bod „Test suite + fixtures“ a průběžně hlídat konzistenci JS vs VM běhu.
- Dopad: rychlejší regresní kontrola při dalších změnách jazyka i runtime.

## 2026-03-15 — v0.5.2 package publishing strategie + quality gates
- `package.json` doplněn o whitelist `files`, aby publish artefakt obsahoval jen runtime/compiler/IDE/docs/examples a ne interní šum.
- Přidán script `npm run pack:check`, který provádí `npm pack --dry-run --json` a validuje povinné soubory + blokuje `tests/`, `dist/`, `.github/`.
- `prepublishOnly` gate nyní vynucuje `npm test && npm run pack:check` před publish pokusem.
- Přidána dokumentace `docs/PUBLISHING.md` s release checklistem; `private: true` zůstává jako ochrana proti omylu a publish je explicitní krok až při release rozhodnutí.
- Roadmap bod "Package publishing strategy" uzavřen ve `docs/ROADMAP.md`.
- Sentinel review: změna je maintainable (malý validátor v jednom skriptu, deterministické podmínky, bez zásahu do parser/runtime logiky).
- Hydra security review: zmenšený balíček snižuje attack surface (žádné test fixture nebo build artefakty v distribuci); gate neotevírá nové síťové capability ani tajné vstupy.
