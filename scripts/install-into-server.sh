#!/usr/bin/env bash
# Copy the built `simple` bundle into apteva-server's dashboard directory.
# The server serves this directory as its SPA fallback (see main.go:642),
# so the UI becomes available at the server's own root URL with no extra
# container, no nginx proxy, no CORS — same origin, cookie auth works.
#
# Usage:  DATA_DIR=/path/to/apteva/data ./scripts/install-into-server.sh
# Defaults to the user's ~/.apteva/data if DATA_DIR is unset.
set -euo pipefail

cd "$(dirname "$0")/.."

DATA_DIR="${DATA_DIR:-$HOME/.apteva/data}"
DEST="$DATA_DIR/dashboard"

echo "→ Building..."
bun run build

echo "→ Installing into $DEST"
mkdir -p "$DEST"
rm -rf "$DEST"/*
cp -r dist/* "$DEST"/

echo "✓ Installed. Restart apteva-server to pick up the new bundle."
