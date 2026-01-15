# Video Editor Integration Plan

## 🎯 Mục tiêu:

Đổi tên `VideoMerger` → `VideoEditor` và integrate tất cả advanced features

## 📋 Checklist:

### 1. **Rename Component** ✅

- [x] Copy VideoMerger.tsx → VideoEditor.tsx
- [ ] Update export name: `export const VideoEditor`
- [ ] Update imports trong VideoStudio.tsx
- [ ] Update registry.tsx nếu cần

### 2. **Import Utilities** ✅

```tsx
import {
  applyMagneticSnap,
  applyGridSnap,
  rippleDelete,
  rippleDeleteMultiple,
  duplicateClips,
  selectRange,
  findNearestSnapPoint,
  formatTimeDisplay,
  debounce,
} from "./utils/timelineUtils";
```

### 3. **Add New State Variables** ✅

```tsx
const [selectedClips, setSelectedClips] = useState<number[]>([]);
const [magneticSnap, setMagneticSnap] = useState(true);
const [history, setHistory] = useState<ExtendedVideoInfo[][]>([]);
const [historyIndex, setHistoryIndex] = useState(-1);
const [trackHeights, setTrackHeights] = useState<number[]>(Array(6).fill(60));
```

### 4. **Implement History Management** ✅

```tsx
const saveToHistory = debounce(() => {
  setHistory((prev) => {
    const newHistory = prev.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(files)));
    return newHistory.slice(-50);
  });
  setHistoryIndex((prev) => Math.min(prev + 1, 49));
}, 500);

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

### 5. **Enhanced Keyboard Shortcuts** ✅

```tsx
// Add to existing useEffect
else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (e.shiftKey) {
        redo();
    } else {
        undo();
    }
} else if (e.code === 'KeyM' && !e.ctrlKey) {
    e.preventDefault();
    setMagneticSnap(prev => !prev);
} else if (e.code === 'KeyA' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    setSelectedClips(files.map((_, i) => i));
} else if (e.code === 'KeyD' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (selectedClips.length > 0) {
        const duplicated = duplicateClips(files, selectedClips);
        setFiles(duplicated);
        saveToHistory();
    }
}
```

### 6. **Implement Multi-Select** ✅

```tsx
const handleClipSelect = (idx: number, e: React.MouseEvent) => {
  if (e.ctrlKey || e.metaKey) {
    setSelectedClips((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  } else if (e.shiftKey && selectedClips.length > 0) {
    const lastSelected = selectedClips[selectedClips.length - 1];
    const range = selectRange(lastSelected, idx);
    setSelectedClips(range);
  } else {
    setSelectedClips([idx]);
  }
  setPreviewIndex(idx);
};
```

### 7. **Implement Ripple Delete** ✅

```tsx
const handleRippleDelete = () => {
  if (selectedClips.length > 0) {
    const newFiles = rippleDeleteMultiple(files, selectedClips);
    setFiles(newFiles);
    setSelectedClips([]);
    saveToHistory();
  }
};
```

### 8. **Enhanced updateClipPosition with Magnetic Snap** ✅

```tsx
const updateClipPosition = (
  idx: number,
  newTimelineStart: number,
  newTrackIndex: number
) => {
  let finalTime = newTimelineStart;

  // Apply magnetic snap
  if (magneticSnap) {
    finalTime = applyMagneticSnap(
      newTimelineStart,
      idx,
      files,
      magneticSnapThreshold,
      true
    );
  }

  // Apply grid snap
  if (snapToGrid) {
    finalTime = applyGridSnap(finalTime, snapInterval, true);
  }

  setFiles((prev) =>
    prev.map((f, i) =>
      i === idx
        ? {
            ...f,
            timelineStart: Math.max(0, finalTime),
            trackIndex: Math.max(0, Math.min(5, newTrackIndex)),
          }
        : f
    )
  );

  saveToHistory();
};
```

### 9. **Playhead Scrubbing** ✅

```tsx
const handleRulerClick = (e: React.MouseEvent) => {
  const rect = timelineRef.current?.getBoundingClientRect();
  if (!rect) return;
  const x = e.clientX - rect.left;
  const time = x / (80 * zoomLevel);
  setCurrentTime(Math.max(0, Math.min(totalDuration, time)));
};
```

### 10. **Update CapCutTimeline Props** ✅

```tsx
<CapCutTimeline
  // ... existing props
  selectedClips={selectedClips}
  magneticSnap={magneticSnap}
  onToggleMagneticSnap={() => setMagneticSnap(!magneticSnap)}
  onClipSelect={handleClipSelect}
  onRulerClick={handleRulerClick}
  canUndo={historyIndex > 0}
  canRedo={historyIndex < history.length - 1}
  onUndo={undo}
  onRedo={redo}
/>
```

## 🚀 Implementation Order:

1. ✅ Create utility functions (timelineUtils.ts)
2. ✅ Create documentation (TIMELINE_ADVANCED_FEATURES.md)
3. ⏳ Copy VideoMerger → VideoEditor
4. ⏳ Add imports and state
5. ⏳ Implement history management
6. ⏳ Add enhanced keyboard shortcuts
7. ⏳ Implement multi-select
8. ⏳ Implement ripple delete
9. ⏳ Add magnetic snap to drag
10. ⏳ Add playhead scrubbing
11. ⏳ Update CapCutTimeline interface
12. ⏳ Update VideoStudio imports
13. ⏳ Test all features

## 📝 Notes:

- Tất cả changes đều có history tracking
- Debounce history saves để tránh spam
- Multi-select support Ctrl+Click và Shift+Click
- Magnetic snap có threshold 0.5s
- Grid snap theo interval 1s
- History limit 50 actions

## ⚠️ Breaking Changes:

- Component name: `VideoMerger` → `VideoEditor`
- New props cho CapCutTimeline
- New keyboard shortcuts (M, Ctrl+Z, Ctrl+Shift+Z, Ctrl+A, Ctrl+D)

Bạn muốn tôi tiếp tục implement từng bước không? 🚀
