# mulda-lang

Experimentální jazyk **Mulda** + web IDE.

## Schválená syntaxe (MVP)

- souborová přípona: `.mulda`
- start programu: `Hokna`
- výpis: `vyblij <expr>`
- bool typ: `joNeboHovno`
- bool literály: `jo` / `hovno`
- logické operátory: `aKurva` / `bo` / `nechcu`

### Dočasné deprecated aliasy (kompatibilita)
- start: `nacpi`, `program`
- print: `rekni`, `spocitej`
- CLI: `hantec` (proxy na `mulda`)

## Co je ve v0.6.1

- `dej x = ...` deklarace proměnných (volitelně `dej flag: joNeboHovno = jo`)
- bloky `kdyz`, `opakuj`, `funkce`, `vrat`, `konec`
- stdlib: `delka`, `cislo`, `text`, `minimum`, `maximum`, `obsahuje`
- transpile do JS + bytecode (`mulda-vm`)
- trace mód pro oba backendy (`--trace` text, `--trace-json` JSON lines)
- web IDE s highlightem Mulda keywordů
- CLI: `mulda`, `muldac`, `muldarun`

## Quickstart

```bash
npm run demo
npm test
```

## CLI

```bash
npm run muldac -- examples/hello.mulda
npm run muldarun -- examples/hello.mulda
npm run mulda -- run-bc --trace examples/hello.mulda
npm run mulda -- run --trace-json examples/hello.mulda

# po npm link
# mulda run examples/hello.mulda
# mulda run-bc --debug examples/hello.mulda
# muldac examples/hello.mulda
# muldarun --bc --trace examples/hello.mulda
```

## Security note

VM i JS backend aktuálně vyhodnocují výrazy přes JavaScript evaluaci (`new Function`).
Mulda zdroj tedy ber jako trusted input a nespouštěj neověřený cizí kód bez sandboxu.
