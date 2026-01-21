## Checklist cải thiện UI/UX & hiệu năng

- [ ] Dọn state tool khi đóng tab: `TabBar` đang gọi `removeToolData(tab.id)` nhưng dữ liệu lưu theo `toolId`. Cần xoá đúng key (`toolId`) để tránh rò rỉ state/persist storage.
- [ ] Truyền `toolId` cho tất cả `<ToolPane>`: đa số tool không set prop này nên các tiện ích (paste/import, piping, presets/history) không xuất hiện → cập nhật từng tool hoặc tạo HOC để đảm bảo `toolId` luôn có.
- [ ] Tôn trọng danh sách `ignoredApps` trong `useClipboardMonitor`: bỏ qua clipboard event (và tránh IPC call dư thừa) khi nguồn thuộc app người dùng đã chặn.
- [ ] Đồng bộ đồng hồ ở Footer: hiện tại `new Date().toLocaleTimeString()` render một lần. Thêm state + interval (hoặc `requestAnimationFrame`) để cập nhật mỗi 30–60 giây.
- [ ] Cải thiện accessibility TabBar: thêm semantics `role="tablist"`/`role="tab"`, `aria-selected`, `tabIndex` và phím tắt (Enter, Delete, Ctrl+F4) để tabstrip dùng được bằng bàn phím/trợ năng.
- [ ] Tách `xlsx` và `pdf-lib` ra khỏi critical path: chuyển các import trong `CsvExcelConverter` và `PdfSecurity` sang dynamic import để giảm bundle/chunk size.
- [ ] Tối ưu `CodeEditor`: lazy-load `@uiw/react-codemirror` và cắt `basicSetup` không cần thiết để tránh kéo CodeMirror khi người dùng không mở editor.
- [ ] Giảm phụ thuộc `framer-motion` ở các UI nhỏ (TabContextMenu, Sidebar, ToolSidebar...) – ưu tiên CSS transitions hoặc thư viện nhẹ hơn để tránh tải motion chunk cho mọi màn hình.
- [ ] Giảm polling stats ở Footer: tạm ngừng interval khi `document.hidden`, coalesce cập nhật và cân nhắc đẩy dữ liệu từ main process để tránh gọi `systeminformation` liên tục.
- [ ] Giữ `useGlobalShortcuts` ổn định: memo hóa map shortcut ngoài hook / dùng ref để listener chỉ đăng ký một lần thay vì rebind mỗi lần tabs thay đổi.

> Có thể bổ sung cột `Owner/Priority` nếu cần phân người thực hiện.
