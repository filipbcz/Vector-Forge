# DECISIONS.md — mulda-lang

## 2026-03-15 — C runtime parity hardening: bool print semantics (RC.2)

- C backend už při `vyblij <bool-expr>` netiskne `1/0`, ale `true/false` přes nový helper `__mulda_print_bool`.
- `generateC()` přidal lehkou heuristiku `isLikelyBooleanCExpression(...)` (literal `true/false`, bool proměnná, relace, logické operátory, `__mulda_obsahuje(...)`) pro volbu print cesty.
- Cíl: lepší runtime/debug parity vůči JS/VM větvi bez rozšíření feature scope mimo C branch.
- Přidány regresní testy:
  - codegen kontrakt: bool assignment flow používá `__mulda_print_bool((bool)(flag));`
  - gcc e2e: `testCE2EBoolPrintParityWhenGccAvailable` očekává stdout `false`.
- Ověřené gate v cyklu:
  - Forge: `npm test` PASS, `npm run build:c:cross -- examples/hello.mulda` PASS (linux-x64 + windows-x64).
  - Sentinel: maintainability OK — změna je izolovaná v C emitteru + krytá unit/e2e testem.
  - Hydra: security posture OK — žádná nová privilegia ani externí I/O; změna pouze formátu výstupu bool hodnot.

## 2026-03-15 — Mulda spec alignment (v0.6.0)

- Jazyk byl sjednocen na schválený název **Mulda** a příponu `.mulda`.
- Parser/transpiler nově primárně podporuje:
  - `Hokna` (start programu)
  - `vyblij` (print)
  - bool typ/literály/operátory: `joNeboHovno`, `jo`, `hovno`, `aKurva`, `bo`, `nechcu`
- Výrazy se v compileru normalizují na JS ekvivalenty (`jo`->`true`, `hovno`->`false`, `aKurva`->`&&`, `bo`->`||`, `nechcu`->`!`).
- Přidána volitelná type anotace v deklaraci: `dej x: joNeboHovno = jo`.
- Runtime CLI přejmenováno na `mulda` + alias commandy `muldac`, `muldarun`.
- Legacy kompatibilita zachována jako deprecated aliasy, pokud to bylo levné:
  - syntax: `nacpi`, `program`, `rekni`, `spocitej`
  - CLI: `hantec` (proxy wrapper)
- IDE demo, examples, test fixtures a dokumentace přepsány na Mulda názvosloví.
- Bytecode target přejmenován na `mulda-vm`; transpiler marker aktualizován na `v0.6.0`.

## 2026-03-15 — Trace parity for JS + VM (v0.6.1)

- Přidán jednotný trace hook do JS outputu (`__muldaTrace`) s eventy na statement-level (`DECLARE`, `PRINT_*`, `IF`, `REPEAT`, `FUNCTION`, `RETURN`).
- Runtime přidal flag `--trace-json` (vedle `--trace/--debug`) pro strojově čitelný JSONL trace.
- `--trace-json` funguje pro oba backendy:
  - JS backend přes preload `runtime/src/js-trace-hook.js`
  - VM backend přes rozšířený tracer s `traceFormat`.
- CLI (`mulda`, `muldarun`) i dokumentace aktualizovány.

## 2026-03-15 — Entry-point guardrails (v0.6.2)

- Parser nově vyžaduje start keyword (`Hokna` nebo legacy alias `nacpi`/`program`) jako první non-comment statement.
- Duplicitní nebo pozdě umístěný start keyword vrací explicitní syntax error.
- Tím se jazyk chová víc podle schválené specifikace (deterministický entry-point) a IDE/demo metadata byla dorovnána na v0.6.2.

## 2026-03-15 — IDE debug foundation + approved keyword pivot (v0.7.0)

- Web IDE bylo přepracováno do single-page debug layoutu:
  - top toolbar (`Run`, `Pause`, `Step`, `Continue`) se stavovými badge
  - levá část editor + gutter breakpointy
  - pravá část debug panely (output, stack timeline, variables/watch MVP)
- IDE run endpoint nově běží v trace-json režimu a vrací parsed trace eventy pro klientské stepping UI.
- Stepping je MVP emulace nad trace replay (true runtime pause zatím není implementována).
- Přidána vizualizace párování bloků (`Hokna`, `dyz`, `opakuj`, `funkcicka` ↔ `konec`) + warningy na unmatched `konec`/missing `konec`.
- Jazykové keywordy byly dorovnány na schválený slovník:
  - primární: `dyz`, `funkcicka`
  - deprecated kompatibilní aliasy zůstávají: `kdyz`, `funkce`
- Verze package/compiler/bytecode metadata zvýšena na `v0.7.0`.

## 2026-03-15 — Trace detail enrichment for variables panel (v0.7.2)

- `DECLARE` trace event nově nese detail ve formátu `name=value` v obou backendech (JS i VM).
- V JS backendu se trace emituje až po evaluaci deklarace, aby bylo možné bezpečně logovat skutečnou hodnotu.
- VM backend sjednocen na stejný detail formát, takže IDE variables panel zobrazuje konzistentní snapshot napříč runtime režimy.
- Přidány regresní testy, které ověřují `DECLARE detail === "x=1"` pro JS i VM trace.

## 2026-03-15 — Assignment snapshots beyond declarations (v0.7.3)

- Parser/compiler přidal statement assignmentu `x = expr` s AST node `assign`.
- JS backend emituje runtime assignment a následný trace event `ASSIGN` s detailem `name=value`.
- Bytecode + VM přidaly opcode `ASSIGN`; assignment aktualizuje existující binding ve scope chainu a při chybějící proměnné vrací explicitní runtime error.
- IDE variables panel nově skládá snapshot jen z `DECLARE` + `ASSIGN`, takže změny hodnot po deklaraci jsou vidět i při step replay.
- Verze package/compiler/bytecode/IDE markerů zvýšena na `v0.7.3`.

## 2026-03-15 — Roadmap pivot: Pascal-first + primární C backend (v0.8/v0.9/v1.0-rc)

- Schválen pivot roadmapy na **Pascal-first** směr s **C backendem jako primárním produkčním targetem**.
- Definované milníky:
  - **v0.8**: C backend generator (MVP)
  - **v0.9**: cross-compile Linux/Windows (gcc + mingw-w64)
  - **v1.0-rc**: release candidate (stabilita, installer/release artifact, debugger parity)
- Každý milník má explicitní DoD v `docs/ROADMAP.md` a zkráceně v `PROJECT.md`.
- **Migration note:** JS backend zůstává podporovaný jako dev/debug path, není deprecovaný pro interní vývojové použití.

## 2026-03-15 — C backend MVP delivered (v0.8.0)

- Compiler nově generuje vedle JS/bytecode i C výstup (`compileMulda().c`, `compiler/src/transpile.js` podporuje `.c` output).
- CLI podporuje C flow:
  - `muldac --target c <file.mulda>`
  - `mulda run-c <file.mulda>` / `muldarun --c <file.mulda>`
- C backend emituje základní trace eventy přes stderr (text/json podle `MULDA_TRACE_FORMAT`) s backend markerem `c`.
- Přidány testy pro C generator + CLI parsing a gcc E2E smoke test (pokud je gcc dostupné).

## 2026-03-15 — v0.9 groundwork: explicit C platform targeting in CLI

- `muldac`/`mulda compile` nově přijímají `--platform linux-x64|windows-x64` pro C target.
- C compile flow je rozdělený na toolchain resolver:
  - `linux-x64` -> `gcc`
  - `windows-x64` -> `x86_64-w64-mingw32-gcc`
- Při `--target c --platform ...` se kromě `dist/<name>.c` pokusí vytvořit i nativní artefakt:
  - `dist/<name>-linux-x64`
  - `dist/<name>-windows-x64.exe`
- Přidány regresní testy pro parse `--platform` a mapování toolchainu.

## 2026-03-15 — v0.9 artifact metadata sidecar for C platform builds

- Úspěšný build přes `muldac --target c --platform ...` nově generuje metadata sidecar JSON vedle artefaktu (`*.metadata.json`).
- Metadata obsahují minimálně: `version`, `backend`, `platform`, `compiler`, `generatedAt`, `sourceFile`, `cFile`, `artifactFile`.
- Tím je splněná dohledatelnost artefaktů (naming + metadata) pro v0.9 cross-compile milestone.
- Přidán regresní test pro strukturu metadata souboru.

## 2026-03-15 — v0.9 release: unified cross-build command + CI artifacts manifest

- Přidán jednotný build command `npm run build:c:cross -- <file.mulda>`, který z jednoho zdroje postaví `linux-x64` i `windows-x64` artefakt (pokud je toolchain dostupný).
- Chybějící toolchain vrací explicitní status `[TOOLCHAIN_MISSING]` a instalační doporučení:
  - GCC: `build-essential`
  - MinGW-w64: `mingw-w64`
- Build orchestrátor generuje release manifest `dist/<name>.release-manifest.json` s:
  - platform map (`linux-x64`, `windows-x64`)
  - stavem každého targetu
  - SHA256 checksumy artefaktů a metadata sidecar souborů
- Přidán GitHub Actions workflow (`.github/workflows/mulda-c-cross.yml`) pro Linux runner + MinGW cross-compile a upload C artefaktů.
- Verze projektu zvýšena na `0.9.0`.

## 2026-03-15 — v0.9 finalized: host cross-build verification + gates

- Reálný cross-build z `examples/hello.mulda` ověřen na hostu pro oba targety:
  - `linux-x64` (`gcc`)
  - `windows-x64.exe` (`x86_64-w64-mingw32-gcc`)
- Opraven probe bug dostupnosti toolchainu (`spawnSync(...).status`), který falešně hlásil chybějící compiler i při `status=0`.
- C backend doplněn o mapování stdlib callů `minimum/maximum/obsahuje` na C helpery, aby referenční hello fixture šla skutečně linknout pro Linux i Windows.
- Release manifest (`dist/hello.release-manifest.json`) obsahuje SHA256 pro artefakty i metadata sidecary a `allTargetsBuilt=true`.
- Sentinel gate (stručně): maintainability OK po opravě probe a explicitním C mapování builtins; žádné regresní selhání v `npm test`.
- Hydra gate (stručně): cross-build smoke bez nových bezpečnostních varování; artefakty deterministicky dohledatelné přes checksum + metadata.

## 2026-03-15 — v1.0.0-rc.1 release packaging + installer baseline

- Přidána release struktura `release/` pro Linux/Windows payload, manifest a checksums.
- Přidán skript `scripts/release-rc.sh`, který provede testy, cross-build, smoke run linux artefaktu a připraví RC bundle (`release/rc-<ver>-<timestamp>`).
- Přidány instalační skripty:
  - `release/install-linux.sh`
  - `release/install-windows.ps1` (template)
- Přidán auditní checklist debugger parity: `docs/RC_CHECKLIST.md`.
- Verze package zvýšena na `1.0.0-rc.1`.
- Sentinel gate (RC): release skript je deterministický, fail-fast na chybějící artefakty/toolchain a generuje checksum inventory.
- Hydra gate (RC): install skripty nekonfigurují systém globálně mimo zvolený target; známé riziko je trust model runtime (spouštět trusted Mulda input).

## 2026-03-15 — v1.0.0-rc.2 migration docs completed

- Přidán dedikovaný migration dokument `docs/MIGRATION_0.9_to_1.0-rc.md` pro upgrade z v0.9.x na v1.0.0-rc.2.
- README doplněno o explicitní odkazy na migration/checklist/publishing dokumentaci.
- Roadmap DoD pro v1.0-rc nyní odkazuje na konkrétní migration soubor (auditovatelný artefakt).
- Sentinel gate (docs): změna je nízkoriziková, zvyšuje release maintainability (jasný postup upgradu + CI doporučení).
- Hydra gate (docs): bez nové attack surface; dokument explicitně připomíná trusted-input model a fail-fast toolchain gating.

## 2026-03-15 — v1.0.0-rc.2 debugger parity hardening (C branch)

- C backend trace detail byl změněn z formátového placeholderu na skutečné hodnoty (`DECLARE`/`ASSIGN` -> `x=2`, `x=5`).
- Přidán explicitní `SNAPSHOT` event z C běhu pro deterministické watch/variables snapshoty.
- IDE debug přidalo source-line stop map (`line -> trace index[]`) a `continue` cílí na nejbližší breakpoint index (ne jen lineární replay bez mapy).
- `Variables / Watch` panel nově bere `SNAPSHOT` spolu s `DECLARE`/`ASSIGN`.
- Přidán E2E test `testCTraceSnapshotsWhenGccAvailable` ověřující C JSON trace contract a snapshot sekvenci.
- True runtime pause/continue orchestrace procesu (live SIGSTOP/SIGCONT debug session) byla vyhodnocena jako **non-blocking** pro RC: v aktuální architektuře by vyžadovala asynchronní debug API/session manager nad místo současného `spawnSync` flow.
- Sentinel gate (rc.2): maintainability OK — změny izolované na trace contract + IDE stop-map, pokryté regresním testem.
- Hydra gate (rc.2): risk přijatelný — žádná nová privilegia ani externí attack surface; debug data jsou deterministická a auditovatelná přes JSON trace.

## 2026-03-15 — v1.0.0-rc.2 release manifest hardening: C source checksum

- `scripts/build-cross-c.js` manifest nyní obsahuje `cSourceSha256` (SHA256 otisk generovaného `dist/<name>.c`).
- Doplněna regresní kontrola v `tests/transpile.test.js` (`testCrossBuildManifestScript`), která ověřuje přítomnost `cSource` + validní 64-hex checksum.
- Cíl: lepší auditovatelnost RC bundle (zdroj C -> binárky -> metadata) bez změny runtime chování.
- Forge test gate: `npm test` PASS, `npm run build:c:cross -- examples/hello.mulda` PASS, `bash scripts/release-rc.sh` PASS.
- Sentinel gate: maintainability OK — změna je izolovaná na build manifest contract + pokrytá testem.
- Hydra gate: security posture OK — pouze integrity metadata, žádná nová privilegia ani attack surface.

## 2026-03-15 — C backend parser hardening: escaped-string arg split fix

- Opraven bug ve `splitCallArgs` (C backend expression normalization), kde escape detekce uvnitř stringu porovnávala dvouznakový token `"\\\\"` místo správného jednoznakového backslashe `"\\"`.
- Dopad: volání builtinů (`obsahuje`, `minimum`, `maximum`) se string argumenty obsahujícími escaped quote + čárku se nyní správně parsují a mapují na C helper funkce.
- Přidán regresní test `testCBackendCallArgumentSplitHandlesEscapedQuoteAndComma`.
- Forge test gate: `npm test` PASS + `npm run build:c:cross -- examples/hello.mulda` PASS (linux-x64 + windows-x64).
- Sentinel gate: změna je minimální, izolovaná a krytá testem; bez dopadu na JS/VM feature set.
- Hydra gate: žádná nová attack surface; fix snižuje riziko špatně přeloženého výrazu při edge-case string literálech.

## 2026-03-15 — RC.2 release artifact refresh after C parser fix

- Proveden nový RC packaging běh (`bash scripts/release-rc.sh`) po C-fixu, aby release payload embedoval opravu i v distribuovaných compiler kopíích (`release/linux|windows/compiler/src/transpile.js`).
- Ověřené gate v cyklu:
  - Forge: `npm test` PASS, `npm run build:c:cross -- examples/hello.mulda` PASS, `bash scripts/release-rc.sh` PASS.
  - Sentinel: změny jsou artifact-only refresh + synchronizace release copy compileru, bez rozšíření scope mimo C větev.
  - Hydra: bez nové attack surface; pouze re-build binárek/manifestů/checksumů, zachovaný fail-fast toolchain model.
- Výsledek: aktualizovaný RC bundle `release/bundles/rc-1.0.0-rc.2-20260315T183323Z` a nové checksum/manifest metadata pro Linux+Windows artefakty.

## 2026-03-15 — RC packaging hygiene: automatic old-bundle pruning (C/release branch)

- `scripts/release-rc.sh` nově podporuje `RELEASE_KEEP_BUNDLES` (default `5`) a po vytvoření nového bundle automaticky maže starší `release/bundles/rc-<version>-*` adresáře nad limit.
- Cíl: stabilita a udržitelnost release větve bez nekonečného růstu artefaktů při opakovaných RC bězích.
- README doplněno o sekci **RC release packaging** včetně ukázky override (`RELEASE_KEEP_BUNDLES=3`).
- Ověřené gate v cyklu:
  - Forge: `npm test` PASS, `npm run build:c:cross -- examples/hello.mulda` PASS, `RELEASE_KEEP_BUNDLES=2 bash scripts/release-rc.sh` PASS + očekávané prune logy.
  - Sentinel: změna je izolovaná na release skript (operational hygiene), bez dopadu na parser/compiler/runtime API.
  - Hydra: nízké riziko; mazání je scoped jen na verzi `rc-<version>-*`, bez globálního čistění mimo release bundles.

## 2026-03-15 — C cross-build stability: single transpile in orchestrator (RC.2)

- `scripts/build-cross-c.js` byl upraven tak, aby pro `linux-x64` + `windows-x64` dělal transpile do C pouze jednou (`compileFile(..., { target: 'c' })`) a pak jen kompiloval nativní targety přes `compileCToNative`.
- Sidecar metadata (`*.metadata.json`) se nově při cross-build kroku zapisují explicitně voláním `writeNativeArtifactMetadata`, takže auditní contract zůstává zachovaný.
- Přínos: menší šum v build logu, méně redundantních kroků a stabilnější release orchestrace bez změny veřejného CLI contractu.
- Ověřené gate v cyklu:
  - Forge: `npm test` PASS, `npm run build:c:cross -- examples/hello.mulda` PASS, `RELEASE_KEEP_BUNDLES=2 bash scripts/release-rc.sh` PASS.
  - Sentinel: změna je malá, lokalizovaná do build orchestrace; bez dopadu na parser/runtime semantics.
  - Hydra: beze změny attack surface; žádná nová privilegia ani externí integrace, pouze determinističtější interní build flow.

## 2026-03-15 — C trace parity hardening: typed ASSIGN snapshots for bool variables (RC.2)

- `generateC()` nově drží jednoduchý scope-chain typů (`bool`/`double`) odvozený z deklarací (`dej ...: joNeboHovno`) a funkčních parametrů.
- `ASSIGN` trace v C backendu už není vždy numerický: pro bool proměnné emituje `__mulda_trace_bool_var`, takže detail i `SNAPSHOT` mají tvar `flag=true/false` místo `flag=1/0`.
- Přidány regresní testy:
  - `testCBackendBoolAssignmentUsesBoolTrace` (codegen kontrakt)
  - `testCBoolTraceSnapshotsWhenGccAvailable` (gcc e2e JSON trace kontrakt)
- Ověřené gate v cyklu:
  - Forge: `npm test` PASS, `npm run build:c:cross -- examples/hello.mulda` PASS.
  - Sentinel: maintainability OK — změna je lokalizovaná v C emitteru, s minimálním zásahem do ostatních backendů, krytá unit+e2e testem.
  - Hydra: security posture OK — žádná nová privilegia ani externí I/O; pouze zpřesnění diagnostických trace dat.

## 2026-03-15 — Cross-build script stability: project-root relative input resolution (RC.2)

- `scripts/build-cross-c.js` nově resolveduje relativní vstupní `.mulda` cestu vůči `projectRoot` (ne vůči aktuálnímu `cwd` shellu).
- Dopad: `npm run build:c:cross -- examples/hello.mulda` i přímé volání skriptu funguje deterministicky i když je skript spuštěn mimo kořen repa.
- Rozšířen regresní test `testCrossBuildManifestScript` o scénář `cwd=os.tmpdir()` + relativní vstup (`examples/hello.mulda`).
- Ověřené gate v cyklu:
  - Forge: `npm test` PASS, `npm run build:c:cross -- examples/hello.mulda` PASS.
  - Sentinel: maintainability OK — malá, izolovaná stabilizační změna bez dopadu na parser/runtime semantics.
  - Hydra: security posture OK — bez nové attack surface, pouze robustnější práce s cestami při lokálním build orchestration.
