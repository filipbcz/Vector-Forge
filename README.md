# Vector Forge

Interní workspace pro orchestraci AI agentů týmu Vector Forge a související projektové artefakty.

## Co tu je

- `AGENTS.md` — role týmu a globální pravidla
- `agents/ROUTING.md` — pravidla orchestrace a delegace
- `memory/` — projektová paměť a rozhodnutí
- `projects/` — jednotlivé pracovní projekty

## Aktivní projekt

- `projects/hantec-lang` — jazyk Mulda + IDE + compiler/runtime

## Vývojový workflow

1. Vytvoř větev z `main`
2. Proveď změny
3. Ověř lokální běh/testy
4. Otevři PR do `main`
5. Po review merge

## CI checks

GitHub Actions workflow (`.github/workflows/ci.yml`) nyní kontroluje:

- **python-sanity**: compile-check Python souborů v `projects/`
- **yaml-lint**: parsování všech `*.yml`/`*.yaml` souborů v repu přes PyYAML
- **addon-smoke** (Home Assistant add-on):
  - Python syntax check `openclaw_voice_task_bridge/app.py`
  - shell syntax check `openclaw_voice_task_bridge/run.sh` (`bash -n`)
  - validaci `openclaw_voice_task_bridge/config.yaml` na povinné klíče `name`, `slug`, `version`, `options`, `schema`
