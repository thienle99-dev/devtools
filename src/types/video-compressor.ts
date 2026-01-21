export interface VideoCompressOptions {
    id?: string;
    inputPath: string;
    outputPath?: string;
    format: 'mp4' | 'webm' | 'mkv' | 'avi' | 'mov';
    resolution?: {
        width: number;
        height: number;
    };
    preset?: string; // ffmpeg preset like 'ultrafast', 'medium', 'veryslow'
    crf?: number; // Constant Rate Factor (0-51)
    bitrate?: string; // e.g. '1M', '500k'
    scaleMode?: 'fit' | 'fill' | 'stretch';
    keepAudio?: boolean;
    useHardwareAcceleration?: boolean;
    targetSize?: number; // Target size in bytes
    codec?: 'h264' | 'hevc' | 'vp9' | 'av1';
}

export interface VideoCompressProgress {
    id: string;
    percent: number;
    state: 'analyzing' | 'processing' | 'complete' | 'error' | 'cancelled';
    outputPath?: string;
    error?: string;
    speed?: number;
    eta?: number;
    currentSize?: number;
}

export interface VideoMetadata {
    path: string;
    duration: number;
    width: number;
    height: number;
    codec: string;
    fps: number;
    size: number;
    bitrate?: number;
}
