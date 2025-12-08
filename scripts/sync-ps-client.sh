#!/bin/bash
# Sync battle engine files from local pokemon-showdown-client clone
#
# Usage:
#   ./scripts/sync-ps-client.sh [path-to-ps-client]
#
# If no path provided, defaults to ../pokemon-showdown-client

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VENDOR_DIR="$PROJECT_ROOT/src/vendor/pokemon-showdown"

# Default path or use argument
PS_CLIENT="${1:-$PROJECT_ROOT/pokemon-showdown-client}"
PS_SRC="$PS_CLIENT/play.pokemonshowdown.com/src"

if [ ! -d "$PS_SRC" ]; then
    echo "Error: Pokemon Showdown client not found at $PS_CLIENT"
    echo ""
    echo "Clone it first:"
    echo "  git clone https://github.com/smogon/pokemon-showdown-client.git $PS_CLIENT"
    exit 1
fi

echo "Syncing from: $PS_SRC"
echo "Syncing to:   $VENDOR_DIR"
echo ""

# Get current commit for tracking
COMMIT=$(git -C "$PS_CLIENT" rev-parse --short HEAD)
DATE=$(date +%Y-%m-%d)

echo "Source commit: $COMMIT"
echo ""

# Copy battle files (MIT licensed)
echo "Copying battle-*.ts files..."
cp "$PS_SRC"/battle*.ts "$VENDOR_DIR/"

# Count files
COUNT=$(ls -1 "$VENDOR_DIR"/battle*.ts | wc -l | tr -d ' ')
echo "Copied $COUNT files"
echo ""

# Update sync info
echo "# Last synced: $DATE (commit $COMMIT)" > "$VENDOR_DIR/.sync-info"

echo "Done! Synced to commit $COMMIT"
echo ""
echo "Next steps:"
echo "  1. Test the build: npm run build"
echo "  2. Run tests: npm test"
echo "  3. Commit changes if everything works"
