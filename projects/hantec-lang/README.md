# hantec-lang

Experimentální jazyk **Hantec** + web IDE.

## Co je ve v0.5.3 (aktuální)

- `dej x = ...` pro deklaraci proměnných
- `rekni ...` pro textový výstup
- `spocitej ...` pro výpočet/vypsání výrazu
- Blokové řízení toku:
  - `kdyz <podminka>` ... `konec`
  - `opakuj <pocet>` ... `konec`
  - `funkce <name>(<params>)` ... `konec`
- Návratová hodnota přes `vrat <expr>` uvnitř `funkce`
- Základní stdlib funkce:
  - `delka(x)` — délka stringu/pole, počet klíčů objektu
  - `cislo(x)` — převod na číslo (s chybou při neplatné hodnotě)
  - `text(x)` — převod na text
  - `minimum(...x)` — minimum přes číselné argumenty (včetně číslo-like stringů)
  - `maximum(...x)` — maximum přes číselné argumenty
  - `obsahuje(container, needle)` — `true/false` pro substring, položku v poli nebo klíč v objektu
- Chybové hlášky ze transpileru obsahují `line/col`
- CLI příkaz `hantec run file.hantec` (JS runtime)
- CLI příkaz `hantec run-bc file.hantec` (bytecode VM runtime)
- Debug/trace režim pro bytecode běh: `hantec run-bc --trace file.hantec` (alias `--debug`)
- Bytecode prototyp output `dist/*.bytecode.json` s instrukcemi pro interní VM
- Web IDE (compile + run) + základní syntax highlighting (keywords/čísla/komentáře)
- Publishing strategy v0.5.2: `npm run pack:check` + `prepublishOnly` gate (`npm test` + package dry-run validace)
- Runtime trace loguje instrukce VM (`DECLARE`, `IF`, `REPEAT`, `CALL`, `RETURN`) do stderr bez změny stdout programu

## Struktura

- `compiler/` — transpiler (`.hantec` -> `.js`) + bytecode placeholder
- `runtime/` — Node runtime wrapper + `hantec` CLI
- `ide-web/` — jednoduché webové IDE s editorem a výstupem
- `docs/ROADMAP.md` — plán od v0.1 po v1.0
- `docs/PUBLISHING.md` — release/publish checklist a quality gates
- `tests/` — transpiler testy + fixture parity testy (JS backend vs bytecode VM)
- `scripts/dev.sh` — lokální dev workflow

## Quickstart

```bash
npm run demo
npm test
```

### CLI

```bash
npm run hantec -- run examples/hello.hantec
npm run hantec -- run-bc examples/hello.hantec
npm run hantec -- run-bc --trace examples/hello.hantec
# nebo po npm link:
# hantec run examples/hello.hantec
# hantec run-bc examples/hello.hantec
# hantec run-bc --debug examples/hello.hantec
```

## Security note (v0.5 VM prototype)

VM i JS backend aktuálně vyhodnocují výrazy přes JavaScript evaluaci (`new Function`).
To znamená, že **Hantec zdroj ber jako trusted input** (stejně jako vlastní JS skript),
a nespouštěj neověřený cizí kód na hostu bez sandboxu.
