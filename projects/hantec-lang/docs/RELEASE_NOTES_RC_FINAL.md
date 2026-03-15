# Mulda v1.0.0-rc.final — Release Notes

## Co je součástí RC.final
- Stabilizovaný C-first toolchain pro Mulda (`muldac --target c`, `mulda run-c`).
- Cross-build flow pro Linux + Windows:
  - `npm run build:c:cross -- examples/hello.mulda`
- Release packaging + integrity checks:
  - `npm run release:rc -- examples/hello.mulda`
  - `npm run check:installers`
  - `npm run audit:reproducibility`
- Aktualizované release artefakty (`release/manifest*.json`, `release/checksums.sha256`, installer payloady, RC bundle).

## Install quickstart

### Linux
```bash
sha256sum -c release/checksums.sha256
bash release/install-linux.sh
mulda --help
./release/linux/bin/mulda examples/hello.mulda
```

### Windows (PowerShell)
```powershell
# from project root
powershell -ExecutionPolicy Bypass -File .\release\install-windows.ps1
mulda --help
.\release\windows\bin\mulda.exe examples\hello.mulda
```

## Known limitations (non-blocking)
- `release/manifest.json` a `release/manifest.source.json` obsahují timestampy (`generatedAt`), takže mezi dvěma běhy se liší.
- Windows PE binárka může mít timestamp-related checksum drift; je reportováno jako očekávaný non-deterministic drift v reproducibility auditu.
- JS backend zůstává dev/debug path; produkční směr je C backend.