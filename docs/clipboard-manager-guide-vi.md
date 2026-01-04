# Clipboard Manager - Hướng Dẫn Sử Dụng

## Tính Năng Chính

### 🎯 Tự Động Lưu Clipboard
Khi bạn mở app DevTools, **mọi nội dung bạn copy (Cmd+C hoặc Ctrl+C)** trên máy sẽ **tự động được lưu** vào lịch sử clipboard.

- ✅ Tự động bật khi mở app
- ✅ Hoạt động ở background (không cần mở tool)
- ✅ Kiểm tra clipboard mỗi 1 giây
- ✅ Loại bỏ duplicate tự động

### 📋 Quick Copy
- Nhập text vào ô textarea
- Click "Copy to Clipboard" để copy và lưu vào lịch sử
- Hiển thị thông báo "✓ Copied!" khi thành công

### 🔍 Tìm Kiếm & Lọc
- **Search**: Tìm kiếm real-time trong nội dung clipboard
- **Filter by Type**: All / Text Only / Images Only
- **Filter by Date**: All Time / Today / This Week / This Month
- **Pinned Only**: Chỉ hiển thị items đã pin

### 📌 Quản Lý Items
Mỗi clipboard item có các action:
- **Copy (⚡)**: Copy lại vào clipboard
- **View Full (👁)**: Xem toàn bộ nội dung trong modal
- **Pin (📌)**: Ghim item lên đầu danh sách
- **Delete (🗑)**: Xóa item khỏi lịch sử

### ⚙️ Cài Đặt

Click icon **Settings** để cấu hình:

1. **Maximum History Items**
   - 50, 100, 200, 500, hoặc 1000 items
   - Items cũ nhất sẽ tự động xóa khi vượt giới hạn

2. **Auto-clear items older than**
   - Never / 1 day / 7 days / 30 days / 90 days
   - Tự động xóa items quá cũ

3. **Exclude Duplicates** ✅ (Mặc định BẬT)
   - Không lưu nếu nội dung giống item cuối cùng

4. **Enable Clipboard Monitoring** ✅ (Mặc định BẬT)
   - Tự động phát hiện và lưu clipboard changes
   - Bạn có thể tắt nếu không muốn tự động lưu

### 🗑️ Clear All
- Click nút "Clear All" lần đầu → Hiện cảnh báo xác nhận
- Click lần 2 trong vòng 3 giây → Xóa toàn bộ lịch sử

## Cách Sử Dụng

### Kịch Bản 1: Tự Động Lưu Clipboard
1. Mở app DevTools
2. Copy bất kỳ text nào trên máy (Cmd+C)
3. Mở Clipboard Manager từ sidebar
4. Xem lịch sử clipboard đã được lưu tự động

### Kịch Bản 2: Quick Copy
1. Mở Clipboard Manager
2. Nhập text vào ô "Quick Copy"
3. Click "Copy to Clipboard"
4. Text đã được copy và lưu vào lịch sử

### Kịch Bản 3: Tìm Lại Nội Dung Đã Copy
1. Mở Clipboard Manager
2. Dùng search bar để tìm nội dung
3. Click vào item để copy lại
4. Hoặc click "View Full" để xem toàn bộ

### Kịch Bản 4: Ghim Items Quan Trọng
1. Tìm item quan trọng cần giữ lại
2. Click icon 📌 Pin
3. Item sẽ luôn ở đầu danh sách
4. Click lại để unpin

## Lưu Ý

### Quyền Truy Cập Clipboard
- Trình duyệt có thể yêu cầu quyền đọc clipboard
- Nếu bị từ chối, tính năng tự động lưu sẽ không hoạt động
- Nhưng Quick Copy vẫn hoạt động bình thường

### Hiệu Suất
- Clipboard được kiểm tra mỗi 1 giây
- Duplicate detection giúp tránh lưu trùng lặp
- Dữ liệu lưu trong localStorage (persistent)

### Bảo Mật & Riêng Tư
- ✅ Tất cả dữ liệu lưu LOCAL (không gửi server)
- ✅ Không chia sẻ với bên thứ ba
- ✅ Có thể xóa toàn bộ bất kỳ lúc nào
- ✅ Tắt monitoring nếu không muốn tự động lưu

## Keyboard Shortcuts (Tương Lai)

Các shortcuts sẽ được thêm trong phiên bản sau:
- `Cmd/Ctrl + K`: Mở search
- `Cmd/Ctrl + Shift + V`: Mở Clipboard Manager
- `Arrow Keys`: Navigate items
- `Enter`: Copy selected item
- `Delete`: Xóa selected item

## Troubleshooting

### Không Tự Động Lưu Clipboard?
1. Kiểm tra Settings → "Enable Clipboard Monitoring" có BẬT không
2. Kiểm tra browser có cho phép đọc clipboard không
3. Thử refresh app

### Lịch Sử Bị Mất?
- Dữ liệu lưu trong localStorage
- Nếu clear browser data → lịch sử sẽ mất
- Tính năng Export/Import sẽ có trong phiên bản sau

### App Chạy Chậm?
- Giảm "Maximum History Items" xuống 100 hoặc 50
- Bật "Auto-clear" để tự động xóa items cũ
- Tắt "Clipboard Monitoring" nếu không cần

## Roadmap

### Phase 2 (Sắp Tới)
- [ ] Image support (lưu ảnh clipboard)
- [ ] Export/Import lịch sử
- [ ] Categories/Tags cho items
- [ ] Rich text support

### Phase 3 (Tương Lai)
- [ ] Sync across devices
- [ ] Keyboard shortcuts
- [ ] Clipboard templates/snippets
- [ ] Statistics (most copied items)

---

**Phiên Bản**: 1.0.0  
**Ngày Cập Nhật**: 2026-01-04
