# Migration Guide — v0.9.x -> v1.0.0-rc.2

Tento dokument popisuje praktický upgrade z Mulda `v0.9.x` na release-candidate `v1.0.0-rc.2`.

## 1) Co se mění

### Stabilní C-first release flow
- Primární produkční backend zůstává **C**.
- Doporučený build pipeline je:
  1. `npm test`
  2. `npm run build:c:cross -- <file.mulda>`
  3. (volitelně) `npm run release:rc`

### Debug parity pro C větev (RC)
- C trace detail pro `DECLARE`/`ASSIGN` nese konkrétní hodnoty (`x=2`, `x=5`), ne placeholdery.
- C běh emituje `SNAPSHOT` eventy pro deterministický variables/watch panel v IDE.
- IDE continue používá source-line stop map (`line -> trace index[]`) pro stabilnější breakpoint replay.

## 2) Co zůstává kompatibilní

- Schválený Mulda slovník (`Hokna`, `vyblij`, `dyz`, `funkcicka`, `konec`) beze změny.
- Legacy aliasy (`kdyz`, `funkce`, `nacpi`, `program`, `rekni`, `spocitej`) zůstávají v RC dostupné jako kompatibilita.
- `hantec` CLI alias zůstává proxy na `mulda`.

## 3) Upgrade checklist

1. **Aktualizuj závislosti / workspace**
   - `npm install`
2. **Spusť regresní testy**
   - `npm test`
3. **Ověř cross-build toolchain**
   - Linux: `gcc`
   - Windows target: `x86_64-w64-mingw32-gcc`
4. **Proveď referenční cross-build**
   - `npm run build:c:cross -- examples/hello.mulda`
5. **Zkontroluj výstupy v `dist/`**
   - `hello-linux-x64`
   - `hello-windows-x64.exe`
   - `hello-*.metadata.json`
   - `hello.release-manifest.json`
6. **(Volitelně) Připrav RC bundle**
   - `npm run release:rc`

## 4) Známé non-blocking limity v RC

- True runtime pause/continue orchestrace procesu (`SIGSTOP/SIGCONT`) není součást RC architektury.
- Debugging je postavený na deterministickém trace replay.

Toto je explicitně akceptované v RC checklistu s mitigací přes JSON trace contract + test coverage.

## 5) Doporučení pro CI/CD

- Drž C větev jako release gate (JS/VM používej jen pro dev/debug parity a kompatibilitu).
- Archivuj i metadata sidecary a release manifest (audit artefaktů + checksumy).
- Fail-fast při `[TOOLCHAIN_MISSING]` a vypiš instalační hinty do CI logu.
