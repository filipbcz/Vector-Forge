# hantec-lang

Experimentální jazyk **Hantec** + web IDE.

## Co je ve v0.4.1 (aktuální)

- `dej x = ...` pro deklaraci proměnných
- `rekni ...` pro textový výstup
- `spocitej ...` pro výpočet/vypsání výrazu
- Blokové řízení toku:
  - `kdyz <podminka>` ... `konec`
  - `opakuj <pocet>` ... `konec`
  - `funkce <name>(<params>)` ... `konec`
- Návratová hodnota přes `vrat <expr>` uvnitř `funkce`
- Chybové hlášky ze transpileru obsahují `line/col`
- CLI příkaz `hantec run file.hantec`
- Web IDE (compile + run) + základní syntax highlighting (keywords/čísla/komentáře)

## Struktura

- `compiler/` — transpiler (`.hantec` -> `.js`) + bytecode placeholder
- `runtime/` — Node runtime wrapper + `hantec` CLI
- `ide-web/` — jednoduché webové IDE s editorem a výstupem
- `docs/ROADMAP.md` — plán od v0.1 po v1.0
- `tests/` — základní transpiler testy
- `scripts/dev.sh` — lokální dev workflow

## Quickstart

```bash
npm run demo
npm test
```

### CLI

```bash
npm run hantec -- run examples/hello.hantec
# nebo po npm link:
# hantec run examples/hello.hantec
```
