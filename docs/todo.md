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
- [ ] Encrypt/decrypt text (TripleDES, Rabbit, RC4)
- [ ] BIP39 passphrase generator
- [ ] RSA key pair generator
- [ ] RSA encryption/decryption
- [ ] RSA signature generator/verifier
- [ ] PBKDF2 key derivation
- [ ] Argon2 password hashing (Argon2id, Argon2i, Argon2d)
- [ ] Scrypt key derivation
- [ ] ECDSA key pair generator
- [ ] ECDSA signature generator/verifier
- [ ] Ed25519 key pair generator
- [ ] Ed25519 signature generator/verifier
- [ ] X25519 key exchange generator
- [ ] X.509 certificate parser/validator
- [ ] CSR (Certificate Signing Request) generator
- [ ] PEM/DER format converter
- [ ] ChaCha20 encryption
- [ ] Twofish encryption
- [ ] Blowfish encryption
- [ ] Fernet encryption

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
- [ ] Device information
- [ ] Open Graph meta generator
- [ ] OTP code generator (TOTP)
- [ ] MIME types lookup
- [ ] Keycode info
- [ ] HTML WYSIWYG editor
- [ ] Outlook Safelink decoder
- [ ] URL shortener/expander
- [ ] UTM parameter builder
- [ ] URL query string parser
- [ ] HTTP headers parser
- [ ] HTTP request builder
- [ ] CORS checker
- [ ] Content Security Policy (CSP) generator
- [ ] HSTS checker
- [ ] Meta tags generator
- [ ] Robots.txt generator
- [ ] Sitemap generator
- [ ] Structured Data (JSON-LD) generator
- [ ] Canonical URL generator
- [ ] Bearer token generator
- [ ] API key generator
- [ ] Security headers checker
- [ ] Base64 URL encoder/decoder
- [ ] Percent encoding
- [ ] Unicode encoder/decoder
- [ ] Cookie parser
- [ ] Set-Cookie header generator
- [ ] Content-Type parser
- [ ] Accept header builder
- [ ] User-Agent switcher
- [ ] Referrer Policy generator
- [ ] Feature Policy generator
- [ ] Favicon generator
- [ ] Manifest.json generator
- [ ] Service Worker generator
- [ ] PWA checklist

### 3.4 Development Tools

- [ ] JSON prettify and format
- [ ] JSON minify
- [x] JSON to CSV
- [x] SQL prettify and format
- [ ] YAML prettify and format
- [x] XML formatter
- [x] Regex Tester
- [x] Crontab generator
- [x] Docker run → docker-compose converter
- [x] Chmod calculator
- [ ] Email normalizer

### 3.5 Text Tools

- [ ] Lorem ipsum generator
- [ ] Text statistics
- [ ] Text diff
- [ ] String obfuscator
- [ ] Case converter
- [ ] ASCII Art Text Generator

### 3.6 Network Tools

- [x] IPv4 subnet calculator
- [x] IPv4 address converter
- [x] MAC address generator
- [x] MAC address lookup

### 3.7 Math & Measurement Tools

- [ ] Math evaluator
- [ ] Percentage calculator
- [ ] Temperature converter
- [ ] Chronometer

### 3.8 Image Tools

- [ ] QR Code generator
- [ ] WiFi QR Code generator
- [ ] SVG placeholder generator
- [ ] Camera recorder (capture ảnh/video từ webcam)
- [ ] Image Format Converter (PNG, JPG, WebP, AVIF, SVG, etc.)
- [ ] HEIC to JPG Converter
- [ ] ICO Generator (favicon)
- [ ] WebP Converter
- [ ] AVIF Converter
- [ ] Image Compressor (JPG, PNG, WebP)
- [ ] Lossless Image Compressor
- [ ] Lossy Image Compressor (adjustable quality)
- [ ] Bulk Image Compressor
- [ ] Image Cropper
- [ ] Image Resizer (with aspect ratio options)
- [ ] Image Rotator (90°, 180°, 270°)
- [ ] Image Flipper (horizontal/vertical)
- [ ] Image Cropper with Aspect Ratio (16:9, 4:3, 1:1, etc.)
- [ ] Image Filter Applier (blur, sharpen, grayscale, sepia, etc.)
- [ ] Image Brightness/Contrast Adjuster
- [ ] Image Color Adjuster (saturation, hue, etc.)
- [ ] Image Watermarker (text/image watermark)
- [ ] Image Metadata Viewer (EXIF, metadata)
- [ ] Image Metadata Remover (privacy)
- [ ] Image Color Palette Extractor
- [ ] Image Dominant Color Extractor
- [ ] Image Dimension Analyzer
- [ ] Barcode Generator
- [ ] Data URI Generator (image to base64)
- [ ] Base64 Image Encoder/Decoder
- [ ] Gradient Generator
- [ ] Pattern Generator (dots, lines, etc.)
- [ ] Image Merger (horizontal/vertical)
- [ ] Image Splitter
- [ ] Image Comparator (side-by-side, diff)
- [ ] Image Optimizer (auto format, compression)
- [ ] Responsive Image Generator (multiple sizes)
- [ ] Image OCR (text recognition)
- [ ] Image to ASCII Art Converter
- [ ] Image to SVG Converter (vectorization)
- [ ] Image Background Remover
- [ ] Image Upscaler (AI-based)
- [ ] Video to GIF Converter
- [ ] GIF Optimizer
- [ ] Video Frame Extractor

### 3.9 Data Tools

- [ ] Phone parser and formatter
- [ ] IBAN validator and parser

### 3.10 PDF Tools

- [ ] PDF signature checker
- [ ] PDF to Images (PNG/JPG)
- [ ] Images to PDF
- [ ] PDF to Text
- [ ] PDF to HTML
- [ ] PDF to Markdown
- [ ] HTML to PDF
- [ ] Markdown to PDF
- [ ] Word/DOCX to PDF
- [ ] PDF to Word/DOCX
- [ ] PDF Merger
- [ ] PDF Splitter
- [ ] PDF Page Extractor
- [ ] PDF Page Rotator
- [ ] PDF Page Reorder
- [ ] PDF Compressor
- [ ] PDF Optimizer
- [ ] PDF Watermarker (text/image)
- [ ] PDF Page Numbering
- [ ] PDF Password Protector
- [ ] PDF Password Remover
- [ ] PDF Encryption
- [ ] PDF Decryption
- [ ] PDF Metadata Remover
- [ ] PDF Metadata Viewer
- [ ] PDF Metadata Editor
- [ ] PDF Page Counter
- [ ] PDF File Size Analyzer
- [ ] PDF Structure Viewer
- [ ] PDF Font Extractor
- [ ] PDF Image Extractor
- [ ] PDF Form Filler
- [ ] PDF Form Creator
- [ ] PDF Form Field Extractor
- [ ] PDF OCR (text recognition)
- [ ] PDF Redaction
- [ ] PDF Annotation
- [ ] PDF Bookmark Generator
- [ ] PDF Table Extractor
- [ ] PDF Comparison (diff)
- [ ] PDF Preview
- [ ] PDF Thumbnail Generator
- [ ] PDF to Base64
- [ ] Base64 to PDF
- [ ] PDF Validator

---

## Phase 4: Polish & Advanced Features

### 4.1 Animations & Transitions

- [ ] Add Framer Motion animations
- [ ] Implement status pulse animation (Dynamic Island)
- [ ] Add hover transitions
- [ ] Add focus effects
- [ ] Add page transitions
- [ ] Optimize animation performance

### 4.2 Dynamic Island

- [ ] Complete Dynamic Island component
- [ ] Add status indicators
- [ ] Add latency display
- [ ] Add active tool indicator
- [ ] Implement pulse animation
- [ ] Test on different screen sizes

### 4.3 Keyboard Shortcuts

- [ ] Implement Cmd/Ctrl + K for search
- [ ] Add tool-specific shortcuts
- [ ] Add navigation shortcuts
- [ ] Create shortcuts help modal
- [ ] Store shortcuts in settings

### 4.4 Settings & Persistence

- [x] Create Settings UI
- [x] Implement preferences storage
- [x] Add theme settings (if needed)
- [x] Refactor components for Light/Dark mode support
- [x] Add window state persistence
- [x] Add tool history persistence
- [x] Test persistence across app restarts

## 5. Performance Improvements
- [x] Optimize Dynamic Island animations (GPU acceleration, remove expensive blur)
- [x] Implement Lazy Loading for routes (SettingsPage)
- [ ] Implement virtualization for large data outputs (future)
- [ ] Optimize sidebar re-renders with Memoization (future)

### 4.5 Tool Search & Filter

- [ ] Implement search functionality
- [ ] Add filter by category
- [ ] Add recent tools section
- [ ] Add favorites system
- [ ] Implement tool sorting
- [ ] Test search performance

### 4.6 History & Favorites

- [ ] Create history store
- [ ] Implement tool usage history
- [ ] Add favorites functionality
- [ ] Create history UI
- [ ] Add clear history option
- [ ] Test history persistence

### 4.7 Export/Import

- [ ] Implement export tool data
- [ ] Implement import tool data
- [ ] Add export settings
- [ ] Add backup/restore functionality
- [ ] Test export/import flow

### 4.8 File Handling

- [ ] Implement drag & drop for files
- [ ] Add file picker integration
- [ ] Handle file reading (Electron IPC)
- [ ] Handle file saving (Electron IPC)
- [ ] Test file operations

### 4.9 Toast Notifications

- [ ] Integrate Sonner
- [ ] Add toast for copy actions
- [ ] Add toast for download actions
- [ ] Add toast for errors
- [ ] Add toast for success messages
- [ ] Style toasts with glassmorphism

---

## Phase 5: Performance & Optimization

### 5.1 Performance Optimizations

- [ ] Implement virtual scrolling for long lists
- [ ] Add lazy loading for tool components
- [ ] Add React.memo for expensive components
- [ ] Implement debouncing for input handlers
- [ ] Optimize Zustand selectors
- [ ] Test performance with large data

### 5.2 Code Optimization

- [ ] Review and optimize bundle size
- [ ] Implement code splitting
- [ ] Optimize images and assets
- [ ] Remove unused dependencies
- [ ] Optimize Electron main process

### 5.3 Error Handling

- [ ] Add error boundaries
- [ ] Implement error logging
- [ ] Add user-friendly error messages
- [ ] Handle network errors (if applicable)
- [ ] Test error scenarios

### 5.4 Testing

- [ ] Write unit tests for utilities
- [ ] Write component tests
- [ ] Write integration tests for tools
- [ ] Test Electron IPC communication
- [ ] Test cross-platform compatibility

---

## Phase 6: Build & Distribution

### 6.1 Build Configuration

- [ ] Finalize electron-builder.yml
- [ ] Configure Windows build (NSIS)
- [ ] Configure macOS build (DMG)
- [ ] Setup code signing (macOS)
- [ ] Setup notarization (macOS)
- [ ] Test build process

### 6.2 Auto-updater

- [ ] Complete auto-updater implementation
- [ ] Setup update server/endpoint
- [ ] Test update flow
- [ ] Add update notifications
- [ ] Handle update errors

### 6.3 Documentation

- [ ] Create README.md
- [ ] Document installation process
- [ ] Document tool usage
- [ ] Create changelog
- [ ] Add screenshots/demos

### 6.4 Release Preparation

- [ ] Version bumping
- [ ] Create release notes
- [ ] Test on Windows
- [ ] Test on macOS
- [ ] Final QA testing
- [ ] Create release build

---

## Ongoing Tasks

### Maintenance

- [ ] Monitor error logs
- [ ] Update dependencies regularly
- [ ] Fix reported bugs
- [ ] Add requested features
- [ ] Performance monitoring

### Future Enhancements

- [ ] Additional tools (based on feedback)
- [ ] Plugin system (if needed)
- [ ] Cloud sync (optional)
- [ ] Multi-language support (if needed)
- [ ] Advanced customization options

---

## Notes

- Prioritize Phase 1 and Phase 2 for MVP
- Each tool should be isolated and testable
- Follow glassmorphism design consistently
- Ensure all tools work client-side (privacy)
- Test on both Windows and macOS
- Keep bundle size optimized
- Document all tools with examples
