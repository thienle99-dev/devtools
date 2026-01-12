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
- [x] Canonical URL generator
- [x] Bearer token generator
- [x] API key generator
- [ ] Security headers checker
- [x] Base64 URL encoder/decoder
- [ ] Percent encoding
- [ ] Unicode encoder/decoder
- [x] Cookie parser
- [x] Set-Cookie header generator
- [x] Content-Type parser
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

#### API & Backend (Not do)

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

## Phase 18: UI / UX Improvements & Product Polish

### 18.1 Global UX Improvements

- [x] Global Command Palette (Tool + Action + Settings)
- [x] Tool Quick Switcher (recent / favorite)
- [x] Inline Tool Search (inside Sidebar)
- [x] Tool Usage Analytics (local-only)
- [x] Smart Empty States (tips + shortcuts)
- [x] Contextual Help per Tool
- [x] Tool Description & Examples Panel
- [ ] First-time Tool Walkthrough (tooltip-based)
- [ ] Undo / Redo (global level)
- [x] Better Loading & Skeleton States

---

### 18.2 Tool UX Enhancements

- [x] Tool Presets (Save / Load / Share)
- [x] Tool History Replay
- [x] Compare Mode (before / after)
- [x] Side-by-side Input / Output
- [x] Multi-input Tabs
- [x] Drag & Drop Input Everywhere
- [x] Inline Validation & Warnings
- [x] Error Explanation Panel (human-readable)
- [x] Output Highlighting (diff / syntax)
- [x] Output Export Menu (copy / save / share)

---

### 18.3 UI Customization

- [x] Compact / Comfortable / Dense Layout Modes
- [x] Sidebar Collapsible Sections
- [x] Custom Sidebar Ordering
- [x] Per-tool UI Preferences (via individual tool store data)
- [x] Font Size & Editor Zoom Controls
- [x] Accent Color Picker
- [x] Glass Intensity Control
- [x] Blur Performance Toggle (low-end devices)

---

### 18.4 Accessibility (a11y)

- [ ] Full Keyboard Navigation
- [ ] Focus Ring Improvements
- [ ] Screen Reader Labels
- [ ] High Contrast Mode
- [ ] Reduced Motion Mode
- [ ] Color Blind Safe Palette
- [ ] Shortcut Conflict Detector

---

### 18.5 Onboarding & Guidance

- [x] Welcome Tour
- [ ] Tool Discovery Suggestions
- [ ] “You might also need…” Tool Suggestions
- [ ] Built-in Documentation Viewer
- [ ] Example Gallery per Tool
- [x] Reset Onboarding Flow

---

### 18.6 Performance UX

- [x] Progressive Rendering for Large Outputs
- [x] Background Processing Indicator
- [x] Task Queue UI
- [x] Cancel Long-running Tasks
- [x] Performance Warning Toasts
- [x] Memory Usage Indicator (per tool)

---

## Phase 19: Advanced & Missing Tools

### 19.1 Developer Productivity

- [ ] API Scenario Runner (multi-step requests)
- [ ] HTTP Response Visualizer (timing, waterfall)
- [x] Code Snippet Generator (curl / fetch / axios)
- [ ] Environment Switcher (dev / staging / prod)
- [ ] JSON Schema Builder (UI-based)
- [x] Mock Data Generator (faker-style)
- [ ] Feature Flag Simulator
- [ ] Config Diff Tool (.env / yaml / json)

---

### 19.2 Security / Privacy Advanced

- [ ] Redaction Preview Mode
- [ ] Secrets Scanner for Entire Project Folder
- [ ] Compliance Checklist Generator (GDPR, SOC2)
- [ ] Threat Modeling Canvas (STRIDE)
- [ ] Secure Random Test Tool
- [ ] Password Policy Tester
- [ ] Encryption Strength Analyzer

---

### 19.3 Data & File Power Tools

- [ ] CSV Join / Merge Tool
- [ ] CSV Diff Tool
- [ ] Data Sampling Tool
- [ ] JSON Stream Viewer
- [ ] File Chunk Viewer
- [ ] Binary File Inspector (hex view)
- [ ] Base64 File Compare
- [ ] Directory Snapshot & Diff

---

### 19.4 Web & Frontend Advanced

- [ ] CSS Specificity Calculator
- [ ] Flexbox / Grid Visual Playground
- [ ] HTML Minifier + Beautifier
- [ ] JS Minifier / Obfuscator
- [ ] JS AST Viewer
- [ ] Bundle Size Analyzer
- [ ] Web Font Inspector
- [ ] Cookie Permission Simulator

---

### 19.5 Image / Media Pro

- [ ] Image Pipeline Builder (resize → compress → format)
- [ ] Screenshot Automation Rules
- [ ] Batch Watermark Tool
- [ ] Image EXIF Editor
- [ ] Video Bitrate Analyzer
- [ ] Audio Silence Trimmer
- [ ] Frame-by-frame Video Inspector
- [ ] Thumbnail Generator

---

### 19.6 System & Power User

- [ ] Process Timeline Viewer
- [ ] Disk I/O Visualizer
- [ ] Network Traffic Snapshot
- [ ] System Health Score
- [ ] Scheduled Maintenance Rules
- [ ] App Permission Inspector
- [ ] Log File Viewer (system/app)

---

### 19.7 Power Features (Differentiators)

- [ ] Tool-to-Tool Piping (Output → Input)
- [ ] Workflow Automation (No-code)
- [ ] Tool Templates Marketplace (local / community)
- [ ] CLI ↔ GUI Sync
- [ ] Headless Mode (scriptable)
- [ ] Portable Workspace Profiles
- [ ] Multi-window Tool Instances

## Phase 20: Tool Chaining System

### 20.1 Core Architecture

- [x] Define ToolDataType (text, json, image, file, etc.)
- [x] Extend ToolDefinition with accepts / produces
- [x] Standardize Tool input/output contract
- [x] Add chainable flag to tools
- [x] Validate tool compatibility (A → B)

---

### 20.2 Quick Chain (MVP)

- [x] Add "Send to..." action in Tool output
- [x] Show compatible tools only
- [x] Auto-fill input of next tool
- [x] Preserve tool state during chaining
- [x] Save chained actions to history

---

### 20.3 Chain Store & Execution

- [x] Create toolChainStore (Zustand)
- [x] Implement sequential execution
- [x] Cache output per step
- [x] Allow re-run single step
- [x] Allow reset chain

---

### 20.4 Visual Chain Builder (Advanced)

- [x] Chain canvas UI
- [x] Drag & drop tool nodes
- [x] Connect compatible nodes only
- [x] Step-by-step execution view
- [x] Inline output preview per node

---

### 20.5 Smart UX

- [x] Auto-suggest next tools
- [x] Common chain templates
- [x] Recent chains
- [x] Favorite chains
- [x] Tool compatibility hints

---

### 20.6 Persistence & Sharing

- [x] Save chain presets
- [x] Export / import chains (JSON)
- [x] Duplicate chain
- [x] Share chain internally

---

### 20.7 Error Handling

- [x] Per-step error isolation
- [x] Human-readable error messages
- [x] Retry failed step
- [x] Skip step option

---

### 20.8 Performance

- [ ] Lazy execution
- [ ] Background execution
- [x] Progress indicator per step
- [x] Cancel running chain

## Phase 20.9: Built-in Chain Templates (Flows)

> Ready-to-use chaining presets (one-click).  
> Format: `Tool A → Tool B → Tool C ...`

---

## A. JSON / Data Flows

### A1. JSON Cleanup & Export

- [x] JSON Formatter → JSON Validator → JSON to CSV → Export CSV
- [x] JSON Formatter → JSON Minifier → Copy to Clipboard
- [ ] JSON Formatter → Data Masking (JSON) → Export JSON
- [ ] JSON Diff → Export Report (TXT/MD)

### A2. JSON ↔ Other Formats

- [x] JSON Formatter → JSON ⇄ YAML (to YAML) → Export YAML
- [x] JSON Formatter → JSON ⇄ XML (to XML) → Export XML
- [x] YAML ⇄ JSON (to JSON) → JSON Validator → Export JSON
- [ ] XML ⇄ JSON (to JSON) → JSON Formatter → Export JSON

### A3. Token / JWT Workflows

- [ ] JWT Parser → JSON Formatter → Copy Claims
- [ ] JWT Parser → Data Masking (JSON) → Export JSON
- [ ] Bearer Token Generator → Copy to Clipboard

---

## B. URL / Web Flows

### B1. URL Inspection

- [ ] URL Decode → URL Parser → URL Query String Parser → Export Report
- [ ] URL Parser → UTM Builder → Copy Result URL
- [x] URL Decode → Outlook Safelink Decoder → URL Parser → Export

### B2. Web Headers & Agents

- [x] User-Agent Parser → Device Information → Export Report (JSON)

### B3. SEO / Metadata

- [x] Meta Tags Generator → Open Graph Meta Generator → Export HTML
- [x] Robots.txt Generator → Sitemap Generator → Export Files
- [x] Structured Data (JSON-LD) Generator → JSON Validator → Export JSON-LD

---

## C. Security / Privacy Flows

### C1. Secrets & Redaction

- [ ] Secrets Scanner (Text/JSON) → Data Masking → Export Sanitized Output
- [ ] Text Input → Regex Replace → Data Masking → Export TXT/MD

### C2. Password & Keys

- [ ] Password Strength Analyzer → Password Policy Tester → Export Report
- [ ] Password Strength Analyzer → Password Policy Tester → Export Report
- [x] Token Generator → Hash Generator → Copy / Export

### C3. Certificates

- [ ] PEM/DER Converter → X.509 Certificate Parser → Export Report
- [ ] CSR Generator → Export CSR + Private Key

---

## D. Dev / Code Flows

### D1. Logs & Debug

- [ ] Log Text → Data Masking → Error Log Analyzer → Export Report
- [ ] Log Text → Regex Tester → Export Patterns

### D2. Docker & Infra

- [x] Docker run → docker-compose Converter → YAML Formatter → Export docker-compose.yml
- [ ] YAML Formatter → Kubernetes YAML Validator → Export Validated YAML

### D3. Dates & IDs

- [ ] Date-time Converter → Export ISO8601
- [x] UUID Generator → Copy
- [ ] ULID Generator → Copy

---

## E. Image Flows

### E1. Optimize & Convert

- [x] Image Import → Image Compressor → Image Format Converter → Export Image
- [x] Image Import → Image Resize → Image Compressor → Export

### E2. Privacy & Metadata

- [ ] Image Import → Image Metadata Viewer → Image Metadata Remover → Export Clean Image

### E3. Sharing

- [ ] Image Import → Watermark → Resize for Social Preset → Export

### E4. Visual Transform

- [x] Image Import → Image to ASCII Art → Export TXT/MD
- [x] Image Import → Base64 Image Encoder → Copy Data URI

---

## F. Screenshot (Xnapper) Flows

### F1. Quick Redaction

- [ ] Screenshot Capture → OCR Detection → Regex Redaction → Export PNG
- [ ] Screenshot Capture → Manual Redaction → Export PNG

### F2. Social Share

- [ ] Screenshot Capture → Background Generator (blur/gradient) → Annotation → Export Social Preset
- [ ] Screenshot Capture → Auto Balance → Resize Preset → Copy to Clipboard

### F3. Documentation

- [ ] Screenshot Capture → Annotation → Watermark → Export PNG
- [ ] Screenshot Capture → OCR → Export Text (TXT/MD)

---

## G. PDF Flows

### G1. Split / Merge

- [ ] PDF Import → Page Extractor → Export PDF
- [ ] PDF Import → Splitter → Export PDFs
- [ ] PDF Merger → Compressor → Export PDF

### G2. Cleanup & Privacy

- [ ] PDF Import → Metadata Viewer → Metadata Remover → Export Clean PDF
- [ ] PDF Import → Watermarker → Page Numbering → Export PDF

### G3. Convert

- [ ] PDF Import → PDF to Images → Export Images
- [ ] Images to PDF → Compressor → Export PDF

---

## H. Universal Export End-Nodes

- [ ] Copy to Clipboard
- [ ] Save to File
- [ ] Export TXT / MD
- [ ] Export JSON / YAML / XML / CSV
- [ ] Export PNG / JPG / WebP
- [ ] Export PDF
- [ ] Share (OS)

## Phase 21: Workflow, Automation & Power User Features

### 21.1 Workflow Engine (No-code)

- [ ] Workflow definition schema (steps, conditions)
- [ ] Conditional branching (if / else)
- [ ] Parallel steps support
- [ ] Delay / wait step
- [ ] Reusable sub-workflows
- [ ] Workflow execution history
- [ ] Workflow error recovery
- [ ] Workflow versioning

---

### 21.2 Tool Chaining Enhancements

- [ ] Chain variables (store intermediate results)
- [ ] Named outputs (output.json, output.csv)
- [ ] Partial chain execution (run from step X)
- [ ] Chain input parameters
- [ ] Chain validation before run
- [ ] Chain dry-run mode
- [ ] Chain performance profiling

---

### 21.3 Presets, Templates & Sharing

- [ ] Global presets system (tool + chain)
- [ ] Preset tagging & search
- [ ] Duplicate / fork preset
- [ ] Export / import presets
- [ ] Share preset via file / link
- [ ] Preset permissions (read-only / editable)
- [ ] Preset marketplace (local/community)

---

## Phase 22: Project / Workspace Mode

### 22.1 Project Context

- [ ] Project workspace (folder-based)
- [ ] Project-level environment variables
- [ ] Project secrets vault (local encrypted)
- [ ] Project-specific tool history
- [ ] Project presets & workflows
- [ ] Switch project quickly

---

### 22.2 File-Aware Tools

- [ ] Run tools on entire folder
- [ ] Batch processing for chains
- [ ] Folder watch (auto-run workflow)
- [ ] Ignore rules (.gitignore-like)
- [ ] Output folder management

---

## Phase 23: CLI, Automation & Headless Mode

### 23.1 CLI Companion

- [ ] CLI binary (devtools-cli)
- [ ] Run tool from CLI
- [ ] Run chain from CLI
- [ ] Run workflow from CLI
- [ ] Pipe stdin → tool → stdout
- [ ] Export CLI results
- [ ] CLI config & profiles

---

### 23.2 Headless / Script Mode

- [ ] Headless execution engine
- [ ] JSON-based execution API
- [ ] Scriptable chains
- [ ] Background execution
- [ ] Exit codes & error mapping

---

## Phase 24: Developer Platform / Extensibility

### 24.1 Plugin System

- [ ] Plugin SDK (tool / chain / UI)
- [ ] Plugin lifecycle (install, update, remove)
- [ ] Plugin permission model
- [ ] Plugin sandboxing
- [ ] Plugin version compatibility
- [ ] Plugin registry (local / remote)

---

### 24.2 Tool SDK

- [ ] Tool authoring template
- [ ] Tool IO contract validator
- [ ] Tool test harness
- [ ] Tool documentation generator
- [ ] Tool schema linting

---

## Phase 25: Intelligence & Smart UX (Non-AI-heavy)

### 25.1 Smart Suggestions

- [ ] Suggest next tool in chain
- [ ] Suggest workflow from history
- [ ] Detect repeated manual actions
- [ ] Recommend automation
- [ ] Tool misuse warnings

---

### 25.2 Insight & Feedback

- [ ] Local usage analytics (privacy-first)
- [ ] Tool performance metrics
- [ ] Slow

## Phase 21: Workflow, Automation & Power User Features

### 21.1 Workflow Engine (No-code)

- [ ] Workflow definition schema (steps, conditions)
- [ ] Conditional branching (if / else)
- [ ] Parallel steps support
- [ ] Delay / wait step
- [ ] Reusable sub-workflows
- [ ] Workflow execution history
- [ ] Workflow error recovery
- [ ] Workflow versioning

---

### 21.2 Tool Chaining Enhancements

- [ ] Chain variables (store intermediate results)
- [ ] Named outputs (output.json, output.csv)
- [ ] Partial chain execution (run from step X)
- [ ] Chain input parameters
- [ ] Chain validation before run
- [ ] Chain dry-run mode
- [ ] Chain performance profiling

---

### 21.3 Presets, Templates & Sharing

- [ ] Global presets system (tool + chain)
- [ ] Preset tagging & search
- [ ] Duplicate / fork preset
- [ ] Export / import presets
- [ ] Share preset via file / link
- [ ] Preset permissions (read-only / editable)
- [ ] Preset marketplace (local/community)

---

## Phase 22: Project / Workspace Mode

### 22.1 Project Context

- [ ] Project workspace (folder-based)
- [ ] Project-level environment variables
- [ ] Project secrets vault (local encrypted)
- [ ] Project-specific tool history
- [ ] Project presets & workflows
- [ ] Switch project quickly

---

### 22.2 File-Aware Tools

- [ ] Run tools on entire folder
- [ ] Batch processing for chains
- [ ] Folder watch (auto-run workflow)
- [ ] Ignore rules (.gitignore-like)
- [ ] Output folder management

---

## Phase 23: CLI, Automation & Headless Mode

### 23.1 CLI Companion

- [ ] CLI binary (devtools-cli)
- [ ] Run tool from CLI
- [ ] Run chain from CLI
- [ ] Run workflow from CLI
- [ ] Pipe stdin → tool → stdout
- [ ] Export CLI results
- [ ] CLI config & profiles

---

### 23.2 Headless / Script Mode

- [ ] Headless execution engine
- [ ] JSON-based execution API
- [ ] Scriptable chains
- [ ] Background execution
- [ ] Exit codes & error mapping

---

## Phase 24: Developer Platform / Extensibility

### 24.1 Plugin System

- [ ] Plugin SDK (tool / chain / UI)
- [ ] Plugin lifecycle (install, update, remove)
- [ ] Plugin permission model
- [ ] Plugin sandboxing
- [ ] Plugin version compatibility
- [ ] Plugin registry (local / remote)

---

### 24.2 Tool SDK

- [ ] Tool authoring template
- [ ] Tool IO contract validator
- [ ] Tool test harness
- [ ] Tool documentation generator
- [ ] Tool schema linting

---

## Phase 25: Intelligence & Smart UX (Non-AI-heavy)

### 25.1 Smart Suggestions

- [ ] Suggest next tool in chain
- [ ] Suggest workflow from history
- [ ] Detect repeated manual actions
- [ ] Recommend automation
- [ ] Tool misuse warnings

---

### 25.2 Insight & Feedback

- [ ] Local usage analytics (privacy-first)
- [ ] Tool performance metrics
- [ ] Slow tool detection
- [ ] UX friction detection
- [ ] Debug insights panel

---

## Phase 26: Collaboration & Sharing (Optional)

- [ ] Share workflow/preset files
- [ ] Team workspace (local sync)
- [ ] Read-only shared tools
- [ ] Audit log for shared actions
- [ ] Export reports for team use

---

## Phase 27: Product-Grade UX & Trust

### 27.1 Reliability

- [ ] Crash recovery (restore state)
- [ ] Safe mode startup
- [ ] Tool isolation (one tool crash ≠ app crash)
- [ ] Background task recovery

---

### 27.2 Trust & Transparency

- [ ] Privacy dashboard
- [ ] Offline guarantee mode
- [ ] Permission inspector (filesystem, network)
- [ ] Tool capability manifest
- [ ] User-facing security model docs

## Phase 28: Folder-aware Batch Tools (Project Mode + Batch Pipeline)

### 28.1 Core Concepts & Data Model

- [ ] Define Workspace concept (root folder + config)
- [ ] Define FileTarget (path, type, size, hash, metadata)
- [ ] Define BatchJob (id, tool/chain/workflow, inputs, outputs, status)
- [ ] Define BatchResult (per-file output + errors + timings)
- [ ] Define Ignore Rules (.devtoolsignore + .gitignore support)

---

### 28.2 File Discovery & Indexing

- [ ] Folder picker integration (Electron)
- [ ] Recursive scan with filters (extension, size, depth)
- [ ] Fast file indexing cache (mtime + size + hash optional)
- [ ] Incremental rescan (only changed files)
- [ ] File type detection (by ext + magic bytes where needed)
- [ ] “Dry scan” preview (show what will be processed)

---

### 28.3 Batch Execution Engine

- [ ] BatchRunner (queue + concurrency limit)
- [ ] Per-file task execution (tool.run / chain.run)
- [ ] Concurrency controls (CPU-bound vs IO-bound)
- [ ] Cancellation (job-level + per-file)
- [ ] Pause / resume
- [ ] Retry policy (N retries, backoff)
- [ ] Timeout guard for long operations
- [ ] Progress model (processed/total, ETA, speed)

---

### 28.4 Output Management

- [ ] Output folder strategy (mirror structure / flat / custom)
- [ ] Collision strategy (overwrite / rename / skip)
- [ ] Deterministic naming (sanitize + suffix)
- [ ] Generate report (JSON/CSV/MD summary)
- [ ] “Open output folder” quick action
- [ ] Output preview for first N items

---

### 28.5 Watch Mode (Optional but powerful)

- [ ] Folder watcher (chokidar in main process)
- [ ] Debounced change events
- [ ] Auto-run workflow/chain on changes
- [ ] Safe guards (ignore output folder to avoid loops)
- [ ] Notification + activity log

---

### 28.6 UI / UX for Batch

- [ ] Batch Mode toggle per tool/chain
- [ ] “Select Folder” + filter bar (ext, size, modified time)
- [ ] File list preview (virtualized)
- [ ] “Run” + “Dry-run” buttons
- [ ] Batch progress panel (overall + per-file)
- [ ] Error panel (group by error type)
- [ ] “Re-run failed only”
- [ ] “Export report” (JSON/CSV/MD)

---

### 28.7 Safety & Permissions

- [ ] Read-only mode by default
- [ ] Confirm destructive operations (delete/overwrite)
- [ ] Safe path checks (prevent processing system folders)
- [ ] Sandboxed temp directory for intermediate files
- [ ] Audit log of file operations
- [ ] Optional encryption for stored batch history

---

### 28.8 Batch-ready Tool Adapters

- [ ] Define Tool IO contract supports file inputs/outputs
- [ ] Add adapters for common groups:
- [ ] Images: convert/compress/resize/metadata-remove (batch)
- [ ] PDFs: merge/split/compress/watermark (batch)
- [ ] Text/JSON: format/mask/convert/export (batch)
- [ ] Universal downloader: batch URL list support

## Phase 29: Plugin System (Implementation Plan)

### 29.1 Manifest & Validation

- [ ] Define plugin.json schema (zod)
- [ ] Define ToolDefinition vNext (accepts/produces/batch)
- [ ] Add apiVersion compatibility checks
- [ ] Add toolId namespacing policy

### 29.2 Install / Uninstall

- [ ] Install from .devtools-plugin (zip)
- [ ] Verify checksum / integrity
- [ ] Versioned install directories
- [ ] Uninstall flow (remove files + state option)

### 29.3 Registry Integration

- [ ] Merge plugin tools into tool registry
- [ ] Merge chain templates and workflows
- [ ] Plugin tools appear in search/sidebar/favorites
- [ ] Tool chaining compatibility computed from accepts/produces

### 29.4 Runtime Sandbox

- [ ] Spawn isolated runtime process per plugin (lazy)
- [ ] Define IPC message contract + zod validation
- [ ] Implement permissioned host APIs (fs/network/clipboard)
- [ ] Crash isolation + auto-disable on repeated crashes

### 29.5 UI Rendering (Schema-driven)

- [ ] Define UI schema format (ui.json)
- [ ] Build schema renderer components
- [ ] Map UI actions → tool.run calls
- [ ] Output renderer (text/json/table/file)

### 29.6 Plugin Manager UI

- [ ] Installed plugins list
- [ ] Enable/disable toggle
- [ ] Permissions viewer
- [ ] Plugin logs viewer
- [ ] Safe mode actions (disable all / disable last)

### 29.7 Developer Mode

- [ ] Load plugin from folder
- [ ] Hot reload (restart runtime)
- [ ] Validate manifest & UI schema
- [ ] Example plugin templates (hello-tool)

### 29.8 Stability & Security

- [ ] Path allowlist enforcement
- [ ] Network allowlist enforcement
- [ ] Rate limit host APIs (optional)
- [ ] Audit log for plugin actions

## Phase 30: Workflow System (No-code Automation)

### 30.1 Workflow Schema & Validation

- [ ] Define Workflow schema (id, name, triggers, inputs, steps, variables)
- [ ] Define Step schema (tool.run, chain.run, condition.if, batch.\*)
- [ ] Add schema validation (zod)
- [ ] Add versioning + migration strategy

---

### 30.2 Workflow Runner (Engine)

- [ ] Implement step executor interface
- [ ] Implement variable resolver (${vars}, ${inputs}, ${workspace})
- [ ] Step status model (pending/running/success/failed/skipped)
- [ ] Logs + timings + artifacts per step
- [ ] Cancellation support
- [ ] Retry policy (per-step)
- [ ] “Continue on error” mode

---

### 30.3 Triggers (MVP)

- [ ] Manual trigger (Run button)
- [ ] Folder watch trigger (debounce + ignore output folder)
- [ ] Schedule trigger (optional for MVP)

---

### 30.4 Batch Integration

- [ ] batch.scan (folder scan + filters)
- [ ] batch.runTool (apply tool to items + concurrency)
- [ ] batch.export (output folder + collision strategy)
- [ ] “Re-run failed only”

---

### 30.5 UI: Workflow Manager

- [ ] Workflow list (create/duplicate/delete)
- [ ] Enable/disable workflows
- [ ] Import/export workflow JSON
- [ ] Workflow run history

---

### 30.6 UI: Workflow Editor (MVP list-based)

- [ ] Add step menu (Tool / Chain / Condition / Batch)
- [ ] Step config panels
- [ ] Validation errors inline
- [ ] Test run (run selected step / run all)

---

### 30.7 Templates

- [ ] Ship built-in workflow templates
- [ ] “Create from template” UX
- [ ] Tag + search templates

---

### 30.8 Safety & Reliability

- [ ] Safe path rules (avoid system folders)
- [ ] Audit log for file writes
- [ ] Crash recovery (restore running workflow state)
- [ ] Safe mode (disable all workflows)

## Phase 31: Performance Optimization (App-wide)

### 31.1 Measure First (Profiling)

- [ ] Add perf marks (tool run start/end, render times)
- [ ] Add FPS + memory overlay (dev-only)
- [ ] React Profiler pass (identify top re-render components)
- [ ] Electron performance tracing baseline
- [ ] Bundle analyzer baseline (Vite)

---

### 31.2 React Rendering Optimizations

- [ ] Add React.memo for heavy components (Sidebar lists, ToolPane, OutputView)
- [ ] Memoize derived values (useMemo) + stable callbacks (useCallback)
- [ ] Split large components into smaller memoized blocks
- [ ] Avoid passing new object/array props each render
- [ ] Replace expensive effects with event-driven updates

---

### 31.3 Zustand Optimizations

- [ ] Use minimal selectors everywhere (no large object selects)
- [ ] Use shallow compare for multi-field selects
- [ ] Normalize store state (maps by id)
- [ ] Avoid storing large derived data in store (compute in view layer)
- [ ] Persist middleware: debounce writes + store only necessary keys

---

### 31.4 Output & Large Data Handling

- [ ] Virtualize output text (line-based)
- [ ] Virtualize JSON viewer (expand-based + windowing)
- [ ] Virtualize tables (rows; columns if needed)
- [ ] Progressive render for huge outputs (chunk append)
- [ ] Add output size guards (warn + “show more”)
- [ ] Add “copy/export without rendering” for huge payloads

---

### 31.5 IPC & Realtime Streams

- [ ] Throttle IPC updates (500–1000ms UI)
- [ ] Visible-only updates (active tool/module only)
- [ ] Pause updates when minimized/blurred
- [ ] Send diffs instead of full payloads when possible
- [ ] Batch IPC messages (coalesce)

---

### 31.6 Heavy Work Off Main Thread

- [ ] Move CPU-heavy tasks to worker threads / child process
- [ ] Use Web Workers in renderer for parsing/formatting large text
- [ ] Avoid blocking UI with JSON parse/pretty print (chunked)
- [ ] Stream file processing for batch tools

---

### 31.7 CodeMirror Performance

- [ ] Debounce editor onChange (e.g. 150–300ms)
- [ ] Avoid controlled editor for huge text (use internal state)
- [ ] Disable expensive extensions for large docs
- [ ] Use viewport-only rendering settings where possible

---

### 31.8 Fabric / Canvas (Xnapper) Performance

- [ ] Limit canvas re-render frequency (requestAnimationFrame batching)
- [ ] Cache objects where possible (fabric objectCaching)
- [ ] Downscale preview while editing, full-res on export
- [ ] Avoid huge blurred backgrounds in-canvas; pre-render background
- [ ] Release canvas resources on tool switch

---

### 31.9 Styling & GPU (Glassmorphism)

- [ ] Reduce backdrop-filter usage (count + area)
- [ ] Prefer transform/opacity animations over blur/shadow
- [ ] Add Low Graphics Mode toggle
- [ ] Reduce box-shadow layers
- [ ] Use will-change carefully (only during animations)

---

### 31.10 Bundle & Startup

- [ ] Route-level code splitting for all tools
- [ ] Lazy load heavy deps (tesseract, fabric, crypto libs)
- [ ] Preload only critical routes/components
- [ ] Cache tool modules after first load
- [ ] Optimize asset loading (icons, fonts)

---

### 31.11 Memory & Cleanup

- [ ] Cap history sizes (per tool + total)
- [ ] Use LRU cache for large outputs
- [ ] Release large buffers after export
- [ ] Prevent image blob leaks (revokeObjectURL)
- [ ] Add memory leak checks for canvas/editor mounts
