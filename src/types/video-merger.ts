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

export interface VideoFromImagesOptions {
    imagePaths: string[];
    fps: number;
    outputPath?: string;
    format: 'mp4' | 'webm' | 'gif';
    quality?: 'low' | 'medium' | 'high';
    transition?: 'none' | 'crossfade';
    transitionDuration?: number;
}
