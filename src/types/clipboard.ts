/**
 * Clipboard Manager Type Definitions
 */

export interface ClipboardItem {
    id: string;
    content: string;
    type: 'text' | 'image' | 'link' | 'file';
    timestamp: number;
    pinned: boolean;
    copyCount: number;
    sourceApp?: string;
    categories?: string[];
    metadata?: {
        length?: number;
        mimeType?: string;
        preview?: string;
        url?: string;
        filePath?: string;
    };
}

export type SearchMode = 'contains' | 'exact' | 'startsWith' | 'fuzzy';

export interface FilterOptions {
    type: 'all' | 'text' | 'image' | 'link' | 'file';
    dateRange: 'all' | 'today' | 'week' | 'month';
    pinnedOnly: boolean;
    searchMode: SearchMode;
}

export interface ClipboardSettings {
    autoClearDays: number;
    excludeDuplicates: boolean;
    enableMonitoring: boolean;
    ignoredApps: string[];
    clearOnQuit: boolean;
}

export interface ClipboardStatistics {
    totalItems: number;
    totalCopies: number;
    mostCopiedItems: ClipboardItem[];
    itemsByType: Record<string, number>;
    itemsByDay: Record<string, number>;
}
