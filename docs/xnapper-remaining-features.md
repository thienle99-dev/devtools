# Xnapper - Remaining Features Implementation

**Date**: 2026-01-06  
**Status**: Phase 4 Complete, Moving to Phase 5

---

## ✅ **Completed Features**

### Phase 1-4 (100% Complete)
- ✅ Core Capture (Screen, Window, Area)
- ✅ Basic Processing (Auto-balance, Redaction)
- ✅ Annotations (Arrow, Text, Blur, Pixelate, Highlight, Draw)
- ✅ Background & Styling
- ✅ Export & Share
- ✅ **Crop Tool** (NEW)
- ✅ **Area Selection with Overlay** (NEW)
- ✅ **Xnapper-Style Controls** (NEW)
  - Border Radius
  - Shadow (Blur, Opacity, Offset)
  - Inset Padding
  - Custom Slider Component

---

## 🎯 **Priority Features to Implement**

### 1. Quick Actions (HIGH PRIORITY) ⭐⭐⭐
**Why**: Signature Xnapper feature, huge UX improvement

#### 1.1 Double-Click to Copy
- **File**: `PreviewSection.tsx` or `CanvasPreview.tsx`
- **Action**: Double-click on canvas → Copy final image to clipboard
- **Feedback**: Toast notification + visual flash effect
- **Implementation**:
  ```typescript
  const handleDoubleClick = async () => {
    const finalImage = await generateFinalImage(...);
    await copyToClipboard(finalImage);
    toast.success('Copied to clipboard!');
    // Show visual feedback (flash animation)
  };
  ```

#### 1.2 Drag-and-Drop Export
- **File**: `PreviewSection.tsx`
- **Action**: Drag canvas → Creates temp file → Drag to Finder/Desktop
- **Requires**: Electron IPC for file creation
- **Implementation**:
  ```typescript
  const handleDragStart = async (e) => {
    const finalImage = await generateFinalImage(...);
    const tempPath = await window.electron.createTempFile(finalImage);
    e.dataTransfer.setData('DownloadURL', `image/png:screenshot.png:file://${tempPath}`);
  };
  ```

---

### 2. Aspect Ratio Presets (MEDIUM PRIORITY) ⭐⭐
**Why**: Quick resize for social media

#### Implementation
- **File**: `ExportPanel.tsx` (already has dimension controls)
- **Add**: Quick preset buttons
  - 16:9 (Twitter/YouTube)
  - 1:1 (Instagram Square)
  - 4:5 (Instagram Portrait)
  - 9:16 (Stories)
  - Custom
- **UI**: Pill buttons above custom width/height inputs

---

### 3. Templates System (MEDIUM PRIORITY) ⭐⭐
**Why**: Save time for recurring styles

#### Features
- **Built-in Templates**:
  - Code Showcase (gradient bg, padding, shadow)
  - Social Post (optimized for Instagram/Twitter)
  - Presentation (clean, white bg)
  - Minimal (transparent, no padding)
  
- **Custom Templates**:
  - Save current settings as template
  - Name + description
  - Thumbnail preview
  - Delete custom templates

#### Files to Create/Modify
- `src/tools/screenshot/types/templates.ts` - Type definitions
- `src/tools/screenshot/components/TemplatesPanel.tsx` - UI
- `src/store/xnapperStore.ts` - Add template state
- `src/tools/screenshot/Xnapper.tsx` - Add Templates tab

---

### 4. Keyboard Shortcuts (LOW PRIORITY) ⭐
**Why**: Power user feature

#### Shortcuts
- `Cmd+C` - Copy to clipboard
- `Cmd+S` - Save to file
- `Cmd+Z` - Undo annotation
- `Cmd+Shift+Z` - Redo annotation
- `Escape` - Cancel crop/annotation
- `Cmd+1,2,3...` - Switch tools

---

### 5. Batch Processing (LOW PRIORITY) ⭐
**Why**: Niche use case, complex to implement

#### Features
- Import multiple images
- Apply same settings to all
- Export all at once
- Progress indicator

**Defer**: This is Phase 5 future feature

---

## 📋 **Implementation Order**

### Sprint 1: Quick Actions (1-2 hours)
1. ✅ Double-click to copy
2. ✅ Visual feedback (flash animation)
3. ⏳ Drag-and-drop (if time permits)

### Sprint 2: Polish & UX (1 hour)
1. ✅ Aspect ratio preset buttons
2. ✅ Keyboard shortcuts for common actions
3. ✅ Loading states and better error handling

### Sprint 3: Templates (2-3 hours)
1. ⏳ Define template structure
2. ⏳ Create TemplatesPanel component
3. ⏳ Implement save/load/delete
4. ⏳ Add built-in templates

### Sprint 4: Advanced (Future)
1. ⏳ Batch processing
2. ⏳ Cloud upload
3. ⏳ AI background suggestions

---

## 🎨 **Current Status Summary**

| Feature | Status | Priority |
|---------|--------|----------|
| Core Capture | ✅ 100% | - |
| Crop Tool | ✅ 100% | - |
| Area Selection | ✅ 100% | - |
| Style Controls | ✅ 100% | - |
| Double-Click Copy | ⏳ TODO | HIGH |
| Drag-and-Drop | ⏳ TODO | HIGH |
| Aspect Ratio Presets | ⏳ TODO | MEDIUM |
| Keyboard Shortcuts | ⏳ TODO | MEDIUM |
| Templates | ⏳ TODO | MEDIUM |
| Batch Processing | ⏳ TODO | LOW |

---

## 🚀 **Next Steps**

**Immediate**: Implement Quick Actions (Double-click to copy)
- Easiest to implement
- Biggest UX impact
- Signature Xnapper feature

**After**: Aspect Ratio Presets
- Already have dimension controls
- Just add preset buttons
- Quick win

**Then**: Templates System
- More complex but very useful
- Can defer if time is limited

---

## 📝 **Notes**

- Focus on **high-impact, low-effort** features first
- Templates can be deferred to Phase 5
- Batch processing is nice-to-have, not essential
- Quick Actions are THE signature feature of Xnapper
