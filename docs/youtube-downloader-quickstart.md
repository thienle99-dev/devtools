# YouTube Downloader - Quick Start Guide

## 🚀 Sử dụng nhanh

### 1. Truy cập Tool
- Mở ứng dụng DevTools
- Tìm kiếm "YouTube" trong search bar
- Hoặc vào category **Utilities** → **YouTube Downloader**

### 2. Download Video

#### Cách 1: Download Video thông thường
1. Copy link YouTube video (ví dụ: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
2. Paste vào ô "YouTube URL"
3. Chọn format: **Video + Audio (MP4)**
4. Chọn quality: **720p** (hoặc quality khác)
5. Click nút **"Download Video"**

#### Cách 2: Download Audio Only
1. Paste YouTube URL
2. Chọn format: **Audio Only (MP3)**
3. Click **"Download Video"**

#### Cách 3: Download Best Quality
1. Paste YouTube URL
2. Chọn format: **Best Quality Available**
3. Click **"Download Video"**

### 3. Theo dõi tiến trình
- Progress bar sẽ hiển thị % hoàn thành
- Xem tốc độ download và thời gian còn lại
- Download có thể được hủy bất cứ lúc nào

---

## ✅ Supported URLs

### ✔️ URL Types được hỗ trợ:
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`

### ❌ Chưa hỗ trợ:
- Playlists (đang phát triển)
- Private videos
- Age-restricted videos
- Live streams

---

## 📝 Format Options

| Format | Description | File Type | Use Case |
|--------|-------------|-----------|----------|
| **Video + Audio** | Full video với sound | MP4 | Xem video bình thường |
| **Audio Only** | Chỉ âm thanh | MP3 | Nghe nhạc, podcast |
| **Best Quality** | Chất lượng tốt nhất | MP4 | Lưu trữ chất lượng cao |

---

## 🎯 Quality Options

| Quality | Resolution | Description | File Size |
|---------|------------|-------------|-----------|
| **144p** | 256x144 | Lowest | Very Small |
| **240p** | 426x240 | Low | Small |
| **360p** | 640x360 | SD | Medium |
| **480p** | 854x480 | SD | Medium |
| **720p** | 1280x720 | HD | Large |
| **1080p** | 1920x1080 | Full HD | Very Large |

**💡 Tip**: 720p là lựa chọn tốt cho cân bằng giữa chất lượng và dung lượng.

---

## ⚙️ Current Status

### ✅ Hoàn thành:
- [x] UI/UX Design
- [x] URL Validation
- [x] Format & Quality Selection
- [x] Progress Tracking UI
- [x] Error Handling UI

### ⏳ Đang phát triển:
- [ ] Backend integration (ytdl-core/yt-dlp)
- [ ] Real download functionality
- [ ] File management
- [ ] Video info preview
- [ ] Playlist support

---

## 🔧 Troubleshooting

### Lỗi "Invalid YouTube URL"
- **Nguyên nhân**: URL không đúng format
- **Giải pháp**: Kiểm tra lại URL, đảm bảo copy đầy đủ

### Lỗi "Download failed"
- **Nguyên nhân**: Video không khả dụng, network issue
- **Giải pháp**: 
  - Kiểm tra internet connection
  - Thử lại sau vài phút
  - Kiểm tra xem video có bị xóa không

### Video không có chất lượng cao
- **Nguyên nhân**: Video gốc không có quality đó
- **Giải pháp**: Chọn quality thấp hơn hoặc "Best Available"

---

## ⚠️ Legal Notice

**Important**: 
- Downloading YouTube videos may violate YouTube's Terms of Service
- Only download videos you have the right to download
- Respect copyright and intellectual property
- Use this tool responsibly and legally

---

## 📞 Support

Có vấn đề? Tạo issue trên GitHub hoặc liên hệ developer.

---

**Last Updated**: January 7, 2026  
**Version**: 1.0.0 (UI Only)

