# Platform-Specific UI Implementation

## Overview
This document describes the platform-specific UI implementation for the DevTools application, providing native-looking window controls for macOS, Windows, and Linux.

## Architecture

### 1. Platform Detection Hook (`src/hooks/usePlatform.ts`)
A custom React hook that detects the current platform:
```typescript
const { platform, isMac, isWindows, isLinux } = usePlatform();
```

- **platform**: The raw platform string ('darwin', 'win32', 'linux')
- **isMac**: Boolean indicating macOS
- **isWindows**: Boolean indicating Windows
- **isLinux**: Boolean indicating Linux

### 2. Platform-Specific Components

#### macOS Window Controls (`src/components/layout/MacOSWindowControls.tsx`)
- **Design**: Minimal header with centered app title
- **Traffic Lights**: Uses native macOS traffic light buttons (minimize, maximize, close)
- **Layout**: 
  - Left: 80px reserved space for native traffic lights
  - Center: App title "DEVTOOLS"
  - Right: 80px for balance
- **Height**: 48px (h-12) to accommodate native controls

#### Windows/Linux Window Controls (`src/components/layout/WindowsWindowControls.tsx`)
- **Design**: Custom window controls on the right side
- **Buttons**: 
  - Minimize (Minus icon)
  - Maximize/Restore (Square/Copy icon)
  - Close (X icon with red hover)
- **Layout**:
  - Left: Centered app title
  - Right: Window control buttons
- **Height**: 36px (h-9) for compact design
- **Features**: Dynamic icon based on window state (maximized/restored)

#### Main Window Controls (`src/components/layout/WindowControls.tsx`)
Platform-aware wrapper that renders the appropriate component:
```tsx
export const WindowControls = () => {
  const { isMac } = usePlatform();
  return isMac ? <MacOSWindowControls /> : <WindowsWindowControls />;
};
```

## Electron Configuration

### Main Process (`electron/main/main.ts`)
```typescript
const win = new BrowserWindow({
  titleBarStyle: 'hidden',  // Hides default title bar
  trafficLightPosition: { x: 15, y: 15 },  // macOS traffic lights position
  // ...
});

// Send window state changes to renderer
win.on('maximize', () => {
  win?.webContents.send('window-maximized', true);
});
win.on('unmaximize', () => {
  win?.webContents.send('window-maximized', false);
});
```

### Preload Script (`electron/preload/preload.ts`)
Exposes platform information and window controls:
```typescript
contextBridge.exposeInMainWorld('ipcRenderer', {
  process: {
    platform: process.platform,  // 'darwin', 'win32', 'linux'
  },
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
  },
});
```

## CSS Considerations

### Draggable Regions
- **`.drag`**: Makes the element draggable (title bar area)
- **`.no-drag`**: Prevents dragging (buttons, interactive elements)

```css
.drag {
  -webkit-app-region: drag;
}
.no-drag {
  -webkit-app-region: no-drag;
}
```

### Platform-Specific Styling (Future Enhancement)
The `isMac` variable in `App.tsx` can be used for platform-specific padding or layout adjustments:

```tsx
<div className={`main-container ${isMac ? 'pt-0' : 'pt-2'}`}>
  {/* Content */}
</div>
```

## Key Features

### 1. **Native Look & Feel**
- macOS: Uses system traffic lights for familiar UX
- Windows/Linux: Custom controls matching platform conventions

### 2. **Responsive Window State**
- Maximize/restore button updates dynamically
- IPC communication keeps UI in sync with window state

### 3. **Consistent Branding**
- App title "DEVTOOLS" with gradient styling on all platforms
- Maintains visual identity while respecting platform norms

### 4. **Accessibility**
- All buttons have proper titles for tooltips
- Keyboard shortcuts work across platforms (Cmd on Mac, Ctrl on Windows/Linux)

## Testing

### macOS
- ✅ Native traffic lights appear in top-left
- ✅ Title bar is draggable
- ✅ Buttons are not obscured by native controls

### Windows/Linux
- ✅ Custom window controls appear on the right
- ✅ Minimize, maximize/restore, close buttons work
- ✅ Icon changes when window is maximized
- ✅ Title bar is draggable except on buttons

## Future Enhancements

1. **Platform-Specific Menus**: macOS menu bar vs Windows/Linux in-window menu
2. **Keyboard Shortcuts**: Platform-specific shortcut hints (⌘ vs Ctrl)
3. **Window Snapping**: Windows-style window snapping on Windows/Linux
4. **Full-Screen Mode**: Platform-specific full-screen behavior
5. **Theme Integration**: Respect system theme preferences per platform

## Files Modified/Created

### Created:
- `src/hooks/usePlatform.ts`
- `src/components/layout/MacOSWindowControls.tsx`
- `src/components/layout/WindowsWindowControls.tsx`

### Modified:
- `src/components/layout/WindowControls.tsx`
- `src/App.tsx`
- `electron/preload/preload.ts` (already had platform info)
- `electron/main/main.ts` (already had window event handlers)

## Usage Example

```tsx
import { usePlatform } from './hooks/usePlatform';

function MyComponent() {
  const { isMac, isWindows, isLinux } = usePlatform();
  
  return (
    <div>
      {isMac && <div>macOS-specific content</div>}
      {isWindows && <div>Windows-specific content</div>}
      {isLinux && <div>Linux-specific content</div>}
    </div>
  );
}
```
