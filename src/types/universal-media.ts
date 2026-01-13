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
    availableQualities?: string[];
    isPlaylist?: boolean;
    playlistCount?: number;
    playlistVideos?: Array<{
        id: string;
        title: string;
        duration?: number;
        url: string;
        thumbnail?: string;
    }>;
    size?: number;
}

export interface UniversalDownloadOptions {
    url: string;
    format: 'video' | 'audio';
    quality: string; // Changed from union to string for flexible quality labels
    outputPath?: string;
    maxSpeed?: string;
    id?: string;
    filename?: string;
    proxy?: string;
    cookies?: string;
    cookiesBrowser?: 'chrome' | 'firefox' | 'edge';
    embedSubs?: boolean; // New: Support for subtitles
    isPlaylist?: boolean; // New: Support for playlist mode
    playlistItems?: string; // New: Specific indices or IDs to download from playlist
    audioFormat?: 'mp3' | 'm4a' | 'wav' | 'flac'; // New: Output audio format
}

export interface UniversalDownloadProgress {
    id?: string;
    percent: number;
    downloaded: number;
    total: number;
    speed: number;
    eta: number;
    state: 'downloading' | 'processing' | 'complete' | 'error' | 'paused' | 'queued';

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
