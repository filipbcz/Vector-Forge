# DECISIONS.md — mulda-lang

## 2026-03-15 — Mulda spec alignment (v0.6.0)

- Jazyk byl sjednocen na schválený název **Mulda** a příponu `.mulda`.
- Parser/transpiler nově primárně podporuje:
  - `Hokna` (start programu)
  - `vyblij` (print)
  - bool typ/literály/operátory: `joNeboHovno`, `jo`, `hovno`, `aKurva`, `bo`, `nechcu`
- Výrazy se v compileru normalizují na JS ekvivalenty (`jo`->`true`, `hovno`->`false`, `aKurva`->`&&`, `bo`->`||`, `nechcu`->`!`).
- Přidána volitelná type anotace v deklaraci: `dej x: joNeboHovno = jo`.
- Runtime CLI přejmenováno na `mulda` + alias commandy `muldac`, `muldarun`.
- Legacy kompatibilita zachována jako deprecated aliasy, pokud to bylo levné:
  - syntax: `nacpi`, `program`, `rekni`, `spocitej`
  - CLI: `hantec` (proxy wrapper)
- IDE demo, examples, test fixtures a dokumentace přepsány na Mulda názvosloví.
- Bytecode target přejmenován na `mulda-vm`; transpiler marker aktualizován na `v0.6.0`.
