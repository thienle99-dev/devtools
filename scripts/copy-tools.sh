#!/bin/bash

# Copy Tool Files Script
# Usage: ./scripts/copy-tools.sh <plugin-name> <category>

set -e

PLUGIN_NAME=$1
CATEGORY=$2
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PLUGIN_SRC="$PROJECT_ROOT/plugins/$PLUGIN_NAME/src"
TOOLS_SRC="$PROJECT_ROOT/src/tools/$CATEGORY"

if [ -z "$PLUGIN_NAME" ] || [ -z "$CATEGORY" ]; then
    echo "❌ Error: Plugin name and category are required"
    echo "Usage: ./scripts/copy-tools.sh <plugin-name> <category>"
    echo "Example: ./scripts/copy-tools.sh text-tools text"
    exit 1
fi

echo "📋 Copying tools from $CATEGORY to $PLUGIN_NAME"
echo "================================================"

# Check if source directory exists
if [ ! -d "$TOOLS_SRC" ]; then
    echo "❌ Error: Source directory not found: $TOOLS_SRC"
    exit 1
fi

# Check if plugin src directory exists
if [ ! -d "$PLUGIN_SRC" ]; then
    echo "Creating plugin src directory..."
    mkdir -p "$PLUGIN_SRC"
fi

# Copy all .tsx files from category to plugin
echo ""
echo "Copying .tsx files..."
cp -v "$TOOLS_SRC"/*.tsx "$PLUGIN_SRC/" 2>/dev/null || echo "No .tsx files found"

# Copy logic files if they exist
if [ -f "$TOOLS_SRC/logic.ts" ]; then
    echo "Copying logic.ts..."
    cp -v "$TOOLS_SRC/logic.ts" "$PLUGIN_SRC/"
fi

echo ""
echo "✅ Files copied successfully!"
echo ""
echo "Files in $PLUGIN_SRC:"
ls -la "$PLUGIN_SRC"

echo ""
echo "Next steps:"
echo "1. Create index.tsx to export all tools"
echo "2. Update import paths (remove @ aliases)"
echo "3. Run: ./scripts/setup-plugin.sh $PLUGIN_NAME"
