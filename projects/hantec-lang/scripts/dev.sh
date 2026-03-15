#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[mulda] compile demo"
node compiler/src/transpile.js examples/hello.mulda dist/hello.js

echo "[mulda] run demo"
node runtime/src/run.js dist/hello.js

echo "[mulda] done"
