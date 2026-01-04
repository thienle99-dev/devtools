import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ClipboardItem {
    id: string;
    content: string;
    type: 'text' | 'image';
    timestamp: number;
    pinned: boolean;
    metadata?: {
        length?: number;
        mimeType?: string;
        preview?: string;
    };
}

export interface FilterOptions {
    type: 'all' | 'text' | 'image';
    dateRange: 'all' | 'today' | 'week' | 'month';
    pinnedOnly: boolean;
}

interface ClipboardSettings {
    autoClearDays: number;
    excludeDuplicates: boolean;
    enableMonitoring: boolean;
}

interface ClipboardStore {
    items: ClipboardItem[];
    maxItems: number;
    settings: ClipboardSettings;

    // Actions
    addItem: (content: string, type: 'text' | 'image', metadata?: any) => void;
    removeItem: (id: string) => void;
    pinItem: (id: string) => void;
    unpinItem: (id: string) => void;
    clearAll: () => void;
    updateSettings: (settings: Partial<ClipboardSettings>) => void;
    setMaxItems: (max: number) => void;
    getSortedItems: () => ClipboardItem[];
}

export const useClipboardStore = create<ClipboardStore>()(
    persist(
        (set, get) => ({
            items: [],
            maxItems: 100,
            settings: {
                autoClearDays: 0,
                excludeDuplicates: true,
                enableMonitoring: false,
            },

            addItem: (content, type, metadata) => set((state) => {
                // Check for duplicates if enabled
                if (state.settings.excludeDuplicates) {
                    const lastItem = state.items[0];
                    if (lastItem && lastItem.content === content) {
                        return state; // Don't add duplicate
                    }
                }

                const newItem: ClipboardItem = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    content,
                    type,
                    timestamp: Date.now(),
                    pinned: false,
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
        }),
        {
            name: 'clipboard-manager-storage',
        }
    )
);
