# YouTube Downloader - Implementation Checklist

## Tổng Quan
Tính năng download video từ YouTube link với nhiều định dạng và chất lượng khác nhau.

## Status: ✅ UI Complete | ⏳ Backend Implementation Pending

---

## 📋 Checklist Implementation

### Phase 1: UI Components ✅
- [x] Tạo component `YoutubeDownloader.tsx`
- [x] Design giao diện người dùng
  - [x] Header với gradient và icon
  - [x] URL input field
  - [x] Format selector (Video/Audio/Best)
  - [x] Quality selector (144p - 1080p)
  - [x] Download button với loading state
  - [x] Progress bar
  - [x] Status messages (success/error/downloading)
- [x] Thêm validation cho YouTube URL
- [x] Đăng ký tool vào `registry.tsx`
- [x] Thêm icon `Youtube` từ lucide-react

### Phase 2: Backend Integration ⏳
- [ ] **Chọn thư viện download**
  - [ ] Option 1: `ytdl-core` (Pure JavaScript)
    ```bash
    pnpm add ytdl-core @types/ytdl-core
    ```
  - [ ] Option 2: `yt-dlp` (Python binary - recommended)
    - Cần bundle yt-dlp binary với electron
    - Sử dụng `child_process` để gọi
  
- [ ] **Tạo Electron IPC handlers**
  - [ ] Thêm handler trong `electron/main/main.ts`
  - [ ] `youtube:getInfo` - Lấy thông tin video
  - [ ] `youtube:download` - Download video
  - [ ] `youtube:progress` - Track download progress
  - [ ] `youtube:cancel` - Hủy download

- [ ] **Implement download logic**
  ```typescript
  // electron/main/youtube-downloader.ts
  - [ ] validateYoutubeUrl()
  - [ ] getVideoInfo()
  - [ ] downloadVideo()
  - [ ] getAvailableFormats()
  - [ ] trackProgress()
  ```

- [ ] **Error handling**
  - [ ] Network errors
  - [ ] Invalid URL
  - [ ] Video not available
  - [ ] Age restricted content
  - [ ] Private videos
  - [ ] Disk space check

### Phase 3: Frontend Integration ⏳
- [ ] **Kết nối với Electron IPC**
  - [ ] Thêm IPC methods vào `preload.ts`
  ```typescript
  youtube: {
    getInfo: (url: string) => Promise<VideoInfo>
    download: (options: DownloadOptions) => Promise<void>
    onProgress: (callback: ProgressCallback) => void
  }
  ```

- [ ] **Cập nhật component**
  - [ ] Replace mock download logic
  - [ ] Implement real progress tracking
  - [ ] Add video info preview
  - [ ] Show thumbnail
  - [ ] Display video title, duration, author
  - [ ] Show available formats

- [ ] **File management**
  - [ ] Choose download location
  - [ ] Save file with proper name
  - [ ] Open file after download
  - [ ] Show in folder option

### Phase 4: Advanced Features ⏳
- [ ] **Playlist support**
  - [ ] Download entire playlist
  - [ ] Batch download queue
  - [ ] Progress for multiple videos

- [ ] **Quality options**
  - [ ] Auto-detect best quality
  - [ ] Audio bitrate selector
  - [ ] Video codec options (H.264, VP9, AV1)

- [ ] **Conversion**
  - [ ] Convert to different formats
  - [ ] Audio extraction (MP3, AAC, FLAC)
  - [ ] Video formats (MP4, MKV, WEBM)

- [ ] **Download history**
  - [ ] Save download history
  - [ ] Re-download option
  - [ ] Clear history

- [ ] **Settings**
  - [ ] Default download location
  - [ ] Default quality preference
  - [ ] Concurrent downloads limit
  - [ ] Network speed limit

### Phase 5: Testing & Optimization ⏳
- [ ] **Testing**
  - [ ] Test với các loại URL khác nhau
  - [ ] Test download cancellation
  - [ ] Test error scenarios
  - [ ] Test với videos khác nhau (short, long, 4K)
  - [ ] Test audio-only downloads
  - [ ] Test với slow network

- [ ] **Performance**
  - [ ] Optimize memory usage
  - [ ] Handle large files efficiently
  - [ ] Background download support
  - [ ] Resume broken downloads

- [ ] **UI/UX**
  - [ ] Loading states
  - [ ] Toast notifications
  - [ ] Keyboard shortcuts
  - [ ] Drag & drop URL support

---

## 🛠️ Technical Stack

### Dependencies cần thêm:
```json
{
  "dependencies": {
    "ytdl-core": "^4.11.5",
    "@types/ytdl-core": "^4.1.1",
    "fluent-ffmpeg": "^2.1.3" // Nếu cần convert format
  }
}
```

### Alternative (Recommended):
- **yt-dlp**: Download binary và bundle với electron
  - More stable and maintained
  - Better format support
  - Handles geo-restrictions better
  - Regular updates

---

## 📁 File Structure
```
src/tools/media/
├── YoutubeDownloader.tsx          ✅ Created
├── components/
│   ├── VideoInfo.tsx             ⏳ TODO
│   ├── DownloadQueue.tsx         ⏳ TODO
│   └── FormatSelector.tsx        ⏳ TODO
└── utils/
    └── youtube-helpers.ts        ⏳ TODO

electron/main/
├── youtube-downloader.ts         ⏳ TODO
└── youtube-handlers.ts           ⏳ TODO
```

---

## ⚠️ Important Notes

### Legal & Ethical Considerations:
- ⚠️ Downloading YouTube videos may violate YouTube's Terms of Service
- 📄 Add disclaimer in UI
- 🔒 Ensure compliance with copyright laws
- 👥 Users are responsible for their usage

### Technical Limitations:
- Age-restricted videos require authentication
- Some videos may be geo-blocked
- Quality availability depends on original video
- Large files require sufficient disk space

### Best Practices:
- Always validate URLs before processing
- Implement proper error handling
- Show clear progress indication
- Allow cancellation at any time
- Clean up temporary files
- Respect rate limiting

---

## 🎯 Next Steps

1. **Immediate (Phase 2)**:
   - Decide on ytdl-core vs yt-dlp
   - Implement basic download functionality
   - Add IPC handlers

2. **Short-term (Phase 3)**:
   - Connect frontend to backend
   - Add real progress tracking
   - Implement file saving

3. **Long-term (Phase 4-5)**:
   - Add advanced features
   - Optimize performance
   - Complete testing

---

## 📝 Usage Example

```typescript
// Example usage after implementation
const result = await window.electron.youtube.download({
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  format: 'video',
  quality: '720p',
  outputPath: '/downloads'
});
```

---

## 🔗 References

- [ytdl-core Documentation](https://github.com/fent/node-ytdl-core)
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [YouTube API Guidelines](https://developers.google.com/youtube/terms/api-services-terms-of-service)
- [Electron IPC Documentation](https://www.electronjs.org/docs/latest/api/ipc-main)

---

**Created**: January 7, 2026  
**Status**: Phase 1 Complete - UI Ready for Backend Integration  
**Next Update**: After Phase 2 completion

