#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-$HOME/.local/share/mulda}"
BIN_DIR="${2:-$HOME/.local/bin}"

if [[ ! -f "$SRC_DIR/linux/bin/mulda" ]]; then
  echo "Missing release payload: $SRC_DIR/linux/bin/mulda" >&2
  echo "Run from extracted RC bundle root." >&2
  exit 1
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

echo "Mulda installed"
echo "  HOME: $TARGET_DIR"
echo "  BINS: $BIN_DIR/{mulda,muldac,muldarun}"
echo "Add $BIN_DIR to PATH if needed."
