/**
 * Screenshot Tool Type Definitions
 */

export type CaptureMode = 'fullscreen' | 'window' | 'area' | 'url' | 'upload';

export interface CaptureSource {
    id: string;
    name: string;
    thumbnail: string;
    type: 'screen' | 'window';
}

export interface CaptureOptions {
    mode: CaptureMode;
    sourceId?: string; // For window capture
    x?: number; // For area capture
    y?: number;
    width?: number;
    height?: number;
}

export type AnnotationType = 'arrow' | 'rectangle' | 'circle' | 'text' | 'line' | 'highlight' | 'blur' | 'number' | 'pen' | 'image';

export interface Annotation {
    id: string;
    type: AnnotationType;
    x: number;
    y: number;
    width?: number;
    height?: number;
    color: string;
    text?: string;
    strokeWidth?: number;
    points?: number[]; // For freehand/lines
    opacity?: number;
}

export interface BackgroundStyle {
    type: 'gradient' | 'solid' | 'pattern' | 'image' | 'transparent';
    colors?: string[]; // For gradient (start, end)
    color?: string; // For solid
    pattern?: string;
    image?: string;
    blur?: number;
    opacity?: number;
}

export interface ImageEnhancement {
    brightness?: number; // -100 to 100
    contrast?: number; // -100 to 100
    saturation?: number; // -100 to 100
    autoBalance?: boolean;
}

export interface ExportOptions {
    format: 'png' | 'jpg' | 'webp';
    quality: number; // 0-100
    filename?: string;
    includeBackground?: boolean;
    padding?: number;
    scale?: number;
    shadow?: boolean;
    watermark?: boolean;
}

export interface ScreenshotData {
    id: string;
    data: string; // base64
    width: number;
    height: number;
    format: 'png' | 'jpg' | 'webp';
    timestamp: number;
    title?: string;
}
