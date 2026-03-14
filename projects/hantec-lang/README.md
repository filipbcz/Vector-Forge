# hantec-lang

Scaffold projektu pro experimentální jazyk **Hantec** + web IDE.

## Struktura

- `compiler/` — MVP transpiler (`.hantec` -> `.js`) + bytecode placeholder
- `runtime/` — cross-platform CLI runner skeleton
- `ide-web/` — jednoduché webové IDE s editorem a výstupem
- `docs/ROADMAP.md` — plán od v0.1 po v1.0
- `scripts/dev.sh` — lokální dev workflow

## v0.1 demo

```bash
# Linux/macOS
./scripts/dev.sh

# ručně
node compiler/src/transpile.js examples/hello.hantec dist/hello.js
node runtime/src/run.js dist/hello.js
```

```powershell
# Windows
node compiler/src/transpile.js examples/hello.hantec dist/hello.js
node runtime/src/run.js dist/hello.js
```

