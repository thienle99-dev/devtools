#!/bin/bash

# Plugin Setup Automation Script
# Usage: ./scripts/setup-plugin.sh <plugin-name>

set -e

PLUGIN_NAME=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PLUGIN_DIR="$PROJECT_ROOT/plugins/$PLUGIN_NAME"

if [ -z "$PLUGIN_NAME" ]; then
    echo "❌ Error: Plugin name is required"
    echo "Usage: ./scripts/setup-plugin.sh <plugin-name>"
    exit 1
fi

echo "🚀 Setting up plugin: $PLUGIN_NAME"
echo "=================================="

# Check if plugin directory exists
if [ ! -d "$PLUGIN_DIR" ]; then
    echo "❌ Error: Plugin directory not found: $PLUGIN_DIR"
    echo "Please create the plugin directory first with package.json"
    exit 1
fi

# Check if package.json exists
if [ ! -f "$PLUGIN_DIR/package.json" ]; then
    echo "❌ Error: package.json not found in $PLUGIN_DIR"
    exit 1
fi

cd "$PLUGIN_DIR"

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building plugin..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Plugin setup complete!"
    echo "=================================="
    echo "Plugin: $PLUGIN_NAME"
    echo "Location: $PLUGIN_DIR"
    echo "Build output: $PLUGIN_DIR/dist"
    echo ""
    echo "Next steps:"
    echo "1. Test the plugin in the marketplace"
    echo "2. Verify tools appear in footer plugin bar"
    echo "3. Test each tool functionality"
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi
