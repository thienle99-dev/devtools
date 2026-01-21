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

export type CaptureMode = 'fullscreen' | 'window' | 'area' | 'url';

export interface CaptureSource {
    id: string;
    name: string;
    thumbnail: string;
    appIcon?: string;
}

export type AnnotationType = 'rect' | 'circle' | 'arrow' | 'text' | 'blur' | 'line' | 'highlight' | 'pen' | 'image' | 'callout' | 'number';

export interface Annotation {
    id: string;
    type: AnnotationType;
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: number[];
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    // For specific tools
    blur?: number;
    cornerRadius?: number;
    startArrow?: boolean;
    endArrow?: boolean;
    // For images
    image?: HTMLImageElement;
    // For numbers
    number?: number;
}
export interface AnnotationConfig {
    color: string;
    strokeWidth: number;
    fontSize: number;
    opacity: number;
    fontFamily: string;
}

export const DEFAULT_ANNOTATION_CONFIG: AnnotationConfig = {
    color: '#FF0000',
    strokeWidth: 2,
    fontSize: 20,
    opacity: 1,
    fontFamily: 'Inter, sans-serif'
};
