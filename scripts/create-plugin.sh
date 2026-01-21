#!/bin/bash

# Create Plugin Structure Script
# Usage: ./scripts/create-plugin.sh <plugin-name> <category> <description>

set -e

PLUGIN_NAME=$1
CATEGORY=$2
DESCRIPTION=$3
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PLUGIN_DIR="$PROJECT_ROOT/plugins/$PLUGIN_NAME"
TEMPLATE_DIR="$PROJECT_ROOT/plugins/beautiful-screenshot"

if [ -z "$PLUGIN_NAME" ] || [ -z "$CATEGORY" ]; then
    echo "❌ Error: Plugin name and category are required"
    echo "Usage: ./scripts/create-plugin.sh <plugin-name> <category> <description>"
    echo "Example: ./scripts/create-plugin.sh text-tools text 'Text manipulation utilities'"
    exit 1
fi

if [ -z "$DESCRIPTION" ]; then
    DESCRIPTION="Plugin for $CATEGORY tools"
fi

echo "🎨 Creating plugin: $PLUGIN_NAME"
echo "=================================="
echo "Category: $CATEGORY"
echo "Description: $DESCRIPTION"
echo ""

# Check if plugin already exists
if [ -d "$PLUGIN_DIR" ]; then
    echo "⚠️  Warning: Plugin directory already exists: $PLUGIN_DIR"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create plugin directory structure
echo "Creating directory structure..."
mkdir -p "$PLUGIN_DIR/src"

# Copy config files from template
echo "Copying config files..."
cp "$TEMPLATE_DIR/tsconfig.json" "$PLUGIN_DIR/"
cp "$TEMPLATE_DIR/vite.config.ts" "$PLUGIN_DIR/"

# Create package.json
echo "Creating package.json..."
cat > "$PLUGIN_DIR/package.json" << EOF
{
  "name": "$PLUGIN_NAME",
  "version": "1.0.0",
  "description": "$DESCRIPTION",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.562.0",
    "framer-motion": "^12.23.26"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^5.1.1",
    "typescript": "~5.9.3",
    "vite": "^6.0.1"
  }
}
EOF

# Create README
echo "Creating README.md..."
cat > "$PLUGIN_DIR/README.md" << EOF
# $PLUGIN_NAME

$DESCRIPTION

## Category
$CATEGORY

## Installation

Install via Plugin Marketplace in DevTools.

## Tools Included

(List tools here)

## Development

\`\`\`bash
# Install dependencies
npm install

# Build plugin
npm run build
\`\`\`

## Version
1.0.0
EOF

echo ""
echo "✅ Plugin structure created!"
echo "=================================="
echo "Plugin: $PLUGIN_NAME"
echo "Location: $PLUGIN_DIR"
echo ""
echo "Next steps:"
echo "1. Copy tool files: ./scripts/copy-tools.sh $PLUGIN_NAME $CATEGORY"
echo "2. Create src/index.tsx to export tools"
echo "3. Setup and build: ./scripts/setup-plugin.sh $PLUGIN_NAME"
