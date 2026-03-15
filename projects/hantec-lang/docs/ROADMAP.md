# Mulda Language Roadmap

## v0.7.0 ✅ IDE debug UX foundations
- [x] Modernized single-page IDE layout (editor + debugger side panels + top toolbar)
- [x] Dark theme with runtime/debug status indicators
- [x] Syntax highlighting update for approved Mulda keywords (`dyz`, `funkcicka`, ...)
- [x] Block pairing visualization for `Hokna/dyz/opakuj/funkcicka` with unmatched `konec` warnings
- [x] Breakpoint toggles in editor gutter (in-memory per session)
- [x] Trace-based step controls (Run/Pause/Step/Continue MVP)
- [x] Stack trace timeline panel from `--trace-json` events
- [x] Variables/watch MVP panel with event-detail fallback
- [x] Parser now supports approved `dyz` + `funkcicka` while keeping `kdyz` + `funkce` as deprecated aliases

## v0.6 ✅ Mulda spec alignment
- [x] `.mulda` source format
- [x] `Hokna` start keyword
- [x] `vyblij` print keyword
- [x] bool syntax (`joNeboHovno`, `jo/hovno`, `aKurva/bo/nechcu`)
- [x] CLI naming (`mulda`, `muldac`, `muldarun`)
- [x] IDE demo + syntax highlight update
- [x] fixtures/tests/docs renamed from Hantec to Mulda

## v0.6.1 ✅ Trace parity
- [x] Structured trace output i pro JS backend
- [x] `--trace-json` pro JS i bytecode backend

## v0.6.2 ✅ Entry-point guardrails
- [x] Parser vyžaduje start keyword (`Hokna` nebo deprecated alias) jako první statement
- [x] Duplicate / pozdní start keyword vrací syntax error
- [x] IDE title + demo text srovnán na aktuální verzi

## Next
- True runtime pause/continue hooks v interpreteru (bez replay emulace)
- Rich variables snapshots directly from runtime scopes
- LSP prototype pro editor integraci
- Cross-platform binary/runtime packaging
