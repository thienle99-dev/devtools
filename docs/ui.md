# UI Design Specification - DevTools App

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

### Installation Notes
- Install all dependencies: `npm install` or `yarn install`
- Electron requires Node.js 18+ and npm 9+
- For Windows builds, ensure Windows SDK is installed
- For macOS builds, requires Xcode Command Line Tools

---

## 1. Design System (Core Aesthetic)

### Glassmorphism
- **Backdrop blur:** `backdrop-blur-[40px]` (Tailwind: `backdrop-blur-2xl`)
- **Background:** `bg-white/8` (rgba(255, 255, 255, 0.08))
- **Layers:** Multiple translucent layers for depth

### Shape & Corners
- **Main container:** `rounded-[36px]` (Squircle effect)
- **Panes:** `rounded-[20px]`
- **Buttons:** `rounded-[10px]`
- **Cards:** `rounded-2xl` or `rounded-3xl`

### Depth & Shadows
- **Outer shadow:** `shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]`
- **Inner glow:** `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]`
- **Layered shadows:** Combine multiple shadow utilities

### Borders
- **Ultra-thin:** `border border-white/15` (1px solid rgba(255, 255, 255, 0.15))
- **Hover state:** `border-white/25`

---

## 2. Layout Structure

### Main Container
- **Centered card:** `w-[95vw] h-[95vh]` floating on mesh gradient background
- **Position:** Centered with flexbox/grid
- **Background:** Deep Navy/Obsidian gradient with mesh pattern

### Sidebar (Left)
- **Width:** `w-64` or `w-72`
- **Background:** Translucent glass effect
- **Traffic lights:** Red, Yellow, Green buttons (macOS window controls)
- **Navigation:** Category list with icons and hover effects
- **Scrollable:** Custom scrollbar styling

### Header (Center)
- **Dynamic Island style:** Rounded pill shape
- **Status indicators:** Latency, connection status, active tool
- **Pulse animation:** Subtle pulse on status dot
- **Position:** Top center or integrated into sidebar

### Workspace (Main)
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

---

## 3. Technical Requirements

### Typography
- **Sans-serif:** "Inter" or "SF Pro Display" (system font fallback)
- **Monospace:** "JetBrains Mono" for code/input areas
- **Font weights:** Regular (400), Medium (500), Semibold (600)

### Color Palette (Tailwind Classes)
```css
/* Background */
bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900
/* or custom gradient */

/* Text Colors */
text-cyan-200  /* Input text: #a5f3fc */
text-emerald-300 /* Output text: #34d399 */
text-blue-400  /* Accent: #3b82f6 */

/* Glass backgrounds */
bg-white/8     /* Base glass */
bg-white/12    /* Hover glass */
bg-white/4     /* Subtle glass */
```

### Scrollbars
- **Hidden or minimal:** Custom scrollbar styling
- **Tailwind:** Use `scrollbar-hide` plugin or custom CSS
- **Style:** Thin, translucent, rounded

---

## 4. Interactive Elements

### Animations
- **Status pulse:** `animate-pulse` with custom timing
- **Hover transitions:** `transition-all duration-200`
- **Focus effects:** `focus-within:border-white/25 focus-within:bg-white/12`
- **Glass overlay:** Hover state with increased opacity

### Navigation
- **Hover:** Glass overlay effect with scale/glow
- **Active state:** Highlighted with accent color
- **Icons:** Consistent icon set (Heroicons, Lucide, or custom)

---

## 5. Electron-Specific Considerations

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

## 6. Tailwind Configuration

### Custom Theme Extensions
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      backdropBlur: {
        'xs': '2px',
        '4xl': '72px',
      },
      colors: {
        'glass': {
          light: 'rgba(255, 255, 255, 0.08)',
          medium: 'rgba(255, 255, 255, 0.12)',
          dark: 'rgba(255, 255, 255, 0.04)',
        }
      },
      borderRadius: {
        'squircle': '36px',
      }
    }
  }
}
```

### Plugins
- `@tailwindcss/forms` - Better form styling
- `tailwind-scrollbar-hide` - Hide scrollbars
- `tailwindcss-animate` - Additional animations

---

## 7. Zustand Store Structure

### Recommended Store Architecture

```typescript
// stores/toolStore.ts
interface ToolState {
  // Current tool
  activeTool: string | null;
  setActiveTool: (tool: string) => void;
  
  // Input/Output
  input: string;
  output: string;
  setInput: (value: string) => void;
  setOutput: (value: string) => void;
  
  // Tool-specific state
  toolConfig: Record<string, any>;
  updateToolConfig: (key: string, value: any) => void;
  
  // History
  history: ToolHistory[];
  addToHistory: (entry: ToolHistory) => void;
  
  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}
```

### Additional Stores
- **UI Store:** Theme, layout preferences, window state
- **Settings Store:** User preferences, shortcuts, recent tools
- **History Store:** Tool usage history, favorites

---

## 8. Component Architecture Suggestions

### Core Components
- `WindowControls` - Traffic light buttons
- `Sidebar` - Navigation sidebar with categories
- `DynamicIsland` - Status bar component
- `ToolPane` - Reusable input/output pane
- `CodeEditor` - Syntax-highlighted editor (consider Monaco or CodeMirror)
- `Button` - Glassmorphic button component
- `Card` - Glass card wrapper

### Tool Components
- Each tool as a separate component
- Shared layout wrapper
- Tool-specific configuration panels

### Recommended Libraries
- **Code Editor:** `@uiw/react-codemirror` - Lightweight, customizable code editor
- **Icons:** `lucide-react` - Consistent icon set with tree-shaking support
- **Animations:** `framer-motion` - Advanced animations and transitions
- **Utilities:** `clsx` - Conditional class names utility
- **Toast:** `sonner` - Beautiful toast notifications

---

## 9. Performance Optimizations

### Rendering
- **Virtual scrolling:** For long lists (react-window or react-virtual)
- **Lazy loading:** Load tool components on demand
- **Memoization:** Use `React.memo` for expensive components
- **Debouncing:** For input handlers in tools

### State Management
- **Selective subscriptions:** Zustand selectors to prevent unnecessary re-renders
- **Local state:** Use component state for UI-only state
- **Persistence:** Use Zustand middleware for settings persistence

---

## 10. Additional Features to Consider

### UI Enhancements
- **Dark/Light mode toggle** (if needed)
- **Keyboard shortcuts** (Cmd/Ctrl + K for search)
- **Tool search/filter** in sidebar
- **Recent tools** quick access
- **Favorites** system
- **Tool categories** with collapsible sections
- **Drag & drop** for file inputs
- **Toast notifications** for actions (copy, download, etc.)

### Developer Experience
- **Hot reload** in development
- **DevTools** integration
- **Error boundaries** for tool isolation
- **Loading states** for async operations
- **Error handling** with user-friendly messages

---

## 11. File Structure Suggestion

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

## 12. Implementation Priority

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