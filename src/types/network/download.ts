export interface DownloadSegment {
    id: number;
    start: number;
    end: number;
    downloaded: number;
    status: 'pending' | 'downloading' | 'completed' | 'failed';
}

export interface DownloadTask {
    id: string;
    url: string;
    filename: string;
    filepath: string;
    totalSize: number;
    downloadedSize: number;
    segments: DownloadSegment[];
    status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed';
    speed: number;
    eta: number;
    priority: number;
    createdAt: number;
    completedAt?: number;
    error?: string;
}

export interface DownloadProgress {
    taskId: string;
    downloadedSize: number;
    totalSize: number;
    speed: number;
    eta: number;
    progress: number;
    status: DownloadTask['status'];
    segments?: DownloadSegment[];
}

export interface DownloadSettings {
    downloadPath: string;
    maxConcurrentDownloads: number;
    segmentsPerDownload: number;
    autoStart: boolean;
}
