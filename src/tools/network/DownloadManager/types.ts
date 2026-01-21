import type { DownloadTask } from '@/types/network/download';

export type FilterStatus = 'all' | 'downloading' | 'completed' | 'paused' | 'failed';
export type CategoryFilter = DownloadTask['category'] | 'all';

export interface DownloadStats {
    total: number;
    downloading: number;
    completed: number;
    paused: number;
    failed: number;
}

export type SortBy = 'date' | 'name' | 'size';
export type DownloadViewMode = 'list' | 'grid';
