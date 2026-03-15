# RC Checklist — v1.0.0-rc.final candidate

## READY/BLOCKER criteria (explicit gate)

### BLOCKER (musí být zelené)
- [x] `npm test` PASS.
- [x] `npm run check:installers` PASS.
  - linux installer dry-run vrací očekávané markery.
  - windows installer projde statickou validací syntax/sanity + required placeholders.
- [x] `npm run build:c:cross -- examples/hello.mulda` PASS (linux-x64 + windows-x64).
- [x] `npm run release:rc -- examples/hello.mulda` PASS (včetně integrity verify kroku).
- [x] `npm run audit:reproducibility` PASS (strict binární artefakty stabilní; timestamp drift reportován jako non-deterministic info).

### READY (musí být potvrzené)
- [x] Release bundle vytvořen pro `v1.0.0-rc.final`.
- [x] RC checklist a rozhodnutí aktualizované po gate bězích.
- [x] Sentinel gate note zapsaná v `DECISIONS.md`.
- [x] Hydra gate note zapsaná v `DECISIONS.md`.

---

## RC.final gate run (provedeno)

- [x] `npm test`
- [x] `npm run check:installers`
- [x] `npm run build:c:cross -- examples/hello.mulda`
- [x] `npm run release:rc -- examples/hello.mulda`
- [x] `npm run audit:reproducibility`

## RC verdict

**READY FOR RC.FINAL ✅**

RC.final uzavírá C-branch release kandidáta s kompletní gate sadou, installer kontrolami, release bundlem a reprodukovatelnostním auditem.