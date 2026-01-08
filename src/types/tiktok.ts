export interface TikTokDownloadOptions {
    url: string;
    format: 'video' | 'audio';
    quality?: 'best' | 'medium' | 'low';
    outputPath?: string;
    maxSpeed?: string;
    watermark?: boolean; // TikTok-specific: keep or remove watermark
    id?: string;
}

export interface TikTokVideoInfo {
    id: string;
    title: string;
    author: string;
    authorUsername: string;
    duration: number;
    thumbnailUrl: string;
    description?: string;
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
    shareCount?: number;
    uploadDate?: string;
    musicTitle?: string;
    musicAuthor?: string;
}

export interface TikTokDownloadProgress {
    id?: string;
    percent: number;
    downloaded: number;
    total: number;
    speed: number;
    eta: number;
    state: 'downloading' | 'processing' | 'complete' | 'error';
    filename?: string;
    filePath?: string;
}

export interface TikTokHistoryItem {
    id: string;
    url: string;
    title: string;
    thumbnailUrl: string;
    author: string;
    authorUsername: string;
    timestamp: number;
    path: string;
    size: number;
    duration: number;
    format: 'video' | 'audio';
    status: 'completed' | 'failed';
}
