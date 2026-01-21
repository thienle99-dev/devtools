# Plugin Automation Scripts

## Overview

Three automation scripts to streamline plugin creation and setup.

---

## Scripts

### 1. `create-plugin.sh` - Create Plugin Structure

Creates a new plugin with all necessary config files.

**Usage:**
```bash
./scripts/create-plugin.sh <plugin-name> <category> <description>
```

**Example:**
```bash
./scripts/create-plugin.sh text-tools text "Text manipulation utilities"
```

**What it does:**
- ✅ Creates `plugins/<plugin-name>/` directory
- ✅ Copies `tsconfig.json` and `vite.config.ts` from template
- ✅ Generates `package.json` with basic dependencies
- ✅ Creates `README.md` template
- ✅ Creates `src/` directory

---

### 2. `copy-tools.sh` - Copy Tool Files

Copies tool files from `src/tools/<category>` to plugin.

**Usage:**
```bash
./scripts/copy-tools.sh <plugin-name> <category>
```

**Example:**
```bash
./scripts/copy-tools.sh text-tools text
```

**What it does:**
- ✅ Copies all `.tsx` files from source category
- ✅ Copies `logic.ts` if it exists
- ✅ Lists copied files

**Note:** You still need to create `index.tsx` manually to export all tools.

---

### 3. `setup-plugin.sh` - Install & Build

Installs dependencies and builds the plugin.

**Usage:**
```bash
./scripts/setup-plugin.sh <plugin-name>
```

**Example:**
```bash
./scripts/setup-plugin.sh text-tools
```

**What it does:**
- ✅ Runs `npm install` in plugin directory
- ✅ Runs `npm run build`
- ✅ Verifies build success
- ✅ Shows next steps

---

## Complete Workflow

### Creating a New Plugin from Scratch

```bash
# 1. Create plugin structure
./scripts/create-plugin.sh web-advanced web "Advanced web development utilities"

# 2. Copy tool files
./scripts/copy-tools.sh web-advanced web

# 3. Create index.tsx (manual step)
# Edit plugins/web-advanced/src/index.tsx and export all tools

# 4. Add any additional dependencies to package.json (if needed)
# Edit plugins/web-advanced/package.json

# 5. Setup and build
./scripts/setup-plugin.sh web-advanced
```

---

## Quick Reference

### Text Tools Plugin
```bash
./scripts/create-plugin.sh text-tools text "Text manipulation and analysis utilities"
./scripts/copy-tools.sh text-tools text
# Create index.tsx
./scripts/setup-plugin.sh text-tools
```

### Web Advanced Plugin
```bash
./scripts/create-plugin.sh web-advanced web "Advanced web development utilities"
./scripts/copy-tools.sh web-advanced web
# Create index.tsx + add dependencies (ua-parser-js, otpauth)
./scripts/setup-plugin.sh web-advanced
```

### Developer Tools Plugin
```bash
./scripts/create-plugin.sh developer-tools development "Essential utilities for developers"
./scripts/copy-tools.sh developer-tools development
# Create index.tsx + add dependencies (cronstrue, @faker-js/faker)
./scripts/setup-plugin.sh developer-tools
```

### Image Tools Plugin
```bash
./scripts/create-plugin.sh image-tools image "Image generation and manipulation"
./scripts/copy-tools.sh image-tools image
# Create index.tsx + add dependencies (qrcode, jsqr)
./scripts/setup-plugin.sh image-tools
```

### Math Tools Plugin
```bash
./scripts/create-plugin.sh math-tools math "Mathematical calculators and converters"
./scripts/copy-tools.sh math-tools math
# Create index.tsx + add dependencies (mathjs)
./scripts/setup-plugin.sh math-tools
```

### Crypto Advanced Plugin
```bash
./scripts/create-plugin.sh crypto-advanced crypto "Advanced cryptographic utilities"
./scripts/copy-tools.sh crypto-advanced crypto
# Create index.tsx + add dependencies (crypto-js)
./scripts/setup-plugin.sh crypto-advanced
```

### Advanced Converters Plugin
```bash
./scripts/create-plugin.sh advanced-converters converters "Specialized encoding and format converters"
./scripts/copy-tools.sh advanced-converters converters
# Create index.tsx + add dependencies (iconv-lite, mime-types)
./scripts/setup-plugin.sh advanced-converters
```

### Data Tools Plugin
```bash
./scripts/create-plugin.sh data-tools data "Data extraction and parsing utilities"
./scripts/copy-tools.sh data-tools data
# Create index.tsx + add dependencies (libphonenumber-js, iban)
./scripts/setup-plugin.sh data-tools
```

---

## Manual Steps Still Required

After running the scripts, you need to:

### 1. Create `index.tsx`

Example for text-tools:
```tsx
export { default as LoremIpsumGenerator } from './LoremIpsumGenerator';
export { default as Slugify } from './Slugify';
export { default as RegexReplace } from './RegexReplace';
export { default as TextStatistics } from './TextStatistics';
export { default as TextDiff } from './TextDiff';
export { default as StringObfuscator } from './StringObfuscator';
export { default as AsciiArtGenerator } from './AsciiArtGenerator';
```

### 2. Add Plugin-Specific Dependencies

Edit `package.json` to add any special dependencies:

**Text Tools:**
```json
"figlet": "^1.7.0",
"diff": "^5.1.0"
```

**Web Advanced:**
```json
"ua-parser-js": "^1.0.37",
"otpauth": "^9.2.2"
```

**Developer Tools:**
```json
"cronstrue": "^2.50.0",
"@faker-js/faker": "^8.4.1"
```

### 3. Update Import Paths

Remove `@` aliases and use relative paths:
```tsx
// Before
import { cn } from '@utils/cn';

// After
import { cn } from '../../../src/utils/cn';
// Or copy utility files to plugin
```

### 4. Test the Plugin

- Install via Plugin Marketplace
- Verify tools appear in footer
- Test each tool functionality

---

## Troubleshooting

### Script Permission Denied
```bash
chmod +x scripts/*.sh
```

### Build Errors
- Check TypeScript errors in copied files
- Verify all dependencies are installed
- Check import paths

### Plugin Not Appearing
- Verify build was successful
- Check plugin manifest
- Restart the application

---

## Time Estimates

- **Create plugin structure:** ~1 minute (automated)
- **Copy tool files:** ~1 minute (automated)
- **Create index.tsx:** ~2-5 minutes (manual)
- **Add dependencies:** ~1-2 minutes (manual)
- **Build plugin:** ~1-2 minutes (automated)
- **Test plugin:** ~5-10 minutes (manual)

**Total per plugin:** ~10-20 minutes

**All 9 plugins:** ~2-3 hours

---

## Next Steps

1. Use scripts to create remaining 8 plugins
2. Test each plugin thoroughly
3. Update PLUGIN_MIGRATION.md with completion status
4. Create plugin marketplace listings
