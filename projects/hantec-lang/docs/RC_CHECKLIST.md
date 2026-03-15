# RC Checklist — v1.0.0-rc.4 candidate

## Parser parity

### ✅ Hotovo
- [x] Entry-point guardrails (`Hokna` first, duplicate/late start rejected).
- [x] Schválené keywordy (`dyz`, `funkcicka`) + legacy aliases.
- [x] Deklarace + assignment (`DECLARE`, `ASSIGN`) pro trace-driven debug.

### Non-blocking
- [x] Pokročilé diagnostiky / multi-error recovery nejsou v RC implementované.
  - **Trade-off:** parser zůstává fail-fast (lepší determinismus pro debug trace).
  - **Mitigace:** explicitní syntax error line/column + testy parser guardrails (`tests/transpile.test.js`).

---

## Compiler parity

### ✅ Hotovo
- [x] JS backend + bytecode backend stabilní pro core subset.
- [x] C backend (`--target c`) a explicitní `--platform linux-x64|windows-x64`.
- [x] Sidecar metadata (`*.metadata.json`) a release manifest (`*.release-manifest.json`).
- [x] C trace detail nese deterministické hodnoty proměnných + `SNAPSHOT` eventy.

### RC.4 hardening
- [x] Release integrity check script (`scripts/verify-release-integrity.sh`) ověřuje required artefakty + checksum inventory.
- [x] `release:rc` flow fail-fast padá při chybějícím artefaktu / chybějícím checksum entry / mismatch (`sha256sum -c`).
- [x] CI (`mulda-c-cross.yml`) po `release:rc` explicitně běží `sha256sum -c release/checksums.sha256`.

---

## Runtime parity

### ✅ Hotovo
- [x] Trace eventy pro JS/VM/C na core scénáře (`DECLARE`, `ASSIGN`, `PRINT`, `IF`, `RETURN`).
- [x] `mulda run`, `mulda run-bc`, `mulda run-c` flow funkční.
- [x] Cross-build smoke ověřen pro linux/windows artefakt.
- [x] C runtime trace má deterministické variable snapshots (`SNAPSHOT`) použitelné pro watch panel.

---

## Installer readiness (RC.4)

### ✅ Hotovo
- [x] Linux installer má `--dry-run` / `-n` mód a validuje payload strukturu s jasnou hint hláškou.
- [x] Linux installer vypisuje stručný quick-verify postup (`mulda --help`).
- [x] Windows installer validuje vstupní cesty (`TargetDir`, `BinDir`) a dává jasné next-step instrukce (PATH + nový terminál + verify command).

---

## Debug parity

### ✅ Hotovo
- [x] `--trace` / `--trace-json` dostupné v CLI.
- [x] JSON trace pipeline napojená pro IDE debug tok.
- [x] Základní parity mezi JS/VM/C ověřena na referenčním `hello.mulda` flow.
- [x] C breakpoint MVP parity: source-line stop map + deterministické trace body.
- [x] Watch/variables snapshot parity: C emit `SNAPSHOT` eventů s hodnotami.

---

## RC.4 release gate run

### ✅ Uzavřeno
- [x] `npm test`
- [x] `npm run build:c:cross -- examples/hello.mulda`
- [x] `npm run release:rc`
- [x] Linux artifact smoke run (součást `release:rc`)
- [x] Lokální integrity verify: `sha256sum -c release/checksums.sha256`

## RC verdict

**READY FOR RC4 CANDIDATE ✅**

RC.4 uzavírá release-integrity hardening + installer polish bez rozšíření scope mimo C větev. Gate běhy jsou zelené a kandidát `v1.0.0-rc.4` je připravený pro push.
