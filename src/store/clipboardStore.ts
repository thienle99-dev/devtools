import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ClipboardItem {
    id: string;
    content: string;
    type: 'text' | 'image' | 'link' | 'file';
    timestamp: number;
    pinned: boolean;
    copyCount: number; // Số lần copy
    sourceApp?: string; // App nguồn (từ Electron)
    metadata?: {
        length?: number;
        mimeType?: string;
        preview?: string;
        url?: string; // Cho links
        filePath?: string; // Cho files
    };
}

export type SearchMode = 'contains' | 'exact' | 'startsWith' | 'fuzzy';

export interface FilterOptions {
    type: 'all' | 'text' | 'image' | 'link' | 'file';
    dateRange: 'all' | 'today' | 'week' | 'month';
    pinnedOnly: boolean;
    searchMode: SearchMode; // Thêm search mode
}

interface ClipboardSettings {
    autoClearDays: number;
    excludeDuplicates: boolean;
    enableMonitoring: boolean;
    ignoredApps: string[]; // Danh sách apps để ignore
    clearOnQuit: boolean; // Xóa clipboard khi quit
}

interface ClipboardStore {
    items: ClipboardItem[];
    maxItems: number;
    settings: ClipboardSettings;

    // Actions
    addItem: (content: string, type: 'text' | 'image' | 'link' | 'file', metadata?: any) => void;
    removeItem: (id: string) => void;
    pinItem: (id: string) => void;
    unpinItem: (id: string) => void;
    clearAll: () => void;
    updateSettings: (settings: Partial<ClipboardSettings>) => void;
    setMaxItems: (max: number) => void;
    getSortedItems: () => ClipboardItem[];
    searchItems: (query: string, mode: SearchMode) => ClipboardItem[];
    incrementCopyCount: (id: string) => void;
}

export const useClipboardStore = create<ClipboardStore>()(
    persist(
        (set, get) => ({
            items: [],
            maxItems: 200, // Maccy default
            settings: {
                autoClearDays: 0,
                excludeDuplicates: true,
                enableMonitoring: true, // Bật mặc định để tự động lưu clipboard
                ignoredApps: [], // Danh sách apps để ignore
                clearOnQuit: false, // Không xóa clipboard khi quit mặc định
            },

            addItem: (content, type, metadata) => set((state) => {
                // Check for duplicates if enabled
                if (state.settings.excludeDuplicates) {
                    const lastItem = state.items[0];
                    if (lastItem && lastItem.content === content) {
                        // Increment copy count instead of adding duplicate
                        return {
                            items: state.items.map(item =>
                                item.id === lastItem.id
                                    ? { ...item, copyCount: item.copyCount + 1, timestamp: Date.now() }
                                    : item
                            ),
                        };
                    }
                }

                // Check if item already exists (for updating copy count)
                const existingItem = state.items.find(item => item.content === content);
                if (existingItem) {
                    return {
                        items: state.items.map(item =>
                            item.id === existingItem.id
                                ? { ...item, copyCount: item.copyCount + 1, timestamp: Date.now() }
                                : item
                        ),
                    };
                }

                const newItem: ClipboardItem = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    content,
                    type,
                    timestamp: Date.now(),
                    pinned: false,
                    copyCount: 1,
                    sourceApp: metadata?.sourceApp,
                    metadata: {
                        length: type === 'text' ? content.length : undefined,
                        ...metadata,
                    },
                };

                const newItems = [newItem, ...state.items];

                // Remove oldest items if exceeding max
                const trimmedItems = newItems.slice(0, state.maxItems);

                return { items: trimmedItems };
            }),

            removeItem: (id) => set((state) => ({
                items: state.items.filter(item => item.id !== id),
            })),

            pinItem: (id) => set((state) => ({
                items: state.items.map(item =>
                    item.id === id ? { ...item, pinned: true } : item
                ),
            })),

            unpinItem: (id) => set((state) => ({
                items: state.items.map(item =>
                    item.id === id ? { ...item, pinned: false } : item
                ),
            })),

            clearAll: () => set({ items: [] }),

            updateSettings: (newSettings) => set((state) => ({
                settings: { ...state.settings, ...newSettings },
            })),

            setMaxItems: (max) => set((state) => ({
                maxItems: max,
                items: state.items.slice(0, max),
            })),

            getSortedItems: () => {
                const { items } = get();
                // Sort: pinned first, then by timestamp (newest first)
                return [...items].sort((a, b) => {
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    return b.timestamp - a.timestamp;
                });
            },

            // Enhanced search with 4 modes
            searchItems: (query, mode) => {
                const { items } = get();
                if (!query.trim()) return items;

                const queryLower = query.toLowerCase();

                return items.filter(item => {
                    const content = item.content.toLowerCase();

                    switch (mode) {
                        case 'exact':
                            return content === queryLower;
                        case 'startsWith':
                            return content.startsWith(queryLower);
                        case 'fuzzy':
                            // Fuzzy match: all characters in query must appear in order
                            let queryIndex = 0;
                            for (let i = 0; i < content.length && queryIndex < queryLower.length; i++) {
                                if (content[i] === queryLower[queryIndex]) {
                                    queryIndex++;
                                }
                            }
                            return queryIndex === queryLower.length;
                        case 'contains':
                        default:
                            return content.includes(queryLower);
                    }
                });
            },

            incrementCopyCount: (id) => set((state) => ({
                items: state.items.map(item =>
                    item.id === id ? { ...item, copyCount: item.copyCount + 1 } : item
                ),
            })),
        }),
        {
            name: 'clipboard-manager-storage',
        }
    )
);
