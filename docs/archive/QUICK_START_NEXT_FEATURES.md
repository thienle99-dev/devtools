# 🚀 Quick Start - Tính Năng Tiếp Theo

> Hướng dẫn nhanh để bắt đầu implement tính năng mới

**Bạn đã hoàn thành:** ✅ YouTube Downloader + ✅ TikTok Downloader

---

## 🎯 Top 3 Tính Năng Nên Làm Ngay

### 1️⃣ **Universal Media Downloader** (HIGHLY RECOMMENDED) ⭐⭐⭐⭐⭐

**Tại sao làm đầu tiên?**
- Hợp nhất YouTube + TikTok + thêm 10+ platforms khác
- Foundation cho mọi downloader sau này
- Best ROI (Return on Investment)

**Platforms được support:**
- ✅ YouTube (đã có)
- ✅ TikTok (đã có)
- 🆕 Instagram (Reels, Stories, Posts)
- 🆕 Twitter/X (Videos, GIFs)
- 🆕 Facebook (Videos)
- 🆕 Reddit (Videos)
- 🆕 Vimeo, Dailymotion, Twitch...

**Thời gian:** 3-4 ngày  
**Độ khó:** ⭐⭐⭐ (Medium)

**Bắt đầu:**
```bash
# Tạo file mới
touch src/tools/media/UniversalDownloader.tsx
touch electron/main/universal-downloader.ts
touch src/tools/media/utils/platform-detector.ts
```

**Xem chi tiết:** [FEATURE_SUGGESTIONS.md](./FEATURE_SUGGESTIONS.md#11-universal-media-downloader-⭐⭐⭐⭐⭐)

---

### 2️⃣ **Instagram Downloader** (VERY HOT) 🔥🔥🔥

**Tại sao hot?**
- Demand cực cao
- Reels đang trending
- Stories cần save trước khi hết hạn

**Features chính:**
```typescript
✅ Reels download (no watermark)
✅ Stories download (before 24h expiry)
✅ Posts & Carousel
✅ IGTV
✅ Profile pictures
```

**Thời gian:** 2-3 ngày  
**Độ khó:** ⭐⭐⭐ (Medium)

**Note:** yt-dlp đã support Instagram sẵn, chỉ cần implement UI!

---

### 3️⃣ **Batch URL Download** (PRODUCTIVITY BOOST) ⚡

**Tại sao quan trọng?**
- Power users cần tính năng này
- Download 10-100 URLs cùng lúc
- Dễ implement (1-2 ngày)

**Features:**
```
[Paste Multiple URLs]
┌────────────────────────────────┐
│ https://youtube.com/...        │
│ https://tiktok.com/...         │
│ https://instagram.com/...      │
│ ...                            │
└────────────────────────────────┘
[Import from File] [Start All]
```

**Thời gian:** 2-3 ngày  
**Độ khó:** ⭐⭐ (Easy-Medium)

---

## 🗺️ Implementation Order (Tuần đầu tiên)

### Option A: Universal Approach (RECOMMENDED)
```
Week 1:
├── Day 1-2: Universal Downloader (core)
├── Day 3-4: Add Instagram support
└── Day 5: Add Twitter support

Result: 1 tool support 5 platforms!
```

### Option B: Platform-by-Platform
```
Week 1:
├── Day 1-3: Instagram Downloader
├── Day 4-5: Batch URL feature
└── Weekend: Integration

Result: 2 separate tools
```

**💡 Khuyến nghị:** Option A (Universal) - Better architecture, easier maintain

---

## 📦 Files Cần Tạo

### Universal Downloader Approach

#### Backend
```
electron/main/
└── universal-downloader.ts         # NEW - Main downloader service
    ├── class UniversalDownloader
    ├── detectPlatform()
    ├── download()
    └── getInfo()
```

#### Frontend
```
src/tools/media/
├── UniversalDownloader.tsx         # NEW - Main UI component
├── components/
│   ├── PlatformDetector.tsx       # NEW - Auto-detect platform
│   ├── UniversalVideoInfo.tsx     # NEW - Unified info card
│   └── PlatformBadge.tsx          # NEW - Platform indicator
└── utils/
    ├── platform-detector.ts        # NEW - URL pattern matching
    └── platform-configs.ts         # NEW - Platform configurations
```

#### Integration
```
electron/main/main.ts               # MODIFY - Add IPC handlers
electron/preload/preload.ts         # MODIFY - Add API
src/tools/registry.tsx              # MODIFY - Register tool
```

---

## 🎯 Quick Implementation Guide

### Step 1: Platform Detection (30 phút)

Tạo `src/tools/media/utils/platform-detector.ts`:

```typescript
export type Platform = 
  | 'youtube' 
  | 'tiktok' 
  | 'instagram' 
  | 'twitter' 
  | 'facebook' 
  | 'reddit'
  | 'unknown';

export function detectPlatform(url: string): Platform {
  const patterns = {
    youtube: /(?:youtube\.com|youtu\.be)/i,
    tiktok: /tiktok\.com/i,
    instagram: /instagram\.com/i,
    twitter: /(?:twitter\.com|x\.com)/i,
    facebook: /facebook\.com/i,
    reddit: /reddit\.com/i,
  };

  for (const [platform, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) {
      return platform as Platform;
    }
  }

  return 'unknown';
}
```

**Test:**
```typescript
detectPlatform('https://youtube.com/watch?v=xyz')    // 'youtube'
detectPlatform('https://tiktok.com/@user/video/123') // 'tiktok'
detectPlatform('https://instagram.com/p/xyz')        // 'instagram'
```

---

### Step 2: Backend Service (2-3 giờ)

Tạo `electron/main/universal-downloader.ts`:

```typescript
import { youtubeDownloader } from './youtube-downloader';
import { tiktokDownloader } from './tiktok-downloader';

export class UniversalDownloader {
  async getVideoInfo(url: string) {
    const platform = this.detectPlatform(url);
    
    switch (platform) {
      case 'youtube':
        return youtubeDownloader.getVideoInfo(url);
      case 'tiktok':
        return tiktokDownloader.getVideoInfo(url);
      case 'instagram':
        return this.getInstagramInfo(url);
      // ... more platforms
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  async download(url: string, options: any) {
    const platform = this.detectPlatform(url);
    
    switch (platform) {
      case 'youtube':
        return youtubeDownloader.downloadVideo(options);
      case 'tiktok':
        return tiktokDownloader.downloadVideo(options);
      // ... more platforms
    }
  }

  private detectPlatform(url: string): Platform {
    // Same logic as frontend
  }

  private async getInstagramInfo(url: string) {
    // Use yt-dlp (already supports Instagram!)
    return this.ytDlp.getVideoInfo([url, '--no-playlist']);
  }
}

export const universalDownloader = new UniversalDownloader();
```

---

### Step 3: Frontend Component (3-4 giờ)

Tạo `src/tools/media/UniversalDownloader.tsx`:

```typescript
export const UniversalDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [videoInfo, setVideoInfo] = useState(null);

  // Auto-detect platform when URL changes
  useEffect(() => {
    if (url) {
      const detected = detectPlatform(url);
      setPlatform(detected);
    }
  }, [url]);

  // Auto-fetch info
  useEffect(() => {
    if (platform !== 'unknown') {
      fetchVideoInfo();
    }
  }, [url, platform]);

  const fetchVideoInfo = async () => {
    const info = await window.universalAPI.getInfo(url);
    setVideoInfo(info);
  };

  return (
    <div>
      {/* URL Input với platform badge */}
      <div className="relative">
        <Input value={url} onChange={setUrl} />
        {platform !== 'unknown' && (
          <PlatformBadge platform={platform} />
        )}
      </div>

      {/* Video Info - unified cho tất cả platforms */}
      {videoInfo && (
        <UniversalVideoInfo {...videoInfo} platform={platform} />
      )}

      {/* Download Button */}
      <Button onClick={handleDownload}>
        Download from {platform}
      </Button>
    </div>
  );
};
```

---

### Step 4: IPC Integration (30 phút)

Update `electron/main/main.ts`:

```typescript
import { universalDownloader } from './universal-downloader';

ipcMain.handle('universal:get-info', async (_, url: string) => {
  return await universalDownloader.getVideoInfo(url);
});

ipcMain.handle('universal:download', async (_, url: string, options: any) => {
  return await universalDownloader.download(url, options);
});
```

Update `electron/preload/preload.ts`:

```typescript
const universalAPI = {
  getInfo: (url: string) => ipcRenderer.invoke('universal:get-info', url),
  download: (url: string, options: any) => 
    ipcRenderer.invoke('universal:download', url, options),
};

contextBridge.exposeInMainWorld('universalAPI', universalAPI);
```

---

### Step 5: Register Tool (5 phút)

Update `src/tools/registry.tsx`:

```typescript
const UniversalDownloader = React.lazy(() => 
  import('./media/UniversalDownloader')
);

{
  id: 'universal-downloader',
  name: 'Universal Downloader',
  path: '/universal-downloader',
  description: 'Download from YouTube, TikTok, Instagram, Twitter, and more',
  category: 'utilities',
  icon: Download,
  color: 'text-purple-500',
  component: UniversalDownloader,
  keywords: ['download', 'video', 'universal', 'multi-platform'],
}
```

---

## ✅ Testing Checklist

### Platform Detection
- [ ] YouTube URL → detects 'youtube'
- [ ] TikTok URL → detects 'tiktok'
- [ ] Instagram URL → detects 'instagram'
- [ ] Invalid URL → shows error

### Download Flow
- [ ] Paste YouTube URL → shows YT video info
- [ ] Download → uses YouTube downloader
- [ ] Paste Instagram URL → shows IG info
- [ ] Download → uses Instagram logic

### Error Handling
- [ ] Invalid URL → clear error message
- [ ] Unsupported platform → suggest supported ones
- [ ] Network error → retry option

---

## 🎨 UI Tips

### Platform Badge
```tsx
const platformColors = {
  youtube: 'bg-red-500',
  tiktok: 'bg-pink-500',
  instagram: 'bg-purple-500',
  twitter: 'bg-blue-500',
};

<span className={`${platformColors[platform]} px-2 py-1 rounded`}>
  {platform.toUpperCase()}
</span>
```

### Auto-detect Feedback
```tsx
{platform !== 'unknown' && (
  <div className="text-sm text-green-400">
    ✓ Detected {platform} video
  </div>
)}
```

---

## 📚 Resources

### Tài liệu chi tiết
- **Full feature specs:** [FEATURE_SUGGESTIONS.md](./FEATURE_SUGGESTIONS.md)
- **Complete roadmap:** [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)
- **TikTok reference:** [TIKTOK_DOWNLOADER_PLAN.md](./TIKTOK_DOWNLOADER_PLAN.md)

### yt-dlp Documentation
- [Supported sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md) - 1800+ platforms!
- [Instagram extractor](https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/instagram.py)

### Code Reference
- Xem `electron/main/youtube-downloader.ts` - Pattern để follow
- Xem `src/tools/media/YoutubeDownloader.tsx` - UI pattern

---

## 💬 Need Help?

### Common Questions

**Q: Instagram có cần authentication không?**  
A: Basic posts không cần. Private/Stories có thể cần cookies.

**Q: yt-dlp có support hết các platforms không?**  
A: Support 1800+ sites! Check [supportedsites.md](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md)

**Q: Có cần viết lại downloader cho mỗi platform?**  
A: Không! Reuse yt-dlp binary, chỉ cần thêm UI logic.

**Q: Performance có bị ảnh hưởng không?**  
A: Không. yt-dlp handle tất cả platforms efficiently.

---

## 🎯 Decision Time

### Nên làm gì bây giờ?

#### Option 1: Universal Downloader (RECOMMENDED)
✅ Best long-term architecture  
✅ Support nhiều platforms ngay  
✅ Easier maintenance  
⏱️ 3-4 ngày  

**→ START HERE:** Create `universal-downloader.ts`

---

#### Option 2: Instagram Only
✅ Faster to market  
✅ High user demand  
❌ Need refactor later cho universal  
⏱️ 2-3 ngày  

**→ START HERE:** Create `instagram-downloader.ts`

---

#### Option 3: Batch Downloader
✅ Quick win  
✅ Improve existing tools  
❌ Doesn't add new platforms  
⏱️ 2 ngày  

**→ START HERE:** Create `BatchDownloader.tsx`

---

## 🚀 Ready to Code?

### My Recommendation: **Universal Downloader First**

**Why?**
1. Future-proof architecture
2. Reuse existing code (YouTube, TikTok)
3. Easy to add more platforms later
4. Better user experience (1 tool cho tất cả)

**Next Steps:**
1. ✅ Read this guide
2. ⏳ Create files (see "Files Cần Tạo")
3. ⏳ Implement platform detection (30 min)
4. ⏳ Setup backend service (2-3 hours)
5. ⏳ Build UI component (3-4 hours)
6. ⏳ Test with YouTube + TikTok (existing)
7. ⏳ Add Instagram support (1-2 hours)
8. 🎉 Release!

**Total Time:** ~1 tuần (working casually)

---

**Let's build something amazing! 💪**

*Có câu hỏi? Check [FEATURE_SUGGESTIONS.md](./FEATURE_SUGGESTIONS.md) for details.*
