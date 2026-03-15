# PROJECT.md — mulda-lang

## Cíl
Jazyk **Mulda** + web IDE pro rychlé iterace syntaxe, compileru a runtime.

Nový hlavní směr: **Pascal-first jazyk s primárním C backendem**.
JS backend zůstává zachován jako **dev/debug path**.

## Schválený naming spec
- Název jazyka: Mulda
- Přípona: `.mulda`
- Start keyword: `Hokna`
- Print: `vyblij`
- Bool type: `joNeboHovno`
- Bool literals: `jo` / `hovno`
- Logic ops: `aKurva` / `bo` / `nechcu`

## Stav
- Verze: `0.8.0`
- IDE má moderní debug UI základy (toolbar + breakpoints + stack/variables panely)
- Parser primárně podporuje `dyz` + `funkcicka`
- Variables panel sleduje deklarace i assignment snapshoty (`DECLARE` + `ASSIGN`)
- C backend MVP je dostupný přes `muldac --target c` a `mulda run-c`
- Deprecated kompatibilita ponechána pro staré aliasy (`kdyz`,`funkce`,`nacpi`,`program`,`rekni`,`spocitej`,`hantec` CLI)

## Milníky (pivot roadmap)

### v0.8 — C backend generator (MVP)
**DoD:**
- `muldac --target c` generuje validní C pro core subset.
- Výstup jde přeložit přes gcc a projde E2E fixture testy.
- Základní trace eventy fungují i v C cestě.

### v0.9 — Cross-compile Linux/Windows (gcc + mingw-w64)
**DoD:**
- Linux + Windows target build skripty jsou stabilní.
- CI ověřuje kompilaci obou targetů.
- Artefakty mají konzistentní verzi a naming.

### v1.0-rc — Release candidate
**DoD:**
- Stabilita bez blocker bugů pro deklarovaný scope.
- Installer/release artifact pro Linux/Windows.
- Debugger parity mezi C backendem a JS dev/debug cestou.

## Migration note
- JS backend je dál podporovaný pro vývoj a debugging.
- Primární produkční backend je od tohoto pivotu C.
