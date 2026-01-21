export interface CanvasPreviewHandle {
    undo: () => void;
    redo: () => void;
    clear: () => void;
    canUndo: boolean;
    canRedo: boolean;
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    getZoom: () => number;
    exportImage?: () => string;
    bringForward?: () => void;
    sendBackward?: () => void;
}
