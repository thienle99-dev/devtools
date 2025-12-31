# Master Prompt - DevTools App Project

## Tổng quan dự án

**DevTools App** là một desktop application (Electron) cung cấp bộ công cụ phát triển web tương tự Dev Tools (dev-tool.dev) và IT Tools (it-tools.tech), được thiết kế cho backend developers cần xử lý nhanh các tác vụ phổ biến như format, convert, debug, và generate data.

---

## Mục tiêu chính

Ứng dụng hỗ trợ backend developer (Golang, PostgreSQL, AWS, Docker, AI tools) với các chức năng:

- **Phân tích / chuyển đổi dữ liệu:** JSON, Base64, CSV, SQL, timestamp, hash, crypto
- **Debug nhanh:** request/response, log, JWT, cron, regex, encoding
- **Tạo nội dung/cấu hình mẫu:** UUID, lorem text, color palette, cron, docker-compose

### Use cases thường gặp

- Format / validate JSON, SQL, YAML, XML
- Encode/decode Base64, URL, JWT
- Sinh UUID, password, token, hash, QR
- Chuyển đổi CSV ↔ JSON, JSON ↔ TypeScript, YAML ↔ JSON/TOML
- Tạo cron expression, regex pattern, docker-compose từ docker run

---

## Tech Stack

### Core
- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **Desktop:** Electron (Latest)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Aesthetic:** macOS 2026 Glassmorphism

### UI Components & Libraries
- **Code Editor:** CodeMirror (`@uiw/react-codemirror`)
- **Icons:** Lucide React (`lucide-react`)
- **Utilities:** `clsx` (conditional classes)
- **Animations:** Framer Motion (`framer-motion`)
- **Toast:** Sonner (`sonner`)

### Data Processing
- **Crypto:** `crypto-js`
- **Encoding:**
  - Base64: `js-base64`
  - YAML: `js-yaml`
  - XML: `xml2js`
- **JWT:** `jsonwebtoken`
- **CSV:** `papaparse`
- **JSON:** `json5`
- **Regex:** `xregexp`

### Electron Specific
- **Builder:** `electron-builder`
- **IPC:** Electron IPC (native)
- **Storage:** `electron-store`
- **Auto-updater:** Enabled
- **Platforms:** Windows, macOS

### Development Tools
- **Linting:** ESLint + Prettier
- **Testing:** Vitest
- **File Handling:** Native + Electron APIs

---

## Design System - macOS 2026 Glassmorphism

### Core Aesthetic

#### Glassmorphism
- **Backdrop blur:** `backdrop-blur-[40px]` (Tailwind: `backdrop-blur-2xl`)
- **Background:** `bg-white/8` (rgba(255, 255, 255, 0.08))
- **Layers:** Multiple translucent layers for depth

#### Shape & Corners
- **Main container:** `rounded-[36px]` (Squircle effect)
- **Panes:** `rounded-[20px]`
- **Buttons:** `rounded-[10px]`
- **Cards:** `rounded-2xl` or `rounded-3xl`

#### Depth & Shadows
- **Outer shadow:** `shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]`
- **Inner glow:** `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]`
- **Layered shadows:** Combine multiple shadow utilities

#### Borders
- **Ultra-thin:** `border border-white/15` (1px solid rgba(255, 255, 255, 0.15))
- **Hover state:** `border-white/25`

### Layout Structure

#### Main Container
- **Centered card:** `w-[95vw] h-[95vh]` floating on mesh gradient background
- **Position:** Centered with flexbox/grid
- **Background:** Deep Navy/Obsidian gradient with mesh pattern

#### Sidebar (Left)
- **Width:** `w-64` or `w-72`
- **Background:** Translucent glass effect
- **Traffic lights:** Red, Yellow, Green buttons (macOS window controls)
- **Navigation:** Category list with icons and hover effects
- **Scrollable:** Custom scrollbar styling

#### Header (Center)
- **Dynamic Island style:** Rounded pill shape
- **Status indicators:** Latency, connection status, active tool
- **Pulse animation:** Subtle pulse on status dot
- **Position:** Top center or integrated into sidebar

#### Workspace (Main)
- **Layout:** Vertical split (1:1 ratio)
- **Top Pane (Input):**
  - Label: "Source" or tool-specific label
  - Textarea/Code editor
  - Action buttons: Clear, Validate, Format
- **Bottom Pane (Output):**
  - Label: "Result"
  - Output display area
  - Action buttons: Copy, Download, Share
- **Flex behavior:** `flex-1` for equal space distribution

### Typography
- **Sans-serif:** "Inter" or "SF Pro Display" (system font fallback)
- **Monospace:** "JetBrains Mono" for code/input areas
- **Font weights:** Regular (400), Medium (500), Semibold (600)

### Color Palette
```css
/* Background */
bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900

/* Text Colors */
text-cyan-200      /* Input text: #a5f3fc */
text-emerald-300  /* Output text: #34d399 */
text-blue-400     /* Accent: #3b82f6 */

/* Glass backgrounds */
bg-white/8        /* Base glass */
bg-white/12       /* Hover glass */
bg-white/4        /* Subtle glass */
```

---

## Component Architecture

### Core Components
- `WindowControls` - Traffic light buttons
- `Sidebar` - Navigation sidebar with categories
- `DynamicIsland` - Status bar component
- `ToolPane` - Reusable input/output pane
- `CodeEditor` - Syntax-highlighted editor (CodeMirror)
- `Button` - Glassmorphic button component
- `Card` - Glass card wrapper

### Tool Components
- Each tool as a separate component
- Shared layout wrapper
- Tool-specific configuration panels

### State Management (Zustand)

#### Tool Store
```typescript
interface ToolState {
  activeTool: string | null;
  setActiveTool: (tool: string) => void;
  input: string;
  output: string;
  setInput: (value: string) => void;
  setOutput: (value: string) => void;
  toolConfig: Record<string, any>;
  updateToolConfig: (key: string, value: any) => void;
  history: ToolHistory[];
  addToHistory: (entry: ToolHistory) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}
```

#### Additional Stores
- **UI Store:** Theme, layout preferences, window state
- **Settings Store:** User preferences, shortcuts, recent tools
- **History Store:** Tool usage history, favorites

---

## File Structure

```
devtools-app/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── WindowControls.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── DynamicIsland.tsx
│   │   │   └── ToolPane.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── CodeEditor.tsx
│   │   └── tools/
│   │       └── [tool-components]
│   ├── stores/
│   │   ├── toolStore.ts
│   │   ├── uiStore.ts
│   │   └── settingsStore.ts
│   ├── utils/
│   │   ├── toolHelpers.ts
│   │   └── formatters.ts
│   ├── styles/
│   │   └── globals.css
│   ├── main.tsx
│   └── App.tsx
├── electron/
│   ├── main/
│   │   ├── main.ts
│   │   ├── window.ts
│   │   └── updater.ts
│   └── preload/
│       └── preload.ts
├── public/
│   └── [static assets]
├── dist/
│   └── [build output]
├── build/
│   └── [electron-builder output]
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── electron-builder.yml
└── .eslintrc.json
```

---

## Electron Configuration

### Window Configuration
- **Frameless:** `frame: false` for custom title bar
- **Transparent:** `transparent: true` for glassmorphism
- **Vibrancy:** Use `vibrancy` option (macOS) or `backgroundMaterial` (Windows)
- **Resizable:** Enable with min/max dimensions

### Electron Builder Configuration
- **Build targets:** Windows (NSIS installer) and macOS (DMG)
- **Auto-updater:** Configured with `electron-updater`
- **Code signing:** Required for macOS distribution
- **Notarization:** Required for macOS Gatekeeper

### Storage & Persistence
- **electron-store:** Persistent storage for user settings, preferences, and tool history
- **Storage locations:**
  - Windows: `%APPDATA%/devtools-app/config.json`
  - macOS: `~/Library/Application Support/devtools-app/config.json`

### IPC Communication
- **Main process:** Handle file operations, system APIs, auto-updater
- **Preload scripts:** Secure bridge between renderer and main process
- **Renderer process:** UI components and tool logic

### Performance
- **Hardware acceleration:** Enable in Electron config
- **Backdrop filter:** May require `app.commandLine.appendSwitch('enable-experimental-web-platform-features')`
- **Optimize blur:** Consider CSS `will-change` for smooth animations
- **Context isolation:** Enabled for security
- **Node integration:** Disabled in renderer (use preload scripts)

---

## Features List (Theo categories)

### Crypto
- Token generator
- Hash text (MD5, SHA1, SHA256, SHA224, SHA512, SHA384, SHA3, RIPEMD160)
- Bcrypt
- UUIDs generator
- ULID generator
- Encrypt / decrypt text (AES, TripleDES, Rabbit, RC4, …)
- BIP39 passphrase generator
- HMAC generator
- RSA key pair generator
- Password strength analyser
- PDF signature checker

### Converter
- Date-time converter
- Integer base converter (decimal, hex, binary, octal, base64, …)
- Roman numeral converter
- Base64 string encoder/decoder
- Base64 file converter
- Color converter (hex, rgb, hsl, css name)
- Case converter
- Text to NATO alphabet
- Text to ASCII binary
- Text to Unicode
- YAML ⇄ JSON
- YAML ⇄ TOML
- JSON ⇄ YAML
- JSON ⇄ TOML
- TOML ⇄ JSON
- TOML ⇄ YAML
- XML ⇄ JSON
- JSON ⇄ XML
- Markdown to HTML
- List converter (transpose, prefix/suffix, sort, lowercase, truncate, …)

### Web
- URL encoder/decoder
- Escape HTML entities
- URL parser
- Device information
- Basic auth generator
- Open Graph meta generator
- OTP code generator (TOTP)
- MIME types lookup
- JWT parser
- Keycode info
- Slugify string
- HTML WYSIWYG editor
- User-agent parser
- HTTP status codes list
- JSON diff
- Outlook Safelink decoder

### Images & Videos
- QR Code generator
- WiFi QR Code generator
- SVG placeholder generator
- Camera recorder (capture ảnh/video từ webcam)

### Development
- Git cheatsheet
- Random port generator
- Crontab generator
- JSON prettify and format
- JSON minify
- JSON to CSV
- SQL prettify and format
- Chmod calculator
- Docker run → docker-compose converter
- XML formatter
- YAML prettify and format
- Email normalizer
- Regex Tester
- Regex cheatsheet

### Network
- IPv4 subnet calculator
- IPv4 address converter
- IPv4 range expander
- MAC address lookup
- MAC address generator
- IPv6 ULA generator

### Math
- Math evaluator
- ETA calculator
- Percentage calculator

### Measurement
- Chronometer
- Temperature converter
- Benchmark builder

### Text
- Lorem ipsum generator
- Text statistics
- Emoji picker
- String obfuscator
- Text diff
- Numeronym generator
- ASCII Art Text Generator

### Data
- Phone parser and formatter
- IBAN validator and parser

---

## Implementation Phases

### Phase 1: Core UI
1. Window setup (Electron config)
2. Base layout (Sidebar + Workspace)
3. Glassmorphism styling
4. Basic navigation

### Phase 2: Tool Integration
1. Tool store setup
2. First tool implementation
3. Input/Output panes
4. Action buttons

### Phase 3: Polish
1. Animations & transitions
2. Dynamic Island
3. Keyboard shortcuts
4. Settings & persistence

### Phase 4: Advanced
1. Tool search
2. History & favorites
3. Export/Import
4. Performance optimizations

---

## Development Guidelines

### Code Style
- **Linting:** ESLint + Prettier
- **TypeScript:** Strict mode enabled
- **Component naming:** PascalCase
- **File naming:** PascalCase for components, camelCase for utilities

### Performance
- **Virtual scrolling:** For long lists
- **Lazy loading:** Load tool components on demand
- **Memoization:** Use `React.memo` for expensive components
- **Debouncing:** For input handlers in tools
- **Selective subscriptions:** Zustand selectors to prevent unnecessary re-renders

### Error Handling
- **Error boundaries:** For tool isolation
- **User-friendly messages:** Clear error messages
- **Loading states:** For async operations
- **Toast notifications:** For user feedback

### Testing
- **Unit tests:** Vitest for utility functions
- **Component tests:** React Testing Library
- **Integration tests:** For tool workflows

---

## Additional Features

### UI Enhancements
- Keyboard shortcuts (Cmd/Ctrl + K for search)
- Tool search/filter in sidebar
- Recent tools quick access
- Favorites system
- Tool categories with collapsible sections
- Drag & drop for file inputs
- Toast notifications for actions

### Developer Experience
- Hot reload in development
- DevTools integration
- Error boundaries for tool isolation
- Loading states for async operations
- Error handling with user-friendly messages

---

## Package Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "electron": "latest",
    "zustand": "^4.4.0",
    "tailwindcss": "^3.4.0",
    "@uiw/react-codemirror": "^4.21.0",
    "lucide-react": "^0.300.0",
    "clsx": "^2.1.0",
    "framer-motion": "^10.16.0",
    "sonner": "^1.3.0",
    "crypto-js": "^4.2.0",
    "js-base64": "^3.7.5",
    "js-yaml": "^4.1.0",
    "xml2js": "^0.6.2",
    "jsonwebtoken": "^9.0.2",
    "papaparse": "^5.4.1",
    "json5": "^2.2.3",
    "xregexp": "^5.1.1",
    "electron-store": "^8.1.0"
  }
}
```

### Dev Dependencies
```json
{
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/node": "^20.10.0",
    "@types/crypto-js": "^4.2.1",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/xml2js": "^0.4.14",
    "@types/papaparse": "^5.3.14",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vite-plugin-electron": "^0.28.0",
    "electron-builder": "^24.9.1",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react": "^7.33.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.1.0",
    "vitest": "^1.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@tailwindcss/forms": "^0.5.7",
    "tailwind-scrollbar-hide": "^1.1.7",
    "tailwindcss-animate": "^1.0.7"
  }
}
```

---

## Notes

- Tất cả tools chạy **client-side** để đảm bảo privacy
- Ưu tiên performance và UX smooth
- Code phải dễ maintain và extend
- Follow best practices cho Electron security

