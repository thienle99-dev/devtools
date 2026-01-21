# Plugin Creation Plan

## Overview
This document outlines the plan to create 9 remaining plugin packs. Each plugin will follow the same structure as existing plugins.

---

## Plugin Structure Template

```
plugins/[plugin-name]/
├── package.json          # Plugin metadata
├── tsconfig.json         # TypeScript config
├── vite.config.ts        # Build config
├── src/
│   ├── index.tsx         # Main entry point
│   ├── [Tool1].tsx       # Individual tools
│   ├── [Tool2].tsx
│   └── ...
└── README.md            # Documentation
```

---

## Implementation Priority

### **Phase 1: High-Value Plugins** (Create first)
1. 🔥 **text-tools** - 7 tools (high usage)
2. 🔥 **web-advanced** - 13 tools (most comprehensive)
3. 🔥 **developer-tools** - 5 tools (dev-focused)

### **Phase 2: Utility Plugins** (Create second)
4. ⭐ **image-tools** - 2 tools (visual)
5. ⭐ **math-tools** - 4 tools (calculators)
6. ⭐ **crypto-advanced** - 2 tools (security)

### **Phase 3: Specialized Plugins** (Create last)
7. 📦 **advanced-converters** - 2 tools (niche)
8. 📦 **data-tools** - 1 tool (specific)
9. 📦 **formatters-advanced** - 1 tool (optional)

---

## Plugin Specifications

### 1. **text-tools** 🔥

**Name:** Text Tools  
**ID:** `text-tools`  
**Category:** `text`  
**Description:** Comprehensive text manipulation and analysis utilities  
**Icon:** `Type` (from lucide-react)  
**Color:** `text-indigo-400`

**Tools (7):**
1. **Lorem Ipsum Generator** - Generate placeholder text
2. **Slugify** - Convert text to URL-friendly slugs
3. **Regex Replace** - Advanced search and replace
4. **Text Statistics** - Word count, reading time, analysis
5. **Text Diff** - Compare two texts
6. **String Obfuscator** - ROT13, Base64, Hex encoding
7. **ASCII Art Generator** - Stylized ASCII art

**Dependencies:**
```json
{
  "figlet": "^1.7.0",
  "diff": "^5.1.0"
}
```

**Source Files to Copy:**
- `/src/tools/text/LoremIpsumGenerator.tsx`
- `/src/tools/text/Slugify.tsx`
- `/src/tools/text/RegexReplace.tsx`
- `/src/tools/text/TextStatistics.tsx`
- `/src/tools/text/TextDiff.tsx`
- `/src/tools/text/StringObfuscator.tsx`
- `/src/tools/text/AsciiArtGenerator.tsx`

---

### 2. **web-advanced** 🔥

**Name:** Web Advanced Tools  
**ID:** `web-advanced`  
**Category:** `web`  
**Description:** Advanced web development and debugging utilities  
**Icon:** `Globe` (from lucide-react)  
**Color:** `text-blue-400`

**Tools (13):**
1. **Cookie Parser** - Parse HTTP cookies
2. **OTP Generator** - TOTP 2FA codes
3. **User Agent Parser** - Parse UA strings
4. **Basic Auth Generator** - HTTP Basic Auth
5. **Slug Generator** - URL-friendly slugs
6. **HTTP Status Codes** - Status code reference
7. **MIME Types List** - MIME type lookup
8. **Keycode Info** - Keyboard event info
9. **Safelink Decoder** - Decode Outlook Safe Links
10. **Base64 URL** - URL-safe Base64
11. **HTTP Header Parser** - Parse HTTP headers
12. **Set-Cookie Generator** - Generate Set-Cookie headers
13. **Content-Type Parser** - Parse Content-Type headers

**Dependencies:**
```json
{
  "ua-parser-js": "^1.0.37",
  "otpauth": "^9.2.2"
}
```

**Source Files to Copy:**
- `/src/tools/web/CookieParser.tsx`
- `/src/tools/web/OtpGenerator.tsx`
- `/src/tools/web/UserAgentParser.tsx`
- `/src/tools/web/BasicAuthGenerator.tsx`
- `/src/tools/web/SlugGenerator.tsx`
- `/src/tools/web/HttpStatusCode.tsx`
- `/src/tools/web/MimeTypesList.tsx`
- `/src/tools/web/KeycodeInfo.tsx`
- `/src/tools/web/SafelinkDecoder.tsx`
- `/src/tools/web/Base64UrlConverter.tsx`
- `/src/tools/web/HttpHeaderParser.tsx`
- `/src/tools/web/SetCookieGenerator.tsx`
- `/src/tools/web/ContentTypeParser.tsx`

---

### 3. **developer-tools** 🔥

**Name:** Developer Tools  
**ID:** `developer-tools`  
**Category:** `development`  
**Description:** Essential utilities for developers  
**Icon:** `Code` (from lucide-react)  
**Color:** `text-orange-400`

**Tools (5):**
1. **Crontab Generator** - Cron schedule generator
2. **Chmod Calculator** - File permissions calculator
3. **Docker Converter** - Docker run → compose
4. **Mock Data Generator** - Generate test data
5. **Code Snippet Generator** - HTTP code snippets (curl, fetch, axios)

**Dependencies:**
```json
{
  "cronstrue": "^2.50.0",
  "@faker-js/faker": "^8.4.1"
}
```

**Source Files to Copy:**
- `/src/tools/development/CrontabGenerator.tsx`
- `/src/tools/development/ChmodCalculator.tsx`
- `/src/tools/development/DockerConverter.tsx`
- `/src/tools/development/MockDataGenerator.tsx`
- `/src/tools/development/CodeSnippetGenerator.tsx`

---

### 4. **image-tools** ⭐

**Name:** Image Tools  
**ID:** `image-tools`  
**Category:** `image`  
**Description:** Image generation and manipulation utilities  
**Icon:** `Image` (from lucide-react)  
**Color:** `text-purple-400`

**Tools (2):**
1. **QR Code Generator** - Generate and scan QR codes
2. **SVG Placeholder Generator** - Generate SVG placeholders

**Dependencies:**
```json
{
  "qrcode": "^1.5.3",
  "jsqr": "^1.4.0"
}
```

**Source Files to Copy:**
- `/src/tools/image/QrCodeGenerator.tsx`
- `/src/tools/image/SvgPlaceholderGenerator.tsx`
- `/src/tools/image/logic.ts`

---

### 5. **math-tools** ⭐

**Name:** Math Tools  
**ID:** `math-tools`  
**Category:** `math`  
**Description:** Mathematical calculators and converters  
**Icon:** `Calculator` (from lucide-react)  
**Color:** `text-emerald-400`

**Tools (4):**
1. **Math Evaluator** - Evaluate mathematical expressions
2. **Percentage Calculator** - Calculate percentages
3. **Temperature Converter** - Celsius, Fahrenheit, Kelvin
4. **Chronometer** - Stopwatch and countdown timer

**Dependencies:**
```json
{
  "mathjs": "^12.4.0"
}
```

**Source Files to Copy:**
- `/src/tools/math/MathEvaluator.tsx`
- `/src/tools/math/PercentageCalculator.tsx`
- `/src/tools/math/TemperatureConverter.tsx`
- `/src/tools/math/Chronometer.tsx`
- `/src/tools/math/logic.ts`

---

### 6. **crypto-advanced** ⭐

**Name:** Crypto Advanced  
**ID:** `crypto-advanced`  
**Category:** `crypto`  
**Description:** Advanced cryptographic utilities  
**Icon:** `ShieldCheck` (from lucide-react)  
**Color:** `text-fuchsia-400`

**Tools (2):**
1. **HMAC Generator** - Keyed-hash message authentication
2. **Bearer Token Generator** - Generate secure API tokens

**Dependencies:**
```json
{
  "crypto-js": "^4.2.0"
}
```

**Source Files to Copy:**
- `/src/tools/crypto/HmacGenerator.tsx`
- `/src/tools/crypto/BearerTokenGenerator.tsx`

---

### 7. **advanced-converters** 📦

**Name:** Advanced Converters  
**ID:** `advanced-converters`  
**Category:** `converters`  
**Description:** Specialized encoding and format converters  
**Icon:** `FileCode` (from lucide-react)  
**Color:** `text-cyan-400`

**Tools (2):**
1. **Character Encoding Converter** - UTF-8, ASCII, ISO-8859-1
2. **MIME Type Converter** - File extensions ↔ MIME types

**Dependencies:**
```json
{
  "iconv-lite": "^0.6.3",
  "mime-types": "^2.1.35"
}
```

**Source Files to Copy:**
- `/src/tools/converters/CharacterEncodingConverter.tsx`
- `/src/tools/converters/MimeTypeConverter.tsx`

---

### 8. **data-tools** 📦

**Name:** Data Tools  
**ID:** `data-tools`  
**Category:** `data`  
**Description:** Data extraction and parsing utilities  
**Icon:** `Database` (from lucide-react)  
**Color:** `text-cyan-400`

**Tools (1):**
1. **Data Parser** - Extract IBANs, Phone Numbers, Emails

**Dependencies:**
```json
{
  "libphonenumber-js": "^1.10.53",
  "iban": "^0.0.14"
}
```

**Source Files to Copy:**
- `/src/tools/data/DataParser.tsx`

---

### 9. **formatters-advanced** 📦

**Name:** Advanced Formatters  
**ID:** `formatters-advanced`  
**Category:** `formatters`  
**Description:** Additional formatting utilities  
**Icon:** `Braces` (from lucide-react)  
**Color:** `text-yellow-400`

**Tools (1):**
1. **JSON Minifier** - Compress JSON (Note: redundant with Code Formatter)

**Dependencies:** None (uses built-in JSON)

**Source Files to Copy:**
- Can reuse `UniversalFormatter` with `initialMode: 'json'` and `minify: true`

---

## Implementation Checklist

For each plugin:

### Setup
- [ ] Create plugin directory structure
- [ ] Copy `package.json` template from existing plugin
- [ ] Update plugin metadata (name, description, category)
- [ ] Copy `tsconfig.json` and `vite.config.ts`

### Development
- [ ] Copy source files from `/src/tools/[category]/`
- [ ] Create `index.tsx` entry point
- [ ] Update imports to use relative paths
- [ ] Add plugin-specific dependencies
- [ ] Test build: `npm run build`

### Integration
- [ ] Add plugin manifest
- [ ] Test installation via marketplace
- [ ] Verify tools appear in footer plugin bar
- [ ] Test tool functionality

### Documentation
- [ ] Create README.md
- [ ] Add screenshots (optional)
- [ ] Document dependencies
- [ ] List all included tools

---

## Automation Script

To speed up plugin creation, we can create a script:

```bash
#!/bin/bash
# create-plugin.sh

PLUGIN_NAME=$1
CATEGORY=$2
DESCRIPTION=$3

mkdir -p plugins/$PLUGIN_NAME/src
cp plugins/beautiful-screenshot/package.json plugins/$PLUGIN_NAME/
cp plugins/beautiful-screenshot/tsconfig.json plugins/$PLUGIN_NAME/
cp plugins/beautiful-screenshot/vite.config.ts plugins/$PLUGIN_NAME/

# Update package.json with new plugin info
# Copy tool files
# Generate index.tsx
```

---

## Timeline Estimate

- **Phase 1** (3 plugins): ~2-3 hours
- **Phase 2** (3 plugins): ~1-2 hours
- **Phase 3** (3 plugins): ~1 hour

**Total:** ~4-6 hours for all 9 plugins

---

## Next Steps

1. Start with **text-tools** (highest value, 7 tools)
2. Then **web-advanced** (most comprehensive, 13 tools)
3. Continue with remaining plugins in priority order

Would you like me to start creating the plugins now? I'll begin with **text-tools**.
