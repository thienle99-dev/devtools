// YouTube Downloader Type Definitions

export interface VideoInfo {
    videoId: string;
    title: string;
    author: string;
    lengthSeconds: number;
    thumbnailUrl: string;
    description?: string;
    viewCount?: number;
    uploadDate?: string;
    formats: VideoFormat[];
}

export interface VideoFormat {
    itag: number;
    quality: string;
    qualityLabel?: string;
    container: string;
    hasVideo: boolean;
    hasAudio: boolean;
    codec?: string;
    bitrate?: number;
    audioCodec?: string;
    videoCodec?: string;
    width?: number;
    height?: number;
    fps?: number;
    contentLength?: string;
}

export interface DownloadOptions {
    url: string;
    format: 'video' | 'audio' | 'best';
    quality?: string;
    outputPath?: string;
    filename?: string;
}

export interface DownloadProgress {
    percent: number;
    downloaded: number;
    total: number;
    speed: number;
    eta: number;
    state: 'downloading' | 'processing' | 'complete' | 'error';
}

export interface DownloadResult {
    success: boolean;
    filepath?: string;
    filename?: string;
    error?: string;
}

export interface YouTubeAPI {
    getInfo: (url: string) => Promise<VideoInfo>;
    download: (options: DownloadOptions) => Promise<DownloadResult>;
    onProgress: (callback: (progress: DownloadProgress) => void) => () => void;
    cancelDownload: () => void;
}

