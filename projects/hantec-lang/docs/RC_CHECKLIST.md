# RC Checklist — v1.0.0-rc.1

## Parser parity

### ✅ Hotovo
- Entry-point guardrails (`Hokna` first, duplicate/late start rejected).
- Schválené keywordy (`dyz`, `funkcicka`) + legacy aliases.
- Deklarace + assignment (`DECLARE`, `ASSIGN`) pro trace-driven debug.

### Known limitations
- Parser ještě nepokrývá pokročilé diagnostiky (error recovery pro víc chyb v jednom průchodu).

---

## Compiler parity

### ✅ Hotovo
- JS backend + bytecode backend stabilní pro core subset.
- C backend (`--target c`) a explicitní `--platform linux-x64|windows-x64`.
- Sidecar metadata (`*.metadata.json`) a release manifest (`*.release-manifest.json`).

### Known limitations
- C backend zatím nemá optimalizační průchody ani hlubší static analysis warningy.

---

## Runtime parity

### ✅ Hotovo
- Trace eventy pro JS/VM/C na core scénáře (`DECLARE`, `ASSIGN`, `PRINT`, `IF`, `RETURN`).
- `mulda run`, `mulda run-bc`, `mulda run-c` flow funkční.
- Cross-build smoke ověřen pro linux/windows artefakt.

### Known limitations
- C runtime trace je primárně přes stderr hooky; není ještě plně feature-complete debug runtime.

---

## IDE parity

### ✅ Hotovo
- Debug layout (run/pause/step/continue) + stack/variables panely.
- Trace replay stepping MVP funguje na standardních scénářích.
- Variables panel reflektuje `DECLARE` i `ASSIGN` snapshoty.

### Known limitations
- IDE stepping je replay-driven, ne true runtime pause/continue orchestrace.

---

## Debug parity

### ✅ Hotovo
- `--trace` / `--trace-json` dostupné v CLI.
- JSON trace pipeline napojená pro IDE debug tok.
- Základní parity mezi JS/VM/C ověřena na referenčním `hello.mulda` flow.

### Known limitations
- Breakpoint kontrola v C běhu zatím není nativní (MVP parity přes trace replay).
- Watch expressions jsou zatím MVP bez pokročilých evaluací.
