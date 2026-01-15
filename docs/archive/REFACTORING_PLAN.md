# 🔧 Code Refactoring Plan - DevTools App

## Tổng Quan (Overview)

Refactor toàn bộ codebase để cải thiện code organization, reusability, và maintainability bằng cách:
- Consolidate các duplicate utility functions vào cấu trúc utils tập trung
- Centralize tất cả interfaces và types vào `src/types`
- Loại bỏ code duplication across components
- Cải thiện overall code organization

---

## 🔍 Vấn Đề Hiện Tại (Current Issues)

### 1. Duplicate Utility Functions

#### Format Functions (Duplicated 5+ lần)
- **`formatBytes` / `formatFileSize`**
  - `src/tools/media/YoutubeDownloader.tsx` (line 56)
  - `src/tools/media/utils/youtube-helpers.ts` (line 45)
  - `src/tools/utilities/stats-monitor/components/DiskModule.tsx` (line 20)
  - `src/tools/utilities/stats-monitor/components/MemoryModule.tsx` (line 20)
  - `src/tools/utilities/stats-monitor/components/NetworkModule.tsx` (line 20)

#### Time/Duration Functions (Duplicated 6+ lần)
- **`formatTime` / `formatDuration`**
  - `src/tools/media/YoutubeDownloader.tsx` (line 79, 88)
  - `src/tools/media/components/PlaylistView.tsx` (line 26)
  - `src/tools/media/components/VideoInfo.tsx` (line 24)
  - `src/tools/media/components/TimelineEditor.tsx` (line 172)
  - `src/tools/media/utils/youtube-helpers.ts` (line 58)
  - `src/tools/utilities/stats-monitor/components/BatteryModule.tsx` (line 327)
  - `src/tools/utilities/stats-monitor/components/TimeZonesModule.tsx` (line 35)

#### Speed Functions
- **`formatSpeed`**
  - `src/tools/media/YoutubeDownloader.tsx` (line 55)
  - `src/tools/media/utils/youtube-helpers.ts` (line 73)

#### Other Utilities
- **`formatETA`** - Only in YoutubeDownloader but should be shared
- **`sanitizeFilename`** - Only in youtube-helpers but reusable
- **Validation functions** - Scattered across components

### 2. Scattered Interfaces & Types

**Vấn đề:**
- Nhiều components định nghĩa local interfaces có thể share
- Một số types tồn tại trong `src/types` nhưng components vẫn redefine
- Inconsistent type definitions across similar features

**Ví dụ:**
- `VideoFormat`, `VideoInfo` - Defined nhiều lần trong YoutubeDownloader.tsx và types/youtube.ts
- Clipboard types - Mixed trong store và components
- Screenshot types - Riêng lẻ trong tools/screenshot/types
- System cleaner types - Riêng lẻ trong tools/utilities/system-cleaner/types

### 3. Mixed Code Organization

**Hiện tại:**
- Một số features có utils folders (`media/utils`, `screenshot/utils`)
- Features khác có inline utility functions
- Không có consistent pattern cho shared code placement

---

## 🏗️ Cấu Trúc Mới (New Structure)

```
src/
├── utils/
│   ├── format/
│   │   ├── bytes.ts         # formatBytes, formatFileSize
│   │   ├── time.ts          # formatTime, formatDuration, formatETA
│   │   ├── speed.ts         # formatSpeed, formatBandwidth
│   │   └── index.ts         # Export tất cả format utils
│   │
│   ├── validation/
│   │   ├── url.ts           # URL validation (youtube, general)
│   │   ├── file.ts          # File validation, sanitization
│   │   └── index.ts         # Export tất cả validation utils
│   │
│   ├── file/
│   │   ├── operations.ts    # File system operations
│   │   ├── sanitize.ts      # Filename sanitization
│   │   └── index.ts
│   │
│   ├── cn.ts                # (existing - classnames utility)
│   ├── errorHandling.ts     # (existing)
│   ├── keyboardShortcuts.ts # (existing)
│   └── logger.ts            # (existing)
│
├── types/
│   ├── common/
│   │   ├── ui.ts            # Common UI types (Button, Card, etc.)
│   │   ├── file.ts          # File-related types
│   │   ├── format.ts        # Format-related types
│   │   └── index.ts
│   │
│   ├── youtube.ts           # (existing, sẽ enhance)
│   ├── application-manager.ts # (existing)
│   ├── stats.ts             # (existing)
│   ├── store.ts             # (existing)
│   ├── clipboard.ts         # NEW - Extract from clipboardStore
│   ├── screenshot.ts        # NEW - Move from tools/screenshot/types
│   └── system-cleaner.ts    # NEW - Move from system-cleaner/types
```

---

## 📋 Chi Tiết Implementation

### Phase 1: Tạo Centralized Utils Structure

#### 1.1 Create `src/utils/format/bytes.ts`
```typescript
/**
 * Byte formatting utilities
 */

export const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
};

// Alias for compatibility
export const formatFileSize = formatBytes;
```

**Files affected:** 5+ files sẽ import từ đây

#### 1.2 Create `src/utils/format/time.ts`
```typescript
/**
 * Time and duration formatting utilities
 */

export const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
};

export const formatTime = formatDuration; // Alias

export const formatETA = (seconds: number): string => {
    if (seconds === 0 || !isFinite(seconds)) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
};

export const formatTimeAgo = (date: string | Date): string => {
    const now = new Date();
    const then = typeof date === 'string' ? new Date(date) : date;
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
};
```

**Files affected:** 6+ files sẽ import từ đây

#### 1.3 Create `src/utils/format/speed.ts`
```typescript
/**
 * Speed formatting utilities
 */

import { formatBytes } from './bytes';

export const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`;
};

export const formatBandwidth = formatSpeed; // Alias
```

#### 1.4 Create `src/utils/format/index.ts`
```typescript
/**
 * Format utilities barrel export
 */

export * from './bytes';
export * from './time';
export * from './speed';
```

#### 1.5 Create `src/utils/validation/url.ts`
```typescript
/**
 * URL validation utilities
 */

export const isValidYoutubeUrl = (url: string): boolean => {
    const patterns = [
        /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
};

export const extractVideoId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
};

export const extractPlaylistId = (url: string): string | null => {
    const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
};

export const isPlaylistUrl = (url: string): boolean => {
    return url.includes('list=');
};
```

#### 1.6 Create `src/utils/validation/file.ts`
```typescript
/**
 * File validation and sanitization utilities
 */

export const sanitizeFilename = (filename: string, maxLength: number = 200): string => {
    return filename
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
        .replace(/\s+/g, ' ')          // Replace multiple spaces
        .trim()
        .substring(0, maxLength);
};

export const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
};

export const isValidFilename = (filename: string): boolean => {
    const invalidChars = /[<>:"/\\|?*]/;
    return !invalidChars.test(filename) && filename.length > 0;
};
```

#### 1.7 Create `src/utils/validation/index.ts`
```typescript
/**
 * Validation utilities barrel export
 */

export * from './url';
export * from './file';
```

---

### Phase 2: Centralize Type Definitions

#### 2.1 Create `src/types/clipboard.ts`
Extract từ `src/store/clipboardStore.ts`:

```typescript
/**
 * Clipboard Manager Type Definitions
 */

export interface ClipboardItem {
    id: string;
    content: string;
    type: 'text' | 'image' | 'file' | 'html' | 'rtf';
    timestamp: number;
    isPinned: boolean;
    source?: string;
    preview?: string;
    category?: string;
    tags?: string[];
    favorite?: boolean;
}

export interface ClipboardSettings {
    enableMonitoring: boolean;
    maxItems: number;
    autoClean: boolean;
    ignoredApps: string[];
    enableSync: boolean;
}

export interface FilterOptions {
    type: 'all' | 'text' | 'image' | 'file' | 'html' | 'rtf';
    dateRange: 'all' | 'today' | 'week' | 'month';
    pinnedOnly: boolean;
    searchMode: 'contains' | 'startsWith' | 'regex';
}

export interface ClipboardStats {
    totalItems: number;
    itemsByType: Record<string, number>;
    mostUsed: ClipboardItem[];
}
```

#### 2.2 Move `src/tools/screenshot/types/index.ts` → `src/types/screenshot.ts`

```typescript
/**
 * Screenshot Tool Type Definitions
 */

export interface Screenshot {
    id: string;
    data: string; // base64
    width: number;
    height: number;
    format: 'png' | 'jpg' | 'webp';
    timestamp: number;
}

export interface Annotation {
    id: string;
    type: 'arrow' | 'rectangle' | 'circle' | 'text' | 'line' | 'highlight';
    x: number;
    y: number;
    width?: number;
    height?: number;
    color: string;
    text?: string;
    strokeWidth?: number;
}

export interface BackgroundStyle {
    type: 'gradient' | 'solid' | 'pattern';
    colors?: string[];
    pattern?: string;
}

export interface ExportOptions {
    format: 'png' | 'jpg' | 'webp';
    quality: number;
    includeBackground: boolean;
    padding: number;
}
```

#### 2.3 Move `src/tools/utilities/system-cleaner/types/index.ts` → `src/types/system-cleaner.ts`

Keep existing types, just move location.

#### 2.4 Create `src/types/common/ui.ts`

```typescript
/**
 * Common UI Component Types
 */

export interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ToastOptions {
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}
```

---

### Phase 3: Refactor Component Files

#### Files cần refactor (8+ files):

1. **`src/tools/media/YoutubeDownloader.tsx`**
   - Remove lines 47-86 (inline utility functions)
   - Add imports:
     ```typescript
     import { formatBytes, formatSpeed, formatETA, formatTime } from '../../utils/format';
     ```

2. **`src/tools/media/components/PlaylistView.tsx`**
   - Remove `formatDuration` function (line 26)
   - Import: `import { formatDuration } from '../../../utils/format';`

3. **`src/tools/media/components/VideoInfo.tsx`**
   - Remove `formatDuration` function (line 24)
   - Import: `import { formatDuration } from '../../../utils/format';`

4. **`src/tools/media/components/TimelineEditor.tsx`**
   - Remove `formatTime` function (line 172)
   - Import: `import { formatTime } from '../../../utils/format';`

5. **`src/tools/utilities/stats-monitor/components/DiskModule.tsx`**
   - Remove `formatBytes` function (line 20)
   - Import: `import { formatBytes } from '../../../../utils/format';`

6. **`src/tools/utilities/stats-monitor/components/MemoryModule.tsx`**
   - Remove `formatBytes` function (line 20)
   - Import: `import { formatBytes } from '../../../../utils/format';`

7. **`src/tools/utilities/stats-monitor/components/NetworkModule.tsx`**
   - Remove `formatBytes` function (line 20)
   - Import: `import { formatBytes } from '../../../../utils/format';`

8. **`src/tools/utilities/stats-monitor/components/BatteryModule.tsx`**
   - Remove `formatTime` function (line 327)
   - Import: `import { formatTime } from '../../../../utils/format';`

---

### Phase 4: Update Feature-Specific Utils

#### Keep but enhance:
- **`src/tools/media/utils/youtube-helpers.ts`**
  - Remove duplicate functions (formatFileSize, formatDuration, formatSpeed)
  - Keep YouTube-specific logic (isValidYoutubeUrl, extractVideoId, etc.)
  - Import common utilities: `import { formatBytes, formatDuration, formatSpeed } from '../../../utils/format';`
  - Export re-exports for backward compatibility if needed

#### Maintain:
- `src/tools/screenshot/utils/` - Screenshot-specific operations (annotations, crop, redaction, etc.)
- `src/tools/utilities/system-cleaner/utils/` - System cleaner specific operations

---

### Phase 5: Update Imports Throughout Codebase

#### Search and replace patterns:

1. Find all files importing from old locations
2. Update to new centralized locations
3. Verify no circular dependencies

#### Example updates:
```typescript
// OLD
import { formatBytes } from '../utils/helpers';

// NEW
import { formatBytes } from '../../utils/format';
```

---

## 📊 Impact Analysis

### Files to Create: **13 files**
- `src/utils/format/bytes.ts`
- `src/utils/format/time.ts`
- `src/utils/format/speed.ts`
- `src/utils/format/index.ts`
- `src/utils/validation/url.ts`
- `src/utils/validation/file.ts`
- `src/utils/validation/index.ts`
- `src/types/common/ui.ts`
- `src/types/common/file.ts`
- `src/types/common/format.ts`
- `src/types/clipboard.ts`
- `src/types/screenshot.ts`
- `src/types/system-cleaner.ts`

### Files to Modify: **20+ files**

**High Priority (Remove inline functions):**
- `src/tools/media/YoutubeDownloader.tsx`
- `src/tools/media/components/PlaylistView.tsx`
- `src/tools/media/components/VideoInfo.tsx`
- `src/tools/media/components/TimelineEditor.tsx`
- `src/tools/utilities/stats-monitor/components/DiskModule.tsx`
- `src/tools/utilities/stats-monitor/components/MemoryModule.tsx`
- `src/tools/utilities/stats-monitor/components/NetworkModule.tsx`
- `src/tools/utilities/stats-monitor/components/BatteryModule.tsx`

**Medium Priority (Extract types):**
- `src/store/clipboardStore.ts`
- All files importing from `tools/screenshot/types`
- All files importing from `system-cleaner/types`

**Low Priority (Update imports):**
- All other files using these utilities

### Files to Delete: **3 folders**
- `src/tools/screenshot/types/` (move to centralized location)
- `src/tools/utilities/system-cleaner/types/` (move to centralized location)
- Potentially some duplicate utility files

---

## ✅ Benefits

### 1. Code Reusability
- Single source of truth cho common utilities
- Dễ dàng reuse across features
- Giảm code duplication từ 5+ lần xuống 1 lần

### 2. Maintainability
- Update logic ở một nơi thay vì nhiều nơi
- Dễ tìm và fix bugs
- Clear ownership của code

### 3. Consistency
- Unified formatting across toàn app
- Consistent behavior
- Predictable API

### 4. Type Safety
- Centralized types prevent inconsistencies
- Better IDE autocomplete
- Catch errors at compile time

### 5. Bundle Size
- Remove duplicate code
- Better tree-shaking
- Smaller production build

### 6. Developer Experience
- Clear code organization
- Easy to find utilities
- Faster development
- Better onboarding cho developers mới

---

## 🧪 Testing Strategy

### After Refactoring, Verify:

#### 1. TypeScript Compilation
```bash
npm run build
# hoặc
tsc --noEmit
```

#### 2. Tool Functionality Testing
- [ ] YouTube Downloader - Download video/audio
- [ ] YouTube Downloader - Playlist support
- [ ] Screenshot Tool - Capture & edit
- [ ] Clipboard Manager - Monitor & search
- [ ] Stats Monitor - All modules display correctly
- [ ] System Cleaner - Scan & clean functions

#### 3. Format Function Testing
Test các format functions với edge cases:
- `formatBytes(0)` → "0 Bytes"
- `formatBytes(1024)` → "1.00 KB"
- `formatDuration(0)` → "0:00"
- `formatDuration(3661)` → "1:01:01"

#### 4. Runtime Errors
- Check console for errors
- Verify no import errors
- Test hot reload still works

---

## 📝 Migration Checklist

### Pre-Migration
- [ ] Backup current codebase
- [ ] Create refactoring branch
- [ ] Document current file structure

### Phase 1: Utils
- [ ] Create utils/format folder structure
- [ ] Create utils/validation folder structure
- [ ] Implement all format utilities
- [ ] Implement all validation utilities
- [ ] Add comprehensive JSDoc comments

### Phase 2: Types
- [ ] Create types/common folder
- [ ] Move screenshot types
- [ ] Move system-cleaner types
- [ ] Extract clipboard types
- [ ] Update all type imports

### Phase 3: Components
- [ ] Refactor YouTube components
- [ ] Refactor Stats Monitor components
- [ ] Update all component imports
- [ ] Remove inline utility functions

### Phase 4: Testing
- [ ] Run TypeScript compiler
- [ ] Test all refactored tools
- [ ] Verify no runtime errors
- [ ] Performance testing

### Phase 5: Cleanup
- [ ] Delete old type folders
- [ ] Remove commented code
- [ ] Update documentation
- [ ] Create PR for review

---

## 🚀 Execution Order

### Step-by-Step Implementation:

1. **Create new utils structure** (1-2 hours)
   - Format utilities
   - Validation utilities

2. **Create centralized types** (1 hour)
   - Move existing types
   - Create new common types

3. **Refactor components in batches** (2-3 hours)
   - Batch 1: YouTube components
   - Batch 2: Stats Monitor components
   - Batch 3: Other components

4. **Update imports** (1 hour)
   - Find and replace
   - Verify all imports

5. **Testing & verification** (1 hour)
   - Compile check
   - Functionality testing
   - Bug fixes

**Total Estimated Time: 6-8 hours**

---

## 📚 Additional Notes

### Backward Compatibility
- Keep old files temporarily with deprecation warnings
- Gradually migrate imports
- Remove old files in separate PR if needed

### Code Review Focus Points
- Verify no circular dependencies
- Check import paths are correct
- Ensure type safety maintained
- Test critical user flows

### Future Improvements
- Add unit tests for utility functions
- Document utility functions with examples
- Create Storybook for UI components
- Set up code coverage tracking

---

## 🔗 Related Documentation
- [YouTube Auto Fetch Feature](./YOUTUBE_AUTO_FETCH_FEATURE.md)
- [Background Downloads](./BACKGROUND_DOWNLOADS.md)
- [YouTube Dynamic Formats](./YOUTUBE_DYNAMIC_FORMATS.md)

---

**Status:** 📋 Planning Complete - Ready for Implementation
**Last Updated:** January 7, 2026
**Maintainer:** Development Team

