# Phase 3: Annotations - Implementation Summary

## 1. Objective
Enable users to annotate screenshots with arrows, text, shapes, and other elements, and apply cropping.

## 2. Implementation Details

### Core Components
1. **CanvasPreview.tsx (`src/tools/screenshot/components/CanvasPreview.tsx`)**
   - The central component for rendering and interaction.
   - Built on **Fabric.js** (v6/v7) for vector-based object manipulation on HTML5 Canvas.
   - **Layering Architecture**:
     - **Bottom**: Base Image (Screenshot + Auto-Balance + Redactions + Background/Padding). Generated via `exportUtils`.
     - **Top**: Interactive Annotation Layer (Fabric.js objects).
   - **Features**:
     - **Drawing Tools**: Arrow, Text, Rectangle, Circle, Ellipse, Line, Blur.
     - **Manipulation**: Select, Move, Resize, Rotate, Delete interactions natively supported by Fabric.js.
     - **History**: Local Undo/Redo stack with keyboard shortcuts (Cmd+Z, Cmd+Shift+Z/Cmd+Y).
     - **Zoom/Pan**: Responsive scaling and zoom controls.

2. **AnnotationToolbar.tsx (`src/tools/screenshot/components/AnnotationToolbar.tsx`)**
   - Provides UI controls for:
     - Tool Selection (Arrow, Text, etc.).
     - Color Picker (Preset palette + custom).
     - Stroke Width and Font Size sliders.
     - Undo/Redo/Clear actions.

3. **Utilities (`src/tools/screenshot/utils/annotations.ts`)**
   - Factory functions for creating Fabric objects with consistent styling (`createArrow`, `createText`, etc.).
   - Serialization helpers.

### Integration
- **PreviewSection.tsx** was refactored to replace the static HTML canvas with the interactive `CanvasPreview`.
- **State Management**: `xnapperStore` updated to track active tools, configuration, and canvas state.

## 3. Supported Features
- [x] **Draw Arrows**: Drag to create arrows.
- [x] **Add Text**: Click to add editable text.
- [x] **Shapes**: Rectangle, Circle, Ellipse, Line.
- [x] **Blur**: Create "blur" areas (semantic representation, rendered as pixelated/blurred rects).
- [x] **Styling**: Change color, stroke width, text size.
- [x] **Undo/Redo**: Full history support for annotations.
- [x] **Delete**: Select objects and press Backspace/Delete.
- [x] **Clear All**: Remove all annotations.

## 4. Pending / Future Work
- **Advanced Crop**: While the "Crop" tool is in the toolbar and utils exist (`crop.ts`), the interactive crop overlay in `CanvasPreview` is currently a placeholder. Implementing a robust cropping UI (resizable overlay with dimming) is the next logical step (Phase 3.5).
- **Text Formatting**: Font family selection is basic.
- **Group Redactions**: Currently Redactions (Phase 2) are baked into the background. Making them editable as Fabric objects would unify the experience.

## 5. Usage
1. Capture a screenshot.
2. Use the **Annotation Toolbar** above the canvas to select a tool.
3. Draw on the canvas.
4. Use the Side Panel to adjust Redactions or Backgrounds (this will reload the base image under the annotations).
5. Click **Copy** or **Save** (Export logic will flatten the canvas using `exportCanvasWithAnnotations` or similar final render logic).

_Note: Export logic currently in `ExportPanel` uses `generateFinalImage`. We need to ensure it also captures the Fabric canvas content overlay. Currently `CanvasPreview` is for PREVIEW. For EXPORT, we need to merge them._

**Critical Note on Export**:
The current `generateFinalImage` utility does **not** yet include the Fabric.js annotations.
To support exporting annotations, we need to update `generateFinalImage` or the export flow to:
1. Get the base image.
2. Load it into a temporary Fabric canvas (or use the main one).
3. Load the annotation JSON.
4. Render everything to a high-res dataURL.

**Immediate Next Task**: Update Export Logic to include Annotations!
