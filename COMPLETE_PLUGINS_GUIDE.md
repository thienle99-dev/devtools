# Complete Plugin Setup Guide

**Goal:** Finish 8 remaining plugins (text-tools, web-advanced, developer-tools, image-tools, math-tools, crypto-advanced, advanced-converters, data-tools)

**Estimated Time:** ~2 hours

---

## 📋 Checklist Overview

For each plugin:
- [ ] Create index.tsx
- [ ] Add special dependencies to package.json
- [ ] Build plugin
- [ ] Test plugin

---

## 🔧 Plugin 1: text-tools

### Step 1: Create index.tsx
```bash
cd plugins/text-tools/src
```

Create `index.tsx`:
```tsx
export { default as AsciiArtGenerator } from './AsciiArtGenerator';
export { default as LoremIpsumGenerator } from './LoremIpsumGenerator';
export { default as RegexReplace } from './RegexReplace';
export { default as Slugify } from './Slugify';
export { default as StringObfuscator } from './StringObfuscator';
export { default as TextDiff } from './TextDiff';
export { default as TextStatistics } from './TextStatistics';
```

### Step 2: Add dependencies
Edit `plugins/text-tools/package.json`, add to dependencies:
```json
"figlet": "^1.7.0",
"diff": "^5.1.0"
```

Add to devDependencies:
```json
"@types/figlet": "^1.5.8",
"@types/diff": "^5.0.9"
```

### Step 3: Build
```bash
cd /Users/thienle/Documents/personal/devtools2
./scripts/setup-plugin.sh text-tools
```

### Step 4: Test
- Open app
- Go to Plugin Marketplace
- Install text-tools
- Verify 7 tools appear in footer plugin bar
- Test each tool

---

## 🌐 Plugin 2: web-advanced

### Step 1: Create index.tsx
```bash
cd plugins/web-advanced/src
```

Create `index.tsx`:
```tsx
export { default as BasicAuthGenerator } from './BasicAuthGenerator';
export { default as Base64UrlConverter } from './Base64UrlConverter';
export { default as ContentTypeParser } from './ContentTypeParser';
export { default as CookieParser } from './CookieParser';
export { default as HttpHeaderParser } from './HttpHeaderParser';
export { default as HttpStatusCode } from './HttpStatusCode';
export { default as KeycodeInfo } from './KeycodeInfo';
export { default as MimeTypesList } from './MimeTypesList';
export { default as OtpGenerator } from './OtpGenerator';
export { default as SafelinkDecoder } from './SafelinkDecoder';
export { default as SetCookieGenerator } from './SetCookieGenerator';
export { default as SlugGenerator } from './SlugGenerator';
export { default as UserAgentParser } from './UserAgentParser';
```

### Step 2: Add dependencies
Edit `plugins/web-advanced/package.json`, add to dependencies:
```json
"ua-parser-js": "^1.0.37",
"otpauth": "^9.2.2"
```

Add to devDependencies:
```json
"@types/ua-parser-js": "^0.7.39"
```

### Step 3: Build
```bash
./scripts/setup-plugin.sh web-advanced
```

### Step 4: Test
- Install via marketplace
- Verify 13 tools in footer
- Test key tools (OTP, JWT, Cookie Parser)

---

## 💻 Plugin 3: developer-tools

### Step 1: Create index.tsx
```bash
cd plugins/developer-tools/src
```

Create `index.tsx`:
```tsx
export { default as ChmodCalculator } from './ChmodCalculator';
export { default as CodeSnippetGenerator } from './CodeSnippetGenerator';
export { default as CrontabGenerator } from './CrontabGenerator';
export { default as DockerConverter } from './DockerConverter';
export { default as MockDataGenerator } from './MockDataGenerator';
```

### Step 2: Add dependencies
Edit `plugins/developer-tools/package.json`, add to dependencies:
```json
"cronstrue": "^2.50.0",
"@faker-js/faker": "^8.4.1"
```

### Step 3: Build
```bash
./scripts/setup-plugin.sh developer-tools
```

### Step 4: Test
- Install via marketplace
- Test Crontab, Chmod, Mock Data generators

---

## 🖼️ Plugin 4: image-tools

### Step 1: Create index.tsx
```bash
cd plugins/image-tools/src
```

Create `index.tsx`:
```tsx
export { default as QrCodeGenerator } from './QrCodeGenerator';
export { default as SvgPlaceholderGenerator } from './SvgPlaceholderGenerator';
```

### Step 2: Add dependencies
Edit `plugins/image-tools/package.json`, add to dependencies:
```json
"qrcode": "^1.5.3",
"jsqr": "^1.4.0"
```

Add to devDependencies:
```json
"@types/qrcode": "^1.5.5"
```

### Step 3: Build
```bash
./scripts/setup-plugin.sh image-tools
```

### Step 4: Test
- Install via marketplace
- Test QR Code generation
- Test SVG Placeholder

---

## 🔢 Plugin 5: math-tools

### Step 1: Create index.tsx
```bash
cd plugins/math-tools/src
```

Create `index.tsx`:
```tsx
export { default as Chronometer } from './Chronometer';
export { default as MathEvaluator } from './MathEvaluator';
export { default as PercentageCalculator } from './PercentageCalculator';
export { default as TemperatureConverter } from './TemperatureConverter';
```

### Step 2: Add dependencies
Edit `plugins/math-tools/package.json`, add to dependencies:
```json
"mathjs": "^12.4.0"
```

### Step 3: Build
```bash
./scripts/setup-plugin.sh math-tools
```

### Step 4: Test
- Install via marketplace
- Test Math Evaluator
- Test Temperature Converter

---

## 🔐 Plugin 6: crypto-advanced

### Step 1: Create index.tsx
```bash
cd plugins/crypto-advanced/src
```

Create `index.tsx`:
```tsx
export { default as HmacGenerator } from './HmacGenerator';
export { default as BearerTokenGenerator } from './BearerTokenGenerator';
```

### Step 2: Add dependencies
Edit `plugins/crypto-advanced/package.json`, add to dependencies:
```json
"crypto-js": "^4.2.0"
```

Add to devDependencies:
```json
"@types/crypto-js": "^4.2.2"
```

### Step 3: Build
```bash
./scripts/setup-plugin.sh crypto-advanced
```

### Step 4: Test
- Install via marketplace
- Test HMAC Generator
- Test Bearer Token

---

## 🔄 Plugin 7: advanced-converters

### Step 1: Create index.tsx
```bash
cd plugins/advanced-converters/src
```

Create `index.tsx`:
```tsx
export { default as CharacterEncodingConverter } from './CharacterEncodingConverter';
export { default as MimeTypeConverter } from './MimeTypeConverter';
```

### Step 2: Add dependencies
Edit `plugins/advanced-converters/package.json`, add to dependencies:
```json
"iconv-lite": "^0.6.3",
"mime-types": "^2.1.35"
```

Add to devDependencies:
```json
"@types/mime-types": "^2.1.4"
```

### Step 3: Build
```bash
./scripts/setup-plugin.sh advanced-converters
```

### Step 4: Test
- Install via marketplace
- Test Character Encoding
- Test MIME Type converter

---

## 📊 Plugin 8: data-tools

### Step 1: Create index.tsx
```bash
cd plugins/data-tools/src
```

Create `index.tsx`:
```tsx
export { default as DataParser } from './DataParser';
```

### Step 2: Add dependencies
Edit `plugins/data-tools/package.json`, add to dependencies:
```json
"libphonenumber-js": "^1.10.53",
"iban": "^0.0.14"
```

Add to devDependencies:
```json
"@types/iban": "^0.0.35"
```

### Step 3: Build
```bash
./scripts/setup-plugin.sh data-tools
```

### Step 4: Test
- Install via marketplace
- Test IBAN, Phone, Email extraction

---

## ⚠️ Troubleshooting

### Build Errors

**Import path errors:**
```
Cannot find module '@utils/cn'
```

**Solution:** Replace `@` aliases with relative paths or copy utility files to plugin.

**Missing dependencies:**
```
Cannot find module 'figlet'
```

**Solution:** Make sure you added all dependencies to package.json and ran `npm install`.

### Plugin Not Appearing

1. Check build was successful (no errors)
2. Restart the application
3. Check plugin manifest exists
4. Verify plugin directory structure

### Tools Not Working

1. Check console for errors
2. Verify all imports are correct
3. Test with simpler tools first
4. Check if shared utilities are accessible

---

## 📝 Progress Tracker

Track your progress:

- [ ] text-tools (7 tools)
- [ ] web-advanced (13 tools)
- [ ] developer-tools (5 tools)
- [ ] image-tools (2 tools)
- [ ] math-tools (4 tools)
- [ ] crypto-advanced (2 tools)
- [ ] advanced-converters (2 tools)
- [ ] data-tools (1 tool)

---

## 🎯 Success Criteria

When all plugins are complete:

✅ All 8 plugins build without errors  
✅ All plugins installable via marketplace  
✅ All tools appear in footer plugin bar  
✅ All tools function correctly  
✅ No console errors  

---

## 📊 Time Breakdown

| Plugin | Tools | Est. Time |
|--------|-------|-----------|
| text-tools | 7 | 15 min |
| web-advanced | 13 | 20 min |
| developer-tools | 5 | 15 min |
| image-tools | 2 | 10 min |
| math-tools | 4 | 10 min |
| crypto-advanced | 2 | 10 min |
| advanced-converters | 2 | 10 min |
| data-tools | 1 | 10 min |
| **TOTAL** | **36 tools** | **~2 hours** |

---

## 🚀 Quick Commands

```bash
# Build all plugins at once (after creating index.tsx files)
for plugin in text-tools web-advanced developer-tools image-tools math-tools crypto-advanced advanced-converters data-tools; do
  echo "Building $plugin..."
  ./scripts/setup-plugin.sh $plugin
done
```

---

**Good luck! 🎉**

Follow this guide step by step and you'll have all 13 plugins ready!
