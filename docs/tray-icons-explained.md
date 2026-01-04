# System Tray Icons - Updated

## 🎨 New Icon Set (Lucide-inspired Unicode)

Vì Electron tray menu chỉ hỗ trợ text, tôi đã chọn Unicode symbols phù hợp với style của Lucide Icons - clean, minimal, professional.

### Current Icon Mapping

```
┌─────────────────────────────────────────┐
│ ▲ Show Window / ▼ Hide Window          │  ← Triangle (chevron-like)
├─────────────────────────────────────────┤
│ 📋 Clipboard Manager                  ▶ │  ← Clipboard emoji
│   ├─ ▸ Open Full Manager                │  ← Play/Arrow right
│   ├─────────────────────────────────────┤
│   ├─ ● Recent Clipboard (5)             │  ← Bullet point
│   ├─   1. Sample text...                │  ← Numbers
│   ├─   2. Another item...               │
│   ├─────────────────────────────────────┤
│   └─ ✕ Clear All History                │  ← X mark
├─────────────────────────────────────────┤
│ ⚡ Quick Actions                       ▶ │  ← Lightning bolt
│   ├─ ◆ Generate UUID      ⌘⇧U           │  ← Diamond filled
│   ├─ ◇ Format JSON        ⌘⇧J           │  ← Diamond outline
│   ├─ # Hash Text (SHA-256)              │  ← Hash symbol
│   ├─────────────────────────────────────┤
│   ├─ ↑ Base64 Encode                    │  ← Up arrow
│   └─ ↓ Base64 Decode                    │  ← Down arrow
├─────────────────────────────────────────┤
│ 🕐 Recent Tools                       ▶ │  ← Clock emoji
│   ├─   • Base64 Converter               │  ← Bullet point
│   └─   • JSON Formatter                 │
├─────────────────────────────────────────┤
│ ⚙ Settings                              │  ← Gear symbol
├─────────────────────────────────────────┤
│ ✕ Quit DevTools            ⌘Q           │  ← X mark
└─────────────────────────────────────────┘
```

## 📊 Icon Choices Explained

### Why These Icons?

#### Window Controls
- **▲ / ▼** - Clean triangles, similar to Lucide's ChevronUp/ChevronDown
- Simple, clear direction indicators

#### Clipboard Section
- **📋** - Standard clipboard emoji (universally recognized)
- **▸** - Play/arrow right (like Lucide's Play or ChevronRight)
- **●** - Bullet point for section headers
- **✕** - Clean X mark (like Lucide's X)

#### Quick Actions
- **⚡** - Lightning bolt (like Lucide's Zap)
- **◆** - Filled diamond (unique, stands out)
- **◇** - Outline diamond (pairs with filled)
- **#** - Hash symbol (perfect for hashing)
- **↑ / ↓** - Arrows for encode/decode direction

#### Other Sections
- **🕐** - Clock emoji (like Lucide's Clock)
- **•** - Bullet point for list items
- **⚙** - Gear (like Lucide's Settings)

## 🎯 Design Principles

### 1. Consistency
- Similar symbols for similar actions
- Paired symbols (◆/◇, ↑/↓, ▲/▼)

### 2. Clarity
- Each icon clearly represents its action
- No ambiguous symbols

### 3. Professional
- Clean, minimal Unicode symbols
- No excessive emoji (only where appropriate)

### 4. Cross-platform
- All symbols work on macOS, Windows, Linux
- Fallback-safe characters

## 🔄 Alternative Options

### If You Want Even More Minimal

```typescript
// Ultra-minimal (no emoji)
{
  label: '▸ Show Window',           // Instead of ▲
  label: '□ Clipboard Manager',     // Instead of 📋
  label: '⚡ Quick Actions',         // Keep lightning
  label: '○ Recent Tools',          // Instead of 🕐
  label: '⚙ Settings',              // Keep gear
  label: '✕ Quit',                  // Keep X
}
```

### If You Want More Visual

```typescript
// More emoji (where appropriate)
{
  label: '👁 Show Window',           // Eye
  label: '📋 Clipboard Manager',     // Clipboard
  label: '⚡ Quick Actions',         // Lightning
  label: '🕐 Recent Tools',          // Clock
  label: '⚙️ Settings',              // Gear with variation selector
  label: '🚪 Quit',                  // Door
}
```

## 💡 Why Not Actual Lucide Icons?

### Technical Limitation
Electron's `Menu.buildFromTemplate()` only accepts:
- `label: string` - Text only
- `icon: NativeImage` - For menu item icons (not supported in all contexts)

### What We Can't Do
```typescript
// ❌ This won't work in Electron tray
import { Clipboard } from 'lucide-react';
label: <Clipboard /> // Can't use React components
```

### What We're Doing Instead
```typescript
// ✅ This works - Unicode that looks like Lucide
label: '📋 Clipboard Manager'  // Emoji
label: '▸ Open Full Manager'   // Unicode symbol
label: '◆ Generate UUID'       // Unicode symbol
```

## 🎨 Current Implementation

### Code
```typescript
const template: Electron.MenuItemConstructorOptions[] = [
  {
    label: win?.isVisible() ? '▼ Hide Window' : '▲ Show Window',
    // ...
  },
  {
    label: '📋 Clipboard Manager',
    submenu: [
      { label: '▸ Open Full Manager' },
      { label: '● Recent Clipboard (5)', enabled: false },
      { label: '  1. Sample text...' },
      { label: '✕ Clear All History' },
    ]
  },
  {
    label: '⚡ Quick Actions',
    submenu: [
      { label: '◆ Generate UUID', accelerator: 'CmdOrCtrl+Shift+U' },
      { label: '◇ Format JSON', accelerator: 'CmdOrCtrl+Shift+J' },
      { label: '# Hash Text (SHA-256)' },
      { label: '↑ Base64 Encode' },
      { label: '↓ Base64 Decode' },
    ]
  },
  {
    label: '🕐 Recent Tools',
    submenu: [
      { label: '  • Base64 Converter' },
      { label: '  • JSON Formatter' },
    ]
  },
  { label: '⚙ Settings' },
  { label: '✕ Quit DevTools', accelerator: 'CmdOrCtrl+Q' },
];
```

## 📝 Summary

**Current approach**: Unicode symbols inspired by Lucide's clean, minimal style
**Why**: Electron tray menus only support text labels
**Result**: Professional, clean, cross-platform compatible icons

**If you want to use actual Lucide Icons**, we would need to:
1. Create custom tray icons as PNG images
2. Use `nativeImage` for the tray icon itself (not menu items)
3. Keep text-based symbols for menu items

---

**Version**: 2.1.0  
**Updated**: 2026-01-04  
**Feature**: Lucide-inspired Unicode Icons
