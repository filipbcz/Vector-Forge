#!/usr/bin/env python3
"""Validate Home Assistant add-on config.yaml required keys."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

REQUIRED_KEYS = ("name", "slug", "version", "options", "schema")


def load_yaml(path: Path):
    try:
        import yaml  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "PyYAML is required for this validator. Install with: pip install pyyaml"
        ) from exc

    with path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)

    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a YAML mapping/object at top level")

    return data


def validate_config(path: Path) -> int:
    data = load_yaml(path)
    missing = [key for key in REQUIRED_KEYS if key not in data]
    if missing:
        print(f"ERROR: {path} is missing required key(s): {', '.join(missing)}")
        return 1

    print(f"OK: {path} contains required keys: {', '.join(REQUIRED_KEYS)}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Home Assistant add-on config.yaml")
    parser.add_argument(
        "config",
        nargs="?",
        default="openclaw_voice_task_bridge/config.yaml",
        help="Path to add-on config.yaml (default: openclaw_voice_task_bridge/config.yaml)",
    )
    args = parser.parse_args()

    path = Path(args.config)
    if not path.exists():
        print(f"ERROR: File not found: {path}")
        return 1

    try:
        return validate_config(path)
    except Exception as exc:  # pragma: no cover
        print(f"ERROR: Validation failed for {path}: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
