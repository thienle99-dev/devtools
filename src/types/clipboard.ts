/**
 * Clipboard Manager Type Definitions
 */

export type ClipboardItemType = 'text' | 'image' | 'link' | 'file';
export type SearchMode = 'contains' | 'exact' | 'startsWith' | 'fuzzy';

export interface ClipboardItem {
    id: string;
    content: string;
    type: ClipboardItemType;
    timestamp: number;
    pinned: boolean;
    copyCount: number; // Số lần copy
    sourceApp?: string; // App nguồn (từ Electron)
    categories?: string[]; // Categories/tags
    metadata?: {
        length?: number;
        mimeType?: string;
        preview?: string;
        url?: string; // Cho links
        filePath?: string; // Cho files
    };
    isPinned?: boolean; // Optional alias for pinned
    favorite?: boolean;
}

export interface ClipboardSettings {
    autoClearDays: number;
    excludeDuplicates: boolean;
    enableMonitoring: boolean;
    ignoredApps: string[]; // Danh sách apps để ignore
    clearOnQuit: boolean; // Xóa clipboard khi quit
    maxItems?: number;
    enableSync?: boolean;
    autoClean?: boolean;
}

export interface FilterOptions {
    type: 'all' | ClipboardItemType;
    dateRange: 'all' | 'today' | 'week' | 'month';
    pinnedOnly: boolean;
    searchMode: SearchMode;
}

export interface ClipboardStatistics {
    totalItems: number;
    totalCopies: number;
    mostCopiedItems: ClipboardItem[];
    itemsByType: Record<string, number>;
    itemsByDay: Record<string, number>;
}
