export type CaptureMode = 'fullscreen' | 'window' | 'area';

export interface CaptureSource {
    id: string;
    name: string;
    thumbnail: string;
    type: 'screen' | 'window';
}

export interface CaptureOptions {
    mode: 'fullscreen' | 'window' | 'area';
    sourceId?: string; // For window capture
    x?: number; // For area capture
    y?: number;
    width?: number;
    height?: number;
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
}
