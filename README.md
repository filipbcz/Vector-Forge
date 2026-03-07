# Vector Forge

Interní workspace pro orchestraci AI agentů týmu Vector Forge a související projektové artefakty.

## Co tu je

- `AGENTS.md` — role týmu a globální pravidla
- `agents/ROUTING.md` — pravidla orchestrace a delegace
- `memory/` — projektová paměť a rozhodnutí
- `projects/` — jednotlivé pracovní projekty

## Spuštění ukázkového projektu

```bash
python3 projects/test-project/app.py
python3 projects/test-project/app.py --name Filip
```

## Vývojový workflow

1. Vytvoř větev z `main`
2. Proveď změny
3. Ověř lokální běh/testy
4. Otevři PR do `main`
5. Po review merge

## CI

GitHub Actions workflow (`.github/workflows/ci.yml`) kontroluje Python syntax check pro `projects/`.

## Týdenní execution

- `projects/weekly-execution/THIS_WEEK_PLAN.md` — konkrétní plán Po–Ne (20–45 min denně)
- `projects/weekly-execution/EXPERIMENT_TEMPLATE.md` — šablona pro rychlé 1h experimenty
- `projects/weekly-execution/SECURITY_BASELINE_CHECKLIST.md` — checklist minimální security baseline
