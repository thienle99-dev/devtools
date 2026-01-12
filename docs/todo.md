# TODO List - DevTools App

## Phase 1: Project Setup & Core UI

### 1.1 Project Initialization

- [x] Initialize Vite + React + TypeScript project
- [x] Setup Electron with Vite plugin
- [x] Configure TypeScript (tsconfig.json)
- [x] Setup ESLint + Prettier
- [x] Configure Tailwind CSS with custom theme
- [x] Install all core dependencies
- [x] Install all dev dependencies
- [x] Setup Vitest for testing
- [x] Create basic project structure

### 1.2 Electron Configuration

- [x] Create electron/main/main.ts (main process)
- [x] Create electron/preload/preload.ts (preload script)
- [x] Configure window (frameless, transparent, vibrancy)
- [x] Setup IPC communication structure
- [x] Configure electron-builder (electron-builder.yml)
- [ ] Setup auto-updater configuration
- [x] Test window creation and basic functionality

### 1.3 Base Layout Components

- [x] Create WindowControls component (traffic lights)
- [x] Create Sidebar component structure
- [x] Create DynamicIsland component
- [x] Create ToolPane component (input/output)
- [x] Create main App layout
- [x] Setup routing/navigation structure

### 1.4 Glassmorphism Styling

- [x] Setup Tailwind custom theme (glass colors, squircle radius)
- [x] Create base glassmorphism utility classes
- [x] Style main container with gradient background
- [x] Style Sidebar with glass effect
- [x] Style ToolPane with glass effect
- [x] Style buttons with glassmorphism
- [x] Create Card component with glass styling
- [x] Setup custom scrollbar styling
- [x] Test glassmorphism on Windows and macOS

### 1.5 Basic Navigation

- [x] Create tool categories structure
- [x] Create navigation list in Sidebar
- [x] Implement tool selection logic
- [x] Add icons to navigation items (Lucide)
- [x] Add hover effects to navigation
- [x] Add active state styling
- [x] Test navigation flow

---

## Phase 2: Tool Integration & Core Features

### 2.1 State Management Setup

- [x] Create toolStore.ts (Zustand)
- [x] Create uiStore.ts (Zustand)
- [x] Create settingsStore.ts (Zustand)
- [x] Setup electron-store integration
- [x] Implement persistence middleware
- [x] Test state management flow

### 2.2 Code Editor Component

- [x] Integrate CodeMirror (@uiw/react-codemirror)
- [x] Create CodeEditor component wrapper
- [x] Setup syntax highlighting
- [x] Add theme for glassmorphism
- [x] Implement line numbers and basic features
- [x] Test editor functionality

### 2.3 Tool Pane Implementation

- [x] Complete ToolPane component
- [x] Add input pane with CodeEditor
- [x] Add output pane with display area
- [x] Implement Clear button
- [x] Implement Copy button
- [x] Implement Download button
- [x] Add tool-specific action buttons
- [x] Test pane interactions

### 2.4 First Tool Implementation (JSON Formatter)

- [x] Create tools/json/JsonFormatter.tsx
- [x] Implement JSON prettify
- [x] Implement JSON minify
- [x] Implement JSON validate
- [x] Add error handling
- [x] Test JSON formatter tool

### 2.5 Tool System Architecture

- [x] Create tool registry system
- [x] Create tool wrapper component (Integrated directly in registry helpers)
- [x] Setup tool routing (Dynamic routing in App.tsx)
- [x] Create tool configuration system (ToolDefinition interface)
- [x] Test tool switching

---

## Phase 3: Core Tools Implementation

### 3.1 Converter Tools

- [x] Base64 string encoder/decoder
- [x] Base64 file converter
- [x] YAML ⇄ JSON converter
- [x] JSON ⇄ XML converter
- [x] XML ⇄ JSON converter
- [x] Markdown to HTML
- [x] Case converter
- [x] Color converter (hex, rgb, hsl)
- [x] Date-time converter
- [x] Integer base converter

### 3.2 Crypto Tools

- [x] Hash text (MD5, SHA1, SHA256, SHA512, SHA3)
- [x] UUID generator
- [x] ULID generator
- [x] Token generator
- [x] Password strength analyser
- [x] HMAC generator
- [x] Encrypt/decrypt text (AES)
- [x] Bcrypt hasher
- [x] Encrypt/decrypt text (TripleDES, Rabbit, RC4)
- [x] BIP39 passphrase generator
- [x] RSA key pair generator
- [x] RSA encryption/decryption
- [x] RSA signature generator/verifier
- [x] PBKDF2 key derivation
- [x] Argon2 password hashing (Argon2id, Argon2i, Argon2d)
- [x] Scrypt key derivation
- [x] ECDSA key pair generator
- [x] ECDSA signature generator/verifier
- [x] Ed25519 key pair generator
- [x] Ed25519 signature generator/verifier
- [x] X25519 key exchange generator
- [x] X.509 certificate parser/validator
- [x] CSR (Certificate Signing Request) generator
- [x] PEM/DER format converter
- [x] ChaCha20 encryption
- [x] Twofish encryption
- [x] Blowfish encryption
- [x] Fernet encryption

### 3.3 Web Tools

- [x] URL encoder/decoder
- [x] JWT parser
- [x] HTML entities escape/unescape
- [x] URL parser
- [x] Basic auth generator
- [x] Slugify string
- [x] User-agent parser
- [x] HTTP status codes list
- [x] JSON diff
- [x] Device information
- [x] Open Graph meta generator
- [x] MIME types lookup
- [x] OTP code generator (TOTP)
- [x] Keycode info
- [x] HTML WYSIWYG editor
- [x] Outlook Safelink decoder
- [ ] URL shortener/expander
- [x] UTM parameter builder
- [x] URL query string parser
- [x] HTTP headers parser
- [ ] HTTP request builder
- [ ] CORS checker
- [x] Content Security Policy (CSP) generator
- [ ] HSTS checker
- [x] Meta tags generator
- [x] Robots.txt generator
- [x] Sitemap generator
- [x] Structured Data (JSON-LD) generator
- [ ] Canonical URL generator
- [x] Bearer token generator
- [x] API key generator
- [ ] Security headers checker
- [x] Base64 URL encoder/decoder
- [ ] Percent encoding
- [ ] Unicode encoder/decoder
- [x] Cookie parser
- [ ] Set-Cookie header generator
- [ ] Content-Type parser
- [ ] Accept header builder
- [ ] User-Agent switcher
- [ ] Referrer Policy generator
- [ ] Feature Policy generator
- [ ] Favicon generator
- [x] Manifest.json generator
- [x] Service Worker generator
- [ ] PWA checklist

### 3.4 Development Tools

- [x] JSON prettify and format
- [x] JSON minify
- [x] JSON to CSV
- [x] SQL prettify and format
- [x] YAML prettify and format
- [x] XML formatter
- [x] Regex Tester
- [x] Crontab generator
- [x] Docker run → docker-compose converter
- [x] Chmod calculator
- [ ] Email normalizer

### 3.5 Text Tools

- [x] Lorem ipsum generator
- [x] Text statistics
- [x] Text diff
- [x] String obfuscator
- [x] ASCII Art Text Generator

### 3.6 Network Tools

- [x] IPv4 subnet calculator
- [x] IPv4 address converter
- [x] MAC address generator
- [x] MAC address lookup

### 3.7 Math & Measurement Tools

- [x] Math evaluator
- [x] Percentage calculator
- [x] Temperature converter
- [x] Chronometer

### 3.8 Image Tools

- [x] QR Code generator
- [x] WiFi QR Code generator
- [x] SVG placeholder generator
- [ ] Camera recorder (capture ảnh/video từ webcam)
- [x] Image Format Converter
- [ ] HEIC to JPG Converter
- [ ] ICO Generator (favicon)
- [x] WebP Converter
- [ ] AVIF Converter
- [x] Image Compressor
- [x] Bulk Image Compressor
- [ ] Image Cropper
- [ ] Image Resizer
- [ ] Image Rotator
- [ ] Image Flipper
- [ ] Image Filter Applier
- [ ] Image Brightness/Contrast Adjuster
- [ ] Image Color Adjuster
- [ ] Image Watermarker
- [x] Image Metadata Viewer
- [x] Image Metadata Remover
- [ ] Image Color Palette Extractor
- [ ] Image Dominant Color Extractor
- [ ] Image Dimension Analyzer
- [ ] Barcode Generator
- [x] Data URI Generator
- [x] Base64 Image Encoder/Decoder
- [ ] Gradient Generator
- [ ] Pattern Generator
- [ ] Image Merger
- [ ] Image Splitter
- [ ] Image Comparator
- [ ] Image Optimizer
- [ ] Responsive Image Generator
- [ ] Image OCR
- [x] Image to ASCII Art Converter
- [ ] Image to SVG Converter
- [ ] Image Background Remover
- [ ] Image Upscaler
- [ ] Video to GIF Converter
- [ ] GIF Optimizer
- [ ] Video Frame Extractor

### 3.9 Screenshot Tools (Xnapper Clone)

- [x] Setup tool structure
- [x] Install dependencies
- [x] Create store
- [x] Screen capture integration
- [x] Capture UI
- [x] Preview
- [x] Auto-balance
- [x] Export
- [x] Save to file
- [x] Tool registry integration
- [x] OCR
- [x] Regex detection
- [x] Redaction panel
- [x] Blur/pixelate/overlay
- [x] Manual redaction
- [x] Background panel
- [x] Gradient background
- [x] Background blur
- [x] Background thumbnails
- [x] Fabric canvas
- [x] Arrow tool
- [x] Text tool
- [x] Shape tools
- [x] Selective blur
- [x] Crop tool
- [x] Annotation toolbar
- [x] Undo/redo
- [x] Color/size controls
- [x] Export panel
- [x] Social presets
- [x] Custom dimensions
- [x] Quality settings
- [x] Format options
- [x] Copy to clipboard
- [x] Share sheet (macOS)
- [x] History panel
- [x] History storage
- [x] Templates system
- [x] Preset saving
- [ ] Quick action: double-click copy
- [ ] Quick action: drag-and-drop export
- [ ] Aspect ratio presets
- [ ] Batch processing (future)
- [x] Cloud upload (Imgur)
- [x] Scrolling screenshot (Web)
- [ ] AI background suggestions (future)
- [x] Keyboard shortcuts
- [x] Drag & drop load
- [x] Comparison mode

### 3.10 Data Tools

- [ ] Phone parser/formatter
- [ ] IBAN validator/parser

### 3.11 PDF Tools

- [ ] PDF signature checker
- [ ] PDF to Images
- [x] Images to PDF
- [ ] PDF to Text
- [ ] PDF to HTML
- [ ] PDF to Markdown
- [x] HTML to PDF
- [x] Markdown to PDF
- [ ] Word/DOCX to PDF
- [ ] PDF to Word/DOCX
- [x] PDF Merger
- [x] PDF Splitter
- [x] PDF Page Extractor
- [x] PDF Page Rotator
- [x] PDF Page Reorder
- [x] PDF Compressor
- [ ] PDF Optimizer
- [x] PDF Watermarker
- [x] PDF Page Numbering
- [ ] PDF Password Protector
- [ ] PDF Password Remover
- [ ] PDF Encryption
- [ ] PDF Decryption
- [x] PDF Metadata Remover
- [x] PDF Metadata Viewer
- [x] PDF Metadata Editor
- [ ] PDF Page Counter
- [ ] PDF File Size Analyzer
- [ ] PDF Structure Viewer
- [ ] PDF Font Extractor
- [ ] PDF Image Extractor
- [ ] PDF Form Filler
- [ ] PDF Form Creator
- [ ] PDF Form Field Extractor
- [ ] PDF OCR
- [ ] PDF Redaction
- [ ] PDF Annotation
- [ ] PDF Bookmark Generator
- [ ] PDF Table Extractor
- [ ] PDF Comparison
- [ ] PDF Preview
- [ ] PDF Thumbnail Generator
- [x] PDF to Base64
- [x] Base64 to PDF
- [x] PDF Validator

---

## Phase 4: Polish & Advanced Features

- [x] Add Framer Motion animations
- [ ] Status pulse animation
- [x] Hover transitions
- [x] Focus effects
- [x] Page transitions
- [x] Optimize animation performance
- [ ] Dynamic Island completion
- [ ] Status indicators
- [ ] Latency display
- [ ] Active tool indicator
- [ ] Pulse animation
- [ ] Screen size test
- [x] Cmd/Ctrl + K search
- [x] Tool shortcuts
- [x] Navigation shortcuts
- [x] Shortcuts modal
- [x] Store shortcuts
- [x] Settings UI
- [x] Preferences storage
- [x] Theme settings
- [x] Light/Dark support
- [x] Window state persistence
- [x] Tool history persistence
- [x] Persistence test
- [ ] Virtualization for large outputs
- [ ] Sidebar memoization
- [x] Search
- [x] Category filter
- [x] Recent tools
- [x] Favorites system
- [x] Sorting
- [x] Search perf test
- [x] History store
- [x] Usage history
- [x] Favorites
- [x] History UI
- [x] Clear history
- [x] History test
- [ ] Export tool data
- [ ] Import tool data
- [ ] Export settings
- [ ] Backup/restore
- [ ] Export/import test
- [ ] Drag & drop files
- [ ] File picker
- [ ] File read IPC
- [ ] File save IPC
- [ ] File ops test
- [x] Sonner integration
- [x] Toast copy
- [x] Toast download
- [x] Toast errors
- [x] Toast success
- [x] Toast styling
- [x] Tray icon
- [x] Minimize to tray
- [x] Tray context menu
- [x] Tray settings
- [x] Tray quick access

---

## Phase 5: Performance & Optimization

### 5.1 Performance Optimizations

- [x] Virtual scrolling
- [x] Lazy loading
- [ ] React.memo for expensive components
- [x] Debounce input handlers
- [ ] Optimize Zustand selectors
- [ ] Test large data performance

### 5.2 Code Optimization

- [x] Bundle size optimization
- [x] Code splitting
- [x] Optimize assets
- [x] Remove unused dependencies
- [x] Optimize Electron main process

### 5.3 Error Handling

- [x] Error boundaries
- [x] Error logging
- [x] Friendly messages
- [x] Network errors handling
- [x] Error scenario tests

### 5.4 Testing

- [ ] Unit tests (utils)
- [ ] Component tests
- [ ] Integration tests (tools)
- [ ] IPC tests
- [ ] Cross-platform tests

---

## Phase 6: Build & Distribution

### 6.1 Build Configuration

- [x] Finalize electron-builder.yml
- [x] Windows build (NSIS)
- [x] macOS build (DMG)
- [x] Code signing (macOS)
- [x] Notarization (macOS)
- [x] Test build process

### 6.2 Auto-updater

- [ ] Auto-updater implementation
- [ ] Update server/endpoint
- [ ] Update flow tests
- [ ] Update notifications
- [ ] Update error handling

### 6.3 Documentation

- [ ] README.md
- [ ] Install docs
- [ ] Tool usage docs
- [ ] Changelog
- [ ] Screenshots/demos

### 6.4 Release Preparation

- [ ] Version bumping
- [ ] Release notes
- [ ] Windows testing
- [ ] macOS testing
- [ ] QA testing
- [ ] Release build

---

## Ongoing Tasks

### Maintenance

- [ ] Monitor error logs
- [ ] Update dependencies
- [ ] Fix bugs
- [ ] Add features
- [ ] Performance monitoring

### Future Enhancements

- [ ] Additional tools
- [ ] Plugin system
- [ ] Cloud sync
- [ ] Multi-language
- [ ] Customization

---

## Phase 7: System Cleaner Tool (mac-cleaner.md)

- [x] Settings & Preferences panel
- [x] Welcome / Onboarding
- [x] Keyboard Shortcuts
- [x] Browser Data Cleanup
- [x] Wi-Fi Network Cleanup
- [x] Search & Filter
- [x] Bulk Actions
- [x] Empty States improvements
- [x] Smart Scan improvements
- [x] Progress tracking
- [x] Backup Management UI
- [x] Space Lens export & snapshots
- [x] Error Recovery
- [x] Memory Management
- [x] Caching Strategy
- [x] Type Safety
- [ ] Cross-platform testing
- [ ] Safety testing
- [ ] Performance testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Windows Update Cleanup
- [ ] System Restore Points cleanup
- [ ] Windows.old cleanup
- [ ] Registry cleanup
- [ ] Windows Defender integration
- [ ] Windows Services management
- [ ] Task Scheduler integration
- [ ] Windows Search optimization
- [x] Time Machine management
- [x] Spotlight optimization
- [x] Disk permissions repair
- [x] Launch Services reset
- [x] Gatekeeper integration
- [x] iCloud optimization
- [x] Mail.app optimization
- [ ] AI recommendations
- [ ] Cloud sync
- [ ] Advanced analytics
- [ ] Custom scripts
- [ ] Community features
- [ ] Multi-language
- [ ] Accessibility
- [ ] Linux support
- [ ] Remote management
- [ ] Scheduled tasks
- [ ] Export & reports
- [ ] App updater (Store/Chocolatey/App Store)
- [ ] Update notifications
- [ ] Background update checks
- [ ] Update install flow

---

## Phase 8: Xnapper/Screenshot Tool (xnapper.md)

- [x] Core capture & export
- [x] Redaction & background
- [x] Annotations
- [x] Export & share
- [x] Templates & presets
- [ ] Quick actions (double-click copy)
- [ ] Drag-and-drop export
- [ ] Aspect ratio presets
- [ ] Batch processing (future)
- [x] Cloud upload (Imgur)
- [x] Scrolling screenshot
- [ ] AI background suggestions (future)
- [x] Shortcuts
- [x] Drag & drop loading
- [x] Comparison mode

---

## Phase 9: Stats Monitor Tool (stats-monitor.md)

- [x] CPU module
- [x] GPU module
- [x] Memory module
- [x] Disk module
- [x] Network module
- [x] Battery module
- [x] Sensors module
- [x] Bluetooth module
- [x] Time Zones module
- [x] Menu bar dropdown
- [ ] Menu bar icon states
- [ ] Real-time graphs
- [x] Quick actions
- [x] Settings modal
- [ ] Module reordering
- [ ] Customizable time zones
- [ ] Export metrics
- [ ] Historical charts
- [ ] Alerts
- [ ] Theme toggle
- [ ] Module size
- [ ] Stats tray icon
- [ ] Context menu integration
- [x] IPC handlers & preload API
- [x] Hooks & modules
- [ ] statsTray dynamic icon

---

## Phase 10: Application Manager Tool (application-manager-plan.md)

- [x] Installed Apps tab
- [x] Running Processes tab
- [x] App type filter
- [x] Process grouping
- [x] CPU/RAM color coding
- [x] System vs user badges
- [x] Confirmation dialogs
- [x] Types for InstalledApp/RunningProcess
- [x] IPC handlers
- [x] Preload API
- [x] Hooks
- [x] Components
- [x] Tool registry
- [x] Safety guards
- [x] Performance guards

---

## Phase 11: Clipboard Manager Enhancements (clipboard-advanced-features.md)

- [ ] Export/Import history
- [ ] Clipboard sync (future)
- [ ] Rich text support
- [ ] File clipboard support
- [ ] Monitoring service
- [ ] Auto-paste shortcuts
- [ ] Statistics
- [ ] Better scroll performance
- [ ] Tray icon quick access

---

## Phase 12: Universal Media Downloader (UNIVERSAL_DOWNLOADER_PLAN.md)

- [x] Backend service + IPC
- [x] Preload API
- [x] React components
- [x] Queue UI
- [x] Disk space check
- [x] History export
- [ ] Batch URL downloads
- [ ] Import URLs
- [ ] Instagram specialized support
- [ ] Twitter/X support
- [ ] Reddit support
- [ ] Facebook support
- [ ] Cloud auto-sync
- [ ] Audio extractor enhancements

---

## Phase 13: Refactoring & Code Quality (REFACTORING_PLAN.md)

- [ ] Centralized utils (format)
- [ ] Centralized utils (validation)
- [ ] Implement format helpers
- [ ] Implement URL/file helpers
- [ ] Centralize types
- [ ] Refactor components
- [ ] Update imports

---

## Phase 14: Video Frame Tools Enhancements (VIDEOFRAMES_COMPLETION.md)

- [ ] FFmpeg.wasm integration
- [ ] MP4/H.265 export
- [ ] GIF creation tool
- [ ] Frame selection/trimming
- [ ] Batch processing
- [ ] Effects/filters
- [ ] Watermarking
- [ ] Compression settings
- [ ] Worker/concurrency support

---

## Phase 15: Stats Monitor Additional Modules

- [ ] Export metrics (JSON/CSV)
- [ ] Create statsTray dynamic icon
- [ ] Tray context menu
- [ ] Frontend tray updates

---

## Phase 16: Browser Extension Support

- [ ] Chrome/Edge/Firefox extension
- [ ] Native messaging
- [ ] Context menu integration
- [ ] Floating download button

## Phase 17: Additional Tools Expansion

### 17.1 Dev / Engineering Tools

#### API & Backend

- [ ] API Tester (Postman-lite)
- [ ] GraphQL Explorer
- [ ] WebSocket Tester
- [ ] gRPC Request Builder
- [ ] API Mock Server
- [ ] OpenAPI (Swagger) Viewer & Validator
- [ ] API Contract Diff Tool

#### Code & Configuration

- [ ] Environment Variables Manager
- [ ] .env File Validator
- [ ] Dockerfile Linter
- [ ] Kubernetes YAML Validator
- [ ] Helm Values Generator
- [ ] Nginx Config Generator
- [ ] Apache .htaccess Generator
- [ ] CI/CD Pipeline Generator (GitHub Actions, GitLab CI)

---

### 17.2 Security & Privacy Tools

- [ ] Password Breach Checker (offline hash-based)
- [ ] JWT Signature Verifier (public key)
- [ ] OAuth 2.0 Flow Visualizer
- [ ] TLS / SSL Inspector
- [ ] Certificate Chain Analyzer
- [ ] Security Checklist Generator (Web / API / Mobile)
- [ ] Secrets Scanner (API keys, tokens, credentials)
- [ ] Data Masking Tool (logs, JSON, CSV)
- [ ] Hash Comparison Tool
- [ ] Checksum Verifier (MD5 / SHA)

---

### 17.3 File & Data Tools

#### CSV / Data

- [ ] CSV Cleaner
- [ ] CSV ⇄ JSON Advanced Mapper
- [ ] CSV Schema Generator
- [ ] Excel Formula Tester
- [ ] SQL Query Runner (SQLite in-memory)
- [ ] Schema-based Data Validator

#### File Utilities

- [ ] File Hash Generator
- [ ] Bulk File Rename Tool
- [ ] File Tree Visualizer
- [ ] Duplicate File Finder
- [ ] Large File Analyzer
- [ ] Archive Inspector (ZIP, TAR, 7z)

---

### 17.4 Web / Frontend Tools

- [ ] CSS Generator (Gradient, Box-shadow, Glassmorphism)
- [ ] Tailwind Class Builder
- [ ] HTML Accessibility Checker (a11y)
- [ ] Offline Lighthouse-style Analyzer
- [ ] SEO Audit Tool
- [ ] Meta Preview Generator (Google / Twitter / Facebook)
- [ ] Responsive Breakpoint Tester
- [ ] Viewport Simulator

---

### 17.5 Productivity & Power User Tools

- [ ] Command Palette Automation (Macros)
- [ ] Clipboard Rules Engine
- [ ] Snippet Manager (Code / Text)
- [ ] Regex Snippet Library
- [ ] Developer Notes / Scratchpad
- [ ] Task Runner (npm / pnpm / yarn scripts)
- [ ] Git Commit Message Generator
- [ ] Conventional Commit Validator

---

### 17.6 Image & Media Tools (Extended)

- [ ] Smart Image Optimizer (auto WebP / AVIF)
- [ ] Batch Image Resizer & Renamer
- [ ] Sprite Sheet Generator
- [ ] CSS Sprite Generator
- [ ] Image Diff (pixel-level)
- [ ] Screenshot Annotation Templates
- [ ] Video Metadata Inspector
- [ ] Audio Metadata Editor
- [ ] Waveform Viewer
- [ ] Subtitle Editor (SRT / VTT)

---

### 17.7 AI-Assist Tools (Privacy-first)

- [ ] Prompt Formatter
- [ ] Prompt Versioning Tool
- [ ] Log Summarizer
- [ ] Code Explanation Tool
- [ ] Error Log Analyzer
- [ ] Regex Generator (AI-assisted)

---

### 17.8 System & OS Utilities

- [ ] Startup Applications Manager
- [ ] Login Items Inspector
- [ ] Process Dependency Viewer
- [ ] Disk Usage Treemap
- [ ] Battery Health Report Export
- [ ] Local Network Port Scanner
- [ ] Hosts File Manager
- [ ] DNS Cache Viewer
- [ ] Firewall Rules Viewer

---

### 17.9 Advanced & Differentiation Features

- [ ] Tool Chaining (Output → Input)
- [ ] Workflow Builder
- [ ] Plugin SDK
- [ ] CLI Companion Tool
- [ ] Portable Mode
- [ ] Offline-first Mode
- [ ] Enterprise Profiles
- [ ] Policy-based Tool Access
