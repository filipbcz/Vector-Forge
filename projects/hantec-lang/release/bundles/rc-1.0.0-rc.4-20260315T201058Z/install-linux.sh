#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash release/install-linux.sh [--dry-run|-n] [TARGET_DIR] [BIN_DIR]

Defaults:
  TARGET_DIR = $HOME/.local/share/mulda
  BIN_DIR    = $HOME/.local/bin

Examples:
  bash release/install-linux.sh --dry-run
  bash release/install-linux.sh ~/.local/share/mulda ~/.local/bin
EOF
}

log() { printf '[install-linux] %s\n' "$*"; }
fail() {
  printf '[install-linux] ERROR: %s\n' "$*" >&2
  printf '[install-linux] Hint: run from extracted RC bundle root (contains linux/bin/mulda).\n' >&2
  exit 1
}

DRY_RUN=0
ARGS=()
for arg in "$@"; do
  case "$arg" in
    --dry-run|-n) DRY_RUN=1 ;;
    --help|-h) usage; exit 0 ;;
    *) ARGS+=("$arg") ;;
  esac
done

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${ARGS[0]:-$HOME/.local/share/mulda}"
BIN_DIR="${ARGS[1]:-$HOME/.local/bin}"

[[ -f "$SRC_DIR/linux/bin/mulda" ]] || fail "Missing release payload: $SRC_DIR/linux/bin/mulda"
[[ -d "$SRC_DIR/linux/runtime" ]] || fail "Missing runtime payload: $SRC_DIR/linux/runtime"
[[ -d "$SRC_DIR/linux/compiler" ]] || fail "Missing compiler payload: $SRC_DIR/linux/compiler"

if (( DRY_RUN )); then
  log "DRY RUN (no files will be changed)"
  log "Would install payload from: $SRC_DIR/linux"
  log "Would create/update: $TARGET_DIR"
  log "Would create/update shims in: $BIN_DIR"
  log "Would remove old dirs: $TARGET_DIR/runtime and $TARGET_DIR/compiler"
  exit 0
fi

mkdir -p "$TARGET_DIR" "$BIN_DIR"
rm -rf "$TARGET_DIR/runtime" "$TARGET_DIR/compiler"
cp -R "$SRC_DIR/linux/runtime" "$TARGET_DIR/runtime"
cp -R "$SRC_DIR/linux/compiler" "$TARGET_DIR/compiler"
cp "$SRC_DIR/linux/bin/mulda" "$TARGET_DIR/mulda"
chmod +x "$TARGET_DIR/mulda"

cat > "$BIN_DIR/mulda" <<'SH'
#!/usr/bin/env bash
exec "${MULDA_HOME:-$HOME/.local/share/mulda}/mulda" "$@"
SH
chmod +x "$BIN_DIR/mulda"

cat > "$BIN_DIR/muldac" <<'SH'
#!/usr/bin/env bash
exec "${MULDA_HOME:-$HOME/.local/share/mulda}/mulda" compile "$@"
SH
chmod +x "$BIN_DIR/muldac"

cat > "$BIN_DIR/muldarun" <<'SH'
#!/usr/bin/env bash
exec "${MULDA_HOME:-$HOME/.local/share/mulda}/mulda" run "$@"
SH
chmod +x "$BIN_DIR/muldarun"

log "Mulda installed"
log "  HOME: $TARGET_DIR"
log "  BINS: $BIN_DIR/{mulda,muldac,muldarun}"
log "Quick verify: mulda --help"
log "If command not found, add to PATH: export PATH=\"$BIN_DIR:$PATH\""
