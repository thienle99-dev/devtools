import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useDashboardStore } from './dashboardStore';

interface ToolHistoryEntry {
    id: string;
    timestamp: number;
    input: string;
    output: string;
    options: Record<string, any>;
}

interface Preset {
    id: string;
    name: string;
    input: string;
    options: Record<string, any>;
}

interface ToolData {
    id: string;
    input: string;
    output: string;
    options: Record<string, any>;
    history: ToolHistoryEntry[];
    layout?: 'vertical' | 'horizontal';
    meta?: Record<string, any>;
}

interface HistoryItem {
    id: string;
    timestamp: number;
}

interface ToolStore {
    tools: Record<string, ToolData>;
    history: HistoryItem[]; // Global recents
    favorites: string[]; // Favorite tool IDs
    presets: Record<string, Preset[]>; // toolId -> presets

    setToolData: (id: string, data: Partial<ToolData>) => void;
    clearToolData: (id: string) => void;
    addToHistory: (id: string) => void;
    clearHistory: () => void;
    removeToolData: (id: string) => void;

    // Per-tool history
    addToolHistoryEntry: (id: string, entry: Omit<ToolHistoryEntry, 'id' | 'timestamp'>) => void;
    clearToolHistory: (id: string) => void;

    // Presets
    savePreset: (toolId: string, name: string) => void;
    deletePreset: (toolId: string, presetId: string) => void;
    loadPreset: (toolId: string, presetId: string) => void;

    toggleFavorite: (toolId: string) => void;
}

export const useToolStore = create<ToolStore>()(
    persist(
        (set, get) => ({
            tools: {},
            history: [],
            favorites: [],
            presets: {},

            setToolData: (id, data) => set((state) => {
                const existing = state.tools[id] || {
                    id,
                    input: '',
                    output: '',
                    options: {},
                    history: [],
                };

                return {
                    tools: {
                        ...state.tools,
                        [id]: {
                            ...existing,
                            ...data,
                        } as ToolData
                    }
                };
            }),

            clearToolData: (id) => set((state) => ({
                tools: {
                    ...state.tools,
                    [id]: {
                        id,
                        input: '',
                        output: '',
                        options: state.tools[id]?.options || {},
                        history: state.tools[id]?.history || [],
                    }
                }
            })),

            addToHistory: (id) => {
                set((state) => {
                    const newItem = { id, timestamp: Date.now() };
                    const filteredHistory = state.history.filter(h => h.id !== id);
                    return {
                        history: [newItem, ...filteredHistory].slice(0, 50)
                    };
                });

                try {
                    const incrementUsage = useDashboardStore.getState().incrementUsage;
                    incrementUsage(id);
                } catch {
                }
            },

            clearHistory: () => set({ history: [] }),

            removeToolData: (id) => set((state) => {
                const newTools = { ...state.tools };
                delete newTools[id];
                return { tools: newTools };
            }),

            addToolHistoryEntry: (id, entry) => set((state) => {
                const tool = state.tools[id] || { id, input: '', output: '', options: {}, history: [] };
                const newEntry: ToolHistoryEntry = {
                    ...entry,
                    id: Math.random().toString(36).substring(7),
                    timestamp: Date.now(),
                };
                return {
                    tools: {
                        ...state.tools,
                        [id]: {
                            ...tool,
                            history: [newEntry, ...tool.history].slice(0, 50)
                        }
                    }
                };
            }),

            clearToolHistory: (id) => set((state) => ({
                tools: {
                    ...state.tools,
                    [id]: {
                        ...(state.tools[id] || { id, input: '', output: '', options: {}, history: [] }),
                        history: []
                    }
                }
            })),

            savePreset: (toolId, name) => set((state) => {
                const tool = state.tools[toolId];
                if (!tool) return state;

                const newPreset: Preset = {
                    id: Math.random().toString(36).substring(7),
                    name,
                    input: tool.input,
                    options: tool.options
                };

                const existingPresets = state.presets[toolId] || [];
                return {
                    presets: {
                        ...state.presets,
                        [toolId]: [...existingPresets, newPreset]
                    }
                };
            }),

            deletePreset: (toolId, presetId) => set((state) => ({
                presets: {
                    ...state.presets,
                    [toolId]: (state.presets[toolId] || []).filter(p => p.id !== presetId)
                }
            })),

            loadPreset: (toolId, presetId) => {
                const state = get();
                const preset = (state.presets[toolId] || []).find(p => p.id === presetId);
                if (preset) {
                    state.setToolData(toolId, {
                        input: preset.input,
                        options: preset.options
                    });
                }
            },

            toggleFavorite: (toolId) => set((state) => {
                const isFavorite = state.favorites.includes(toolId);
                return {
                    favorites: isFavorite
                        ? state.favorites.filter(id => id !== toolId)
                        : [...state.favorites, toolId],
                };
            }),
        }),
        {
            name: 'antigravity-tool-storage',
        }
    )
);

const EMPTY_ARRAY: any[] = [];

export const useToolState = (id: string) => {
    // Get data - this will only re-render when this specific tool's data changes
    const data = useToolStore((state) => state.tools[id]);

    // Get actions separately - Zustand actions are stable references
    const setToolData = useToolStore((state) => state.setToolData);
    const clearToolData = useToolStore((state) => state.clearToolData);
    const addToHistory = useToolStore((state) => state.addToHistory);
    const removeToolData = useToolStore((state) => state.removeToolData);
    const addToolHistoryEntry = useToolStore((state) => state.addToolHistoryEntry);
    const clearToolHistory = useToolStore((state) => state.clearToolHistory);
    const savePreset = useToolStore((state) => state.savePreset);
    const deletePreset = useToolStore((state) => state.deletePreset);
    const loadPreset = useToolStore((state) => state.loadPreset);
    const presets = useToolStore((state) => state.presets[id] || EMPTY_ARRAY);

    return {
        data,
        presets,
        setToolData,
        clearToolData,
        addToHistory,
        removeToolData,
        addToolHistoryEntry,
        clearToolHistory,
        savePreset,
        deletePreset,
        loadPreset,
    };
};
