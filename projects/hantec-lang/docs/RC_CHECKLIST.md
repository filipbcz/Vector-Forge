# RC Checklist — v1.0.0-rc.3 candidate

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
- [x] C trace detail nyní nese deterministické hodnoty proměnných (`x=2`, `x=5`) + `SNAPSHOT` eventy.

### Non-blocking
- [x] C backend bez optimalizačních průchodů / hlubší static analysis warningů.
  - **Trade-off:** priorita byla debug parity a reproducibilita RC.
  - **Mitigace:** build/test gate + Sentinel/Hydra review notes v `DECISIONS.md`.

---

## Runtime parity

### ✅ Hotovo
- [x] Trace eventy pro JS/VM/C na core scénáře (`DECLARE`, `ASSIGN`, `PRINT`, `IF`, `RETURN`).
- [x] `mulda run`, `mulda run-bc`, `mulda run-c` flow funkční.
- [x] Cross-build smoke ověřen pro linux/windows artefakt.
- [x] C runtime trace má deterministické variable snapshots (`SNAPSHOT`) použitelné pro watch panel.

### Non-blocking
- [x] C trace je pořád stderr-hook model (ne plnohodnotný in-process debugger runtime).
  - **Trade-off:** lehký runtime bez ptrace/agent vrstvy.
  - **Mitigace:** JSON trace contract + e2e test `testCTraceSnapshotsWhenGccAvailable`.

---

## IDE parity

### ✅ Hotovo
- [x] Debug layout (run/pause/step/continue) + stack/variables panely.
- [x] Source-line stop map (`line -> trace index[]`) pro breakpoint handling.
- [x] Variables panel čte `DECLARE`/`ASSIGN` i explicitní `SNAPSHOT` eventy z C běhu.
- [x] Continue používá stop-map target (nejbližší breakpoint nebo konec), ne jen lineární replay bez mapy.

### Non-blocking
- [x] True runtime pause/continue orchestrace procesu (SIGSTOP/SIGCONT + live stdin/out control) není v RC.
  - **Trade-off:** současná architektura používá `spawnSync` run flow; robustní live orchestrátor by vyžadoval async debug session vrstvu a přepis server/debug API.
  - **Mitigace:** deterministické trace + stop-map breakpointing + snapshot watch parity; explicitně kryto testy trace contractu.

---

## Debug parity

### ✅ Hotovo
- [x] `--trace` / `--trace-json` dostupné v CLI.
- [x] JSON trace pipeline napojená pro IDE debug tok.
- [x] Základní parity mezi JS/VM/C ověřena na referenčním `hello.mulda` flow.
- [x] C breakpoint MVP parity: source-line stop map + deterministické trace body.
- [x] Watch/variables snapshot parity: C emit `SNAPSHOT` eventů s hodnotami.

---

## Looping blockers (RC2 -> RC3)

### ✅ Uzavřeno
- [x] RC loop zastaven čistým Mulda-only cutem (bez `vf-ops-watch` souborů).
- [x] Final gates pro C-only release proběhly end-to-end (`test`, `build:c:cross`, `release:rc`).
- [x] RC bundle + manifest/checksum byly znovu vygenerované pro kandidáta `v1.0.0-rc.3`.

## RC verdict

**READY FOR RC3 CANDIDATE ✅**

Všechny checklist body jsou uzavřené jako implementované nebo explicitně akceptované non-blocking s trade-off + mitigací + test coverage. Looping blockers z RC2 jsou explicitně uzavřené a kandidát `v1.0.0-rc.3` je připravený pro push.
