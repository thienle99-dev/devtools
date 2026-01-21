# Text Tools Plugin - Implementation Guide

## Status: 🔄 IN PROGRESS

This plugin contains 7 text manipulation and analysis tools.

## Plugin Structure

```
plugins/text-tools/
├── package.json          ✅ CREATED
├── tsconfig.json         ✅ COPIED
├── vite.config.ts        ✅ COPIED
├── src/
│   ├── index.tsx         🔄 TO CREATE (main entry)
│   ├── LoremIpsumGenerator.tsx
│   ├── Slugify.tsx
│   ├── RegexReplace.tsx
│   ├── TextStatistics.tsx
│   ├── TextDiff.tsx
│   ├── StringObfuscator.tsx
│   └── AsciiArtGenerator.tsx
└── README.md
```

## Tools to Copy

### 1. Lorem Ipsum Generator
**Source:** `/src/tools/text/LoremIpsumGenerator.tsx`  
**Purpose:** Generate placeholder text for layouts  
**Dependencies:** None (uses built-in lorem ipsum logic)

### 2. Slugify
**Source:** `/src/tools/text/Slugify.tsx`  
**Purpose:** Convert text to URL-friendly slugs  
**Dependencies:** None (simple string manipulation)

### 3. Regex Replace
**Source:** `/src/tools/text/RegexReplace.tsx`  
**Purpose:** Advanced search and replace using RegEx  
**Dependencies:** None (uses built-in RegExp)

### 4. Text Statistics
**Source:** `/src/tools/text/TextStatistics.tsx`  
**Purpose:** Analyze text - word count, reading time, keyword density  
**Dependencies:** None (string analysis)

### 5. Text Diff
**Source:** `/src/tools/text/TextDiff.tsx`  
**Purpose:** Compare two texts and show differences  
**Dependencies:** `diff` package (already in package.json)

### 6. String Obfuscator
**Source:** `/src/tools/text/StringObfuscator.tsx`  
**Purpose:** Encode/obfuscate text (ROT13, Base64, Hex)  
**Dependencies:** None (uses built-in encoding)

### 7. ASCII Art Generator
**Source:** `/src/tools/text/AsciiArtGenerator.tsx`  
**Purpose:** Generate stylized ASCII art from text  
**Dependencies:** `figlet` package (already in package.json)

## Next Steps

### Manual Steps Required:

1. **Copy Tool Files:**
   ```bash
   cp src/tools/text/LoremIpsumGenerator.tsx plugins/text-tools/src/
   cp src/tools/text/Slugify.tsx plugins/text-tools/src/
   cp src/tools/text/RegexReplace.tsx plugins/text-tools/src/
   cp src/tools/text/TextStatistics.tsx plugins/text-tools/src/
   cp src/tools/text/TextDiff.tsx plugins/text-tools/src/
   cp src/tools/text/StringObfuscator.tsx plugins/text-tools/src/
   cp src/tools/text/AsciiArtGenerator.tsx plugins/text-tools/src/
   ```

2. **Create index.tsx:**
   ```tsx
   export { default as LoremIpsumGenerator } from './LoremIpsumGenerator';
   export { default as Slugify } from './Slugify';
   export { default as RegexReplace } from './RegexReplace';
   export { default as TextStatistics } from './TextStatistics';
   export { default as TextDiff } from './TextDiff';
   export { default as StringObfuscator } from './StringObfuscator';
   export { default as AsciiArtGenerator } from './AsciiArtGenerator';
   ```

3. **Install Dependencies:**
   ```bash
   cd plugins/text-tools
   npm install
   ```

4. **Build Plugin:**
   ```bash
   npm run build
   ```

5. **Test Installation:**
   - Open Plugin Marketplace in app
   - Install text-tools plugin
   - Verify tools appear in footer plugin bar
   - Test each tool functionality

## Plugin Manifest

The plugin will need a manifest file for the marketplace:

```json
{
  "id": "text-tools",
  "name": "Text Tools",
  "version": "1.0.0",
  "description": "Comprehensive text manipulation and analysis utilities",
  "category": "text",
  "icon": "Type",
  "color": "text-indigo-400",
  "author": "DevTools Team",
  "tools": [
    {
      "id": "lorem-ipsum-generator",
      "name": "Lorem Ipsum",
      "description": "Generate placeholder text for layouts"
    },
    {
      "id": "slugify",
      "name": "Slugify",
      "description": "Convert text to URL-friendly slugs"
    },
    {
      "id": "regex-replace",
      "name": "Regex Replace",
      "description": "Advanced search and replace using RegEx"
    },
    {
      "id": "text-statistics",
      "name": "Text Statistics",
      "description": "Analyze text statistics and keyword density"
    },
    {
      "id": "text-diff",
      "name": "Text Diff",
      "description": "Compare two texts and see the differences"
    },
    {
      "id": "string-obfuscator",
      "name": "String Obfuscator",
      "description": "Encode or obfuscate text (ROT13, Base64, Hex)"
    },
    {
      "id": "ascii-art",
      "name": "ASCII Art",
      "description": "Generate stylized ASCII art from text"
    }
  ]
}
```

## Notes

- All tool files should be self-contained
- Update import paths if needed (remove `@` aliases, use relative paths)
- Ensure all dependencies are in package.json
- Test each tool individually after copying

## Completion Checklist

- [x] Create plugin directory structure
- [x] Create package.json with dependencies
- [x] Copy tsconfig.json and vite.config.ts
- [ ] Copy all 7 tool source files
- [ ] Create index.tsx entry point
- [ ] Update import paths in copied files
- [ ] Install dependencies (npm install)
- [ ] Build plugin (npm run build)
- [ ] Create plugin manifest
- [ ] Test installation via marketplace
- [ ] Verify all tools work correctly
- [ ] Create README.md

---

**Status:** Plugin structure created, ready for tool files to be copied manually.

**Estimated Time to Complete:** 30-45 minutes (manual file copying and testing)
