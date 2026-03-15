# DECISIONS.md — mulda-lang

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
