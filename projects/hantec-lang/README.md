# mulda-lang

Experimentální jazyk **Mulda** + web IDE.

## Schválená syntaxe (v0.7.1)

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

## Co je ve v0.7.3

- Modernizované web IDE (single-page layout):
  - horní debug toolbar (Run/Pause/Step/Continue + AI napovědět)
  - levý editor s gutterem a breakpoints
  - pravé debug panely (AI hint / output / stack trace timeline / variables)
- AI hinting endpoint `POST /ai/hint` (server-side), bez hardcoded secretů ve frontendu
- Ctrl+Space shortcut pro AI nápovědu + akce **Apply** / **Insert as comment**
- AI fallback režim: IDE funguje i bez model endpointu nebo při timeoutu
- Vylepšený syntax highlight pro Mulda keywordy
- Block pairing vizualizace (`Hokna`, `dyz`, `opakuj`, `funkcicka` ↔ `konec`) + warning pro unmatched `konec`
- Breakpointy klikem v gutteru (in-memory per session)
- Trace-based stepping MVP nad `--trace-json` eventy
- Stack trace panel parsuje trace události
- Variables/watch panel zobrazuje snapshot z `DECLARE` + `ASSIGN` event detailu, takže reaguje i na pozdější změny proměnných
- Jazyk nově podporuje assignment statement `x = expr` vedle deklarací `dej x = expr`
- Bytecode VM vrací explicitní runtime chybu při assignmentu do neexistující proměnné
- Zachován compile/run flow přes `dist/` jako v předchozí verzi

## Quickstart

```bash
npm run demo
npm test
npm run ide
```

## AI hinting konfigurace

`ide-web/server.js` čte konfiguraci z ENV (viz `ide-web/.env.example`):

- `AI_ENABLED=true|false` – globální zapnutí AI nápovědy
- `AI_MODEL=openai-codex/gpt-5.3-codex` – preferovaný model
- `AI_TIMEOUT_MS=4500` – timeout volání modelu

Volitelné:
- `AI_ENDPOINT` – custom OpenAI-compatible endpoint
- `AI_API_KEY` – API klíč pouze server-side

Fallback chování:
- když je AI vypnutá, endpoint vrátí lokální šablonovou nápovědu;
- když endpoint timeoutne/spadne, IDE se nezablokuje a vrátí safe fallback response.

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
