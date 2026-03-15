#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION="${1:-$(node -p "require('./package.json').version")}" 
SOURCE_FILE="${2:-examples/hello.mulda}"
BASE_NAME="$(basename "$SOURCE_FILE" .mulda)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BUNDLE_DIR="release/bundles/rc-${VERSION}-${STAMP}"

log() { printf '[release-rc] %s\n' "$*"; }
need_file() { [[ -f "$1" ]] || { echo "Missing required file: $1" >&2; exit 1; }; }

log "Version: $VERSION"
log "Source: $SOURCE_FILE"

log "1/5 npm test"
npm test

log "2/5 cross build"
npm run build:c:cross -- "$SOURCE_FILE"

LINUX_ARTIFACT="dist/${BASE_NAME}-linux-x64"
WINDOWS_ARTIFACT="dist/${BASE_NAME}-windows-x64.exe"
MANIFEST_INPUT="dist/${BASE_NAME}.release-manifest.json"
need_file "$LINUX_ARTIFACT"
need_file "$WINDOWS_ARTIFACT"
need_file "$MANIFEST_INPUT"

log "3/5 smoke run linux artifact"
ARTIFACT_OUTPUT="$($LINUX_ARTIFACT)"
printf '%s\n' "$ARTIFACT_OUTPUT"
grep -q 'Nazdar z Muldy!' <<<"$ARTIFACT_OUTPUT" || { echo "Unexpected linux smoke output" >&2; exit 1; }

log "4/5 prepare release structure"
rm -rf release/linux release/windows
mkdir -p \
  release/linux/bin release/linux/runtime/src release/linux/compiler/src \
  release/windows/bin release/windows/runtime/src release/windows/compiler/src \
  release/bundles

cp "$LINUX_ARTIFACT" release/linux/bin/mulda
cp "$WINDOWS_ARTIFACT" release/windows/bin/mulda.exe
cp runtime/src/mulda.js runtime/src/run.js runtime/src/vm.js runtime/src/js-trace-hook.js runtime/src/hantec.js release/linux/runtime/src/
cp runtime/src/mulda.js runtime/src/run.js runtime/src/vm.js runtime/src/js-trace-hook.js runtime/src/hantec.js release/windows/runtime/src/
cp compiler/src/transpile.js release/linux/compiler/src/
cp compiler/src/transpile.js release/windows/compiler/src/

cat > release/manifest.json <<JSON
{
  "name": "mulda",
  "version": "$VERSION",
  "generatedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "sourceExample": "$SOURCE_FILE",
  "artifacts": {
    "linux": "release/linux/bin/mulda",
    "windows": "release/windows/bin/mulda.exe"
  },
  "sourceManifest": "$MANIFEST_INPUT"
}
JSON
cp "$MANIFEST_INPUT" release/manifest.source.json

log "5/5 checksums"
{
  sha256sum release/linux/bin/mulda
  sha256sum release/windows/bin/mulda.exe
  sha256sum release/manifest.json
  sha256sum release/manifest.source.json
} > release/checksums.sha256

rm -rf "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR"
cp -R release/linux "$BUNDLE_DIR/"
cp -R release/windows "$BUNDLE_DIR/"
cp release/manifest.json release/manifest.source.json release/checksums.sha256 release/install-linux.sh release/install-windows.ps1 "$BUNDLE_DIR/"

log "RC bundle ready: $BUNDLE_DIR"
