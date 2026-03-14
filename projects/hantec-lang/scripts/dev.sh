#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[hantec] compile demo"
node compiler/src/transpile.js examples/hello.hantec dist/hello.js

echo "[hantec] run demo"
node runtime/src/run.js dist/hello.js

echo "[hantec] done"
