# Konva Migration Plan for Canvas/Annotation Tools

**Objective:** Migrate current canvas/annotation features from Fabric.js to Konva for better performance (hit detection/layering) while keeping editing UX (select/move/resize/rotate/text) stable.  
**Scope:** Screenshot/annotation and any canvas-based editors in DevTools App.

---

## 1) Why Konva (vs Fabric/Pixi)

- **Better performance** than Fabric for many shapes (layered scene graph, fast hit detection).
- **Editing-friendly**: Events, transformers (resize/rotate), selection overlays are ready to use.
- **React support**: `react-konva` is mature; easy to integrate with existing React code.
- **Lower effort** than Pixi (Pixi requires building selection/handles from scratch).

---

## 2) Target Features to Migrate

- Drawing layer: shapes, lines, arrows, rectangles, ellipses.
- Text: editable text nodes, font/color/size, alignment.
- Selection & transform: select, move, resize, rotate; multi-select; bounding boxes.
- History: undo/redo for canvas actions.
- Export: image (PNG/JPEG), possibly JSON serialization for session save/restore.
- Image layer: background image (for screenshot), overlays.
- Zoom/pan (if present).

---

## 3) High-Level Architecture

```
React (existing app)
  └─ CanvasTool (Screenshot/Annotation)
      ├─ Stage (Konva Stage)
      │   ├─ Background Layer (image/video snapshot)
      │   ├─ Draw Layer (shapes, text)
      │   ├─ UI Layer (selection rect, guides)
      │   └─ Transformer(s) (resize/rotate handles)
      └─ State Store (shapes, selection, history)
```

---

## 4) Migration Steps (Phased)

### Phase 0: Prep (0.5 day)

- Add deps: `konva`, `react-konva`.
- Spike prototype: Stage + Layer + few shapes + Transformer to validate selection/resize/rotate and export toDataURL.

### Phase 1: Core Canvas & Rendering (1-2 days)

- Create `CanvasStage` component using `Stage`, `Layer`.
- Render shapes from state (rect, ellipse, line, arrow, text).
- Add image background support (for screenshot import).
- Ensure pixel ratio handling (hi-dpi).

### Phase 2: Interaction & Selection (1-2 days)

- Click/drag selection.
- Keyboard modifiers (multi-select).
- Transformer integration for resize/rotate.
- Z-index (bring to front/back).
- Lock/visibility flags if needed.

### Phase 3: Shape Tools & Text (1-2 days)

- Tool modes: select, draw-rect, draw-ellipse, draw-line/arrow, text.
- Text editing in-place; font, size, color, align.
- Stroke/fill colors, stroke width, opacity.
- Snap-to-pixel or optional snapping if needed.

### Phase 4: History & State (1 day)

- Undo/redo stack for shape ops (add/remove/move/resize/rotate/props change).
- Serialization: save/load JSON of shapes (Konva node JSON or custom schema).
- Clipboard: duplicate/copy-paste shapes (optional).

### Phase 5: Export & Import (0.5-1 day)

- Export PNG/JPEG (Stage.toDataURL), respect background.
- Optional: Export JSON for session; Import JSON restore.
- Quality settings (scale, pixel ratio).

### Phase 6: Performance & Polish (1 day)

- Hit detection tuning (listening = false for static nodes).
- Layering for dirty regions (separate background vs dynamic layer).
- Throttle drag/transform events for state updates.
- Memory audit for large backgrounds.

### Phase 7: QA & Rollout (1-2 days)

- Cross-browser (Chromium/Electron) testing.
- Regression vs Fabric feature parity checklist.
- Edge cases: very large canvas, many objects, undo/redo spam, export with big images.
- Incremental release behind a feature flag (toggle Fabric/Konva).

---

## 5) State Management Model

- Keep a normalized shape list in React/Zustand/Redux.
- Each shape: `{ id, type, props, locked, visible, zIndex }`.
- Selection: array of ids.
- History: stack of patches (before/after).
- Render: map shapes → Konva nodes; apply `draggable`, `listening`, `name` for grouping.

---

## 6) Feature Parity Checklist (Fabric → Konva)

- [x] Select/move single & multi
- [x] Resize/rotate with handles (Transformer)
- [x] Z-order change (bring front/back)
- [x] Text edit inline
- [x] Shapes: rect, ellipse, line, arrow, free draw (Pen)
- [x] Style: stroke, fill, strokeWidth, opacity
- [x] Undo/redo for all ops
- [x] Export PNG/JPEG
- [x] Import background image
- [x] Serialization (session save/load)
- [x] Zoom/pan (Zoom implemented)
- [x] Keyboard shortcuts (delete, ctrl+c/v, ctrl+z/y)

---

## 7) Performance Tips for Konva

- Use multiple Layers: background vs interactive.
- Set `listening = false` for static layers/background.
- Batch updates with `batchDraw()` after series of changes.
- Avoid frequent React re-renders: keep shape state minimal, use memoization.
- Large backgrounds: downscale preview, use `imageSmoothingEnabled`.
- Disable perfect drawing when not needed (shadows, complex filters).

---

## 8) Rollout Plan

- Add feature flag: `USE_KONVA_CANVAS` (env or settings toggle).
- Ship in beta to compare FPS and UX vs Fabric.
- Collect feedback on text editing, selection, export correctness.
- [x] Remove Fabric code after stable release.

---

## 9) Risks & Mitigations

- Text editing UX differs: test inline editing carefully (Konva Text + textarea overlay if needed).
- Free drawing: may need custom Path tool; ensure smoothing performance.
- Export fidelity: verify colors/opacity and background in toDataURL.
- Large canvases: memory and performance—consider virtualization of shapes if extremely large.

---

## 10) Dependencies & Setup

```bash
npm install konva react-konva
```

- TypeScript: use Konva types bundled.
- Ensure Electron context isolation allows Canvas use (no special change).

---

## 11) Success Criteria

- FPS improves vs Fabric on >200 objects.
- Parity of core editing features (selection/transform/text/export).
- No regressions in screenshot/annotation workflows.
- Undo/redo stable; export quality acceptable.

---

## 12) Timeline (Estimate ~6-8 days)

- Day 1-2: Core Stage/Layers, selection, transformer prototype.
- Day 3-4: Tools (shapes/text), props UI, background image.
- Day 5: History, export/import.
- Day 6: Performance tuning, polish.
- Day 7-8: QA, feature flag rollout, beta.

---

## 13) Deliverables

- Konva-based canvas component(s).
- Feature flag toggle between Fabric/Konva.
- Tests for selection/transform/export and undo/redo.
- Migration guide (mapping Fabric APIs to Konva).

---

## 14) Additional Considerations

- Feature parity & UX
  - Text editing: dùng textarea overlay cho IME/RTL; load font trước khi đo kích thước.
  - Free-draw/pen: cần smoothing, giảm số điểm, throttle để tránh lag.
  - Multi-select + transformer: test rotate/resize nhiều object; z-index, lock/visible rõ ràng.
  - Zoom/pan: đồng bộ pointer/hit detection/transformer với stage scale/position.

- Export & chất lượng
  - toDataURL: kiểm tra background (transparent/color), pixelRatio (hi-dpi), imageSmoothingEnabled.
  - Ảnh nền lớn: cân nhắc downscale preview để giảm RAM khi export.
  - Màu/opacity: so sánh với Fabric để tránh lệch màu (overlay semi-transparent).

- Hiệu năng
  - Layer hóa: background riêng, drawing riêng; đặt `listening=false` cho layer tĩnh.
  - Batch updates: `batchDraw()` sau chuỗi thay đổi; throttle drag/transform events.
  - Nhiều shapes: memo render, tránh re-render toàn bộ; tắt shadow/filter khi không cần.

- State & undo/redo
  - Lưu history dạng patch, tránh lưu ảnh lớn.
  - Serialization: chọn schema (custom vs Konva JSON); đảm bảo tương thích nếu migrate dữ liệu cũ.

- Tương tác & input
  - Shortcuts: delete, copy/paste/duplicate, undo/redo; kiểm tra khi focus textarea.
  - Touch/pen: test trên màn cảm ứng; hit detection với finger lớn.
  - Snapping: snap to pixel/grid bật tùy chọn để không ảnh hưởng FPS.

- Tích hợp Electron
  - HiDPI/scaleFactor: test 4K/125%-150%.
  - Clipboard hình ảnh (nếu có): cân nhắc native clipboard main/preload.
  - GPU yếu: Konva (Canvas 2D) thường ổn, nhưng cần test máy thấp.

- Kiểm thử
  - Kịch bản nặng: >200 objects, ảnh nền lớn, undo/redo nhanh, zoom sâu, export độ phân giải cao.
  - Cross-platform: Win/macOS/Linux, font & IME (gõ tiếng Việt) ổn.
  - Hồi phục phiên: load JSON cũ sang schema mới, tránh mất dữ liệu.

- Triển khai & chuyển đổi
  - Feature flag: bật/tắt Konva để so sánh FPS & UX; rollout beta trước.
  - Parity checklist: chọn/bỏ, text, shapes, export, undo/redo, zoom/pan — tick đủ trước khi gỡ Fabric.
