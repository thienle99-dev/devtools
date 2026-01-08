/**
 * Screenshot Tool Type Definitions
 */

export type CaptureMode = 'fullscreen' | 'window' | 'area' | 'url';

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

export interface Screenshot {
    id: string;
    data: string; // base64
    width: number;
    height: number;
    format: 'png' | 'jpg' | 'webp';
    timestamp: number;
}
