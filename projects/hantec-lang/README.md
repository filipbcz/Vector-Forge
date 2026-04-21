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

## Co je ve v1.0.0 (GA)

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
- Zachován compile/run flow přes `dist/` jako v předchozí verzi
- C backend je jediný podporovaný backend (`muldac` / `mulda run`)
- C backend emituje základní trace eventy (`DECLARE`, `ASSIGN`, `PRINT_EXPR`, `IF`, `REPEAT`, `FUNCTION`, `RETURN`) přes stderr při `MULDA_TRACE=1`
- Nová jednotná cross-build orchestrace: `npm run build:c:cross -- <soubor.mulda>`
  - z jednoho `.mulda` zdroje vyrobí Linux (`gcc`) i Windows (`mingw-w64`) artefakt
  - vygeneruje release manifest s checksums a platform mapou (`dist/<name>.release-manifest.json`)
  - při chybějícím toolchainu vrací jasný status `[TOOLCHAIN_MISSING]` + instalační doporučení
- v0.9 finalize checkpoint (host verification): `examples/hello.mulda` byl reálně cross-buildnut pro `linux-x64` + `windows-x64.exe`, Linux artefakt byl spuštěn a Windows artefakt ověřen přes `file` + SHA256 + velikost.

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
npm run mulda -- run --trace-json examples/hello.mulda
npm run muldac -- --platform linux-x64 examples/hello.mulda
npm run muldac -- --platform windows-x64 examples/hello.mulda
npm run mulda -- run-c examples/hello.mulda
npm run build:c:cross -- examples/hello.mulda
```

Při `--platform ...` se po úspěšném překladu binárky vytvoří i metadata sidecar:
- `dist/<name>-linux-x64.metadata.json`
- `dist/<name>-windows-x64.exe.metadata.json`

## Jak cross-compile funguje

`npm run build:c:cross -- examples/hello.mulda` dělá 3 kroky:

1. Přeloží `.mulda` do `dist/<name>.c`.
2. Spustí dvě C kompilace nad stejným C výstupem:
   - `linux-x64` přes `gcc` → `dist/<name>-linux-x64`
   - `windows-x64` přes `x86_64-w64-mingw32-gcc` → `dist/<name>-windows-x64.exe`
3. Vytvoří metadata:
   - sidecar `*.metadata.json` pro každý úspěšný target
   - release manifest `dist/<name>.release-manifest.json` s platform mapou + SHA256 checksums.

Pokud některý compiler chybí, build vrátí `[TOOLCHAIN_MISSING]` a doporučený instalační příkaz.

## GA release packaging

```bash
bash scripts/release-ga.sh
# optional: keep only N newest bundles for current version
RELEASE_KEEP_BUNDLES=3 bash scripts/release-ga.sh
```

Skript po dokončení automaticky prořeže staré `release/bundles/ga-<version>-*` adresáře (default `5` posledních běhů), aby release větev nebobtnala artifacty.

## Quick verify po instalaci

```bash
# 1) ověř CLI dostupnost
mulda --help

# 2) ověř release integritu (z rootu projektu / bundle)
sha256sum -c release/checksums.sha256

# 3) smoke run linux artefaktu
./release/linux/bin/mulda examples/hello.mulda
```

Volitelně můžeš použít helper skript:

```bash
npm run verify:release
```

## Upgrade / migration

- v0.9.x -> v1.0.0: `docs/MIGRATION_0.9_to_1.0-rc.md` (pozn.: název souboru zůstal historický)
- RC audit checklist: `docs/RC_CHECKLIST.md`
- Publishing flow: `docs/PUBLISHING.md`

## Security note

Mulda je nyní C-backend-only. Pro buildy i spouštění používej důvěryhodné `.mulda` vstupy
a standardní provozní hygienu (sandbox/CI izolace) pro nativní kompilaci.
