# 🎯 Build Size Optimization Guide

## 📊 Current Build Analysis

### Build Targets
- ✅ Windows x64
- ✅ Windows ia32 (32-bit)
- ✅ macOS x64
- ✅ macOS arm64
- ✅ Linux AppImage
- ✅ Linux deb

### Main Size Contributors

#### 1. **Electron Runtime** (~150-200MB)
- Chromium engine
- Node.js runtime
- System libraries

#### 2. **FFmpeg Binaries** (~80-100MB)
```json
"@ffmpeg-installer/ffmpeg": "^1.1.0",
"ffmpeg-static": "^5.3.0",
```
❌ **Problem**: DUPLICATE FFmpeg packages!

#### 3. **Heavy Dependencies** (~50-80MB)
```json
"tesseract.js": "^7.0.0",      // ~30MB (OCR models)
"fabric": "^7.1.0",            // ~15MB (Canvas library)
"aria2": "^5.0.0",             // ~10MB (Downloader)
"framer-motion": "^12.23.26",  // ~5MB
"@uiw/react-codemirror": "^4.23.9", // ~10MB
```

#### 4. **Node Modules**
- Total: ~500-800MB uncompressed
- After asar: ~100-150MB

---

## 🎯 Optimization Strategies

### ✅ **Quick Wins** (Immediate, No Risk)

#### 1. Remove Duplicate FFmpeg ⚡ **Saves ~80MB**
```json
// Choose ONE:
Option A: Keep ffmpeg-static (recommended)
Option B: Keep @ffmpeg-installer/ffmpeg

// Remove the other one
```

**Action:**
```bash
pnpm remove @ffmpeg-installer/ffmpeg
# OR
pnpm remove ffmpeg-static
```

#### 2. Build Only x64 (Skip 32-bit) ⚡ **Saves ~50% installer size**

**Before:**
```yaml
win:
  target:
    - target: nsis
      arch:
        - x64
        - ia32  # ❌ Remove this
```

**After:**
```yaml
win:
  target:
    - target: nsis
      arch:
        - x64  # ✅ Only x64
```

**Rationale:**
- 32-bit Windows is < 1% market share in 2026
- Most dev tools target x64 only
- Saves build time and storage

#### 3. Enable Compression ⚡ **Saves ~30-40%**

Add to `electron-builder.yml`:
```yaml
# Compression settings
compression: maximum  # or 'normal' for faster builds

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  # ... existing config
  differentialPackage: true  # Smaller updates
  
# Use asar archive
asar: true
asarUnpack:
  - "**/*.node"  # Native modules must be unpacked
  - "**/ffmpeg*" # FFmpeg binary
```

#### 4. Exclude Dev Files ⚡ **Saves ~5-10MB**

Update `electron-builder.yml`:
```yaml
files:
  - "dist/**/*"
  - "dist-electron/**/*"
  - "package.json"
  # Exclude more dev files
  - "!**/*.{ts,tsx,jsx,map,md}"
  - "!**/.{git,github,vscode,idea}"
  - "!**/node_modules/*/{test,tests,*.test.*,*.spec.*}"
  - "!**/node_modules/*/{README,LICENSE,CHANGELOG}*"
  - "!**/node_modules/*/*.{md,markdown,txt}"
  - "!node_modules/**/*"
  - "!src/**/*"
  - "!electron/**/*"
  - "!docs/**/*"
  - "!debug_scripts/**/*"
  - "!video/**/*"
  - "!*.{md,yml,yaml}"
  - "!*.json"
  - "package.json"
```

#### 5. Optimize Vite Build ⚡ **Saves ~10-20%**

Already good, but can improve:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser', // Switch from esbuild to terser
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug']
      }
    },
    cssMinify: true,
    reportCompressedSize: false, // Faster builds
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      // ... existing config
    }
  }
})
```

---

### 🔥 **Medium Effort** (Requires Code Changes)

#### 6. Lazy Load Heavy Dependencies ⚡ **Saves runtime memory**

**Tesseract.js** (OCR):
```typescript
// Instead of:
import Tesseract from 'tesseract.js';

// Use:
const loadTesseract = async () => {
  const { createWorker } = await import('tesseract.js');
  return createWorker();
};
```

**Fabric** (Canvas):
```typescript
// Instead of:
import { Canvas } from 'fabric';

// Use:
const loadFabric = async () => {
  const fabric = await import('fabric');
  return fabric.Canvas;
};
```

#### 7. Replace Heavy Libraries

**a) Replace `fabric` with lighter alternative**
```bash
# fabric: ~15MB
pnpm remove fabric

# Option 1: Use native Canvas API
# Option 2: Use lightweight library
pnpm add konva
```

**b) Replace `aria2` if not critical**
```bash
# If only using for downloads, use native fetch/axios
pnpm remove aria2
```

**c) Code Splitting for CodeMirror**
```typescript
// Load language packs on demand
const loadPythonMode = () => import('@codemirror/lang-python');
const loadJSMode = () => import('@codemirror/lang-javascript');
```

#### 8. Use CDN for Large Libraries (Web version)
```html
<!-- For web version, load from CDN -->
<script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/build/pdf.min.js"></script>
```

---

### 💪 **Advanced** (Major Changes)

#### 9. Split into Multiple Apps

**Core App** (lightweight, ~80-100MB):
- Basic tools
- Text utilities
- Converters

**Media Pack** (optional plugin):
- FFmpeg tools
- Video processing
- Screenshot editor

**Developer Pack** (optional plugin):
- Code formatters
- API testing
- JWT tools

#### 10. Download Binaries on Demand
```typescript
// Don't bundle FFmpeg, download on first use
async function ensureFFmpeg() {
  if (!hasFFmpeg()) {
    await downloadFFmpeg();
  }
}
```

#### 11. Use Native APIs Instead of Libraries

**Replace bcryptjs** with native crypto:
```typescript
// Instead of bcryptjs (~1MB)
import { scrypt, randomBytes } from 'crypto';
```

**Replace moment/date-fns** with native Intl:
```typescript
// Native date formatting (0 bytes)
new Intl.DateTimeFormat('en-US').format(date);
```

---

## 📝 **Recommended Action Plan**

### Phase 1: Quick Wins (10 minutes)
```bash
# 1. Remove duplicate FFmpeg
pnpm remove @ffmpeg-installer/ffmpeg

# 2. Update electron-builder.yml
#    - Remove ia32 arch
#    - Add compression: maximum
#    - Add asar: true

# 3. Rebuild
pnpm run build:win
```

**Expected savings: ~100-150MB (40-50%)**

---

### Phase 2: Medium Effort (1-2 hours)
```bash
# 1. Lazy load heavy libs
#    - Tesseract
#    - Fabric
#    - CodeMirror languages

# 2. Update vite.config.ts
#    - Switch to terser
#    - Drop console.log

# 3. Clean up unused dependencies
pnpm ls --depth=0 # Check what's used
```

**Expected savings: Additional 20-50MB**

---

### Phase 3: Advanced (1+ week)
- Split into multiple apps/plugins
- Download binaries on demand
- Replace heavy libraries

**Expected savings: 50-70% total reduction**

---

## 🎯 **Optimal Configuration**

### `electron-builder.yml`
```yaml
appId: com.devtools.app
productName: DevTools App
copyright: Copyright © 2026 DevTools App

# Compression
compression: maximum
asar: true
asarUnpack:
  - "**/*.node"
  - "**/ffmpeg*"

directories:
  output: dist-electron/pack
  buildResources: build

files:
  - "dist/**/*"
  - "dist-electron/**/*"
  - "package.json"
  # Comprehensive exclusions
  - "!**/*.{ts,tsx,jsx,map,md}"
  - "!**/.{git,github,vscode,idea}"
  - "!**/node_modules/*/{test,tests,*.test.*,*.spec.*}"
  - "!**/node_modules/*/{README,LICENSE,CHANGELOG}*"
  - "!**/node_modules/*/*.{md,markdown,txt}"
  - "!**/node_modules/**/{example,examples,demo,demos,doc,docs}"
  - "!node_modules/**/*"
  - "!src/**/*"
  - "!electron/**/*"
  - "!docs/**/*"
  - "!debug_scripts/**/*"
  - "!video/**/*"
  - "!build/**/*"
  - "!*.{md,yml,yaml,log}"
  - "!*.json"
  - "!tmpfs*"
  - "!dummy"
  - "package.json"

# Windows Configuration
win:
  target:
    - target: nsis
      arch:
        - x64  # Only x64, no ia32
  icon: public/icon.png
  artifactName: ${productName}-${version}-${arch}.${ext}
  requestedExecutionLevel: asInvoker
  signAndEditExecutable: false

# NSIS Installer
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  allowElevation: true
  createDesktopShortcut: always
  createStartMenuShortcut: true
  shortcutName: DevTools App
  deleteAppDataOnUninstall: false
  differentialPackage: true  # Smaller updates
  include: build/installer.nsh

# macOS Configuration
mac:
  target:
    - target: dmg
      arch:
        - universal  # Universal binary instead of separate x64/arm64
  icon: public/icon.png
  category: public.app-category.developer-tools
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  artifactName: ${productName}-${version}.${ext}

# Linux Configuration
linux:
  target:
    - AppImage  # Most compatible
  icon: public/icon.png
  category: Development
  synopsis: Developer Tools Application
  description: A comprehensive developer tools application
```

### `package.json` Cleanup
```json
{
  "dependencies": {
    // ✅ KEEP (essential)
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.11.0",
    "zustand": "^5.0.9",
    "electron-store": "^10.0.0",
    "lucide-react": "^0.562.0",
    "sonner": "^2.0.7",
    
    // ✅ KEEP ONE FFmpeg
    "ffmpeg-static": "^5.3.0",
    // ❌ REMOVE
    // "@ffmpeg-installer/ffmpeg": "^1.1.0",
    
    // ⚠️ CONSIDER ALTERNATIVES
    "tesseract.js": "^7.0.0",  // Lazy load or make optional
    "fabric": "^7.1.0",        // Replace with konva or native canvas
    "aria2": "^5.0.0",         // Use native downloader
    
    // ✅ KEEP (reasonable size)
    "@uiw/react-codemirror": "^4.23.9",
    "pdf-lib": "^1.17.1",
    "date-fns": "^4.1.0",
    "crypto-js": "^4.2.0",
    "jszip": "^3.10.1",
    "marked": "^17.0.1",
    "systeminformation": "^5.29.0",
    "yt-dlp-wrap": "^2.3.12"
  }
}
```

### `vite.config.ts` Optimized
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@tools': path.resolve(__dirname, './src/tools'),
      '@store': path.resolve(__dirname, './src/store'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  plugins: [
    react(),
    electron([
      {
        entry: 'electron/main/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: [
                'electron',
                'systeminformation',
                'electron-store',
                'yt-dlp-wrap',
                'ffmpeg-static',
              ],
            },
          },
        },
      },
      {
        entry: 'electron/preload/preload.ts',
        onstart: false,
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
    ]),
  ],
  build: {
    target: 'esnext',
    minify: 'terser', // Better compression than esbuild
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info']
      },
      format: {
        comments: false, // Remove all comments
      }
    },
    cssMinify: true,
    reportCompressedSize: false, // Faster builds
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core framework
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-core';
          }
          if (id.includes('react-router-dom')) {
            return 'react-router';
          }
          
          // UI libraries
          if (id.includes('framer-motion')) {
            return 'framer-motion';
          }
          if (id.includes('lucide-react')) {
            return 'lucide';
          }
          
          // Code editor (lazy load)
          if (id.includes('@uiw/react-codemirror') || id.includes('@codemirror/view')) {
            return 'editor-core';
          }
          if (id.includes('@codemirror/lang-')) {
            return 'editor-langs';
          }
          
          // Heavy libraries (lazy load)
          if (id.includes('fabric')) {
            return 'fabric';
          }
          if (id.includes('tesseract')) {
            return 'tesseract';
          }
          
          // Utilities
          if (id.includes('crypto-js') || id.includes('bcryptjs')) {
            return 'crypto';
          }
          if (id.includes('pdf-lib') || id.includes('jspdf')) {
            return 'pdf';
          }
          if (id.includes('jszip')) {
            return 'jszip';
          }
          
          // Parsers
          if (id.includes('js-yaml') || id.includes('fast-xml-parser') || 
              id.includes('papaparse') || id.includes('marked')) {
            return 'parsers';
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'lucide-react',
      'sonner',
    ],
    exclude: [
      'tesseract.js', // Lazy load
      'fabric',       // Lazy load
    ]
  },
});
```

---

## 📈 **Expected Results**

### Before Optimization
- **Installer**: ~250-350MB
- **Installed Size**: ~500-700MB
- **app.asar**: ~150-200MB

### After Phase 1 (Quick Wins)
- **Installer**: ~150-200MB ⬇️ **40%**
- **Installed Size**: ~300-400MB ⬇️ **40%**
- **app.asar**: ~80-120MB ⬇️ **40%**

### After Phase 2 (Medium Effort)
- **Installer**: ~100-150MB ⬇️ **50-60%**
- **Installed Size**: ~200-300MB ⬇️ **50-60%**
- **app.asar**: ~50-80MB ⬇️ **60%**

### After Phase 3 (Advanced)
- **Installer**: ~60-100MB ⬇️ **70%**
- **Installed Size**: ~150-200MB ⬇️ **70%**
- **app.asar**: ~30-50MB ⬇️ **75%**

---

## 🚀 **Implementation Steps**

### Step 1: Backup
```bash
git add .
git commit -m "Before size optimization"
git tag v-before-optimization
```

### Step 2: Remove Duplicate FFmpeg
```bash
pnpm remove @ffmpeg-installer/ffmpeg
```

Check if anything breaks:
```bash
pnpm run dev
# Test video/audio tools
```

### Step 3: Update electron-builder.yml
```bash
# Copy optimal config from above
code electron-builder.yml
```

### Step 4: Update vite.config.ts
```bash
# Add terser, drop console, optimize chunks
code vite.config.ts
```

### Step 5: Test Build
```bash
# Clean build
rm -rf dist dist-electron node_modules/.vite

# Fresh build
pnpm run build:win
```

### Step 6: Measure Results
```bash
# Check installer size
ls -lh dist-electron/pack/*.exe

# Check unpacked size
du -sh dist-electron/pack/win-unpacked

# Check app.asar size
ls -lh dist-electron/pack/win-unpacked/resources/app.asar
```

### Step 7: Test Functionality
```bash
# Install and run the built app
# Test all major features:
# - YouTube downloader
# - Screenshot tool
# - Code formatters
# - PDF tools
# - Crypto tools
```

---

## 🔍 **Monitoring Build Size**

### Add to package.json
```json
{
  "scripts": {
    "build:analyze": "npm run build && source-map-explorer dist/assets/js/*.js",
    "build:size": "npm run build && du -sh dist dist-electron/pack",
    "build:win": "npm run build && electron-builder --win && npm run report:size"
  }
}
```

### Install analyzer
```bash
pnpm add -D source-map-explorer
pnpm add -D webpack-bundle-analyzer
```

---

## 💡 **Pro Tips**

1. **Use differential updates**: Users only download changed files
2. **Separate portable version**: Offer 7z archive for power users
3. **Cloud-based heavy processing**: Offload OCR/video to server
4. **Progressive download**: Download optional features when needed
5. **Compression formats**: Use 7z for better compression than zip

---

## ✅ **Checklist**

- [ ] Remove duplicate FFmpeg
- [ ] Remove ia32 build target
- [ ] Enable maximum compression
- [ ] Enable asar packaging
- [ ] Exclude dev files
- [ ] Switch to terser minification
- [ ] Drop console.log in production
- [ ] Lazy load heavy dependencies
- [ ] Consider library replacements
- [ ] Test all features after optimization
- [ ] Document size improvements

---

## 📚 **Resources**

- [Electron Builder Optimization](https://www.electron.build/configuration/configuration#configuration)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Bundle Size Analysis](https://github.com/webpack-contrib/webpack-bundle-analyzer)
- [Electron App Size Guide](https://electronjs.org/docs/tutorial/application-distribution)

---

**Last Updated**: January 9, 2026  
**Maintained By**: DevTools Team
