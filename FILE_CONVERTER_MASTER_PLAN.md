# VERT.sh-Inspired File Converter - Master Implementation Plan
## Building a Privacy-First, WebAssembly-Powered Conversion Tool

---

## 📋 Mục Lục / Table of Contents
1. [Tổng Quan Dự Án](#tổng-quan-dự-án)
2. [Kiến Trúc Kỹ Thuật](#kiến-trúc-kỹ-thuật)
3. [Technology Stack Chi Tiết](#technology-stack-chi-tiết)
4. [Các Tính Năng Chính](#các-tính-năng-chính)
5. [WebAssembly Integration](#webassembly-integration)
6. [Lộ Trình Triển Khai](#lộ-trình-triển-khai)
7. [Chi Tiết Từng Component](#chi-tiết-từng-component)
8. [Bảo Mật và Privacy](#bảo-mật-và-privacy)
9. [Performance Optimization](#performance-optimization)
10. [Testing và Deployment](#testing-và-deployment)

---

## 🎯 Tổng Quan Dự Án

### Vision
Xây dựng công cụ chuyển đổi file mã nguồn mở, xử lý hoàn toàn local qua WebAssembly, không quảng cáo, không giới hạn file, và tôn trọng privacy tuyệt đối.

### Core Values
- **Privacy-First**: Zero-knowledge processing, không tracking
- **Open Source**: Minh bạch, có thể tự host
- **No Limits**: Không giới hạn file size, unlimited conversions
- **Fast**: Tận dụng WASM để đạt performance gần native
- **User Control**: Full control về metadata, settings, themes

### Target Users
- Privacy-conscious users
- Content creators và designers
- Developers cần tools chuyển đổi
- Organizations cần self-hosted solution
- Anyone muốn tránh upload files lên cloud

---

## 🏗️ Kiến Trúc Kỹ Thuật

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Browser)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Svelte UI Components + TypeScript              │ │
│  └────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│  ┌────────────────┴───────────────────────────────────────┐ │
│  │              Conversion Orchestrator                   │ │
│  │  - File Detection                                      │ │
│  │  - Route to WASM or Server                            │ │
│  │  - Progress Tracking                                   │ │
│  └────────────┬──────────────────────────┬────────────────┘ │
│               │                          │                   │
│  ┌────────────┴────────────┐  ┌──────────┴─────────────┐   │
│  │   WASM Converters       │  │   Server API Client    │   │
│  │  ┌──────────────────┐   │  │  (Video only)          │   │
│  │  │ FFmpeg.wasm      │   │  └────────────────────────┘   │
│  │  │ (Audio)          │   │                                │
│  │  └──────────────────┘   │                                │
│  │  ┌──────────────────┐   │                                │
│  │  │ ImageMagick.wasm │   │                                │
│  │  │ or libvips.wasm  │   │                                │
│  │  └──────────────────┘   │                                │
│  │  ┌──────────────────┐   │                                │
│  │  │ Pandoc.wasm      │   │                                │
│  │  │ (Documents)      │   │                                │
│  │  └──────────────────┘   │                                │
│  └─────────────────────────┘                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (Video only)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Optional: vertd Server (Rust)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Actix-web Server + FFmpeg Native                      │ │
│  │  - Handle video uploads                                │ │
│  │  - GPU-accelerated conversion (NVENC/CUDA)            │ │
│  │  - Temporary file cleanup                              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Two-Component Design

#### Component 1: VERT Core (Frontend WASM)
**Purpose**: Xử lý 100% local cho images, audio, documents

**Advantages**:
- ✅ Zero server dependency
- ✅ Instant processing (no network)
- ✅ Complete privacy
- ✅ Works offline
- ✅ No upload limits

**Limitations**:
- ⚠️ Memory constraints (typically ~2GB)
- ⚠️ Slower than native for large files
- ⚠️ Browser compatibility required

#### Component 2: vertd Server (Optional)
**Purpose**: Video conversion với hardware acceleration

**Advantages**:
- ✅ GPU acceleration (NVENC, CUDA)
- ✅ Handle large video files
- ✅ Faster for complex video ops
- ✅ Self-hostable

**Limitations**:
- ⚠️ Requires server infrastructure
- ⚠️ Upload/download time
- ⚠️ Privacy concerns (unless self-hosted)

---

## 💻 Technology Stack Chi Tiết

### Frontend Stack

```yaml
Core Framework:
  - Svelte 4/5: ~50% codebase
    * Reactive components
    * Small bundle size
    * Great performance
  
  - TypeScript: ~42% codebase
    * Type safety
    * Better DX
    * Auto-completion

Build Tools:
  - Vite: Ultra-fast dev server và build
  - SvelteKit: SSR/SSG framework (optional)
  - PNPM/NPM: Package management

UI/Styling:
  - TailwindCSS: Utility-first CSS
  - DaisyUI/Skeleton UI: Component library
  - Svelte Transitions: Smooth animations

State Management:
  - Svelte Stores: Built-in reactivity
  - LocalStorage: Settings persistence
  - IndexedDB: Cache converted files
```

### WebAssembly Libraries

```yaml
Image Processing:
  Primary: ImageMagick WASM
    - Supports 200+ formats
    - Advanced operations
    - Package: @imagemagick/magick-wasm
  
  Alternative: libvips WASM
    - Faster for large images
    - Memory efficient
    - Better for batch processing

Audio Processing:
  Primary: FFmpeg.wasm
    - Universal audio support
    - Format: MP3, WAV, FLAC, AAC, OGG, etc.
    - Package: @ffmpeg/ffmpeg
    - Features:
      * Bitrate control
      * Sample rate conversion
      * Channel mixing
      * Audio filtering

Document Conversion:
  Primary: Pandoc WASM
    - Markdown, HTML, PDF, DOCX, etc.
    - Package: pandoc-wasm (custom build)
  
  Alternative: PDF.js + jsPDF
    - PDF manipulation
    - Canvas-based rendering

Archive Handling:
  - libzip.js: ZIP files
  - 7z-wasm: 7z, RAR support
  - tar.js: TAR archives
```

### Backend Stack (vertd Server)

```yaml
Language: Rust (92.7%)
  - High performance
  - Memory safety
  - Concurrent processing

Web Framework:
  - Actix-web: Fast, async HTTP server
  - Tower: Middleware
  - Tokio: Async runtime

Video Processing:
  - FFmpeg: Native binary
  - Hardware Acceleration:
    * NVENC (NVIDIA)
    * QuickSync (Intel)
    * VAAPI (Linux)
  
Dependencies:
  - tokio: Async runtime
  - serde: Serialization
  - sqlx: Database (optional)
  - tracing: Logging
```

### File Format Support Matrix

| Category | Formats | Processing |
|----------|---------|------------|
| **Images** | PNG, JPG, WEBP, GIF, BMP, TIFF, SVG, AVIF, HEIC, RAW formats | WASM (ImageMagick) |
| **Audio** | MP3, WAV, FLAC, AAC, OGG, OPUS, M4A, WMA | WASM (FFmpeg) |
| **Video** | MP4, AVI, MKV, MOV, WEBM, FLV, MPEG | Server (FFmpeg + GPU) |
| **Documents** | PDF, DOCX, MD, HTML, EPUB, TXT, RTF, ODT | WASM (Pandoc) |
| **Archives** | ZIP, 7Z, TAR, GZ, RAR | WASM (libzip/7z-wasm) |
| **Fonts** | TTF, OTF, WOFF, WOFF2 | WASM (fonttools) |

---

## 🚀 Các Tính Năng Chính

### Phase 1: Core Features (Essential)

#### 1.1 File Upload & Detection
- [ ] **Drag & Drop Interface**
  - Multiple files support
  - Folder upload
  - Visual feedback
  
- [ ] **File Type Detection**
  - MIME type checking
  - Magic number verification
  - Extension validation
  
- [ ] **Smart Routing**
  ```typescript
  function routeConversion(file: File): 'wasm' | 'server' {
    if (isVideo(file)) return 'server';
    if (file.size > WASM_SIZE_LIMIT) return 'server';
    return 'wasm';
  }
  ```

#### 1.2 WASM Image Converter
- [ ] **Format Support**
  - Input: PNG, JPG, WEBP, GIF, BMP, TIFF, SVG, AVIF, HEIC
  - Output: All above + optimized variants
  
- [ ] **Quality Controls**
  - Quality slider (1-100%)
  - Compression level
  - Preserve/remove metadata
  
- [ ] **Advanced Options**
  - Resize/crop
  - Rotate/flip
  - Color adjustments
  - Format-specific settings

#### 1.3 WASM Audio Converter
- [ ] **Format Support**
  - Input: MP3, WAV, FLAC, AAC, OGG, M4A
  - Output: All above formats
  
- [ ] **Quality Settings**
  - Bitrate selection (64-320 kbps)
  - Sample rate (22050-48000 Hz)
  - Channel config (mono/stereo)
  
- [ ] **Audio Processing**
  - Volume normalization
  - Trim/cut
  - Fade in/out
  - Basic filters

#### 1.4 Document Converter (WASM)
- [ ] **Format Support**
  - Markdown ↔ HTML ↔ PDF ↔ DOCX
  - EPUB, TXT, RTF
  
- [ ] **Options**
  - Template selection
  - CSS styling
  - TOC generation
  - Syntax highlighting (for code)

#### 1.5 Progress & Status
- [ ] **Real-time Progress**
  - Percentage complete
  - ETA calculation
  - Speed indicator
  
- [ ] **Batch Progress**
  - Overall progress
  - Individual file status
  - Failed file handling
  
- [ ] **Notifications**
  - Browser notifications
  - Sound alerts (optional)
  - Desktop integration

### Phase 2: Advanced Features

#### 2.1 Batch Processing
- [ ] **Multiple Files**
  - Process 10-100+ files simultaneously
  - Queue management
  - Priority settings
  
- [ ] **Batch Settings**
  - Apply same settings to all
  - Per-file customization
  - Profile templates

#### 2.2 Metadata Management
- [ ] **EXIF Data**
  - View metadata
  - Remove privacy data
  - Edit fields
  - Bulk operations
  
- [ ] **Privacy Controls**
  - Strip GPS location
  - Remove camera info
  - Clear timestamps
  - Anonymize author

#### 2.3 Advanced Processing
- [ ] **Image Operations**
  - Watermarking
  - Batch resize
  - Format optimization
  - Color profile conversion
  
- [ ] **Audio Operations**
  - Merge audio files
  - Extract audio from video
  - Audio effects
  - Spectral analysis

#### 2.4 Presets & Templates
- [ ] **Conversion Presets**
  - Web optimized
  - Print quality
  - Mobile friendly
  - Archive quality
  
- [ ] **Custom Presets**
  - Save user settings
  - Import/export presets
  - Preset library
  - Quick apply

### Phase 3: Premium Features

#### 3.1 Video Converter (Server)
- [ ] **Format Support**
  - MP4, MKV, AVI, MOV, WEBM
  - H.264, H.265/HEVC, VP9, AV1
  
- [ ] **GPU Acceleration**
  - NVENC (NVIDIA)
  - QuickSync (Intel)
  - AMF (AMD)
  
- [ ] **Settings**
  - Resolution/bitrate
  - Codec selection
  - Hardware encoder
  - Two-pass encoding

#### 3.2 Advanced UI Features
- [ ] **Theme System**
  - Light/dark mode
  - Custom themes
  - Accent colors
  - Animation preferences
  
- [ ] **Multi-language**
  - i18n support
  - RTL languages
  - Language detection
  - Community translations

#### 3.3 Cloud Integration (Optional)
- [ ] **Storage Sync**
  - Google Drive
  - Dropbox
  - OneDrive
  - Direct download
  
- [ ] **URL Import**
  - Download from URL
  - Paste URL to convert
  - Batch URL processing

---

## 🔧 WebAssembly Integration

### WASM Architecture Deep Dive

```typescript
// WASM Converter Interface
interface WasmConverter {
  init(): Promise<void>;
  convert(
    file: Uint8Array,
    options: ConversionOptions
  ): Promise<Uint8Array>;
  progress: (progress: number) => void;
  cleanup(): void;
}

// FFmpeg.wasm Implementation
class FFmpegAudioConverter implements WasmConverter {
  private ffmpeg: FFmpeg;
  
  async init() {
    this.ffmpeg = new FFmpeg();
    await this.ffmpeg.load({
      coreURL: '/ffmpeg-core.wasm',
      wasmURL: '/ffmpeg-core.js',
    });
  }
  
  async convert(
    file: Uint8Array,
    options: AudioConversionOptions
  ): Promise<Uint8Array> {
    // Write input file to WASM filesystem
    await this.ffmpeg.writeFile('input', file);
    
    // Build FFmpeg command
    const args = this.buildFFmpegArgs(options);
    
    // Execute conversion
    await this.ffmpeg.exec(args);
    
    // Read output
    const output = await this.ffmpeg.readFile('output');
    
    // Cleanup
    await this.ffmpeg.deleteFile('input');
    await this.ffmpeg.deleteFile('output');
    
    return output;
  }
  
  private buildFFmpegArgs(options: AudioConversionOptions): string[] {
    const args = ['-i', 'input'];
    
    if (options.bitrate) {
      args.push('-b:a', `${options.bitrate}k`);
    }
    
    if (options.sampleRate) {
      args.push('-ar', options.sampleRate.toString());
    }
    
    if (options.channels) {
      args.push('-ac', options.channels.toString());
    }
    
    args.push('output.' + options.format);
    return args;
  }
}
```

### WASM Performance Optimization

#### 1. Memory Management
```typescript
// Efficient memory usage
class WasmMemoryManager {
  private maxMemory = 2 * 1024 * 1024 * 1024; // 2GB
  
  checkMemoryAvailability(fileSize: number): boolean {
    // Estimate memory needed (3x file size for processing)
    const needed = fileSize * 3;
    
    if (needed > this.maxMemory) {
      throw new Error('File too large for WASM processing');
    }
    
    return true;
  }
  
  async processInChunks(
    file: File,
    chunkSize: number
  ): Promise<Uint8Array> {
    // Process large files in chunks
    const chunks: Uint8Array[] = [];
    
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = await file.slice(offset, offset + chunkSize).arrayBuffer();
      const processed = await this.processChunk(new Uint8Array(chunk));
      chunks.push(processed);
    }
    
    return this.mergeChunks(chunks);
  }
}
```

#### 2. Worker Threads
```typescript
// Offload WASM to Web Workers
class WasmWorkerPool {
  private workers: Worker[] = [];
  private queue: ConversionTask[] = [];
  
  constructor(workerCount: number = navigator.hardwareConcurrency) {
    for (let i = 0; i < workerCount; i++) {
      this.workers.push(new Worker('/wasm-worker.js'));
    }
  }
  
  async convert(task: ConversionTask): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const worker = this.getAvailableWorker();
      
      worker.postMessage({
        type: 'convert',
        file: task.file,
        options: task.options
      }, [task.file.buffer]); // Transfer ownership
      
      worker.onmessage = (e) => {
        if (e.data.type === 'complete') {
          resolve(e.data.result);
        } else if (e.data.type === 'error') {
          reject(e.data.error);
        }
      };
    });
  }
}
```

#### 3. Caching Strategy
```typescript
// Cache compiled WASM modules
class WasmCache {
  private cache: Map<string, WebAssembly.Module> = new Map();
  
  async getModule(name: string, url: string): Promise<WebAssembly.Module> {
    // Check memory cache
    if (this.cache.has(name)) {
      return this.cache.get(name)!;
    }
    
    // Check IndexedDB cache
    const cached = await this.getFromIndexedDB(name);
    if (cached) {
      this.cache.set(name, cached);
      return cached;
    }
    
    // Download and compile
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const module = await WebAssembly.compile(buffer);
    
    // Cache it
    this.cache.set(name, module);
    await this.saveToIndexedDB(name, module);
    
    return module;
  }
}
```

### WASM Size & Loading

```yaml
Typical WASM Module Sizes:
  - FFmpeg.wasm: ~25-30 MB
  - ImageMagick.wasm: ~15-20 MB
  - Pandoc.wasm: ~10-15 MB
  
Loading Strategy:
  1. Lazy Loading: Load only when needed
  2. Progressive Loading: Show UI while loading
  3. Service Worker: Cache for offline use
  4. CDN: Serve from fast edge locations
```

---

## 📅 Lộ Trình Triển Khai

### Phase 1: Foundation (Tuần 1-4)

#### Tuần 1: Project Setup & Infrastructure
- [ ] **Day 1-2: Project Initialization**
  ```bash
  # Setup Svelte + TypeScript project
  npm create vite@latest vert-converter -- --template svelte-ts
  cd vert-converter
  npm install
  
  # Install dependencies
  npm install @ffmpeg/ffmpeg @imagemagick/magick-wasm
  npm install -D tailwindcss postcss autoprefixer
  ```

- [ ] **Day 3-4: Core Structure**
  - Setup folder structure
  - Configure TypeScript
  - Setup TailwindCSS
  - Create base components
  
- [ ] **Day 5-7: File Upload System**
  - Drag & drop component
  - File type detection
  - Preview generation
  - Basic validation

#### Tuần 2: WASM Image Converter
- [ ] **Day 1-3: ImageMagick Integration**
  - Initialize ImageMagick.wasm
  - Basic image conversion
  - Format detection
  - Quality settings
  
- [ ] **Day 4-5: Image Processing UI**
  - Format selector
  - Quality slider
  - Preview component
  - Progress indicator
  
- [ ] **Day 6-7: Testing & Optimization**
  - Test various formats
  - Memory optimization
  - Error handling
  - Performance tuning

#### Tuần 3: WASM Audio Converter
- [ ] **Day 1-3: FFmpeg.wasm Integration**
  - Load FFmpeg module
  - Audio format conversion
  - Bitrate control
  - Sample rate conversion
  
- [ ] **Day 4-5: Audio UI**
  - Format selector
  - Bitrate/sample rate controls
  - Audio player preview
  - Waveform visualization (optional)
  
- [ ] **Day 6-7: Audio Features**
  - Metadata editing
  - Trim/cut functionality
  - Volume normalization
  - Testing

#### Tuần 4: Document Converter & Polish
- [ ] **Day 1-3: Pandoc Integration**
  - Setup Pandoc.wasm
  - Markdown conversion
  - PDF generation
  - HTML rendering
  
- [ ] **Day 4-5: UI Polish**
  - Improve layouts
  - Add animations
  - Error messages
  - Help tooltips
  
- [ ] **Day 6-7: Testing & Bug Fixes**
  - Cross-browser testing
  - Bug fixes
  - Performance optimization
  - Documentation

### Phase 2: Advanced Features (Tuần 5-8)

#### Tuần 5: Batch Processing
- [ ] **Multi-file Upload**
  - Queue system
  - Progress tracking
  - Concurrent processing
  
- [ ] **Batch Settings**
  - Apply to all
  - Individual customization
  - Profile system

#### Tuần 6: Metadata & Privacy
- [ ] **Metadata Viewer**
  - EXIF reader
  - Display all metadata
  - Edit capability
  
- [ ] **Privacy Controls**
  - Strip sensitive data
  - Anonymize files
  - Bulk operations

#### Tuần 7: Settings & Presets
- [ ] **Settings Panel**
  - Theme selection
  - Language picker
  - Performance settings
  - Privacy options
  
- [ ] **Preset System**
  - Pre-made presets
  - Custom presets
  - Import/export
  - Quick apply

#### Tuần 8: PWA & Offline
- [ ] **Progressive Web App**
  - Service worker
  - Offline support
  - Install prompt
  - App manifest
  
- [ ] **Caching Strategy**
  - Cache WASM modules
  - Cache UI assets
  - Smart cache updates

### Phase 3: Server Component (Tuần 9-12)

#### Tuần 9-10: Rust Server (vertd)
- [ ] **Day 1-5: Server Setup**
  ```bash
  # Create Rust project
  cargo new vertd --bin
  cd vertd
  
  # Add dependencies
  cargo add actix-web tokio serde
  cargo add tracing tracing-subscriber
  ```
  
- [ ] **Day 6-10: Video Conversion**
  - FFmpeg integration
  - Upload handling
  - Conversion queue
  - Progress tracking
  - GPU acceleration setup

#### Tuần 11: Server Integration
- [ ] **API Client**
  - Upload client
  - Progress polling
  - Download result
  - Error handling
  
- [ ] **UI Updates**
  - Video converter UI
  - Upload progress
  - Server selection
  - Self-host instructions

#### Tuần 12: Production Ready
- [ ] **Optimization**
  - Bundle size optimization
  - WASM optimization
  - Server performance
  - CDN setup
  
- [ ] **Documentation**
  - User guide
  - API documentation
  - Self-hosting guide
  - Contributing guide
  
- [ ] **Deployment**
  - Docker containers
  - CI/CD pipeline
  - Monitoring setup
  - Analytics (Plausible)

---

## 🔧 Chi Tiết Từng Component

### 1. File Upload Component

```svelte
<!-- FileUploader.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  
  const dispatch = createEventDispatcher();
  
  let isDragging = false;
  let files: File[] = [];
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    
    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    addFiles(droppedFiles);
  }
  
  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files || []);
    addFiles(selectedFiles);
  }
  
  function addFiles(newFiles: File[]) {
    files = [...files, ...newFiles];
    dispatch('filesAdded', { files: newFiles });
  }
  
  function removeFile(index: number) {
    files = files.filter((_, i) => i !== index);
    dispatch('fileRemoved', { index });
  }
</script>

<div
  class="upload-zone"
  class:dragging={isDragging}
  on:dragover|preventDefault={() => isDragging = true}
  on:dragleave={() => isDragging = false}
  on:drop={handleDrop}
>
  {#if files.length === 0}
    <div class="empty-state" transition:fade>
      <svg class="upload-icon">...</svg>
      <h3>Drag & Drop Files Here</h3>
      <p>or click to browse</p>
      <input
        type="file"
        multiple
        on:change={handleFileInput}
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx"
      />
    </div>
  {:else}
    <div class="file-list">
      {#each files as file, i (file.name + i)}
        <div class="file-item" transition:scale>
          <FilePreview {file} />
          <button on:click={() => removeFile(i)}>Remove</button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .upload-zone {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 2rem;
    transition: all 0.3s ease;
  }
  
  .upload-zone.dragging {
    border-color: #4f46e5;
    background-color: #eef2ff;
  }
  
  .file-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
</style>
```

### 2. Conversion Engine

```typescript
// ConversionEngine.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';
import Magick from '@imagemagick/magick-wasm';

export class ConversionEngine {
  private ffmpeg: FFmpeg | null = null;
  private imagemagick: Magick | null = null;
  
  async initialize() {
    // Initialize FFmpeg for audio/video
    this.ffmpeg = new FFmpeg();
    await this.ffmpeg.load({
      coreURL: '/lib/ffmpeg-core.wasm',
      wasmURL: '/lib/ffmpeg-core.js',
    });
    
    // Initialize ImageMagick
    this.imagemagick = await Magick.initialize();
  }
  
  async convertImage(
    file: File,
    options: ImageConversionOptions
  ): Promise<Blob> {
    const buffer = await file.arrayBuffer();
    const inputData = new Uint8Array(buffer);
    
    return new Promise((resolve, reject) => {
      this.imagemagick!.call({
        inputFiles: [{ name: 'input', content: inputData }],
        outputFiles: [`output.${options.format}`],
        commands: [
          'convert',
          'input',
          ...(options.quality ? ['-quality', options.quality.toString()] : []),
          ...(options.resize ? ['-resize', options.resize] : []),
          ...(options.stripMetadata ? ['-strip'] : []),
          `output.${options.format}`
        ]
      }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          const output = result.outputFiles[0].content;
          resolve(new Blob([output], { type: `image/${options.format}` }));
        }
      });
    });
  }
  
  async convertAudio(
    file: File,
    options: AudioConversionOptions
  ): Promise<Blob> {
    const data = await file.arrayBuffer();
    await this.ffmpeg!.writeFile('input', new Uint8Array(data));
    
    // Build command
    const args = [
      '-i', 'input',
      '-b:a', `${options.bitrate}k`,
      '-ar', options.sampleRate.toString(),
      '-ac', options.channels.toString(),
      `output.${options.format}`
    ];
    
    // Execute
    await this.ffmpeg!.exec(args);
    
    // Read output
    const output = await this.ffmpeg!.readFile(`output.${options.format}`);
    
    // Cleanup
    await this.ffmpeg!.deleteFile('input');
    await this.ffmpeg!.deleteFile(`output.${options.format}`);
    
    return new Blob([output], { type: `audio/${options.format}` });
  }
  
  async convertDocument(
    file: File,
    options: DocumentConversionOptions
  ): Promise<Blob> {
    // Use Pandoc.wasm or PDF.js depending on conversion
    // Implementation details...
    throw new Error('Not implemented');
  }
}

// Types
export interface ImageConversionOptions {
  format: 'png' | 'jpg' | 'webp' | 'gif' | 'avif';
  quality?: number;
  resize?: string;
  stripMetadata?: boolean;
}

export interface AudioConversionOptions {
  format: 'mp3' | 'wav' | 'flac' | 'aac' | 'ogg';
  bitrate: number;
  sampleRate: number;
  channels: 1 | 2;
}

export interface DocumentConversionOptions {
  format: 'pdf' | 'docx' | 'html' | 'md';
  template?: string;
}
```

### 3. Progress Tracker

```typescript
// ProgressTracker.ts
import { writable } from 'svelte/store';

export interface ConversionProgress {
  taskId: string;
  filename: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  eta?: number; // seconds
  speed?: number; // bytes per second
  error?: string;
}

class ProgressTrackerClass {
  private tasks = writable<Map<string, ConversionProgress>>(new Map());
  
  subscribe = this.tasks.subscribe;
  
  addTask(taskId: string, filename: string) {
    this.tasks.update(map => {
      map.set(taskId, {
        taskId,
        filename,
        status: 'queued',
        progress: 0
      });
      return map;
    });
  }
  
  updateProgress(taskId: string, progress: number, speed?: number) {
    this.tasks.update(map => {
      const task = map.get(taskId);
      if (task) {
        task.progress = progress;
        task.status = 'processing';
        task.speed = speed;
        
        // Calculate ETA
        if (speed && progress < 100) {
          const remaining = 100 - progress;
          task.eta = (remaining / speed) * 100;
        }
      }
      return map;
    });
  }
  
  completeTask(taskId: string) {
    this.tasks.update(map => {
      const task = map.get(taskId);
      if (task) {
        task.status = 'completed';
        task.progress = 100;
        task.eta = 0;
      }
      return map;
    });
  }
  
  failTask(taskId: string, error: string) {
    this.tasks.update(map => {
      const task = map.get(taskId);
      if (task) {
        task.status = 'failed';
        task.error = error;
      }
      return map;
    });
  }
  
  removeTask(taskId: string) {
    this.tasks.update(map => {
      map.delete(taskId);
      return map;
    });
  }
}

export const ProgressTracker = new ProgressTrackerClass();
```

### 4. Settings Store

```typescript
// settings.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  defaultQuality: {
    image: number;
    audio: number;
  };
  filenameTemplate: string;
  stripMetadataDefault: boolean;
  notifications: boolean;
  soundEffects: boolean;
  animations: boolean;
  maxConcurrent: number;
  serverUrl?: string;
}

const defaultSettings: AppSettings = {
  theme: 'auto',
  language: 'en',
  defaultQuality: {
    image: 85,
    audio: 192
  },
  filenameTemplate: '%name%_converted.%extension%',
  stripMetadataDefault: true,
  notifications: true,
  soundEffects: false,
  animations: true,
  maxConcurrent: 3,
};

function createSettingsStore() {
  // Load from localStorage
  const stored = browser ? localStorage.getItem('app-settings') : null;
  const initial = stored ? JSON.parse(stored) : defaultSettings;
  
  const { subscribe, set, update } = writable<AppSettings>(initial);
  
  return {
    subscribe,
    set: (value: AppSettings) => {
      if (browser) {
        localStorage.setItem('app-settings', JSON.stringify(value));
      }
      set(value);
    },
    update: (updater: (value: AppSettings) => AppSettings) => {
      update(current => {
        const updated = updater(current);
        if (browser) {
          localStorage.setItem('app-settings', JSON.stringify(updated));
        }
        return updated;
      });
    },
    reset: () => {
      if (browser) {
        localStorage.removeItem('app-settings');
      }
      set(defaultSettings);
    }
  };
}

export const settings = createSettingsStore();
```

---

## 🔒 Bảo Mật và Privacy

### Privacy-First Architecture

```typescript
// Privacy Guards
class PrivacyManager {
  // 1. No Server Upload for Non-Video Files
  static shouldProcessLocally(file: File): boolean {
    const videoFormats = ['video/mp4', 'video/webm', 'video/quicktime'];
    return !videoFormats.includes(file.type);
  }
  
  // 2. Metadata Stripping
  static async stripSensitiveMetadata(file: File): Promise<File> {
    // Remove EXIF GPS, camera info, timestamps
    const sensitiveFields = [
      'GPSLatitude',
      'GPSLongitude',
      'GPSAltitude',
      'Make',
      'Model',
      'DateTime',
      'Artist',
      'Copyright'
    ];
    
    // Use ImageMagick to strip
    // Implementation...
    return file;
  }
  
  // 3. No Tracking
  static initAnalytics() {
    // Only use privacy-focused analytics (Plausible)
    // No Google Analytics, no tracking cookies
    if (import.meta.env.PROD) {
      // Plausible integration
      const script = document.createElement('script');
      script.defer = true;
      script.dataset.domain = 'your-domain.com';
      script.src = 'https://plausible.io/js/script.js';
      document.head.appendChild(script);
    }
  }
  
  // 4. Secure File Handling
  static async secureDelete(blob: Blob) {
    // Overwrite memory before releasing
    if ('crypto' in window && 'getRandomValues' in crypto) {
      // Best effort to zero out memory
      const buffer = await blob.arrayBuffer();
      const view = new Uint8Array(buffer);
      crypto.getRandomValues(view);
    }
  }
}
```

### Security Headers (Server)

```rust
// vertd server - main.rs
use actix_web::{middleware, web, App, HttpServer};

async fn configure_security(app: App<_>) -> App<_> {
    app
        .wrap(middleware::DefaultHeaders::new()
            // CORS
            .add(("Access-Control-Allow-Origin", "*"))
            .add(("Access-Control-Allow-Methods", "POST, GET, OPTIONS"))
            
            // Security headers
            .add(("X-Content-Type-Options", "nosniff"))
            .add(("X-Frame-Options", "DENY"))
            .add(("X-XSS-Protection", "1; mode=block"))
            .add(("Referrer-Policy", "no-referrer"))
            
            // CSP
            .add(("Content-Security-Policy", 
                "default-src 'self'; \
                 script-src 'self' 'wasm-unsafe-eval'; \
                 worker-src 'self' blob:; \
                 connect-src 'self'"))
            
            // COOP/COEP for SharedArrayBuffer
            .add(("Cross-Origin-Opener-Policy", "same-origin"))
            .add(("Cross-Origin-Embedder-Policy", "require-corp"))
        )
}
```

### Data Protection

```typescript
// No persistent storage of user files
class FileHandler {
  // Use IndexedDB only for caching WASM modules, not user files
  private db: IDBDatabase;
  
  async cacheWasmModule(name: string, module: ArrayBuffer) {
    // Cache compiled WASM for performance
    const tx = this.db.transaction('wasm-cache', 'readwrite');
    await tx.objectStore('wasm-cache').put({
      name,
      module,
      timestamp: Date.now()
    });
  }
  
  async clearUserData() {
    // Clear any temporary data
    const tx = this.db.transaction('temp-files', 'readwrite');
    await tx.objectStore('temp-files').clear();
  }
}

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
  // Clear any temporary blobs
  URL.revokeObjectURL(/* all created URLs */);
});
```

---

## ⚡ Performance Optimization

### WASM Performance Benchmarks

```
Expected Performance (compared to native):
┌─────────────────┬──────────┬────────────┬──────────┐
│ Operation       │ Native   │ WASM       │ Ratio    │
├─────────────────┼──────────┼────────────┼──────────┤
│ Image Resize    │ 100ms    │ 150ms      │ 1.5x     │
│ Audio Transcode │ 500ms    │ 1200ms     │ 2.4x     │
│ Format Convert  │ 200ms    │ 350ms      │ 1.75x    │
│ Metadata Strip  │ 50ms     │ 80ms       │ 1.6x     │
└─────────────────┴──────────┴────────────┴──────────┘

WASM Speedup vs Pure JS:
┌─────────────────┬──────────┬────────────┬──────────┐
│ File Size       │ Pure JS  │ WASM       │ Speedup  │
├─────────────────┼──────────┼────────────┼──────────┤
│ Extra Small     │ 2700ms   │ 100ms      │ 27x      │
│ Small           │ 8220ms   │ 1000ms     │ 8.2x     │
│ Medium          │ 25000ms  │ 4000ms     │ 6.3x     │
│ Large           │ 80000ms  │ 15000ms    │ 5.3x     │
└─────────────────┴──────────┴────────────┴──────────┘
```

### Optimization Techniques

#### 1. Lazy Loading
```typescript
// Lazy load WASM modules
const converters = {
  image: () => import('./converters/image.wasm'),
  audio: () => import('./converters/audio.wasm'),
  document: () => import('./converters/document.wasm')
};

async function getConverter(type: string) {
  return await converters[type]();
}
```

#### 2. Web Workers
```typescript
// offload-worker.ts
import { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpeg: FFmpeg;

self.onmessage = async (e) => {
  const { type, data } = e.data;
  
  if (type === 'init') {
    ffmpeg = new FFmpeg();
    await ffmpeg.load();
    self.postMessage({ type: 'ready' });
  }
  
  if (type === 'convert') {
    const result = await convertFile(data);
    self.postMessage({ type: 'complete', result }, [result.buffer]);
  }
};
```

#### 3. Streaming Processing
```typescript
// Stream large files instead of loading into memory
async function convertLargeFile(file: File) {
  const stream = file.stream();
  const reader = stream.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    // Process chunk
    await processChunk(value);
  }
}
```

#### 4. Bundle Optimization
```javascript
// vite.config.ts
export default {
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'wasm-image': ['@imagemagick/magick-wasm'],
          'wasm-audio': ['@ffmpeg/ffmpeg'],
          'vendor': ['svelte', 'svelte/store']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@imagemagick/magick-wasm']
  }
}
```

### Memory Management

```typescript
class MemoryMonitor {
  private maxMemoryUsage = 0.8; // 80% of available
  
  checkAvailableMemory(): number {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return mem.jsHeapSizeLimit - mem.usedJSHeapSize;
    }
    return Infinity;
  }
  
  canProcessFile(fileSize: number): boolean {
    const available = this.checkAvailableMemory();
    const needed = fileSize * 3; // Estimate 3x for processing
    
    return needed < (available * this.maxMemoryUsage);
  }
  
  async forceGarbageCollection() {
    // Trigger GC if possible
    if ('gc' in window) {
      (window as any).gc();
    }
  }
}
```

---

## 🧪 Testing và Deployment

### Testing Strategy

#### 1. Unit Tests
```typescript
// conversion.test.ts
import { describe, it, expect } from 'vitest';
import { ConversionEngine } from './ConversionEngine';

describe('Image Conversion', () => {
  it('should convert PNG to WEBP', async () => {
    const engine = new ConversionEngine();
    await engine.initialize();
    
    const input = new File([/* test data */], 'test.png', { type: 'image/png' });
    const output = await engine.convertImage(input, {
      format: 'webp',
      quality: 85
    });
    
    expect(output.type).toBe('image/webp');
    expect(output.size).toBeLessThan(input.size);
  });
  
  it('should handle large files', async () => {
    const engine = new ConversionEngine();
    const largeFile = createLargeTestFile(50 * 1024 * 1024); // 50MB
    
    await expect(
      engine.convertImage(largeFile, { format: 'jpg' })
    ).resolves.toBeDefined();
  });
});
```

#### 2. Integration Tests
```typescript
// e2e/conversion-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete conversion flow', async ({ page }) => {
  await page.goto('/');
  
  // Upload file
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('test-image.png');
  
  // Select format
  await page.selectOption('select[name="format"]', 'webp');
  
  // Start conversion
  await page.click('button:has-text("Convert")');
  
  // Wait for completion
  await expect(page.locator('.status')).toHaveText('Completed', {
    timeout: 10000
  });
  
  // Download
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toContain('.webp');
});
```

#### 3. Performance Tests
```typescript
// performance.test.ts
import { performance } from 'perf_hooks';

test('conversion performance benchmarks', async () => {
  const sizes = [1, 5, 10, 50]; // MB
  
  for (const size of sizes) {
    const file = createTestFile(size * 1024 * 1024);
    
    const start = performance.now();
    await convertImage(file);
    const duration = performance.now() - start;
    
    console.log(`${size}MB: ${duration}ms`);
    
    // Assert reasonable performance
    expect(duration).toBeLessThan(size * 1000); // 1s per MB max
  }
});
```

### Deployment

#### Docker Setup
```dockerfile
# Dockerfile (Frontend)
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

```dockerfile
# Dockerfile (vertd Server)
FROM rust:1.75 as builder

WORKDIR /app
COPY Cargo.* ./
COPY src ./src

RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/vertd /usr/local/bin/

EXPOSE 8080
CMD ["vertd"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - SERVER_URL=http://vertd:8080
    depends_on:
      - vertd

  vertd:
    build:
      context: ./vertd
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    volumes:
      - ./temp:/tmp/uploads
    environment:
      - RUST_LOG=info
      - MAX_UPLOAD_SIZE=1073741824  # 1GB
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
```

#### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: |
          docker build -t vert-frontend:latest ./frontend
          docker build -t vert-server:latest ./vertd
      
      - name: Push to registry
        run: |
          docker push vert-frontend:latest
          docker push vert-server:latest
      
      - name: Deploy to production
        run: |
          # Deploy script here
```

---

## 📚 Resources & Next Steps

### Learning Resources
- **Svelte**: https://svelte.dev/tutorial
- **WebAssembly**: https://webassembly.org/getting-started/
- **FFmpeg.wasm**: https://github.com/ffmpegwasm/ffmpeg.wasm
- **ImageMagick**: https://imagemagick.org/script/develop.php
- **Rust Actix-web**: https://actix.rs/

### Similar Projects
- **VERT.sh**: https://vert.sh (reference)
- **Convertio**: https://convertio.co (commercial)
- **CloudConvert**: https://cloudconvert.com (commercial)
- **Online-Convert**: https://www.online-convert.com

### Tools & Libraries
- **Svelte**: UI framework
- **Vite**: Build tool
- **TailwindCSS**: Styling
- **FFmpeg.wasm**: Audio/video
- **ImageMagick.wasm**: Image processing
- **Pandoc**: Document conversion

---

## ✅ Success Criteria

### MVP Checklist
- [ ] Image conversion (5+ formats) works locally via WASM
- [ ] Audio conversion (3+ formats) works locally via WASM
- [ ] Drag & drop file upload
- [ ] Progress indicator
- [ ] Download converted files
- [ ] Basic settings (quality, format)
- [ ] Responsive UI
- [ ] Works on Chrome, Firefox, Safari

### Full Launch Checklist
- [ ] All core features implemented
- [ ] Video conversion via server
- [ ] Self-hosting documentation
- [ ] Privacy policy
- [ ] User guide
- [ ] Browser extension (optional)
- [ ] PWA support
- [ ] Analytics (privacy-focused)
- [ ] Error tracking
- [ ] Performance monitoring

---

## 🎯 Conclusion

This master plan provides a complete roadmap for building a VERT.sh-inspired file converter with:

✅ **Privacy-first architecture** (zero-knowledge processing)
✅ **WebAssembly power** (near-native performance)
✅ **Modern tech stack** (Svelte + TypeScript + Rust)
✅ **Self-hostable** (full control)
✅ **250+ formats** support
✅ **No limits** on file size or conversions

**Start with Phase 1** (weeks 1-4) để có MVP working, then iterate based on user feedback.

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Based On**: VERT.sh architecture analysis  
**Status**: Master Planning Phase

## 🚀 Ready to Build?

Choose your starting point:
1. **Quick Start**: Svelte + TypeScript + FFmpeg.wasm (Week 1-4)
2. **Full Stack**: Add Rust server for video (Week 9-12)
3. **Integration**: Add to existing devtools-app

Good luck building your file converter! 🎉
