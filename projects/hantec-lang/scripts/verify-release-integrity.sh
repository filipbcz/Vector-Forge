#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

CHECKSUM_FILE="release/checksums.sha256"

log() { printf '[verify-release] %s\n' "$*"; }
fail() { printf '[verify-release] ERROR: %s\n' "$*" >&2; exit 1; }

required=(
  "release/linux/bin/mulda"
  "release/windows/bin/mulda.exe"
  "release/manifest.json"
  "release/manifest.source.json"
  "$CHECKSUM_FILE"
)

for path in "${required[@]}"; do
  [[ -f "$path" ]] || fail "Missing required artifact: $path"
done

# Fail fast if checksum inventory is stale/incomplete for required artifacts.
for path in "${required[@]:0:4}"; do
  if ! grep -Fq "  $path" "$CHECKSUM_FILE"; then
    fail "Checksum entry missing for $path in $CHECKSUM_FILE"
  fi
done

log "Running sha256sum -c $CHECKSUM_FILE"
sha256sum -c "$CHECKSUM_FILE"
log "Integrity verification passed"
