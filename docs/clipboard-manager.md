# Clipboard Manager Tool - Specification

## Overview

A comprehensive clipboard management tool that allows users to copy text/images to clipboard, maintain a searchable history of clipboard items, and quickly access previously copied content.

## Tool Definition

```typescript
{
    id: 'clipboard-manager',
    name: 'Clipboard Manager',
    path: '/clipboard-manager',
    description: 'Manage and browse clipboard history with search and organization',
    category: 'development', // or 'utilities' if new category
    icon: Clipboard, // from lucide-react
    keywords: ['clipboard', 'copy', 'paste', 'history', 'manager']
}
```

## Core Features

### 1. Quick Copy Section
- **Text Input Field**: Large textarea for entering text to copy
- **Copy Button**: macOS-style button to copy input to clipboard
- **Feedback**: Visual feedback when copy succeeds (toast/notification)
- **Auto-add to History**: Automatically adds copied content to history

### 2. Clipboard History
- **Automatic Tracking**: Saves all clipboard operations (text and images)
- **Chronological Display**: Most recent items first
- **Item Limit**: Configurable max items (default: 100)
- **Auto-cleanup**: Removes oldest items when limit exceeded
- **Persistent Storage**: Saved to localStorage via Zustand persist

### 3. Clipboard Item Display
Each item shows:
- **Preview**: Truncated text preview (first 100-150 chars)
- **Timestamp**: Relative time ("2 minutes ago", "1 hour ago", "Yesterday")
- **Type Indicator**: Icon for text (📄) or image (🖼️)
- **Pinned Badge**: Visual indicator for pinned items
- **Actions**: Copy, Pin/Unpin, Delete buttons

### 4. Search & Filter
- **Search Bar**: Real-time search through clipboard content
- **Filter Options**:
  - Type: All, Text only, Images only
  - Date: Today, This week, This month, All time
  - Status: All, Pinned only
- **Debounced Search**: Performance optimization for large lists

### 5. Item Actions
- **Copy**: Copy item back to system clipboard
- **Pin/Unpin**: Pin important items to top of list
- **Delete**: Remove item from history
- **View Full**: Open modal/drawer to view complete content
- **Copy as**: Options for formatted copy (JSON, code block, etc.)

### 6. Settings & Options
- **Max History Items**: 50, 100, 200, 500, Unlimited
- **Auto-clear**: Remove items older than X days
- **Exclude Duplicates**: Don't save if same as last item
- **Clear All**: Button with confirmation dialog
- **Export/Import**: Backup and restore clipboard history (future)

## UI/UX Design (macOS Style)

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Clipboard Manager                                  │
├─────────────────────────────────────────────────────┤
│  Quick Copy                                         │
│  ┌───────────────────────────────────────────────┐ │
│  │ [Text Input Area - Multi-line]                │ │
│  │                                                │ │
│  └───────────────────────────────────────────────┘ │
│  [Copy to Clipboard Button]                         │
├─────────────────────────────────────────────────────┤
│  Search & Filter                                    │
│  [🔍 Search...] [Filter: All ▼] [⚙️ Settings] [🗑️ Clear All]│
├─────────────────────────────────────────────────────┤
│  📌 Pinned Items (2)                                │
│  ┌───────────────────────────────────────────────┐ │
│  │ 📌 📄 "Important configuration..."            │ │
│  │    2 hours ago                    [⚡][📌][🗑] │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │ 📌 📄 "API endpoint URL..."                   │ │
│  │    1 day ago                      [⚡][📌][🗑] │ │
│  └───────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  Recent Items (15)                                  │
│  ┌───────────────────────────────────────────────┐ │
│  │ 📄 "Sample JSON data..."                      │ │
│  │    5 minutes ago                  [⚡][📌][🗑] │ │
│  └───────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────┐ │
│  │ 🖼️ Image (base64)                            │ │
│  │    10 minutes ago                 [⚡][📌][🗑] │ │
│  └───────────────────────────────────────────────┘ │
│  ... (scrollable)                                   │
└─────────────────────────────────────────────────────┘
```

### Visual Design Elements

- **Glassmorphism Cards**: Each clipboard item in a glass card
- **Hover Effects**: Subtle background change on hover
- **Active State**: Highlighted when item is selected
- **Icons**: 
  - Clipboard (main icon)
  - Pin (pin/unpin action)
  - Copy (quick copy action)
  - Trash (delete action)
  - Search (search icon)
  - Image (image type indicator)
- **Color Coding**: 
  - Pinned items: Accent color border/background
  - Text items: Default glass style
  - Image items: Slight tint

## State Management

### Clipboard Store Structure

```typescript
interface ClipboardItem {
    id: string; // Unique identifier
    content: string; // Full content (text or base64 for images)
    type: 'text' | 'image';
    timestamp: number; // Unix timestamp
    pinned: boolean;
    metadata?: {
        length?: number; // Character count for text
        mimeType?: string; // For images (image/png, etc.)
        preview?: string; // Thumbnail for images
    };
}

interface FilterOptions {
    type: 'all' | 'text' | 'image';
    dateRange: 'all' | 'today' | 'week' | 'month';
    pinnedOnly: boolean;
}

interface ClipboardStore {
    items: ClipboardItem[];
    maxItems: number;
    settings: {
        autoClearDays: number; // 0 = disabled
        excludeDuplicates: boolean;
        enableMonitoring: boolean; // Auto-detect clipboard changes
    };
    
    // Actions
    addItem(content: string, type: 'text' | 'image', metadata?: any): void;
    removeItem(id: string): void;
    pinItem(id: string): void;
    unpinItem(id: string): void;
    clearAll(): void;
    updateSettings(settings: Partial<ClipboardStore['settings']>): void;
    searchItems(query: string): ClipboardItem[];
    filterItems(filter: FilterOptions): ClipboardItem[];
    getSortedItems(): ClipboardItem[]; // Pinned first, then by date
}
```

## Technical Implementation

### Clipboard API Usage

```typescript
// Copy to clipboard
async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
    }
}

// Read from clipboard (requires permission)
async function readClipboard(): Promise<string | null> {
    try {
        const text = await navigator.clipboard.readText();
        return text;
    } catch (err) {
        console.warn('Clipboard read permission denied');
        return null;
    }
}
```

### Clipboard Monitoring (Optional)

```typescript
// Monitor clipboard changes (requires permission)
useEffect(() => {
    if (!settings.enableMonitoring) return;
    
    const interval = setInterval(async () => {
        const current = await readClipboard();
        if (current && current !== lastClipboard) {
            addItem(current, 'text');
            setLastClipboard(current);
        }
    }, 1000); // Check every second
    
    return () => clearInterval(interval);
}, [settings.enableMonitoring]);
```

### Persistence

- **Storage**: Zustand persist middleware
- **Backend**: localStorage (or indexedDB for large data)
- **Migration**: Handle version upgrades
- **Size Limit**: Warn if approaching storage limits

### Performance Optimizations

- **Virtual Scrolling**: For lists with 100+ items
- **Debounced Search**: 300ms delay on search input
- **Memoized Filters**: Use `useMemo` for filtered/sorted lists
- **Lazy Image Loading**: Load image previews on demand
- **Pagination**: Optional pagination for very large histories

## Component Structure

```
src/tools/utilities/
├── ClipboardManager.tsx          # Main component
├── components/
│   ├── QuickCopySection.tsx      # Input + copy button
│   ├── SearchAndFilter.tsx       # Search bar + filters
│   ├── ClipboardList.tsx         # List container
│   ├── ClipboardItem.tsx         # Individual item card
│   ├── ClipboardSettings.tsx     # Settings modal
│   └── ViewFullModal.tsx         # Full content viewer
└── hooks/
    ├── useClipboard.ts           # Clipboard API wrapper
    └── useClipboardMonitor.ts    # Clipboard monitoring hook
```

## User Interactions

1. **Copy Text**: Enter text → Click "Copy" → Added to history
2. **Click Item**: Automatically copies item to clipboard
3. **Pin Item**: Click pin icon → Item moves to pinned section
4. **Delete Item**: Click trash icon → Confirmation → Removed
5. **View Full**: Click item → Modal opens with full content
6. **Search**: Type in search → Real-time filtering
7. **Filter**: Select filter options → List updates
8. **Clear All**: Click "Clear All" → Confirmation → All removed
9. **Settings**: Click settings icon → Modal with options

## Edge Cases & Error Handling

### Clipboard API Not Available
- **Detection**: Check `navigator.clipboard` availability
- **Fallback**: Use `document.execCommand('copy')`
- **UI**: Show warning message if both fail

### Permission Denied
- **Detection**: Catch permission errors
- **UI**: Show message explaining permission requirement
- **Workaround**: Manual copy button still works

### Large Content
- **Preview**: Truncate to 150 characters with "..."
- **Full View**: Modal with scrollable content
- **Performance**: Lazy render large items

### Images
- **Detection**: Check if content is base64 image
- **Preview**: Show thumbnail or placeholder
- **Storage**: Consider size limits for images
- **Display**: Full image viewer in modal

### Duplicates
- **Detection**: Compare with last item
- **Option**: Skip if `excludeDuplicates` enabled
- **Merge**: Or merge with timestamp update

### Empty State
- **Message**: "No clipboard items yet"
- **Action**: Prompt to copy something
- **Illustration**: Empty state icon/illustration

### Storage Limits
- **Detection**: Monitor localStorage size
- **Warning**: Show warning at 80% capacity
- **Action**: Suggest clearing old items

## Accessibility

- **Keyboard Navigation**:
  - Arrow keys to navigate items
  - Enter to copy selected item
  - Escape to close modals
  - Tab to navigate controls
- **Screen Reader**:
  - ARIA labels for all buttons
  - Live regions for copy feedback
  - Descriptive text for items
- **Focus Management**:
  - Visible focus indicators
  - Logical tab order
  - Focus trap in modals

## Future Enhancements

### Phase 1 (MVP)
- ✅ Basic copy functionality
- ✅ History list
- ✅ Search and filter
- ✅ Pin/delete items

### Phase 2
- [ ] Clipboard monitoring (auto-detect changes)
- [ ] Image support (base64)
- [ ] Export/Import history
- [ ] Categories/Tags

### Phase 3
- [ ] Sync across devices (requires backend)
- [ ] Rich text support
- [ ] Keyboard shortcuts (Cmd+K for search)
- [ ] Clipboard templates/snippets
- [ ] Statistics (most copied items, etc.)

## Testing Considerations

- **Unit Tests**:
  - Store actions (add, remove, pin, etc.)
  - Filter and search logic
  - Date formatting utilities
- **Integration Tests**:
  - Clipboard API interactions
  - Persistence (localStorage)
  - Component interactions
- **E2E Tests**:
  - Copy flow
  - Search and filter
  - Pin/delete operations
- **Performance Tests**:
  - Large history (1000+ items)
  - Search performance
  - Render performance

## Security & Privacy

- **Data Storage**: All data stored locally
- **No External Sharing**: No data sent to servers
- **Clear Option**: Easy way to clear all data
- **Permission Handling**: Request clipboard permission only when needed
- **Content Sanitization**: Sanitize content before display (XSS prevention)

## Dependencies

- **Core**: React, Zustand
- **Icons**: lucide-react
- **Date Formatting**: date-fns or similar
- **Virtual Scrolling**: react-window (if needed)
- **Clipboard API**: Native browser API

## Implementation Checklist

- [ ] Create clipboard store (Zustand)
- [ ] Implement QuickCopySection component
- [ ] Implement ClipboardList component
- [ ] Implement ClipboardItem component
- [ ] Add search functionality
- [ ] Add filter functionality
- [ ] Add pin/unpin functionality
- [ ] Add delete functionality
- [ ] Add settings modal
- [ ] Add clipboard monitoring (optional)
- [ ] Add image support (optional)
- [ ] Add persistence
- [ ] Add accessibility features
- [ ] Add error handling
- [ ] Add empty states
- [ ] Add loading states
- [ ] Style with macOS design
- [ ] Add tests
- [ ] Update registry

