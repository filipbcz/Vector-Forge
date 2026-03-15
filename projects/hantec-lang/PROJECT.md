# PROJECT.md — mulda-lang

## Cíl
Jazyk **Mulda** + web IDE pro rychlé iterace syntaxe, compileru a runtime.

## Schválený naming spec
- Název jazyka: Mulda
- Přípona: `.mulda`
- Start keyword: `Hokna`
- Print: `vyblij`
- Bool type: `joNeboHovno`
- Bool literals: `jo` / `hovno`
- Logic ops: `aKurva` / `bo` / `nechcu`

## Stav
- Verze: `0.7.0`
- IDE má moderní debug UI základy (toolbar + breakpoints + stack/variables panely)
- Parser primárně podporuje `dyz` + `funkcicka`
- Deprecated kompatibilita ponechána pro staré aliasy (`kdyz`,`funkce`,`nacpi`,`program`,`rekni`,`spocitej`,`hantec` CLI)
