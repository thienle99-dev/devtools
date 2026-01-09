# Advanced Timeline Features Implementation Guide

## ✨ Tính năng đã implement:

### 1. **Playhead Scrubbing** 🎬

- Click vào timeline ruler để jump đến thời điểm đó
- Drag playhead để scrub qua video
- Hiển thị time tooltip khi hover

**Implementation:**

```tsx
const handleRulerClick = (e: React.MouseEvent) => {
  const rect = timelineRef.current?.getBoundingClientRect();
  if (!rect) return;
  const x = e.clientX - rect.left;
  const time = x / pxPerSecond;
  setCurrentTime(Math.max(0, Math.min(totalDuration, time)));
};
```

### 2. **Magnetic Snap** 🧲

- Tự động snap clip khi kéo gần clip khác
- Snap threshold: 0.5 giây
- Visual indicator khi snap

**Implementation:**

```tsx
const applyMagneticSnap = (newTime: number, clipIdx: number) => {
  if (!magneticSnap) return newTime;

  const threshold = magneticSnapThreshold;
  let snappedTime = newTime;

  files.forEach((file, idx) => {
    if (idx === clipIdx) return;

    const clipEnd = file.timelineStart + (file.endTime - file.startTime);

    // Snap to start
    if (Math.abs(newTime - file.timelineStart) < threshold) {
      snappedTime = file.timelineStart;
    }
    // Snap to end
    if (Math.abs(newTime - clipEnd) < threshold) {
      snappedTime = clipEnd;
    }
  });

  return snappedTime;
};
```

### 3. **Multi-Select Clips** ✅

- Ctrl + Click để chọn nhiều clip
- Shift + Click để chọn range
- Visual highlight cho selected clips

**Implementation:**

```tsx
const handleClipSelect = (idx: number, e: React.MouseEvent) => {
  if (e.ctrlKey || e.metaKey) {
    // Toggle selection
    setSelectedClips((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  } else if (e.shiftKey && selectedClips.length > 0) {
    // Range selection
    const lastSelected = selectedClips[selectedClips.length - 1];
    const start = Math.min(lastSelected, idx);
    const end = Math.max(lastSelected, idx);
    const range = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    setSelectedClips(range);
  } else {
    // Single selection
    setSelectedClips([idx]);
  }
};
```

### 4. **Ripple Delete** 🗑️

- Xóa clip và tự động dồn các clip sau lại
- Giữ nguyên khoảng cách giữa các clip

**Implementation:**

```tsx
const handleRippleDelete = (idx: number) => {
  const deletedClip = files[idx];
  const deletedDuration = deletedClip.endTime - deletedClip.startTime;

  setFiles((prev) => {
    const newFiles = prev.filter((_, i) => i !== idx);

    // Shift clips after deleted clip
    return newFiles.map((file) => {
      if (file.timelineStart > deletedClip.timelineStart) {
        return {
          ...file,
          timelineStart: file.timelineStart - deletedDuration,
        };
      }
      return file;
    });
  });
};
```

### 5. **Undo/Redo** ↩️

- Ctrl+Z: Undo
- Ctrl+Shift+Z: Redo
- History stack với giới hạn 50 actions

**Implementation:**

```tsx
const saveToHistory = () => {
  setHistory((prev) => {
    const newHistory = prev.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(files)));
    return newHistory.slice(-50); // Keep last 50 states
  });
  setHistoryIndex((prev) => Math.min(prev + 1, 49));
};

const undo = () => {
  if (historyIndex > 0) {
    setHistoryIndex((prev) => prev - 1);
    setFiles(history[historyIndex - 1]);
  }
};

const redo = () => {
  if (historyIndex < history.length - 1) {
    setHistoryIndex((prev) => prev + 1);
    setFiles(history[historyIndex + 1]);
  }
};
```

### 6. **Enhanced Keyboard Shortcuts** ⌨️

```
Space       - Play/Pause
S           - Split at playhead
R           - Toggle Razor mode
G           - Toggle Snap to grid
M           - Toggle Magnetic snap
Delete      - Delete selected clips
Ctrl+Z      - Undo
Ctrl+Shift+Z - Redo
Ctrl+A      - Select all clips
Ctrl+D      - Duplicate selected clips
←/→         - Navigate frames
Ctrl+←/→    - Navigate seconds
Shift+←/→   - Navigate single frame
Home        - Go to start
End         - Go to end
```

### 7. **Track Height Adjustment** 📏

- Click track label để toggle height
- 3 sizes: Small (40px), Medium (60px), Large (80px)

**Implementation:**

```tsx
const [trackHeights, setTrackHeights] = useState<number[]>(
  Array(6).fill(60) // Default medium
);

const cycleTrackHeight = (trackIdx: number) => {
  setTrackHeights((prev) => {
    const newHeights = [...prev];
    const current = newHeights[trackIdx];
    newHeights[trackIdx] = current === 40 ? 60 : current === 60 ? 80 : 40;
    return newHeights;
  });
};
```

### 8. **Clip Thumbnails Preview** 🖼️

- Hiển thị nhiều thumbnail trong clip
- Auto-generate từ video frames
- Lazy loading để tối ưu performance

**Implementation:**

```tsx
const generateThumbnails = async (videoPath: string, count: number = 5) => {
  const thumbnails: string[] = [];

  for (let i = 0; i < count; i++) {
    const timestamp = (i / count) * duration;
    const thumbnail = await window.videoMergerAPI.extractFrame(
      videoPath,
      timestamp
    );
    thumbnails.push(thumbnail);
  }

  return thumbnails;
};
```

## 🎯 Cách sử dụng:

1. **Playhead Scrubbing**: Click vào ruler hoặc drag playhead
2. **Magnetic Snap**: Kéo clip gần clip khác, sẽ tự động snap
3. **Multi-Select**: Ctrl+Click để chọn nhiều, Shift+Click cho range
4. **Ripple Delete**: Delete key sẽ xóa và dồn clip
5. **Undo/Redo**: Ctrl+Z / Ctrl+Shift+Z
6. **Track Height**: Click vào track label để thay đổi height
7. **Thumbnails**: Tự động hiển thị khi load clip

## 📝 Notes:

- Tất cả features đều có keyboard shortcuts
- Magnetic snap có thể toggle on/off (M key)
- History giới hạn 50 actions để tránh memory leak
- Thumbnails được cache để tối ưu performance
- Multi-select support bulk operations (delete, move, duplicate)

## 🚀 Performance Tips:

1. Thumbnails lazy load khi clip visible
2. Debounce history saves (500ms)
3. Virtual scrolling cho timeline dài
4. RequestAnimationFrame cho smooth playback
5. Web Workers cho thumbnail generation
