# mulda-lang

Experimentální jazyk **Mulda** + web IDE.

## Schválená syntaxe (v0.7.0)

- souborová přípona: `.mulda`
- start programu: `Hokna`
- výpis: `vyblij <expr>`
- podmínka: `dyz <expr>`
- funkce: `funkcicka name(args...)`
- bool typ: `joNeboHovno`
- bool literály: `jo` / `hovno`
- logické operátory: `aKurva` / `bo` / `nechcu`
- bloky: `dyz/opakuj/funkcicka ... konec`

### Dočasné deprecated aliasy (kompatibilita)
- start: `nacpi`, `program`
- print: `rekni`, `spocitej`
- control flow/function: `kdyz`, `funkce`
- CLI: `hantec` (proxy na `mulda`)

## Co je ve v0.7.0

- Modernizované web IDE (single-page layout):
  - horní debug toolbar (Run/Pause/Step/Continue)
  - levý editor s gutterem a breakpoints
  - pravé debug panely (output / stack trace timeline / variables)
- Vylepšený syntax highlight pro Mulda keywordy
- Block pairing vizualizace (`Hokna`, `dyz`, `opakuj`, `funkcicka` ↔ `konec`) + warning pro unmatched `konec`
- Breakpointy klikem v gutteru (in-memory per session)
- Trace-based stepping MVP nad `--trace-json` eventy
- Stack trace panel parsuje trace události
- Variables/watch panel zobrazuje snapshot z event detailu, fallback na poslední event detail
- Zachován compile/run flow přes `dist/` jako v předchozí verzi

## Quickstart

```bash
npm run demo
npm test
npm run ide
```

## CLI

```bash
npm run muldac -- examples/hello.mulda
npm run muldarun -- examples/hello.mulda
npm run mulda -- run-bc --trace examples/hello.mulda
npm run mulda -- run --trace-json examples/hello.mulda
```

## Security note

VM i JS backend aktuálně vyhodnocují výrazy přes JavaScript evaluaci (`new Function`).
Mulda zdroj tedy ber jako trusted input a nespouštěj neověřený cizí kód bez sandboxu.
