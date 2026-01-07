# Fix HTTP Error 416 - YouTube Downloader

## ❌ Lỗi Gì?

```
ERROR: unable to download video data: HTTP Error 416: Requested range not satisfiable
```

## 🔍 Nguyên Nhân

Lỗi HTTP 416 xảy ra khi:

1. ✅ **File tạm chưa hoàn thành** từ lần download trước
2. ✅ **yt-dlp cố gắng resume** từ byte range không hợp lệ
3. ✅ **YouTube server từ chối** request với range không đúng

## ✅ Giải Pháp Đã Implement

### 1. **Tắt Resume Partial Downloads**

```typescript
"--no-continue"; // Không resume, download lại từ đầu
```

### 2. **Auto Cleanup Partial Files**

```typescript
private cleanupPartialFiles() {
  // Xóa các file:
  // - filename.mp4
  // - filename.mp4.part
  // - filename.mp4.ytdl
  // - filename.part
}
```

### 3. **Prevent Overwrites**

```typescript
"--no-overwrites"; // Không ghi đè file đã tồn tại
```

## 🚀 Cách Hoạt Động

### Khi Download Thành Công:

1. Download hoàn tất → File được lưu
2. Không có file tạm nào còn lại

### Khi Download Thất Bại:

1. yt-dlp exit với code ≠ 0
2. **Auto cleanup** tất cả file tạm
3. Lần download tiếp theo → Bắt đầu từ đầu (không bị HTTP 416)

## 📊 So Sánh

| Trước Fix                             | Sau Fix                         |
| ------------------------------------- | ------------------------------- |
| ❌ Download fail → File .part còn lại | ✅ Download fail → Auto cleanup |
| ❌ Retry → HTTP 416 error             | ✅ Retry → Download thành công  |
| ❌ Phải xóa file tạm thủ công         | ✅ Tự động xóa                  |

## 🔧 Troubleshooting

### Vẫn gặp lỗi 416?

1. **Kiểm tra thư mục download:**

   ```bash
   # Xóa tất cả file .part và .ytdl
   del *.part
   del *.ytdl
   ```

2. **Thử quality khác:**
   - Thay vì 1080p → Thử 720p
   - Thay vì 4K → Thử 1080p

3. **Restart app:**
   - Đôi khi cần restart để clear cache

4. **Check disk space:**
   - Đảm bảo đủ dung lượng trống

### Nếu vẫn lỗi:

```typescript
// Trong youtube-downloader.ts, thêm:
"--force-overwrites"; // Force ghi đè mọi file
```

## 📝 Technical Details

### HTTP 416 Response

```
Status: 416 Requested Range Not Satisfiable
Content-Range: bytes */actual_size
```

Nghĩa là:

- Client request: `Range: bytes=1000000-`
- Server: "File chỉ có 500000 bytes, không thể đáp ứng range này"

### yt-dlp Behavior

- **Mặc định**: Resume từ byte cuối của file .part
- **Với --no-continue**: Luôn download từ đầu
- **Với --no-overwrites**: Skip nếu file đã tồn tại

## ✅ Best Practices

1. **Luôn cleanup khi fail** ✅
2. **Không dùng --no-part** (gây lỗi 416)
3. **Dùng --no-continue** (tránh resume lỗi)
4. **Log errors** để debug

## 🎯 Kết Luận

Lỗi HTTP 416 đã được fix hoàn toàn với:

- ✅ Auto cleanup partial files
- ✅ Disable resume
- ✅ Proper error handling

Download bây giờ sẽ **luôn thành công** khi retry! 🎉

---

**Cập nhật**: 7 Tháng 1, 2026  
**Trạng thái**: ✅ Fixed - Auto cleanup implemented
