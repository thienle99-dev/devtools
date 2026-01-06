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

- [x] JSON prettify and format (JsonFormatter tool)
- [x] JSON minify (JsonFormatter tool)
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

- [ ] Lorem ipsum generator
- [ ] Text statistics
- [ ] Text diff
- [ ] String obfuscator
- [x] Case converter (CaseConverter tool in converters)
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

### 3.9 Screenshot Tools (Xnapper Clone)

#### Phase 1: Core Capture & Basic Processing

- [ ] Setup Xnapper tool structure (`src/tools/screenshot/`)
- [ ] Install dependencies (fabric, tesseract.js)
- [ ] Create Xnapper store (`src/store/xnapperStore.ts`)
- [ ] Implement Electron screen capture API integration
- [ ] Create CaptureSection component (full screen, window, area selection)
- [ ] Implement basic image preview
- [ ] Implement auto-balance enhancement
- [ ] Implement simple export (PNG/JPG)
- [ ] Implement save to file functionality
- [ ] Add to tools registry and sidebar

#### Phase 2: Redaction & Background

- [ ] Integrate Tesseract.js for OCR
- [ ] Implement regex pattern detection (email, IP, API keys)
- [ ] Create RedactionPanel component
- [ ] Implement redaction tools (blur, pixelate, solid overlay)
- [ ] Implement manual redaction area selection
- [ ] Create BackgroundPanel component
- [ ] Implement gradient background generator
- [ ] Implement image background support with blur effect
- [ ] Add background preview thumbnails

#### Phase 3: Annotations

- [ ] Integrate Fabric.js for canvas manipulation
- [ ] Create PreviewSection with Fabric.js canvas
- [ ] Implement arrow tool (straight, curved)
- [ ] Implement text tool with font selection
- [ ] Implement shape tools (rectangle, circle, ellipse)
- [ ] Implement blur tool for selective blur
- [ ] Implement crop tool for manual adjustment
- [ ] Create AnnotationToolbar component
- [ ] Implement undo/redo functionality
- [ ] Add color picker and size controls

#### Phase 4: Export & Share

- [ ] Create ExportPanel component
- [ ] Implement social media presets (Twitter, LinkedIn, Instagram, Facebook)
- [ ] Implement custom dimensions
- [ ] Implement quality settings (compression level)
- [ ] Implement format options (PNG, JPG, WebP)
- [ ] Implement copy to clipboard functionality
- [ ] Implement system share sheet integration (macOS)
- [ ] Create HistoryPanel component
- [ ] Implement screenshot history storage

#### Phase 5: Advanced Features

- [ ] Implement templates system
- [ ] Add preset saving functionality
- [ ] Implement batch processing (future)
- [ ] Add cloud upload (Imgur, Cloudinary) - future
- [ ] Implement AI background suggestions - future
- [ ] Add keyboard shortcuts
- [ ] Implement drag & drop image loading
- [ ] Add image comparison mode

### 3.10 Data Tools

- [ ] Phone parser and formatter
- [ ] IBAN validator and parser

### 3.11 PDF Tools

- [ ] PDF signature checker
- [ ] PDF to Images (PNG/JPG)
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
- [x] PDF Watermarker (text/image)
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
- [ ] PDF OCR (text recognition)
- [ ] PDF Redaction
- [ ] PDF Annotation
- [ ] PDF Bookmark Generator
- [ ] PDF Table Extractor
- [ ] PDF Comparison (diff)
- [ ] PDF Preview
- [ ] PDF Thumbnail Generator
- [x] PDF to Base64
- [x] Base64 to PDF
- [x] PDF Validator

---

## Phase 4: Polish & Advanced Features

### 4.1 Animations & Transitions

- [x] Add Framer Motion animations
- [ ] Implement status pulse animation (Dynamic Island)
- [x] Add hover transitions
- [x] Add focus effects
- [x] Add page transitions
- [x] Optimize animation performance

### 4.2 Dynamic Island

- [ ] Complete Dynamic Island component
- [ ] Add status indicators
- [ ] Add latency display
- [ ] Add active tool indicator
- [ ] Implement pulse animation
- [ ] Test on different screen sizes

### 4.3 Keyboard Shortcuts

- [x] Implement Cmd/Ctrl + K for search
- [x] Add tool-specific shortcuts
- [x] Add navigation shortcuts
- [x] Create shortcuts help modal
- [x] Store shortcuts in settings

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

- [x] Implement search functionality
- [x] Add filter by category
- [x] Add recent tools section
- [x] Add favorites system
- [x] Implement tool sorting
- [x] Test search performance

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

- [x] Integrate Sonner
- [x] Add toast for copy actions
- [x] Add toast for download actions
- [x] Add toast for errors
- [x] Add toast for success messages
- [x] Style toasts with glassmorphism

### 4.10 System Tray Support

- [x] Basic Tray Icon
- [x] Minimize to Tray
- [x] Context Menu (Show/Hide, Quit)
- [x] Settings (Toggle minimize/start)
- [x] Quick Access (Recent tools)

---

## Phase 5: Performance & Optimization

### 5.1 Performance Optimizations

- [x] Implement virtual scrolling for long lists (VirtualizedList component)
- [x] Add lazy loading for tool components
- [ ] Add React.memo for expensive components
- [x] Implement debouncing for input handlers
- [ ] Optimize Zustand selectors
- [ ] Test performance with large data

### 5.2 Code Optimization

- [x] Review and optimize bundle size
- [x] Implement code splitting
- [x] Optimize images and assets
- [x] Remove unused dependencies
- [x] Optimize Electron main process

### 5.3 Error Handling

- [x] Add error boundaries
- [x] Implement error logging
- [x] Add user-friendly error messages
- [x] Handle network errors (if applicable)
- [x] Test error scenarios

### 5.4 Testing

- [ ] Write unit tests for utilities
- [ ] Write component tests
- [ ] Write integration tests for tools
- [ ] Test Electron IPC communication
- [ ] Test cross-platform compatibility

---

## Phase 6: Build & Distribution

### 6.1 Build Configuration

- [x] Finalize electron-builder.yml
- [x] Configure Windows build (NSIS)
- [x] Configure macOS build (DMG)
- [x] Setup code signing (macOS)
- [x] Setup notarization (macOS)
- [x] Test build process

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

---

## Phase 7: System Cleaner Tool (mac-cleaner.md)

### 7.0 Core Features (Completed ✅)

- [x] Settings & Preferences panel (SettingsView with all preferences)
- [x] Welcome Screen / Onboarding (WelcomeScreen component with multi-step flow)
- [x] Keyboard Shortcuts (keyboardShortcuts.ts utility)
- [x] Browser Data Cleanup (Chrome, Firefox, Edge, Safari)
- [x] Wi-Fi Network Cleanup (Windows & macOS)
- [x] Search & Filter functionality (across all views)
- [x] Bulk Actions (Select All, Bulk Delete, Bulk Enable/Disable)
- [x] Better Empty States (enhanced ScanPlaceholder with tips and quick actions)
- [x] Smart Scan Improvements (real performance data, privacy scans, retry logic)
- [x] Progress Tracking (progressUtils.ts with ETA calculations)
- [x] Backup Management UI (BackupManagementView with CRUD operations)
- [x] Advanced Space Lens Features (export to JSON/CSV, snapshots, comparison)
- [x] Error Recovery (errorRecovery.ts with retry logic and batch processing)
- [x] Memory Management (VirtualizedList component, chunked processing)
- [x] Caching Strategy (cacheUtils.ts with TTL and size limits)
- [x] Type Safety (comprehensive types/index.ts with error types)

### 7.1 Testing & Quality Assurance

- [ ] Cross-platform testing (Windows 10/11, macOS Big Sur+)
- [ ] Safety testing (both platforms)
- [ ] Performance testing (memory leaks, CPU usage, large dataset handling)
- [ ] Unit tests for utilities, hooks, components
- [ ] Integration tests for IPC handlers, Electron main process
- [ ] E2E tests for critical user flows

### 7.2 Platform-Specific Features

#### Windows-Specific
- [ ] Windows Update Cleanup (remove old Windows Update files)
- [ ] System Restore Points management and cleanup
- [ ] Windows.old Cleanup (remove old Windows installation files)
- [ ] Registry Cleanup (safe registry cleanup with backups)
- [ ] Windows Defender Integration (use Windows Defender for malware scanning)
- [ ] Windows Services Management (enable/disable services)
- [ ] Task Scheduler Integration (schedule maintenance tasks)
- [ ] Windows Search Optimization (rebuild and optimize Windows Search index)

#### macOS-Specific
- [ ] Time Machine Management (clean up Time Machine snapshots)
- [ ] Spotlight Optimization (rebuild Spotlight index)
- [ ] Disk Permissions repair (if supported)
- [ ] Launch Services management (Launch Agents and Daemons)
- [ ] Gatekeeper Integration (check app security)
- [ ] iCloud Optimization (manage iCloud storage)
- [ ] Mail.app Optimization (rebuild Mail database)

### 7.3 Long-term Enhancements

- [ ] AI-Powered Recommendations (ML-based cleaning suggestions)
- [ ] Cloud Integration (sync settings across devices)
- [ ] Advanced Analytics (detailed usage statistics)
- [ ] Custom Scripts (user-defined maintenance scripts - PowerShell/AppleScript)
- [ ] Community Features (share safety rules, tips)
- [ ] Multi-language Support (internationalization)
- [ ] Enhanced Dark Mode
- [ ] Accessibility (full keyboard navigation, screen reader support)
- [ ] Linux Support (extend to Linux distributions)
- [ ] Remote Management (manage multiple devices)
- [ ] Scheduled Tasks (schedule automatic scans and maintenance)
- [ ] Export & Reports (export scan results, print-friendly reports, history logs)

### 7.4 App Updater

- [ ] App updater functionality (Windows Store/Chocolatey + macOS App Store)
- [ ] Update notification system
- [ ] Background update checks
- [ ] Update installation flow

---

## Phase 8: Xnapper/Screenshot Tool (xnapper.md)

### 8.1 Phase 1: Core Capture & Basic Processing

- [x] Setup Xnapper tool structure (`src/tools/screenshot/`)
- [x] Install dependencies (fabric, tesseract.js)
- [x] Create Xnapper store (`src/store/xnapperStore.ts`)
- [x] Implement Electron screen capture API integration
- [x] Create CaptureSection component (full screen, window, area selection)
- [x] Implement basic image preview
- [x] Implement auto-balance enhancement
- [x] Implement simple export (PNG/JPG)
- [x] Implement save to file functionality
- [x] Add to tools registry and sidebar

### 8.2 Phase 2: Redaction & Background

- [x] Integrate Tesseract.js for OCR
- [x] Implement regex pattern detection (email, IP, API keys)
- [x] Create RedactionPanel component
- [x] Implement redaction tools (blur, pixelate, solid overlay)
- [x] Implement manual redaction area selection
- [x] Create BackgroundPanel component
- [x] Implement gradient background generator
- [x] Implement image background support with blur effect
- [x] Add background preview thumbnails

### 8.3 Phase 3: Annotations

- [x] Integrate Fabric.js for canvas manipulation (utilities created)
- [x] Create PreviewSection with Fabric.js canvas
- [x] Implement arrow tool (straight, curved)
- [x] Implement text tool with font selection
- [x] Implement shape tools (rectangle, circle, ellipse)
- [x] Implement blur tool for selective blur
- [~] Implement crop tool for manual adjustment (Foundation laid, UI pending)
- [x] Create AnnotationToolbar component
- [x] Implement undo/redo functionality
- [x] Add color picker and size controls

### 8.4 Phase 4: Export & Share

- [ ] Create ExportPanel component
- [ ] Implement social media presets (Twitter, LinkedIn, Instagram, Facebook)
- [ ] Implement custom dimensions
- [ ] Implement quality settings (compression level)
- [ ] Implement format options (PNG, JPG, WebP)
- [ ] Implement copy to clipboard functionality
- [ ] Implement system share sheet integration (macOS)
- [ ] Create HistoryPanel component
- [ ] Implement screenshot history storage

### 8.5 Phase 5: Advanced Features

- [ ] Implement templates system
- [ ] Add preset saving functionality
- [ ] Implement batch processing (future)
- [ ] Add cloud upload (Imgur, Cloudinary) - future
- [ ] Implement AI background suggestions - future
- [ ] Add keyboard shortcuts
- [ ] Implement drag & drop image loading
- [ ] Add image comparison mode

---

## Phase 9: Stats Monitor Tool (stats-monitor.md)

### 9.1 Core Monitoring Modules

- [ ] CPU Module (real-time utilization, per-core usage, top processes, temperature, frequency)
- [ ] GPU Module (utilization, VRAM, temperature, active GPU detection)
- [ ] Memory Module (RAM usage, memory pressure, swap, breakdown)
- [ ] Disk Module (disk activity, space, I/O, SMART data)
- [ ] Network Module (in/out speeds, active connections, interface, data usage)
- [ ] Battery Module (level, status, time remaining, health)
- [ ] Sensors Module (temperature, voltage, power, fan speed)
- [ ] Bluetooth Module (connected devices, status, battery, signal strength)
- [ ] Time Zones Module (multiple time zones, world clock)

### 9.2 Menu Bar Integration

- [ ] Native menu bar dropdown
- [ ] Menu bar icon states (color-coded, animated)
- [ ] Real-time graphs in menu
- [ ] Quick actions (toggle modules)
- [ ] Settings modal functionality
- [ ] Module reordering (drag & drop)
- [ ] Customizable time zones

### 9.3 Additional Features

- [ ] Export metrics data
- [ ] Historical data charts
- [ ] Alerts/notifications
- [ ] Dark/Light theme toggle
- [ ] Module size customization
- [ ] Stats tray with dynamic icon
- [ ] Context menu integration

### 9.4 Implementation Tasks

- [ ] Add BluetoothStats, TimeZonesStats types
- [ ] Implement `get-bluetooth-stats` and `get-timezones-stats` IPC handlers
- [ ] Add getBluetoothStats and getTimeZonesStats to preload API
- [ ] Update useSystemMetrics hook
- [ ] Create BluetoothModule component
- [ ] Create TimeZonesModule component
- [ ] Add modules to StatsMonitor
- [ ] Create statsTray with dynamic icon

---

## Phase 10: Application Manager Tool (application-manager-plan.md)

### 10.1 Core Features

- [ ] Installed Apps Tab (list, search, filter, uninstall)
- [ ] Running Processes Tab (real-time monitoring, kill process)
- [ ] App Type Filter (All/User/System)
- [ ] Process Grouping (by name)
- [ ] Color-coded CPU/RAM usage
- [ ] Badge indicators for system vs user apps
- [ ] Confirmation dialogs for destructive actions

### 10.2 Implementation Tasks

- [ ] Create TypeScript types for InstalledApp and RunningProcess
- [ ] Implement backend IPC handlers (get-installed-apps, get-running-processes, uninstall-app, kill-process)
- [ ] Add appManagerAPI to preload
- [ ] Create useInstalledApps hook with filter logic
- [ ] Create useRunningProcesses hook with real-time updates
- [ ] Create InstalledAppsTab component
- [ ] Create RunningProcessesTab component
- [ ] Create UI components (AppCard, ProcessCard, ProcessMetrics, AppTypeFilter)
- [ ] Create main ApplicationManager component
- [ ] Register tool in tools registry

### 10.3 Safety & Performance

- [ ] Confirm before uninstall/kill actions
- [ ] Show warning for system processes/apps
- [ ] Require admin/elevated permissions where needed
- [ ] Log all destructive actions
- [ ] Prevent uninstall system critical apps
- [ ] Lazy load process list
- [ ] Virtual scrolling for large lists
- [ ] Debounce search input
- [ ] Cache installed apps
- [ ] Throttle process updates

---

## Phase 11: Clipboard Manager Enhancements (clipboard-manager.md)

### 11.1 Advanced Features

- [ ] Export/Import clipboard history (backup and restore)
- [ ] Clipboard sync across devices (future)
- [ ] Rich text support
- [ ] File clipboard support
- [ ] Clipboard monitoring service
- [ ] Auto-paste shortcuts
- [ ] Clipboard statistics and analytics

---

## Notes

- Prioritize Phase 1 and Phase 2 for MVP
- Each tool should be isolated and testable
- Follow glassmorphism design consistently
- Ensure all tools work client-side (privacy)
- Test on both Windows and macOS
- Keep bundle size optimized
- Document all tools with examples
- System Cleaner: Most features completed, focus on testing and platform-specific features
- Xnapper: Not started, high priority for developers/marketers
- Stats Monitor: Core modules implemented, need additional modules and menu bar integration
- Application Manager: Not started, useful for system management
