# 🔧 DevTools App - Tools Classification

**Date**: January 13, 2026  
**Purpose**: Phân loại tools thành Core (giữ trong app) vs Plugins (chuyển thành plugins)

---

## 📊 Tổng Quan

```yaml
Total Tools: ~120+ tools
Core Tools (Keep): 38 tools (~15-20MB)
Plugin Tools (Migrate): 82+ tools (~180MB)

Core App Size: ~50MB (Electron + Core tools + Framework)
Plugins: 10-100MB each (optional install)
```

---

## ✅ CORE TOOLS (Giữ trong App)

### **Tiêu Chí Core Tools:**
```yaml
Criteria:
  ✅ Lightweight (< 500KB per tool)
  ✅ No heavy dependencies
  ✅ Pure JS/TS (no binaries)
  ✅ High usage frequency
  ✅ Fast load time (< 100ms)
  ✅ Essential developer tools
```

---

### **1. Text & Data Converters** (9 tools)

**Folder**: `src/tools/converters/`

```yaml
Core Tools:
  ✅ Base64FileConverter.tsx         # Base64 encode/decode
  ✅ ColorConverter.tsx               # RGB, HEX, HSL conversion
  ✅ DateConverter.tsx                # Timestamp, date format
  ✅ Converter.tsx                    # General converter

Rationale:
  - Size: < 100KB total
  - Dependencies: None
  - Usage: Very high
  - Performance: Instant
```

**Status**: ✅ **KEEP IN CORE**

---

### **2. Basic Crypto Tools** (5 tools)

**Folder**: `src/tools/crypto/`

```yaml
Core Tools:
  ✅ HashGenerator.tsx                # MD5, SHA-256, SHA-512
  ✅ UuidGenerator.tsx                # UUID v4, v5
  ✅ TokenGenerator.tsx               # Random tokens
  ✅ BearerTokenGenerator.tsx        # Bearer tokens
  ✅ HmacGenerator.tsx                # HMAC signing

Rationale:
  - Size: < 200KB total
  - Dependencies: Node crypto (built-in)
  - Usage: Very high
  - Performance: Fast
```

**Status**: ✅ **KEEP IN CORE**

---

### **3. Basic Web Tools** (10 tools)

**Folder**: `src/tools/web/`

```yaml
Core Tools:
  ✅ Base64UrlConverter.tsx          # Base64 URL encode/decode
  ✅ UrlParser.tsx                   # URL parsing
  ✅ JwtParser.tsx                   # JWT decode (no crypto)
  ✅ HttpStatusCode.tsx              # Status code reference
  ✅ MimeTypesList.tsx               # MIME types reference
  ✅ UserAgentParser.tsx             # UA string parsing
  ✅ CookieParser.tsx                # Cookie parsing
  ✅ KeycodeInfo.tsx                 # Keycode reference
  ✅ SlugGenerator.tsx               # URL slug generator
  ✅ UtmBuilder.tsx                  # UTM parameter builder

Rationale:
  - Size: < 300KB total
  - Dependencies: Minimal (ua-parser-js ~50KB)
  - Usage: High
  - Performance: Fast
```

**Status**: ✅ **KEEP IN CORE**

---

### **4. Developer Tools** (8 tools)

**Folder**: `src/tools/development/`

```yaml
Core Tools:
  ✅ RegexTester.tsx                 # Regex testing
  ✅ ChmodCalculator.tsx             # Unix permissions
  ✅ CrontabGenerator.tsx            # Cron expression
  ✅ UniversalFormatter.tsx          # Code formatter (basic)
  ✅ CodeSnippetGenerator.tsx        # Code snippets
  ✅ MockDataGenerator.tsx           # Mock data (basic)
  ✅ TemplateSelector.tsx            # Template manager
  ✅ DockerConverter.tsx             # Docker compose converter

Rationale:
  - Size: < 400KB total
  - Dependencies: Minimal
  - Usage: High for developers
  - Performance: Fast
```

**Status**: ✅ **KEEP IN CORE**

---

### **5. JSON Tools** (1 tool)

**Folder**: `src/tools/json/`

```yaml
Core Tools:
  ✅ JsonDiff.tsx                    # JSON diff & compare

Rationale:
  - Size: < 50KB
  - Dependencies: None (pure JS)
  - Usage: Very high
  - Performance: Instant
```

**Status**: ✅ **KEEP IN CORE**

---

### **6. Math & Calculators** (4 tools)

**Folder**: `src/tools/math/`

```yaml
Core Tools:
  ✅ MathEvaluator.tsx               # Math expression evaluator
  ✅ PercentageCalculator.tsx        # Percentage calc
  ✅ TemperatureConverter.tsx        # Temp conversion
  ✅ Chronometer.tsx                 # Timer/stopwatch

Rationale:
  - Size: < 100KB total
  - Dependencies: None
  - Usage: Medium-high
  - Performance: Instant
```

**Status**: ✅ **KEEP IN CORE**

---

### **7. Screenshot Tool** (1 tool - ESSENTIAL)

**Folder**: `src/tools/screenshot/`

```yaml
Core Tool:
  ✅ Screenshot Tool                 # Screen capture, annotation

Rationale:
  - Size: ~500KB (with annotations)
  - Dependencies: Electron API (built-in)
  - Usage: VERY HIGH (signature feature)
  - Performance: Fast
  - Essential: Core feature
```

**Status**: ✅ **KEEP IN CORE** (Signature feature)

---

## 🔌 PLUGIN TOOLS (Chuyển thành Plugins)

### **Tiêu Chí Plugin Tools:**
```yaml
Criteria:
  🔌 Heavy dependencies (binaries, large libs)
  🔌 Large size (> 5MB)
  🔌 Specialized use cases
  🔌 Not used by all users
  🔌 Optional features
  🔌 Longer load time
```

---

### **Plugin 1: Universal Media Downloader** 🎬

**Folder**: `src/tools/media/`

```yaml
Files to Migrate (41 files):
  🔌 UniversalDownloader.tsx
  🔌 YoutubeDownloader.tsx
  🔌 TiktokDownloader.tsx
  🔌 components/
      - DownloadProgress.tsx
      - FormatSelector.tsx
      - FormatsList.tsx
      - PlaylistView.tsx
      - ResumeDownloadsDialog.tsx
      - SearchBar.tsx
      - ShortcutsModal.tsx
      - TikTokFormatSelector.tsx
      - TikTokVideoInfo.tsx
      - UniversalFormatSelector.tsx
      - UniversalVideoInfo.tsx
      - VideoInfo.tsx
  🔌 utils/
      - platform-detector.ts
      - tiktok-helpers.ts
      - youtube-helpers.ts

Dependencies:
  - yt-dlp binary: ~50MB
  - Total plugin size: ~60MB

Rationale:
  - Heavy binary dependency (yt-dlp)
  - Specialized use case
  - Not all users need downloader
  - Large download size
  - Perfect candidate for plugin
```

**Plugin Info**:
```yaml
id: universal-downloader
name: Universal Media Downloader
version: 2.0.0
category: media
size: 65536000 (~62MB)
platforms: [win32, darwin, linux]
permissions:
  filesystem: true
  network: true
  shell: true
```

**Status**: 🔌 **MIGRATE TO PLUGIN** (High priority)

---

### **Plugin 2: Video Editor Suite** 🎥

**Folder**: `src/tools/media/`

```yaml
Files to Migrate:
  🔌 VideoStudio.tsx                 # Main video editor
  🔌 VideoTrimmer.tsx                # Video trimming
  🔌 VideoMerger.tsx                 # Video merging
  🔌 VideoFrames.tsx                 # Frame extraction
  🔌 AudioExtractor.tsx              # Audio extraction
  🔌 Camera.tsx                      # Camera recording
  🔌 VoiceRecorder.tsx               # Voice recording
  🔌 components/
      - CapCutTimeline.tsx
      - FrameEditor.tsx
      - FramesToVideo.tsx
      - GifCreator.tsx
      - ScreenRecorder.tsx
      - TimelineClipItem.tsx
      - TimelineEditor.tsx
      - TrimmingModal.tsx
      - VideoEffects.tsx
      - VideoToFrames.tsx
  🔌 hooks/
      - useTimelineHistory.ts
  🔌 utils/
      - imageAnalysis.ts
      - timelineUtils.ts

Dependencies:
  - FFmpeg binary: ~80MB
  - Total plugin size: ~100MB

Rationale:
  - VERY heavy binary (FFmpeg)
  - Specialized video editing
  - Not all users need video tools
  - Large download
  - Complex features
```

**Plugin Info**:
```yaml
id: video-editor
name: Video Editor Suite
version: 1.5.0
category: media
size: 104857600 (~100MB)
platforms: [win32, darwin, linux]
permissions:
  filesystem: true
  shell: true
```

**Status**: 🔌 **MIGRATE TO PLUGIN** (High priority)

---

### **Plugin 3: PDF Tools Suite** 📄

**Folder**: `src/tools/pdf/`

```yaml
Files to Migrate (16 files):
  🔌 PdfMerger.tsx                   # Merge PDFs
  🔌 PdfSplitter.tsx                 # Split PDFs
  🔌 PdfCompressor.tsx               # Compress PDFs
  🔌 PdfWatermarker.tsx              # Add watermarks
  🔌 PdfPageExtractor.tsx            # Extract pages
  🔌 PdfPageRotator.tsx              # Rotate pages
  🔌 PdfPageReorder.tsx              # Reorder pages
  🔌 PdfPageNumbering.tsx            # Add page numbers
  🔌 PdfMetadata.tsx                 # View metadata
  🔌 PdfMetadataRemover.tsx          # Remove metadata
  🔌 PdfValidator.tsx                # Validate PDF
  🔌 PdfBase64.tsx                   # PDF to Base64
  🔌 ImagesToPdfConverter.tsx        # Images to PDF
  🔌 HtmlToPdf.tsx                   # HTML to PDF
  🔌 MarkdownToPdf.tsx               # Markdown to PDF
  🔌 logic.ts

Dependencies:
  - pdf-lib: ~2MB
  - pdfjs-dist: ~3MB
  - jsPDF: ~500KB
  - html2canvas: ~500KB
  - Total plugin size: ~10MB

Rationale:
  - Multiple heavy libraries
  - Specialized PDF operations
  - Not essential for all users
  - Good plugin candidate
```

**Plugin Info**:
```yaml
id: pdf-tools
name: PDF Tools Suite
version: 1.2.0
category: document
size: 10485760 (~10MB)
platforms: [win32, darwin, linux]
permissions:
  filesystem: true
```

**Status**: 🔌 **MIGRATE TO PLUGIN** (High priority)

---

### **Plugin 4: Advanced Image Tools** 🖼️

**Folder**: `src/tools/image/`

```yaml
Files to Migrate:
  🔌 ImageConverter.tsx              # Image format conversion
  🔌 ImageMetadata.tsx               # EXIF data
  🔌 ImageToAscii.tsx                # ASCII art
  🔌 DataUriGenerator.tsx            # Data URI

Keep in Core:
  ✅ QrCodeGenerator.tsx             # QR code (lightweight)
  ✅ SvgPlaceholderGenerator.tsx     # SVG placeholder

Dependencies (if advanced):
  - Sharp/ImageMagick WASM: ~20MB
  - Total plugin size: ~25MB

Rationale:
  - Image conversion needs heavy libs
  - QR code is lightweight, keep in core
  - Advanced features = plugin
```

**Plugin Info**:
```yaml
id: image-tools
name: Advanced Image Tools
version: 1.0.0
category: media
size: 26214400 (~25MB)
platforms: [win32, darwin, linux]
permissions:
  filesystem: true
```

**Status**: 🔌 **MIGRATE TO PLUGIN** (Medium priority)

---

### **Plugin 5: Advanced Crypto Tools** 🔐

**Folder**: `src/tools/crypto/`

```yaml
Files to Migrate:
  🔌 AesEncryptor.tsx                # AES encryption
  🔌 SymmetricEncryptor.tsx          # Symmetric encryption
  🔌 RsaGenerator.tsx                # RSA key generation
  🔌 rsaLogic.ts                     # RSA logic
  🔌 BcryptGenerator.tsx             # Bcrypt hashing

Dependencies:
  - crypto-js: ~500KB
  - bcryptjs: ~300KB
  - node-forge: ~700KB
  - Total plugin size: ~3MB

Rationale:
  - Advanced crypto features
  - Not needed by most users
  - Basic hash/UUID in core is enough
```

**Plugin Info**:
```yaml
id: advanced-crypto
name: Advanced Crypto Tools
version: 1.0.0
category: security
size: 3145728 (~3MB)
platforms: [win32, darwin, linux]
permissions:
  none
```

**Status**: 🔌 **MIGRATE TO PLUGIN** (Low priority)

---

### **Plugin 6: System Utilities Suite** 💻

**Folder**: `src/tools/utilities/`

```yaml
Files to Migrate:
  🔌 ApplicationManager.tsx          # Manage installed apps
  🔌 ClipboardManager.tsx            # Advanced clipboard
  🔌 DeviceInfo.tsx                  # System information
  🔌 stats-monitor/                  # System stats monitoring
      - StatsMonitor.tsx
      - components/ (11 components)
      - hooks/
      - store/
  🔌 system-cleaner/                 # System cleaner
      - SystemCleaner.tsx
      - components/ (4 components)
      - hooks/
      - store/
      - utils/
      - views/ (13 views)

Dependencies:
  - systeminformation: ~5MB
  - node-powershell: ~2MB
  - Total plugin size: ~15MB

Rationale:
  - System-level operations
  - Heavy dependencies (systeminformation)
  - Specialized use case
  - Not essential for code tools
```

**Plugin Info**:
```yaml
id: system-utilities
name: System Utilities Suite
version: 1.0.0
category: utility
size: 15728640 (~15MB)
platforms: [win32, darwin, linux]
permissions:
  filesystem: true
  shell: true
```

**Status**: 🔌 **MIGRATE TO PLUGIN** (Medium priority)

---

### **Plugin 7: Advanced Web Tools** 🌐

**Folder**: `src/tools/web/`

```yaml
Files to Migrate:
  🔌 HtmlWysiwyg.tsx                 # WYSIWYG editor
  🔌 ManifestGenerator.tsx           # Web manifest
  🔌 ServiceWorkerGenerator.tsx      # Service worker
  🔌 SitemapGenerator.tsx            # Sitemap generator
  🔌 RobotsTxtGenerator.tsx          # Robots.txt
  🔌 MetaTagsGenerator.tsx           # Meta tags
  🔌 OpenGraphGenerator.tsx          # Open Graph tags
  🔌 StructuredDataGenerator.tsx     # Schema.org
  🔌 CspGenerator.tsx                # Content Security Policy
  🔌 CanonicalUrlGenerator.tsx       # Canonical URLs

Dependencies:
  - TinyMCE/Quill: ~5MB (WYSIWYG)
  - Total plugin size: ~8MB

Rationale:
  - Advanced web features
  - Heavy editor dependency
  - Specialized for web developers
```

**Plugin Info**:
```yaml
id: advanced-web-tools
name: Advanced Web Tools
version: 1.0.0
category: developer
size: 8388608 (~8MB)
platforms: [win32, darwin, linux]
permissions:
  filesystem: true
```

**Status**: 🔌 **MIGRATE TO PLUGIN** (Low priority)

---

### **Plugin 8: Network Tools** 🌐

**Folder**: `src/tools/network/`

```yaml
Files to Migrate:
  🔌 DownloadManager/ (4 files)      # Advanced download manager
  🔌 Ipv4Converter.tsx               # IP converter
  🔌 Ipv4SubnetCalculator.tsx        # Subnet calculator
  🔌 MacGenerator.tsx                # MAC address generator
  🔌 MacLookup.tsx                   # MAC vendor lookup

Dependencies:
  - ip: ~100KB
  - netmask: ~50KB
  - Total plugin size: ~2MB

Rationale:
  - Network-specific tools
  - Not needed by most users
  - Small but specialized
```

**Plugin Info**:
```yaml
id: network-tools
name: Network Tools
version: 1.0.0
category: network
size: 2097152 (~2MB)
platforms: [win32, darwin, linux]
permissions:
  network: true
```

**Status**: 🔌 **MIGRATE TO PLUGIN** (Low priority)

---

### **Plugin 9: Development Pipeline Tools** ⚙️

**Folder**: `src/tools/development/`

```yaml
Files to Migrate:
  🔌 PipelineDesigner.tsx            # CI/CD pipeline designer
  🔌 VisualPipelineDesigner.tsx      # Visual pipeline editor
  🔌 LogAnalyzer.tsx                 # Log analysis

Dependencies:
  - React Flow: ~2MB
  - Chart.js: ~500KB
  - Total plugin size: ~5MB

Rationale:
  - Specialized CI/CD tools
  - Heavy visualization libs
  - Not needed by most users
```

**Plugin Info**:
```yaml
id: pipeline-tools
name: Development Pipeline Tools
version: 1.0.0
category: developer
size: 5242880 (~5MB)
platforms: [win32, darwin, linux]
permissions:
  filesystem: true
```

**Status**: 🔌 **MIGRATE TO PLUGIN** (Low priority)

---

### **Plugin 10: Security Tools** 🔒

**Folder**: `src/tools/security/`

```yaml
Files to Migrate (6 files):
  🔌 All security tools               # Advanced security features

Dependencies:
  - Various crypto libs: ~5MB
  - Total plugin size: ~8MB

Rationale:
  - Advanced security features
  - Not essential for all users
  - Basic crypto in core is enough
```

**Plugin Info**:
```yaml
id: security-tools
name: Advanced Security Tools
version: 1.0.0
category: security
size: 8388608 (~8MB)
platforms: [win32, darwin, linux]
permissions:
  filesystem: true
```

**Status**: 🔌 **MIGRATE TO PLUGIN** (Low priority)

---

### **Plugin 11: Data Converters** 🔄

**Folder**: `src/tools/converters/`

```yaml
Files to Migrate:
  🔌 CsvExcelConverter.tsx           # CSV/Excel conversion

Dependencies:
  - xlsx: ~5MB
  - Total plugin size: ~7MB

Rationale:
  - Heavy Excel library
  - Specialized data conversion
  - Not needed by all users
```

**Plugin Info**:
```yaml
id: data-converters
name: Data Converters
version: 1.0.0
category: utility
size: 7340032 (~7MB)
platforms: [win32, darwin, linux]
permissions:
  filesystem: true
```

**Status**: 🔌 **MIGRATE TO PLUGIN** (Low priority)

---

## 📊 Summary Table

### Core Tools (Keep in App)

| Category | Tools Count | Total Size | Dependencies |
|----------|-------------|------------|--------------|
| Text & Data | 4 | ~100KB | None |
| Basic Crypto | 5 | ~200KB | Node crypto (built-in) |
| Web Tools | 10 | ~300KB | Minimal |
| Developer | 8 | ~400KB | Minimal |
| JSON | 1 | ~50KB | None |
| Math | 4 | ~100KB | None |
| Screenshot | 1 | ~500KB | Electron API |
| **TOTAL** | **38** | **~1.65MB** | **Lightweight** |

**Core App Total**: ~50MB (38 tools + Electron + Framework)

---

### Plugin Tools (Migrate)

| Plugin | Category | Size | Priority | Dependencies |
|--------|----------|------|----------|--------------|
| Universal Downloader | Media | 62MB | 🔴 High | yt-dlp |
| Video Editor Suite | Media | 100MB | 🔴 High | FFmpeg |
| PDF Tools Suite | Document | 10MB | 🔴 High | pdf-lib, pdfjs |
| Advanced Image Tools | Media | 25MB | 🟡 Medium | ImageMagick WASM |
| System Utilities | Utility | 15MB | 🟡 Medium | systeminformation |
| Advanced Crypto | Security | 3MB | 🟢 Low | crypto-js, bcrypt |
| Advanced Web Tools | Developer | 8MB | 🟢 Low | TinyMCE |
| Network Tools | Network | 2MB | 🟢 Low | ip, netmask |
| Pipeline Tools | Developer | 5MB | 🟢 Low | React Flow |
| Security Tools | Security | 8MB | 🟢 Low | Various |
| Data Converters | Utility | 7MB | 🟢 Low | xlsx |
| **TOTAL** | | **~245MB** | | **Heavy** |

---

## 🎯 Migration Priority

### **Phase 1: High Priority** (Week 5-6)

```yaml
Must Migrate First:
  1. 🔴 Universal Downloader (62MB, yt-dlp dependency)
  2. 🔴 Video Editor Suite (100MB, FFmpeg dependency)
  3. 🔴 PDF Tools Suite (10MB, multiple PDF libs)

Reason: Largest size reduction, most specialized
Estimated Size Reduction: -172MB
```

### **Phase 2: Medium Priority** (Week 7-8)

```yaml
Should Migrate Next:
  4. 🟡 Advanced Image Tools (25MB, ImageMagick)
  5. 🟡 System Utilities (15MB, systeminformation)

Reason: Good size reduction, specialized use case
Estimated Size Reduction: -40MB
```

### **Phase 3: Low Priority** (Future)

```yaml
Can Migrate Later:
  6-11. 🟢 All remaining plugins (38MB total)

Reason: Small individual impact, can batch migrate
Estimated Size Reduction: -38MB
```

---

## 📈 Expected Impact

### Before Migration

```yaml
App Size: ~200MB
  ├─ Electron + Framework: ~50MB
  ├─ Core Tools: ~1.65MB
  ├─ Plugin Tools (all bundled): ~245MB
  └─ Other: ~5MB

Startup Time: 3-5 seconds (loading all tools)
Memory Usage: ~300MB (all features loaded)
User Choice: None (all or nothing)
```

### After Migration (Core Only)

```yaml
App Size: ~52MB
  ├─ Electron + Framework: ~50MB
  ├─ Core Tools: ~1.65MB
  └─ Other: ~500KB

Startup Time: 1-2 seconds (core only)
Memory Usage: ~150MB (core only)
User Choice: Full flexibility
```

### After Migration (Core + Typical User)

```yaml
Typical User Installs:
  ✅ Core App: 52MB
  ✅ Universal Downloader Plugin: 62MB
  ✅ PDF Tools Plugin: 10MB
  
Total: ~124MB (vs 200MB monolithic)
Savings: 76MB (-38%)
```

### After Migration (Power User)

```yaml
Power User Installs:
  ✅ Core App: 52MB
  ✅ Universal Downloader: 62MB
  ✅ Video Editor: 100MB
  ✅ PDF Tools: 10MB
  ✅ Image Tools: 25MB
  
Total: ~249MB (slightly more than monolithic)
BUT: Better performance, individual updates, modular
```

---

## ✅ Checklist

### Planning Phase ✅

- [x] Analyze all tools
- [x] Classify Core vs Plugin
- [x] Prioritize migration order
- [x] Document decisions

### Implementation Phase 🔵

- [ ] Phase 1: Migrate high-priority plugins
  - [ ] Universal Downloader → Plugin
  - [ ] Video Editor → Plugin
  - [ ] PDF Tools → Plugin
- [ ] Phase 2: Migrate medium-priority plugins
  - [ ] Image Tools → Plugin
  - [ ] System Utilities → Plugin
- [ ] Phase 3: Migrate low-priority plugins
  - [ ] All remaining → Plugins

### Testing Phase ⏸️

- [ ] Test core app (38 tools)
- [ ] Test each plugin installation
- [ ] Verify size reduction
- [ ] Performance benchmarks

---

## 🎯 Next Steps

1. **Review this classification** - Xác nhận phân loại đúng
2. **Start with Phase 1** - Migrate 3 high-priority plugins
3. **Test thoroughly** - Đảm bảo core app hoạt động tốt
4. **Deploy gradually** - Beta → Production

---

## 📝 Notes

- **Core Tools** = Essential, lightweight, no heavy deps
- **Plugin Tools** = Optional, specialized, heavy deps
- **Migration** = Move to separate plugin packages
- **Goal** = 50MB core app, user choice for extras

---

**Last Updated**: January 13, 2026  
**Maintained by**: DevTools Team  
**Status**: 🟢 Classification Complete, Ready for Implementation
