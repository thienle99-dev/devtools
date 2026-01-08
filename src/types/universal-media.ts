export type SupportedPlatform = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'twitch' | 'reddit' | 'other';

export interface UniversalMediaInfo {
    id: string;
    url: string;
    title: string;
    platform: SupportedPlatform;
    thumbnailUrl: string;
    author?: string;
    authorUrl?: string;
    duration?: number;
    uploadDate?: string;
    description?: string;
    viewCount?: number;
    likeCount?: number;
    isLive?: boolean;
    webpageUrl?: string;
    availableQualities?: string[]; // e.g., ['2160p', '1440p', '1080p', '720p', '480p', '360p']
}

export interface UniversalDownloadOptions {
    url: string;
    format: 'video' | 'audio';
    quality: 'best' | 'medium' | 'low';
    outputPath?: string;
    maxSpeed?: string;
    id?: string;
    filename?: string;
    proxy?: string;
    cookies?: string; // Path to cookies file if needed
    cookiesBrowser?: 'chrome' | 'firefox' | 'edge'; // Use browser cookies
}

export interface UniversalDownloadProgress {
    id?: string;
    percent: number;
    downloaded: number;
    total: number;
    speed: number;
    eta: number;
    state: 'downloading' | 'processing' | 'complete' | 'error';
    filename?: string;
    filePath?: string;
    platform?: SupportedPlatform;
}

export interface UniversalHistoryItem {
    id: string;
    url: string;
    title: string;
    platform: SupportedPlatform;
    thumbnailUrl: string;
    author?: string;
    timestamp: number;
    path: string;
    size: number;
    duration?: number;
    format: 'video' | 'audio';
    status: 'completed' | 'failed';
}
