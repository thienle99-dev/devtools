# TikTok Video Downloader - Implementation Plan

## Overview
Build a TikTok video downloader feature similar to the existing YouTube downloader, leveraging the same yt-dlp backend infrastructure.

**Status:** 📋 Planning Phase  
**Priority:** High  
**Estimated Time:** 4-6 hours

---

## Table of Contents
1. [Architecture](#architecture)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Integration Steps](#integration-steps)
5. [Testing Plan](#testing-plan)
6. [Future Enhancements](#future-enhancements)

---

## Architecture

### Component Structure
```
devtools-app/
├── electron/main/
│   └── tiktok-downloader.ts          # Backend service (NEW)
├── src/tools/media/
│   ├── TiktokDownloader.tsx           # Main component (NEW)
│   ├── components/
│   │   ├── TikTokVideoInfo.tsx        # Video info card (NEW)
│   │   ├── TikTokFormatSelector.tsx   # Format selector (NEW)
│   │   └── DownloadProgress.tsx       # Reuse existing
│   └── utils/
│       └── tiktok-helpers.ts          # Helper functions (NEW)
└── src/tools/registry.tsx             # Update with new tool
```

### Technology Stack
- **Backend**: yt-dlp (already installed, supports TikTok)
- **Frontend**: React + TypeScript
- **State Management**: React hooks + Zustand (optional)
- **Storage**: electron-store (for history and settings)

---

## Backend Implementation

### File: `electron/main/tiktok-downloader.ts`

#### 1. Core Classes & Interfaces

```typescript
export interface TikTokDownloadOptions {
    url: string;
    format: 'video' | 'audio';
    quality?: 'best' | 'medium' | 'low';
    outputPath?: string;
    maxSpeed?: string;
    watermark?: boolean; // TikTok-specific: keep or remove watermark
    id?: string;
}

export interface TikTokVideoInfo {
    id: string;
    title: string;
    author: string;
    authorUsername: string;
    duration: number;
    thumbnailUrl: string;
    description?: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
    uploadDate?: string;
    musicTitle?: string;
    musicAuthor?: string;
}

export interface DownloadProgress {
    id?: string;
    percent: number;
    downloaded: number;
    total: number;
    speed: number;
    eta: number;
    state: 'downloading' | 'processing' | 'complete' | 'error';
    filename?: string;
}

export interface HistoryItem {
    id: string;
    url: string;
    title: string;
    thumbnailUrl: string;
    author: string;
    authorUsername: string;
    timestamp: number;
    path: string;
    size: number;
    duration: number;
    format: 'video' | 'audio';
    status: 'completed' | 'failed';
}
```

#### 2. TikTokDownloader Class Implementation

**Key Methods:**
- `constructor()` - Initialize yt-dlp (reuse existing binary)
- `getVideoInfo(url: string): Promise<TikTokVideoInfo>` - Fetch video metadata
- `downloadVideo(options: TikTokDownloadOptions, callback): Promise<string>` - Download video
- `cancelDownload(id?: string): void` - Cancel active downloads
- `getHistory(): HistoryItem[]` - Get download history
- `clearHistory(): void` - Clear download history
- `getSettings()` - Get user settings
- `saveSettings(settings)` - Save user preferences

**URL Validation:**
```typescript
private isValidTikTokUrl(url: string): boolean {
    const patterns = [
        /^(https?:\/\/)?(www\.)?(tiktok\.com)\/@[\w.-]+\/video\/\d+/,
        /^(https?:\/\/)?(vm\.|vt\.)?(tiktok\.com)\/[\w]+/,
        /^(https?:\/\/)?(www\.)?tiktok\.com\/t\/[\w]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
}
```

**yt-dlp Arguments for TikTok:**
```typescript
// Video download
[
    url,
    '-o', outputTemplate,
    '--no-playlist',
    '--newline',
    '--no-warnings',
    '-f', 'best', // TikTok quality selection
    '--concurrent-fragments', '4',
    '--retries', '10',
]

// Audio extraction
[
    url,
    '-x',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
]

// No watermark (if supported by yt-dlp fork)
// Some yt-dlp versions support downloading without watermark
```

#### 3. IPC Handlers (in main.ts)

```typescript
// TikTok Video Info
ipcMain.handle('tiktok:get-info', async (_, url: string) => {
    return await tiktokDownloader.getVideoInfo(url);
});

// TikTok Download
ipcMain.handle('tiktok:download', async (_, options: TikTokDownloadOptions) => {
    return new Promise((resolve, reject) => {
        tiktokDownloader.downloadVideo(options, (progress) => {
            mainWindow?.webContents.send('tiktok:progress', progress);
        })
        .then(resolve)
        .catch(reject);
    });
});

// Cancel Download
ipcMain.handle('tiktok:cancel', async (_, id?: string) => {
    tiktokDownloader.cancelDownload(id);
});

// History
ipcMain.handle('tiktok:get-history', async () => {
    return tiktokDownloader.getHistory();
});

ipcMain.handle('tiktok:clear-history', async () => {
    tiktokDownloader.clearHistory();
});

ipcMain.handle('tiktok:remove-from-history', async (_, id: string) => {
    tiktokDownloader.removeFromHistory(id);
});

// Settings
ipcMain.handle('tiktok:get-settings', async () => {
    return tiktokDownloader.getSettings();
});

ipcMain.handle('tiktok:save-settings', async (_, settings) => {
    return tiktokDownloader.saveSettings(settings);
});

// Choose folder
ipcMain.handle('tiktok:choose-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});
```

#### 4. Preload API (in preload.ts)

```typescript
const tiktokAPI = {
    getInfo: (url: string) => ipcRenderer.invoke('tiktok:get-info', url),
    download: (options: any) => ipcRenderer.invoke('tiktok:download', options),
    cancel: (id?: string) => ipcRenderer.invoke('tiktok:cancel', id),
    getHistory: () => ipcRenderer.invoke('tiktok:get-history'),
    clearHistory: () => ipcRenderer.invoke('tiktok:clear-history'),
    removeFromHistory: (id: string) => ipcRenderer.invoke('tiktok:remove-from-history', id),
    getSettings: () => ipcRenderer.invoke('tiktok:get-settings'),
    saveSettings: (settings: any) => ipcRenderer.invoke('tiktok:save-settings', settings),
    chooseFolder: () => ipcRenderer.invoke('tiktok:choose-folder'),
    onProgress: (callback: (progress: any) => void) => {
        const listener = (_: any, progress: any) => callback(progress);
        ipcRenderer.on('tiktok:progress', listener);
        return () => ipcRenderer.removeListener('tiktok:progress', listener);
    },
    openFile: (path: string) => ipcRenderer.invoke('youtube:open-file', path),
    showInFolder: (path: string) => ipcRenderer.invoke('youtube:show-in-folder', path),
};

contextBridge.exposeInMainWorld('tiktokAPI', tiktokAPI);
```

---

## Frontend Implementation

### File: `src/tools/media/TiktokDownloader.tsx`

#### 1. Component Structure

```typescript
export const TiktokDownloader: React.FC = () => {
    // State
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<'video' | 'audio'>('video');
    const [quality, setQuality] = useState<'best' | 'medium' | 'low'>('best');
    const [removeWatermark, setRemoveWatermark] = useState(false);
    const [videoInfo, setVideoInfo] = useState<TikTokVideoInfo | null>(null);
    const [fetchingInfo, setFetchingInfo] = useState(false);
    const [activeDownloads, setActiveDownloads] = useState<Map<string, ActiveDownload>>(new Map());
    const [view, setView] = useState<'new' | 'downloads' | 'settings'>('new');
    const [history, setHistory] = useState<any[]>([]);
    const [settings, setSettings] = useState({...});
    
    // Hooks
    const { toasts, success, error, info } = useToast();
    
    // Effects
    useEffect(() => {
        // Auto-fetch video info when URL changes (debounced)
    }, [url]);
    
    useEffect(() => {
        // Listen to global progress events
        const unsubscribe = window.tiktokAPI.onProgress((progress) => {
            setActiveDownloads(prev => {
                const newMap = new Map(prev);
                newMap.set(progress.id, progress);
                return newMap;
            });
        });
        return unsubscribe;
    }, []);
    
    // Handlers
    const handleFetchInfo = async () => {...};
    const handleDownload = async () => {...};
    const handleCancel = async (id: string) => {...};
    
    // Render
    return (
        <div className="h-full flex flex-col bg-background/50">
            {/* Header with view toggle */}
            {/* Content based on view */}
        </div>
    );
};
```

#### 2. UI Sections

**A. Header Section**
- Title with TikTok icon (from lucide-react or custom SVG)
- View toggle: New Download | Downloads | Settings
- Active download badge

**B. New Download View**
- Info card with supported URL formats
- URL input with auto-fetch on paste/change
- Video info preview card
- Format selector (Video/Audio)
- Quality selector (Best/Medium/Low)
- Watermark toggle (if supported)
- Download button

**C. Video Info Card** (`TikTokVideoInfo.tsx`)
```typescript
interface TikTokVideoInfoProps {
    id: string;
    title: string;
    author: string;
    authorUsername: string;
    duration: number;
    thumbnailUrl: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    musicTitle?: string;
}

export const TikTokVideoInfo: React.FC<TikTokVideoInfoProps> = ({ ... }) => {
    return (
        <Card className="...">
            {/* Thumbnail with play overlay */}
            {/* Video title */}
            {/* Author info with @ username */}
            {/* Stats: views, likes, comments */}
            {/* Music info if available */}
            {/* Duration */}
        </Card>
    );
};
```

**D. Format Selector** (`TikTokFormatSelector.tsx`)
- Video/Audio toggle
- Quality dropdown
- Watermark removal checkbox
- Download button with loading state
- Download location display

**E. Downloads View** (Reuse YouTube pattern)
- Active downloads section with progress bars
- History list with thumbnails
- Actions: Open file, Show in folder, Remove from history

**F. Settings View**
- Default download location
- Default format preference
- Default quality preference
- Max concurrent downloads
- Speed limit
- Watermark removal default

#### 3. Helper Functions

**File: `src/tools/media/utils/tiktok-helpers.ts`**

```typescript
// URL validation
export const isValidTikTokUrl = (url: string): boolean => {
    const patterns = [
        /^(https?:\/\/)?(www\.)?(tiktok\.com)\/@[\w.-]+\/video\/\d+/,
        /^(https?:\/\/)?(vm\.|vt\.)?(tiktok\.com)\/[\w]+/,
        /^(https?:\/\/)?(www\.)?tiktok\.com\/t\/[\w]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
};

// Extract video ID from URL
export const extractTikTokId = (url: string): string | null => {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
};

// Format file size
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Format duration
export const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format view count
export const formatCount = (count: number): string => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
};
```

---

## Integration Steps

### Step 1: Backend Setup ✅
1. Create `electron/main/tiktok-downloader.ts`
2. Implement TikTokDownloader class
3. Add IPC handlers in `electron/main/main.ts`
4. Add preload API in `electron/preload/preload.ts`
5. Test yt-dlp with TikTok URLs

### Step 2: Frontend Components 🎨
1. Create `src/tools/media/TiktokDownloader.tsx`
2. Create `src/tools/media/components/TikTokVideoInfo.tsx`
3. Create `src/tools/media/components/TikTokFormatSelector.tsx`
4. Create `src/tools/media/utils/tiktok-helpers.ts`
5. Style components to match app theme

### Step 3: Registry Integration 📋
1. Update `src/tools/registry.tsx`:
   ```typescript
   const TiktokDownloader = React.lazy(() => import('./media/TiktokDownloader'));
   
   // Add to TOOLS array:
   {
       id: 'tiktok-downloader',
       name: 'TikTok Downloader',
       path: '/tiktok-downloader',
       description: 'Download videos from TikTok in various formats',
       category: 'utilities',
       icon: Film, // or custom TikTok icon
       color: 'text-pink-500',
       component: TiktokDownloader,
       keywords: ['tiktok', 'download', 'video', 'audio', 'social', 'media'],
   }
   ```

### Step 4: TypeScript Types 📝
1. Create shared types in `src/types/tiktok.ts`
2. Ensure type safety across backend and frontend

### Step 5: Testing 🧪
1. Test URL validation (various TikTok URL formats)
2. Test video info fetching
3. Test video download
4. Test audio extraction
5. Test download progress tracking
6. Test history management
7. Test settings persistence
8. Test concurrent downloads
9. Test cancel functionality
10. Test error handling

### Step 6: Documentation 📚
1. Add user guide to `docs/TIKTOK_DOWNLOADER_GUIDE.md`
2. Update README with new feature
3. Add code comments

---

## Testing Plan

### Unit Tests
- URL validation functions
- Helper functions (formatters)
- Video ID extraction

### Integration Tests
- Backend: yt-dlp integration
- IPC communication
- State management
- Progress tracking

### Manual Testing Checklist
- [ ] Standard TikTok video URL (`tiktok.com/@user/video/123`)
- [ ] Short URL (`vm.tiktok.com/xyz`)
- [ ] Mobile URL (`m.tiktok.com`)
- [ ] Invalid URL handling
- [ ] Video download (best quality)
- [ ] Audio extraction
- [ ] Download cancellation
- [ ] Multiple concurrent downloads
- [ ] Progress tracking accuracy
- [ ] History persistence
- [ ] Settings persistence
- [ ] File operations (open, show in folder)
- [ ] Error scenarios (network failure, invalid URL)
- [ ] Large file downloads (>100MB)
- [ ] Private/restricted videos

### Test URLs (Public Videos)
```
Standard: https://www.tiktok.com/@username/video/1234567890123456789
Short: https://vm.tiktok.com/ZMhKxyz/
Mobile: https://m.tiktok.com/v/1234567890123456789.html
```

---

## Implementation Priorities

### Phase 1: MVP (Must Have) 🚀
- [x] Backend service setup
- [x] Basic URL validation
- [x] Video info fetching
- [x] Video download (best quality)
- [x] Progress tracking
- [x] Download history
- [x] Basic UI

### Phase 2: Enhanced Features ⭐
- [ ] Audio extraction
- [ ] Quality selection
- [ ] Concurrent downloads
- [ ] Settings page
- [ ] Download queue management
- [ ] Better error handling

### Phase 3: Advanced Features 🎯
- [ ] Watermark removal (if yt-dlp supports)
- [ ] Batch download (multiple URLs)
- [ ] Playlist support (if applicable)
- [ ] Download scheduling
- [ ] Metadata embedding
- [ ] Thumbnail download
- [ ] Video preview

---

## Technical Considerations

### 1. yt-dlp TikTok Support
- ✅ yt-dlp natively supports TikTok
- ✅ No additional dependencies needed
- ⚠️ Watermark removal depends on yt-dlp version/fork
- ⚠️ Some regions may have restrictions

### 2. URL Formats
TikTok uses various URL formats:
- Standard: `https://www.tiktok.com/@username/video/1234567890`
- Short: `https://vm.tiktok.com/abc123/`
- Mobile: `https://m.tiktok.com/v/1234567890.html`
- Direct: `https://www.tiktok.com/t/abc123/`

### 3. Video Quality
TikTok typically provides:
- Original quality (watermarked)
- Lower quality options
- Audio-only extraction possible

### 4. Rate Limiting
- TikTok may rate-limit requests
- Implement retry logic
- Add delay between batch downloads

### 5. Legal & Ethical Considerations
- ⚠️ Respect TikTok's Terms of Service
- ⚠️ Only download content you have rights to
- ⚠️ Add disclaimer in UI

---

## UI/UX Design

### Color Scheme (TikTok Theme)
- Primary: Pink/Magenta (`#FE2C55`)
- Secondary: Cyan (`#00F2EA`)
- Accent: Blue (`#0F1419`)
- Background: Match app theme

### Icon
Use TikTok-style icon or generic video icon with pink color

### Layout
Follow YouTube downloader pattern for consistency:
- Three-column layout (Info | Options | Preview)
- Card-based design
- Glass-morphism effects
- Smooth animations

---

## Known Limitations

1. **Watermark**: yt-dlp downloads may include TikTok watermark
2. **Private Videos**: Cannot download private/restricted content
3. **Geographic Restrictions**: Some videos may be region-locked
4. **API Changes**: TikTok may change their API, affecting yt-dlp
5. **Rate Limiting**: Aggressive downloading may trigger rate limits

---

## Future Enhancements

### Short Term
- [ ] Add video preview before download
- [ ] Thumbnail gallery for history
- [ ] Download statistics
- [ ] Export history as CSV

### Long Term
- [ ] User profile download (all videos from user)
- [ ] Hashtag download (all videos with hashtag)
- [ ] Video editing features (trim, crop)
- [ ] Format conversion
- [ ] Cloud storage integration
- [ ] Schedule downloads
- [ ] Browser extension for one-click download

---

## Resources

### Documentation
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [TikTok URL Formats](https://support.tiktok.com/)
- Electron IPC Documentation

### Similar Projects
- youtube-dl-gui
- JDownloader
- 4K Video Downloader

---

## Success Metrics

- ✅ Successfully download TikTok videos
- ✅ Progress tracking accuracy >95%
- ✅ UI response time <100ms
- ✅ Error rate <5%
- ✅ User satisfaction >4/5 stars

---

## Implementation Timeline

**Week 1: Backend**
- Day 1-2: Backend service setup
- Day 3: IPC handlers
- Day 4: Testing backend

**Week 2: Frontend**
- Day 1-2: Main component
- Day 3: Sub-components
- Day 4: Integration

**Week 3: Polish**
- Day 1: Bug fixes
- Day 2: UI polish
- Day 3: Testing
- Day 4: Documentation

---

## Conclusion

This plan provides a comprehensive roadmap for implementing a TikTok video downloader feature. The architecture mirrors the existing YouTube downloader, ensuring consistency and maintainability. The phased approach allows for iterative development and early testing.

**Next Steps:**
1. Review and approve plan
2. Set up development branch
3. Begin Phase 1 implementation
4. Regular progress reviews

---

**Document Version:** 1.0  
**Last Updated:** January 8, 2026  
**Status:** Ready for Implementation
