# DevTools App - Responsive Design & Window Resize Plan

> Comprehensive plan để làm app có thể resize tốt và responsive trên mọi kích thước màn hình

**Created:** 9/1/2026  
**Status:** 📋 Ready for Implementation  
**Priority:** ⭐⭐⭐⭐ High

---

## 🎯 Goals

### Primary Objectives
1. ✅ Enable smooth window resizing
2. ✅ Responsive layouts cho tất cả screen sizes
3. ✅ Adaptive UI components
4. ✅ Better min/max size constraints
5. ✅ Optimized sidebar behavior
6. ✅ Breakpoint system

### Target Sizes
- **Minimum:** 800×600 (tablet landscape)
- **Small:** 1024×768 (small laptop)
- **Medium:** 1366×768 (standard laptop)
- **Large:** 1920×1080 (full HD)
- **XL:** 2560×1440+ (4K, ultra-wide)

---

## 📊 Current State Analysis

### ✅ What's Working
- Window can resize (no `resizable: false`)
- Window bounds are saved and restored
- Flexbox layouts are used
- Sidebar can collapse (Cmd/Ctrl+B)

### ⚠️ Issues Found
1. **Fixed minWidth/minHeight** - Too restrictive (900×600)
2. **No responsive breakpoints** - Same UI for all sizes
3. **Sidebar behavior** - Doesn't auto-collapse on small screens
4. **Fixed widths** - Some components have hard-coded widths
5. **Overflow issues** - Content may overflow on small screens
6. **No media queries** - Missing responsive utilities

---

## 🔧 Implementation Plan

### Phase 1: Window Configuration (30 phút)

#### 1.1 Update Electron Window Settings

**File:** `electron/main/main.ts`

**Changes:**
```typescript
// Current (line 532-556)
minWidth: 900,
minHeight: 600,

// Improved
minWidth: 800,  // Allow smaller size (tablet-friendly)
minHeight: 600,
// Optional: Add max size constraints
// maxWidth: 3840, // 4K width
// maxHeight: 2160, // 4K height
```

**Benefits:**
- Support smaller screens (tablets, small laptops)
- Better testing on various sizes

---

### Phase 2: Responsive Breakpoints (1 giờ)

#### 2.1 Update Tailwind Configuration

**File:** `tailwind.config.js`

**Add custom breakpoints:**
```javascript
module.exports = {
  theme: {
    extend: {
      screens: {
        'xs': '640px',    // Mobile landscape
        'sm': '768px',    // Tablet portrait
        'md': '1024px',   // Tablet landscape / Small laptop
        'lg': '1366px',   // Standard laptop
        'xl': '1920px',   // Full HD
        '2xl': '2560px',  // 4K / Ultra-wide
        
        // Custom utility breakpoints
        'sidebar-auto': '1024px',  // Auto-hide sidebar below this
        'compact': '1280px',        // Compact mode threshold
      },
      // Responsive spacing
      spacing: {
        'sidebar': 'clamp(240px, 20vw, 280px)',  // Fluid sidebar
        'sidebar-collapsed': '64px',
      },
      // Responsive font sizes
      fontSize: {
        'responsive-sm': 'clamp(0.75rem, 1vw, 0.875rem)',
        'responsive-base': 'clamp(0.875rem, 1.2vw, 1rem)',
        'responsive-lg': 'clamp(1rem, 1.5vw, 1.125rem)',
      }
    }
  }
}
```

---

#### 2.2 Create Responsive Hooks

**File:** `src/hooks/useResponsive.ts` (NEW)

```typescript
import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ResponsiveState {
  breakpoint: Breakpoint;
  isXs: boolean;
  isSm: boolean;
  isMd: boolean;
  isLg: boolean;
  isXl: boolean;
  is2xl: boolean;
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isCompact: boolean; // < 1280px
}

const breakpoints = {
  xs: 640,
  sm: 768,
  md: 1024,
  lg: 1366,
  xl: 1920,
  '2xl': 2560,
};

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>(() => 
    getResponsiveState(window.innerWidth, window.innerHeight)
  );

  useEffect(() => {
    const handleResize = () => {
      setState(getResponsiveState(window.innerWidth, window.innerHeight));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
}

function getResponsiveState(width: number, height: number): ResponsiveState {
  const breakpoint = getCurrentBreakpoint(width);
  
  return {
    breakpoint,
    isXs: width >= breakpoints.xs,
    isSm: width >= breakpoints.sm,
    isMd: width >= breakpoints.md,
    isLg: width >= breakpoints.lg,
    isXl: width >= breakpoints.xl,
    is2xl: width >= breakpoints['2xl'],
    width,
    height,
    isMobile: width < breakpoints.md,
    isTablet: width >= breakpoints.sm && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    isCompact: width < 1280,
  };
}

function getCurrentBreakpoint(width: number): Breakpoint {
  if (width >= breakpoints['2xl']) return '2xl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

// Window size hook
export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
```

---

### Phase 3: Responsive Layouts (2-3 giờ)

#### 3.1 Update App Layout

**File:** `src/App.tsx`

**Add responsive behavior:**
```typescript
import { useResponsive } from '@hooks/useResponsive';

function App() {
  const { theme } = useSettingsStore();
  const responsive = useResponsive();
  
  // Auto-collapse sidebar on mobile/tablet
  useEffect(() => {
    if (responsive.isMobile) {
      useSettingsStore.getState().setSidebarOpen(false);
    }
  }, [responsive.isMobile]);

  // Auto-adjust layout on compact screens
  const layoutClass = responsive.isCompact 
    ? 'compact-layout' 
    : 'comfortable-layout';

  return (
    <Router>
      <GlobalClipboardMonitor />
      <TrayController />
      <AppErrorBoundary>
        <div className={`flex flex-col h-screen bg-app-gradient text-foreground overflow-hidden font-sans selection:bg-indigo-500/30 ${layoutClass}`}>
          <WindowControls />

          <div className="flex-1 flex overflow-hidden relative">
            {/* Responsive Sidebar */}
            <Sidebar responsive={responsive} />

            {/* Main content area */}
            <main className="flex-1 flex flex-col min-w-0 relative">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="*" element={<MainLayout responsive={responsive} />} />
                </Routes>
              </Suspense>
            </main>
          </div>

          {/* Responsive Footer */}
          <footer className="h-9 px-3 sm:px-6 flex items-center justify-between text-[10px] sm:text-[11px] text-foreground-muted border-t border-border-glass bg-[var(--color-glass-input)] shrink-0 z-30 backdrop-blur-xl">
            <div className="flex items-center space-x-2 sm:space-x-5">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/60 animate-pulse" />
                <span className="font-medium hidden sm:inline">Ready</span>
              </div>
              <div className="w-px h-4 bg-border-glass hidden sm:block" />
              <span className="opacity-70 hidden md:inline">UTF-8</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-5">
              <span className="opacity-60 hover:opacity-100 cursor-pointer transition-opacity font-medium">
                v0.2.0
              </span>
            </div>
          </footer>
        </div>
      </AppErrorBoundary>
    </Router>
  );
}
```

---

#### 3.2 Update Sidebar Component

**File:** `src/components/layout/Sidebar.tsx`

**Add responsive props:**
```typescript
interface SidebarProps {
  responsive?: ResponsiveState;
}

export const Sidebar: React.FC<SidebarProps> = ({ responsive }) => {
  const { isSidebarOpen, toggleSidebar } = useSettingsStore();
  const shouldShow = responsive?.isDesktop || isSidebarOpen;
  
  // Auto-hide on mobile when clicking outside
  useEffect(() => {
    if (!responsive?.isMobile) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (isSidebarOpen && !(e.target as Element).closest('.sidebar')) {
        toggleSidebar();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [responsive?.isMobile, isSidebarOpen, toggleSidebar]);

  return (
    <>
      {/* Mobile Overlay */}
      {responsive?.isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        sidebar
        ${responsive?.isMobile ? 'fixed left-0 top-0 h-full z-50' : 'relative'}
        ${shouldShow ? 'translate-x-0' : '-translate-x-full'}
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'w-[280px]' : 'w-16'}
        bg-background-secondary border-r border-border-glass
        flex flex-col
      `}>
        {/* Sidebar content */}
        {/* ... */}
      </aside>
    </>
  );
};
```

---

#### 3.3 Update Tab Bar Component

**File:** `src/components/layout/TabBar.tsx`

**Make tabs responsive:**
```typescript
export const TabBar: React.FC = () => {
  const { tabs, activeTabId, setActiveTab, closeTab } = useTabStore();
  const responsive = useResponsive();
  
  // Limit visible tabs on small screens
  const maxVisibleTabs = responsive.isCompact ? 5 : 10;
  const visibleTabs = tabs.slice(0, maxVisibleTabs);
  const hiddenTabs = tabs.slice(maxVisibleTabs);

  return (
    <div className="h-10 flex items-center bg-background-tertiary/50 border-b border-border-glass px-2 shrink-0">
      {/* Scrollable tab list */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto scrollbar-none">
        {visibleTabs.map(tab => (
          <Tab
            key={tab.id}
            {...tab}
            isActive={tab.id === activeTabId}
            onClick={() => setActiveTab(tab.id)}
            onClose={() => closeTab(tab.id)}
            compact={responsive.isCompact}
          />
        ))}
        
        {/* More tabs dropdown */}
        {hiddenTabs.length > 0 && (
          <MoreTabsDropdown tabs={hiddenTabs} />
        )}
      </div>
      
      {/* Actions - hide on very small screens */}
      {responsive.isSm && (
        <div className="flex items-center gap-1 ml-2">
          {/* ... */}
        </div>
      )}
    </div>
  );
};
```

---

### Phase 4: Responsive Components (2-3 giờ)

#### 4.1 Create Responsive Card Component

**File:** `src/components/ui/ResponsiveCard.tsx` (NEW)

```typescript
import React from 'react';
import { useResponsive } from '@hooks/useResponsive';
import { Card, CardProps } from './Card';

interface ResponsiveCardProps extends CardProps {
  compact?: boolean;
  mobileStack?: boolean;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  compact,
  mobileStack,
  className = '',
  children,
  ...props
}) => {
  const responsive = useResponsive();
  
  const shouldCompact = compact || responsive.isCompact;
  const shouldStack = mobileStack && responsive.isMobile;
  
  return (
    <Card
      className={`
        ${shouldCompact ? 'p-3' : 'p-4 md:p-6'}
        ${shouldStack ? 'flex flex-col' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </Card>
  );
};
```

---

#### 4.2 Create Responsive Grid

**File:** `src/components/ui/ResponsiveGrid.tsx` (NEW)

```typescript
import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: string;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = '4',
  className = '',
}) => {
  const gridCols = [
    cols.default && `grid-cols-${cols.default}`,
    cols.xs && `xs:grid-cols-${cols.xs}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={`grid ${gridCols} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};
```

**Usage:**
```typescript
<ResponsiveGrid cols={{ default: 1, sm: 2, lg: 3, xl: 4 }}>
  <Card>Tool 1</Card>
  <Card>Tool 2</Card>
  <Card>Tool 3</Card>
</ResponsiveGrid>
```

---

#### 4.3 Update Tool Components

Make individual tools responsive. Example for YouTube Downloader:

**File:** `src/tools/media/YoutubeDownloader.tsx`

```typescript
export const YoutubeDownloader: React.FC = () => {
  const responsive = useResponsive();
  
  return (
    <div className="h-full flex flex-col bg-background/50">
      {/* Header */}
      <div className="px-3 md:px-4 py-3 border-b border-border-glass">
        {/* ... */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        <div className="w-full mx-auto space-y-4 md:space-y-6">
          {/* Responsive grid layout */}
          {videoInfo && (
            <div className={`
              grid gap-4 md:gap-6
              ${responsive.isLg ? 'grid-cols-3' : 'grid-cols-1'}
            `}>
              {/* Left: Video Info */}
              <div className="lg:col-span-1">
                <VideoInfo {...videoInfo} />
              </div>
              
              {/* Right: Options */}
              <div className="lg:col-span-2">
                <FormatSelector {...props} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

### Phase 5: CSS Improvements (1 giờ)

#### 5.1 Add Responsive Utilities

**File:** `src/index.css`

**Add responsive utilities:**
```css
/* Responsive Container */
.responsive-container {
  @apply w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8;
}

/* Responsive Text */
.text-responsive-sm {
  @apply text-xs sm:text-sm;
}

.text-responsive-base {
  @apply text-sm sm:text-base;
}

.text-responsive-lg {
  @apply text-base sm:text-lg md:text-xl;
}

/* Responsive Spacing */
.space-responsive {
  @apply space-y-3 md:space-y-4 lg:space-y-6;
}

.gap-responsive {
  @apply gap-3 md:gap-4 lg:gap-6;
}

/* Hide/Show at breakpoints */
.mobile-only {
  @apply block md:hidden;
}

.desktop-only {
  @apply hidden md:block;
}

.tablet-up {
  @apply hidden sm:block;
}

/* Compact mode utilities */
.compact-layout .tool-card {
  @apply p-3;
}

.comfortable-layout .tool-card {
  @apply p-4 md:p-6;
}

/* Scrollbar improvements */
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

/* Responsive overlay for mobile sidebar */
@media (max-width: 1024px) {
  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 40;
  }
}
```

---

#### 5.2 Add Media Query Helpers

**File:** `src/utils/responsive.ts` (NEW)

```typescript
export const breakpoints = {
  xs: 640,
  sm: 768,
  md: 1024,
  lg: 1366,
  xl: 1920,
  '2xl': 2560,
} as const;

export const mediaQueries = {
  xs: `@media (min-width: ${breakpoints.xs}px)`,
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  '2xl': `@media (min-width: ${breakpoints['2xl']}px)`,
} as const;

export function getResponsiveValue<T>(
  value: T | { xs?: T; sm?: T; md?: T; lg?: T; xl?: T; '2xl'?: T },
  currentWidth: number
): T {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  const breakpointKeys = Object.keys(breakpoints) as Array<keyof typeof breakpoints>;
  const sortedKeys = breakpointKeys.sort((a, b) => breakpoints[b] - breakpoints[a]);

  for (const key of sortedKeys) {
    if (currentWidth >= breakpoints[key] && value[key] !== undefined) {
      return value[key]!;
    }
  }

  return value.xs ?? value.sm ?? value.md ?? (value as any).default;
}
```

---

### Phase 6: Settings Integration (30 phút)

#### 6.1 Add Responsive Settings

**File:** `src/store/settingsStore.ts`

**Add responsive preferences:**
```typescript
interface SettingsState {
  // ... existing settings
  
  // Responsive settings
  autoCollapsSidebar: boolean; // Auto-collapse on mobile
  compactMode: boolean; // Force compact mode
  adaptiveLayout: boolean; // Auto-adjust layout
  
  // Actions
  setAutoCollapseSidebar: (value: boolean) => void;
  setCompactMode: (value: boolean) => void;
  setAdaptiveLayout: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  // ... existing state
  
  autoCollapseSidebar: true,
  compactMode: false,
  adaptiveLayout: true,
  
  setAutoCollapseSidebar: (value) => set({ autoCollapseSidebar: value }),
  setCompactMode: (value) => set({ compactMode: value }),
  setAdaptiveLayout: (value) => set({ adaptiveLayout: value }),
}));
```

---

#### 6.2 Add UI Settings Panel

**File:** `src/pages/Settings.tsx`

**Add responsive settings section:**
```typescript
<Card className="p-6">
  <h3 className="text-lg font-semibold mb-4">Display & Layout</h3>
  
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <label className="font-medium">Auto-collapse Sidebar</label>
        <p className="text-sm text-foreground-secondary">
          Automatically hide sidebar on small screens
        </p>
      </div>
      <Toggle
        checked={autoCollapseSidebar}
        onChange={setAutoCollapseSidebar}
      />
    </div>
    
    <div className="flex items-center justify-between">
      <div>
        <label className="font-medium">Compact Mode</label>
        <p className="text-sm text-foreground-secondary">
          Reduce padding and spacing for more content
        </p>
      </div>
      <Toggle
        checked={compactMode}
        onChange={setCompactMode}
      />
    </div>
    
    <div className="flex items-center justify-between">
      <div>
        <label className="font-medium">Adaptive Layout</label>
        <p className="text-sm text-foreground-secondary">
          Automatically adjust layout based on window size
        </p>
      </div>
      <Toggle
        checked={adaptiveLayout}
        onChange={setAdaptiveLayout}
      />
    </div>
  </div>
</Card>
```

---

## 🧪 Testing Plan

### Manual Testing

#### Window Resize Testing
```
□ 800×600 (Minimum) - All content visible
□ 1024×768 (Tablet) - Sidebar auto-collapses
□ 1366×768 (Laptop) - Normal layout
□ 1920×1080 (Full HD) - Comfortable layout
□ 2560×1440 (4K) - Maximum space utilization
```

#### Layout Testing
```
□ Sidebar collapse/expand smooth
□ Tab bar scrolls on overflow
□ Tool content doesn't overflow
□ Footer adapts to width
□ No horizontal scroll
□ All tools work at minimum size
```

#### Responsive Components
```
□ Cards adjust padding
□ Grids reflow correctly
□ Text sizes scale
□ Buttons remain accessible
□ Modals/dialogs fit screen
```

---

## 📝 Implementation Checklist

### Phase 1: Window (30 min)
- [ ] Update minWidth to 800px
- [ ] Test resize behavior
- [ ] Verify bounds persistence

### Phase 2: Breakpoints (1 hour)
- [ ] Update Tailwind config
- [ ] Create useResponsive hook
- [ ] Create useWindowSize hook
- [ ] Test hook accuracy

### Phase 3: Layouts (2-3 hours)
- [ ] Update App.tsx
- [ ] Update Sidebar.tsx
- [ ] Update TabBar.tsx
- [ ] Add mobile overlay
- [ ] Test navigation

### Phase 4: Components (2-3 hours)
- [ ] Create ResponsiveCard
- [ ] Create ResponsiveGrid
- [ ] Update tool components
- [ ] Test all tools

### Phase 5: CSS (1 hour)
- [ ] Add responsive utilities
- [ ] Update scrollbars
- [ ] Test styles

### Phase 6: Settings (30 min)
- [ ] Add store properties
- [ ] Create settings UI
- [ ] Test persistence

### Final Testing
- [ ] Test all window sizes
- [ ] Test all tools
- [ ] Test sidebar behavior
- [ ] Test mobile simulation
- [ ] Performance check

---

## 🎯 Quick Wins (Do First)

### Immediate Improvements (< 1 hour)
1. **Lower minWidth to 800px**
   - Edit `electron/main/main.ts` line 547
   - Instant better support

2. **Add useResponsive hook**
   - Create file
   - Use in App.tsx
   - Test responsiveness

3. **Update Sidebar**
   - Add mobile overlay
   - Auto-collapse behavior
   - Smooth transitions

### High Impact (1-2 hours)
4. **Responsive TabBar**
   - Scrollable tabs
   - More menu
   - Hide actions on mobile

5. **CSS Utilities**
   - Add responsive classes
   - Update existing components

---

## 💡 Best Practices

### Responsive Design Principles
1. **Mobile-First:** Start with mobile layout, enhance for desktop
2. **Touch-Friendly:** Minimum 44×44px touch targets
3. **Readable Text:** Minimum 14px font size
4. **Adequate Spacing:** Sufficient padding/margin
5. **No Horizontal Scroll:** Content must fit width
6. **Performance:** Avoid expensive recalculations

### Component Guidelines
```typescript
// ✅ Good
<div className="p-3 md:p-4 lg:p-6">
<span className="text-sm md:text-base">

// ❌ Bad
<div style={{ padding: '24px' }}>
<span style={{ fontSize: '14px' }}>
```

---

## 🚀 Next Steps

### Week 1
- Day 1: Phase 1 & 2 (Window + Breakpoints)
- Day 2: Phase 3 (Layouts)
- Day 3-4: Phase 4 (Components)
- Day 5: Phase 5 & 6 (CSS + Settings)

### Testing
- Day 6: Comprehensive testing
- Day 7: Bug fixes and polish

---

## 📚 Resources

### Documentation
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Electron BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window)
- [CSS Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries)

### Tools
- Chrome DevTools (Device Emulation)
- Responsive Design Mode (Firefox)
- Window Size Testing Apps

---

**Ready to make the app fully responsive! 🎨📐**
