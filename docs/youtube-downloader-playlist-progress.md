# Playlist Support - Implementation Progress

## ✅ **Completed (Backend)**

### **1. Backend Method: `getPlaylistInfo()`**

```typescript
async getPlaylistInfo(url: string): Promise<{
  playlistId: string;
  title: string;
  videoCount: number;
  videos: Array<{
    id: string;
    title: string;
    duration: number;
    thumbnail: string;
    url: string;
  }>;
}>
```

**Features:**

- ✅ Uses `yt-dlp --flat-playlist` for fast fetching
- ✅ Returns playlist metadata (ID, title, video count)
- ✅ Returns array of all videos with metadata
- ✅ Validates playlist URL
- ✅ Error handling

**Example Response:**

```json
{
  "playlistId": "PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
  "title": "My Awesome Playlist",
  "videoCount": 25,
  "videos": [
    {
      "id": "dQw4w9WgXcQ",
      "title": "Rick Astley - Never Gonna Give You Up",
      "duration": 212,
      "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
    // ... more videos
  ]
}
```

### **2. IPC Handler**

```typescript
ipcMain.handle("youtube:getPlaylistInfo", async (_event, url: string) => {
  return await youtubeDownloader.getPlaylistInfo(url);
});
```

### **3. Preload API**

```typescript
contextBridge.exposeInMainWorld("youtubeAPI", {
  getPlaylistInfo: (url: string) =>
    ipcRenderer.invoke("youtube:getPlaylistInfo", url),
});
```

---

## ⏳ **TODO (Frontend)**

### **1. URL Detection**

- [ ] Detect playlist URL pattern
- [ ] Differentiate between single video and playlist
- [ ] Auto-fetch playlist info when playlist URL detected

**Playlist URL Patterns:**

- `https://www.youtube.com/playlist?list=PLxxx`
- `https://www.youtube.com/watch?v=xxx&list=PLxxx`
- `https://youtu.be/xxx?list=PLxxx`

### **2. Playlist UI Component**

- [ ] Create `PlaylistView.tsx` component
- [ ] Display playlist title and video count
- [ ] Show list of videos with thumbnails
- [ ] Checkbox for each video
- [ ] "Select All" / "Deselect All" buttons
- [ ] Show total duration of selected videos
- [ ] Show estimated total file size

**UI Mockup:**

```
┌─────────────────────────────────────────────────┐
│ 📋 My Awesome Playlist (25 videos)              │
│ ─────────────────────────────────────────────── │
│ [✓ Select All] [  Deselect All]                │
│                                                  │
│ ☑ [Thumbnail] Video Title 1          (3:45)    │
│ ☑ [Thumbnail] Video Title 2          (5:12)    │
│ ☐ [Thumbnail] Video Title 3          (2:30)    │
│ ...                                              │
│                                                  │
│ Selected: 2/25 videos | Total: 9:57            │
│ [Download Selected]                             │
└─────────────────────────────────────────────────┘
```

### **3. Batch Download Manager**

- [ ] Download selected videos sequentially
- [ ] Track progress for each video
- [ ] Show overall progress (X/Y videos completed)
- [ ] Allow canceling individual downloads
- [ ] Allow canceling entire batch
- [ ] Handle errors gracefully (skip failed, continue)

**Progress UI:**

```
Downloading Playlist: My Awesome Playlist
Progress: 2/25 videos (8%)

Currently downloading:
[████████░░░░░░░░] Video Title 2 - 45% (8.5 MB/s)

Completed:
✓ Video Title 1

Pending:
⏳ Video Title 3
⏳ Video Title 4
...
```

### **4. State Management**

```typescript
const [playlistInfo, setPlaylistInfo] = useState<PlaylistInfo | null>(null);
const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
const [downloadQueue, setDownloadQueue] = useState<DownloadQueueItem[]>([]);
const [currentDownload, setCurrentDownload] = useState<string | null>(null);
```

### **5. Download Queue Logic**

```typescript
const downloadPlaylist = async () => {
  const selected = Array.from(selectedVideos);

  for (let i = 0; i < selected.length; i++) {
    const videoId = selected[i];
    const video = playlistInfo.videos.find((v) => v.id === videoId);

    try {
      setCurrentDownload(videoId);
      await downloadVideo(video.url);
      // Mark as complete
    } catch (error) {
      // Mark as failed, continue to next
    }
  }
};
```

---

## 📊 **Implementation Estimate**

| Task              | Complexity | Time  | Priority |
| ----------------- | ---------- | ----- | -------- |
| ✅ Backend API    | Medium     | 1h    | High     |
| URL Detection     | Low        | 30min | High     |
| Playlist UI       | Medium     | 2h    | High     |
| Batch Download    | High       | 3h    | High     |
| Progress Tracking | Medium     | 2h    | Medium   |
| Error Handling    | Medium     | 1h    | Medium   |

**Total Estimate**: ~9-10 hours  
**Completed**: ~1 hour (Backend)  
**Remaining**: ~8-9 hours (Frontend)

---

## 🎯 **MVP Features (Phase 1)**

For initial release, implement:

1. ✅ Fetch playlist info
2. ⏳ Display playlist videos
3. ⏳ Select videos to download
4. ⏳ Download selected videos sequentially
5. ⏳ Basic progress tracking

**Skip for MVP:**

- Parallel downloads (to avoid rate limiting)
- Resume failed downloads
- Download history for playlists
- Playlist-specific settings

---

## 🚀 **Next Steps**

### **Immediate:**

1. Add URL detection logic
2. Create `PlaylistView` component
3. Implement video selection UI

### **Short-term:**

4. Implement batch download logic
5. Add progress tracking
6. Error handling

### **Testing:**

- Test with small playlists (5-10 videos)
- Test with large playlists (50+ videos)
- Test with mixed public/private videos
- Test cancellation
- Test error recovery

---

## 💡 **Technical Considerations**

### **Performance:**

- Use `--flat-playlist` for fast metadata fetching
- Don't fetch full video info until download
- Lazy load thumbnails
- Virtual scrolling for large playlists

### **Rate Limiting:**

- Download sequentially (not parallel)
- Add delay between downloads (optional)
- Respect YouTube's rate limits

### **Error Handling:**

- Skip unavailable videos
- Continue on individual failures
- Show clear error messages
- Allow retry for failed videos

---

## 📝 **Files to Create/Modify**

### **New Files:**

- `src/tools/media/components/PlaylistView.tsx`
- `src/tools/media/components/VideoListItem.tsx`
- `src/tools/media/components/BatchDownloadProgress.tsx`

### **Modified Files:**

- ✅ `electron/main/youtube-downloader.ts`
- ✅ `electron/main/main.ts`
- ✅ `electron/preload/preload.ts`
- ⏳ `src/tools/media/YoutubeDownloader.tsx`

---

## 🎉 **Progress**

**Backend**: ✅ 100% Complete  
**Frontend**: ⏳ 0% Complete  
**Overall**: **10%** Complete

**Status**: Backend ready, frontend implementation pending

---

**Created**: January 7, 2026  
**Last Updated**: January 7, 2026  
**Next**: Implement frontend UI and batch download logic
