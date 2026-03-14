# Hantec Language Roadmap

## v0.1 (MVP scaffold)
- Basic `.hantec` source format
- Transpile to JavaScript (`rekni`, `spocitej`)
- Runtime CLI wrapper over Node.js
- Minimal web IDE with compile+run panel
- Bytecode backend placeholder

## v0.2 ✅
- [x] Variables (`dej x = ...`)
- [x] Better parser (line-based AST parser)
- [x] Error locations (line/column)
- [x] CLI command: `hantec run file.hantec`

## v0.3 🚧
- [x] Control flow (`kdyz`, `opakuj`, `konec`)
- [ ] Functions
- [ ] Standard library basics
- [ ] Web IDE syntax highlighting

## v0.5
- Bytecode prototype + VM runner
- Test suite + fixtures
- Package publishing strategy

## v0.8
- Cross-platform binary/runtime packaging
- Debug mode and traces
- LSP prototype for editor integration

## v1.0
- Stable language spec
- Production-ready CLI + runtime
- IDE polish (tabs, project tree, diagnostics)
- Documentation + examples + migration guide
