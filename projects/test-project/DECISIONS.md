# DECISIONS.md — test-project

## 2026-03-07
- `app.py` používá `argparse` a podporuje volitelný parametr `--name`.
- Pokud `--name` není vyplněné (nebo je prázdné po trimu), výstup zůstává `Vector Forge online`.
- Pokud je `--name` vyplněné, výstup je `Ahoj, <name>`.
