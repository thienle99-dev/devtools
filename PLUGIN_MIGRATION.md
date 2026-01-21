# Plugin Migration Summary

## Overview
This document tracks the migration of tools from the built-in sidebar to plugins, creating a leaner core experience with optional plugin extensions.

## Core Tools Remaining (12 tools)

### Formatters (2)
- ✅ **Code Formatter** (`universal-formatter`) - JSON/XML/YAML/SQL formatter
- ✅ **JSON Diff** (`json-diff`) - Compare JSON objects

### Converters (3)
- ✅ **Unicode Converter** (`unicode`) - Text ↔ Unicode codes
- ✅ **Binary/Hex to Text** (`binary-hex-text`) - Binary/Hex conversion
- ✅ **Query String Converter** (`query-string`) - URL query parsing

### Crypto (3)
- ✅ **Hash Generator** (`hash`) - MD5, SHA1, SHA256
- ✅ **UUID Generator** (`uuid`) - Generate unique IDs
- ✅ **Token Generator** (`token-generator`) - Secure passwords/tokens

### Web (2)
- ✅ **URL Parser** (`url-parser`) - Parse URL components
- ✅ **JWT Parser** (`jwt`) - Decode JWT tokens

### Development (2)
- ✅ **Regex Tester** (`regex-tester`) - Test regular expressions
- ✅ **Settings** (`settings`) - App settings

---

## Tools Moved to Plugins

### Plugin 1: **beautiful-screenshot** ✅ DONE
- Beautiful Screenshot

### Plugin 2: **media-tools** ✅ DONE
- Voice Recorder
- Webcam Photo
- Video Recorder
- Video Compressor

### Plugin 3: **pdf-tools** ✅ DONE
- PDF Converter
- PDF Security

### Plugin 4: **data-converters** ✅ DONE
- CSV → Excel Converter

### Plugin 5: **text-tools** 🔄 TO CREATE
**Tools to include:**
- Lorem Ipsum Generator
- Slugify
- Regex Replace
- Text Statistics
- Text Diff
- String Obfuscator
- ASCII Art Generator

### Plugin 6: **web-advanced** 🔄 TO CREATE
**Tools to include:**
- Cookie Parser
- OTP Generator
- User Agent Parser
- Basic Auth Generator
- Slug Generator
- HTTP Status Codes
- MIME Types List
- Keycode Info
- Safelink Decoder
- Base64 URL
- HTTP Header Parser
- Set-Cookie Generator
- Content-Type Parser

### Plugin 7: **crypto-advanced** 🔄 TO CREATE
**Tools to include:**
- HMAC Generator
- Bearer Token Generator

### Plugin 8: **developer-tools** 🔄 TO CREATE
**Tools to include:**
- Crontab Generator
- Chmod Calculator
- Docker Converter
- Mock Data Generator
- Code Snippet Generator

### Plugin 9: **image-tools** 🔄 TO CREATE
**Tools to include:**
- QR Code Generator
- SVG Placeholder Generator

### Plugin 10: **math-tools** 🔄 TO CREATE
**Tools to include:**
- Math Evaluator
- Percentage Calculator
- Temperature Converter
- Chronometer

### Plugin 11: **advanced-converters** 🔄 TO CREATE
**Tools to include:**
- Character Encoding Converter
- MIME Type Converter

### Plugin 12: **data-tools** 🔄 TO CREATE
**Tools to include:**
- Data Parser (IBAN, Phone, Email)

### Plugin 13: **formatters-advanced** 🔄 TO CREATE
**Tools to include:**
- JSON Minifier (optional, redundant with Code Formatter)

---

## Statistics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Built-in Tools** | ~60 | 12 | -80% |
| **Sidebar Categories** | 13 | 5 | -62% |
| **Plugin Packs** | 4 | 13 | +225% |
| **Tools in Plugins** | 8 | ~48 | +500% |

---

## Benefits

1. **Faster Load Times** - Only 12 core tools loaded by default
2. **Cleaner Sidebar** - Essential tools only, easier navigation
3. **User Choice** - Install only what you need
4. **Scalability** - Easy to add new tools via plugins
5. **Marketplace Growth** - More plugins = more value

---

## Next Steps

1. ✅ Update registry files (COMPLETED)
2. 🔄 Create remaining 9 plugin packs
3. 🔄 Test all plugins install/uninstall
4. 🔄 Update documentation
5. 🔄 Create plugin marketplace listings

---

## File Changes

### Modified Files:
- `/src/tools/registry/data/formatters.ts` - Reduced to 2 tools
- `/src/tools/registry/data/crypto.ts` - Reduced to 3 tools
- `/src/tools/registry/data/converters/groups/structuredConverters.ts` - Reduced to 3 tools
- `/src/tools/registry/data/web.ts` - Reduced to 2 tools
- `/src/tools/registry/data/development.ts` - Reduced to 2 tools
- `/src/tools/registry/data/text.ts` - Empty (all moved to plugin)
- `/src/tools/registry/data/image.ts` - Empty (all moved to plugin)
- `/src/tools/registry/data/math.ts` - Empty (all moved to plugin)
- `/src/tools/registry/data/media.ts` - Empty (already moved to plugin)
- `/src/tools/registry/data/pdf.ts` - Empty (already moved to plugin)
- `/src/tools/registry/data/data.ts` - Empty (to be moved to plugin)

### Plugin Structure:
```
plugins/
├── beautiful-screenshot/     ✅ EXISTS
├── media-tools/             ✅ EXISTS
├── pdf-tools/               ✅ EXISTS
├── data-converters/         ✅ EXISTS
├── text-tools/              🔄 TO CREATE
├── web-advanced/            🔄 TO CREATE
├── crypto-advanced/         🔄 TO CREATE
├── developer-tools/         🔄 TO CREATE
├── image-tools/             🔄 TO CREATE
├── math-tools/              🔄 TO CREATE
├── advanced-converters/     🔄 TO CREATE
└── data-tools/              🔄 TO CREATE
```

---

**Last Updated:** 2026-01-22
**Status:** Phase 1 Complete (Registry cleanup done)
**Next Phase:** Create remaining plugin packs
