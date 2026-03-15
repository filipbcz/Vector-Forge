# RC Checklist — v1.0.0-rc.5 candidate

## READY/BLOCKER criteria (explicit gate)

### BLOCKER (musí být zelené)
- [x] `npm test` PASS.
- [x] `npm run check:installers` PASS.
  - linux installer dry-run vrací očekávané markery.
  - windows installer projde statickou validací syntax/sanity + required placeholders.
- [x] `npm run build:c:cross -- examples/hello.mulda` PASS (linux-x64 + windows-x64).
- [x] `npm run release:rc` PASS (včetně integrity verify kroku).
- [x] `npm run audit:reproducibility` PASS (strict linux artefakt beze driftu mezi dvěma po sobě jdoucími RC bundly; windows/manifest drift reportován jako non-deterministic info).

### READY (musí být potvrzené)
- [x] Release bundle vytvořen pro `v1.0.0-rc.5`.
- [x] RC checklist a rozhodnutí aktualizované po gate bězích.
- [x] Sentinel gate note zapsaná v `DECISIONS.md`.
- [x] Hydra gate note zapsaná v `DECISIONS.md`.

---

## RC.5 gate run (provedeno)

- [x] `npm test`
- [x] `npm run check:installers`
- [x] `npm run build:c:cross -- examples/hello.mulda`
- [x] `npm run release:rc`
- [x] `npm run audit:reproducibility`

## RC verdict

**READY FOR RC5 CANDIDATE ✅**

RC.5 uzavírá installer smoke automatizaci + reproducibility audit v C-větvi. Gate běhy jsou zelené; případný drift je reportován explicitně a strict binární artefakty jsou stabilní.
