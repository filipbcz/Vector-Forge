# PROJECT.md — mulda-lang

## Cíl
Jazyk **Mulda** + web IDE pro rychlé iterace syntaxe, compileru a runtime.

Nový hlavní směr: **Pascal-first jazyk s C backendem**.

## Schválený naming spec
- Název jazyka: Mulda
- Přípona: `.mulda`
- Start keyword: `Hokna`
- Print: `vyblij`
- Bool type: `joNeboHovno`
- Bool literals: `jo` / `hovno`
- Logic ops: `aKurva` / `bo` / `nechcu`

## Stav
- Verze: `1.0.0` (GA)
- IDE má moderní debug UI základy (toolbar + breakpoints + stack/variables panely)
- Parser primárně podporuje `dyz` + `funkcicka`
- Variables panel sleduje deklarace i assignment snapshoty (`DECLARE` + `ASSIGN`)
- C backend MVP je dostupný přes `muldac` a `mulda run-c`
- Cross-compile orchestrace je dostupná přes `npm run build:c:cross -- <file.mulda>` (linux-x64 + windows-x64)
- Build metadata pro release: sidecar `*.metadata.json` + `*.release-manifest.json` (checksums + platform map)
- v0.9 final verification proběhla na hostu s `gcc` + `mingw-w64`: cross-build z `examples/hello.mulda` je ověřený pro Linux i Windows target.
- Deprecated kompatibilita ponechána pro staré aliasy (`kdyz`,`funkce`,`nacpi`,`program`,`rekni`,`spocitej`,`hantec` CLI)
- JS backend byl ukončen; aktivní a podporovaná je pouze C cesta.

## Milníky (pivot roadmap)

### v0.8 — C backend generator (MVP)
**DoD:**
- `muldac` generuje validní C pro core subset.
- Výstup jde přeložit přes gcc a projde E2E fixture testy.
- Základní trace eventy fungují i v C cestě.

### v0.9 — Cross-compile Linux/Windows (gcc + mingw-w64)
**DoD:**
- Linux + Windows target build skripty jsou stabilní.
- CI ověřuje kompilaci obou targetů.
- Artefakty mají konzistentní verzi a naming.

### v1.0.0 — General Availability (GA)
**DoD:**
- Stabilita bez blocker bugů pro deklarovaný scope.
- Installer/release artifact pro Linux/Windows.
- Debugger/trace workflow je navázaný na C backend.

## Release governance note
- RC fáze je uzavřená, nové změny po GA pouze přes patch governance (bugfix/security only).
- GA bundle (`release/bundles/ga-<version>-<stamp>`) běží vedle historických RC bundle (`release/bundles/rc-*`).

## Migration note
- Podporovaný backend je pouze C.
