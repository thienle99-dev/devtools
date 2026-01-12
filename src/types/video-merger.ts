export interface VideoClip {
    path: string;
    startTime?: number;
    endTime?: number;
}

export interface VideoMergeOptions {
    id?: string;
    clips: VideoClip[];
    outputPath?: string;
    format: 'mp4' | 'mkv' | 'avi' | 'mov' | 'webm';
    resolution?: {
        width: number;
        height: number;
    };
    fps?: number;
    maintainAspectRatio?: boolean;
    audioStrategy?: 'first' | 'all' | 'none';
}

export interface VideoMergeProgress {
    id: string;
    percent: number;
    state: 'analyzing' | 'processing' | 'complete' | 'error';
    currentFile?: string;
    speed?: number;
    eta?: number;
    error?: string;
    outputPath?: string;
}

export interface VideoInfo {
    path: string;
    duration: number;
    width: number;
    height: number;
    codec: string;
    fps: number;
    size: number;
}

export interface ExtendedVideoInfo extends VideoInfo {
    startTime: number;
    endTime: number;
    timelineStart: number;
    trackIndex: number;
    thumbnail?: string;
    filmstrip?: string[];
    waveform?: number[];
}

export type VideoFilter = 'none' | 'grayscale' | 'sepia' | 'invert' | 'warm' | 'cool' | 'vintage';

export interface WatermarkOptions {
    text?: string;
    imagePath?: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity?: number; // 0.1 - 1.0
    scale?: number;   // 0.1 - 1.0 relative to video size
    color?: string;   // For text (hex or name)
    fontSize?: number; // For text
}

export interface VideoFromImagesOptions {
    imagePaths: string[];
    fps: number;
    outputPath?: string;
    format: 'mp4' | 'webm' | 'gif';
    quality?: 'low' | 'medium' | 'high';
    transition?: 'none' | 'crossfade';
    transitionDuration?: number;
    filter?: VideoFilter;
    watermark?: WatermarkOptions;
}
