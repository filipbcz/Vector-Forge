# Release Notes — Mulda v1.0.0 (GA)

Datum: 2026-03-15

## Shrnutí
Mulda v1.0.0 je GA release cut z větve C-first. Tento release je **freeze release**: žádné nové feature, pouze release governance, artefakty a dokumentační uzavření RC fáze.

## Co je nové v GA cutu
- version bump `1.0.0-rc.final` -> `1.0.0`
- uzavření RC fáze v dokumentaci (`README`, `PROJECT`, `ROADMAP`, `RC_CHECKLIST`, `DECISIONS`)
- nový GA release skript `scripts/release-ga.sh`
- nový npm script `npm run release:ga -- <soubor.mulda>`
- GA bundle naming policy: `release/bundles/ga-<version>-<timestamp>`
- clean artifact policy zachována přes `RELEASE_KEEP_BUNDLES` i pro GA bundle

## Gate suite (GA)
- `npm test`
- `npm run check:installers`
- `npm run build:c:cross -- examples/hello.mulda`
- `npm run release:ga -- examples/hello.mulda`
- `npm run audit:reproducibility`

## Známé non-blocking limity
- Windows PE timestamp může způsobovat očekávaný checksum drift windows binárky mezi běhy.
- Manifest timestampy jsou záměrně časově proměnlivé (`generatedAt`).

## Kompatibilita
- JS backend byl ukončen; podporovaná je pouze C větev.
- Primární produkční backend je C.
