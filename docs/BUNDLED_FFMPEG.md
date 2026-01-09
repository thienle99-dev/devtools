# 📦 Bundled FFmpeg - Complete Guide

## ✅ Overview

FFmpeg is now **bundled directly** in the app! No external installation required.

### Key Features
- ✅ **Automatic download** on `pnpm install`
- ✅ **Cross-platform** (Windows, macOS, Linux)
- ✅ **Latest version** from official sources
- ✅ **Standalone** - works without global FFmpeg
- ✅ **Production ready** - included in builds

---

## 🎯 How It Works

### 1. **Download Script** (`scripts/download-ffmpeg.cjs`)

Automatically downloads FFmpeg binary for your platform:

```javascript
// Windows
https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip

// macOS
https://evermeet.cx/ffmpeg/getrelease/zip

// Linux
https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz
```

### 2. **Storage Location**

```
devtools-app/
├── resources/
│   └── bin/
│       ├── ffmpeg.exe     (Windows)
│       ├── ffmpeg         (macOS/Linux)
│       └── (bundled in production)
```

### 3. **Detection Priority** (FFmpegHelper)

```typescript
Strategy 1: Bundled FFmpeg (resources/bin/)          ← HIGHEST PRIORITY
Strategy 2: ffmpeg-static package
Strategy 3: Global FFmpeg (PATH)
Strategy 4: Common install paths
Strategy 5: App directory (portable)
```

---

## 🚀 Usage

### Development

```bash
# Install dependencies (auto-downloads FFmpeg)
pnpm install

# Or manually download
pnpm run download:ffmpeg

# Start app - FFmpeg ready!
pnpm run dev
```

### Production Build

```bash
# Build with bundled FFmpeg
pnpm run build:win    # Windows
pnpm run build:mac    # macOS
pnpm run build:linux  # Linux

# FFmpeg is automatically included in:
# - Installer
# - Unpacked app
# - Portable version
```

---

## 📋 Configuration

### `package.json`

```json
{
  "scripts": {
    "postinstall": "node scripts/download-ffmpeg.cjs",
    "download:ffmpeg": "node scripts/download-ffmpeg.cjs"
  }
}
```

**`postinstall`** runs automatically after `pnpm install`

### `electron-builder.yml`

```yaml
# Include resources in build
files:
  - "resources/**/*"

# Unpack FFmpeg from asar
asarUnpack:
  - "resources/bin/**/*"
```

---

## 🔍 Detection Flow

### FFmpegHelper.getFFmpegPath()

```typescript
// 1. Check bundled location (PRIORITY)
resources/bin/ffmpeg.exe           ← Production
resources/bin/ffmpeg               ← Production (Unix)
./resources/bin/ffmpeg.exe         ← Development

// 2. Fallback to ffmpeg-static
node_modules/.pnpm/ffmpeg-static@5.3.0/.../ffmpeg.exe

// 3. Fallback to global
C:\ffmpeg\bin\ffmpeg.exe           ← Windows
/usr/local/bin/ffmpeg              ← macOS
/usr/bin/ffmpeg                    ← Linux

// 4. Check common paths
C:\Program Files\ffmpeg\bin\ffmpeg.exe
/opt/homebrew/bin/ffmpeg
...

// 5. Check app directory
./bin/ffmpeg.exe
./ffmpeg.exe
```

---

## ✅ Verification

### Check Bundled FFmpeg

```bash
# Windows
.\resources\bin\ffmpeg.exe -version

# macOS/Linux
./resources/bin/ffmpeg -version
```

**Expected output:**
```
ffmpeg version N-122390-gaf6a1dd0b2-20260108
```

### In Application

```typescript
import { FFmpegHelper } from './ffmpeg-helper';

const ffmpegPath = FFmpegHelper.getFFmpegPath();
console.log('FFmpeg:', ffmpegPath);
// Output: C:\...\devtools-app\resources\bin\ffmpeg.exe

const version = FFmpegHelper.getFFmpegVersion();
console.log('Version:', version);
// Output: N-122390-gaf6a1dd0b2-20260108
```

---

## 📊 File Sizes

### Downloaded Archives
| Platform | Archive Size | Extracted Size |
|----------|-------------|----------------|
| Windows  | ~100MB      | ~130MB         |
| macOS    | ~60MB       | ~80MB          |
| Linux    | ~80MB       | ~100MB         |

### In Final Build
| Platform | Binary Size | Impact on Installer |
|----------|-------------|---------------------|
| Windows  | ~130MB      | +40-50MB            |
| macOS    | ~80MB       | +30-40MB            |
| Linux    | ~100MB      | +35-45MB            |

**Note:** With Phase 1+2 optimizations, total installer is still smaller than original!

---

## 🎯 Benefits

### Before (External FFmpeg)
```
❌ User must install FFmpeg manually
❌ Different paths on each system
❌ Version conflicts
❌ Setup complexity
⚠️  "FFmpeg not found" errors
```

### After (Bundled FFmpeg)
```
✅ Works out of the box
✅ Consistent across all systems
✅ No version conflicts
✅ Zero setup for users
✅ Offline capable
```

---

## 🔧 Troubleshooting

### Problem: FFmpeg not downloading

**Solution 1: Manual download**
```bash
pnpm run download:ffmpeg
```

**Solution 2: Check internet connection**
- Script needs internet to download
- Try again with stable connection

**Solution 3: Download manually**
```bash
# Windows
# Download from: https://github.com/BtbN/FFmpeg-Builds/releases
# Extract ffmpeg.exe to resources/bin/

# macOS
brew install ffmpeg
cp $(which ffmpeg) resources/bin/

# Linux
sudo apt install ffmpeg
cp /usr/bin/ffmpeg resources/bin/
```

### Problem: Permission denied (macOS/Linux)

```bash
chmod +x resources/bin/ffmpeg
```

### Problem: Binary not working

```bash
# Re-download
rm -rf resources/bin/ffmpeg*
rm -rf .download-cache/
pnpm run download:ffmpeg
```

---

## 📚 Technical Details

### Download Sources

**Windows:**
- Source: [BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds)
- License: GPL
- Build: Static, full featured
- Size: ~130MB

**macOS:**
- Source: [evermeet.cx](https://evermeet.cx/ffmpeg/)
- License: GPL
- Build: Universal binary (Intel + Apple Silicon)
- Size: ~80MB

**Linux:**
- Source: [johnvansickle.com](https://johnvansickle.com/ffmpeg/)
- License: GPL
- Build: Static, portable
- Size: ~100MB

### License Compliance

FFmpeg is licensed under **GPL v2+**. Our app:
- ✅ Bundles GPL software (allowed)
- ✅ Discloses FFmpeg usage
- ✅ Provides source links
- ✅ Complies with distribution terms

---

## 🚀 Advanced Usage

### Custom FFmpeg Location

```typescript
// Force specific FFmpeg
process.env.FFMPEG_PATH = '/custom/path/to/ffmpeg';

// FFmpegHelper will use this first
const ffmpegPath = FFmpegHelper.getFFmpegPath();
```

### Check Before Use

```typescript
if (FFmpegHelper.isFFmpegAvailable()) {
  // FFmpeg ready
  const version = FFmpegHelper.getFFmpegVersion();
  console.log('Using FFmpeg:', version);
} else {
  // No FFmpeg found
  console.error('Please install FFmpeg');
}
```

### Reset Cache

```typescript
// Force re-detection
FFmpegHelper.resetCache();
const newPath = FFmpegHelper.getFFmpegPath();
```

---

## 📈 Impact on Build Size

### Combined with Phase 1+2 Optimizations

```
Original App:        250MB installer
- Phase 1:          -100MB (removed duplicates)
- Phase 2:           -40MB (lazy loading)
= After Phase 2:     110MB

+ Bundled FFmpeg:    +50MB
= Final Size:        160MB

Still 36% smaller than original! ✅
```

### Size Comparison

| Configuration | Installer Size | Notes |
|---------------|----------------|-------|
| Original (duplicate FFmpeg) | 250MB | ❌ Inefficient |
| Phase 1 (optimized) | 150MB | ✅ Good |
| Phase 2 (lazy load) | 110MB | ✅ Better |
| **Phase 2 + Bundled FFmpeg** | **160MB** | ✅ **Best UX** |

**Result:** 36% smaller + zero dependencies = WIN! 🎉

---

## ✅ Checklist

### For Developers

- [x] FFmpeg downloads automatically on install
- [x] Development works without global FFmpeg
- [x] Production build includes FFmpeg
- [x] Cross-platform compatible
- [x] Graceful fallbacks if missing

### For Users

- [x] No FFmpeg installation required
- [x] Works offline
- [x] Consistent experience
- [x] All video/audio features work
- [x] Zero configuration

---

## 🎉 Summary

### What Changed

**Before:**
```
pnpm install
pnpm run dev
❌ FFmpeg not found - install manually
```

**After:**
```
pnpm install            ← Auto-downloads FFmpeg
pnpm run dev            ← Everything works!
✅ FFmpeg ready: N-122390-gaf6a1dd0b2-20260108
```

### Production

**Before:**
```
DevTools App.exe (110MB)
❌ Requires user to install FFmpeg
⚠️  Video features may not work
```

**After:**
```
DevTools App.exe (160MB)
✅ FFmpeg included
✅ All features work out of the box
✅ Zero dependencies
```

---

## 📖 Related Documentation

- **Build Optimization**: `docs/BUILD_SIZE_OPTIMIZATION.md`
- **FFmpeg Fix**: `docs/FFMPEG_FIX.md`
- **Phase 2 Summary**: `docs/PHASE2_IMPLEMENTATION_SUMMARY.md`

---

**Date**: January 9, 2026  
**Status**: ✅ Complete and Production Ready  
**Maintained By**: DevTools Team
