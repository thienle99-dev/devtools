import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ToolData {
    id: string;
    input: string;
    output: string;
    options: Record<string, any>;
    meta?: Record<string, any>;
}

interface ToolStore {
    tools: Record<string, ToolData>;
    history: string[]; // IDs of used tools

    setToolData: (id: string, data: Partial<ToolData>) => void;
    clearToolData: (id: string) => void;
    addToHistory: (id: string) => void;
    clearHistory: () => void;
    removeToolData: (id: string) => void;
}

export const useToolStore = create<ToolStore>()(
    persist(
        (set) => ({
            tools: {},
            history: [],

            setToolData: (id, data) => set((state) => {
                const existing = state.tools[id] || {
                    id,
                    input: '',
                    output: '',
                    options: {},
                };

                return {
                    tools: {
                        ...state.tools,
                        [id]: {
                            ...existing,
                            ...data,
                        }
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
                    }
                }
            })),

            addToHistory: (id) => set((state) => ({
                history: [id, ...state.history.filter(h => h !== id)].slice(0, 50)
            })),

            clearHistory: () => set({ history: [] }),

            removeToolData: (id) => set((state) => {
                const newTools = { ...state.tools };
                delete newTools[id];
                return { tools: newTools };
            }),
        }),
        {
            name: 'antigravity-tool-storage',
        }
    )
);

export const useToolState = (id: string) => {
    // Get data - this will only re-render when this specific tool's data changes
    const data = useToolStore((state) => state.tools[id]);
    
    // Get actions separately - Zustand actions are stable references
    // This prevents creating a new object on each render which causes infinite loops
    const setToolData = useToolStore((state) => state.setToolData);
    const clearToolData = useToolStore((state) => state.clearToolData);
    const addToHistory = useToolStore((state) => state.addToHistory);
    const removeToolData = useToolStore((state) => state.removeToolData);
    
    // Return object - actions are stable so this won't cause infinite loops
    return {
        data,
        setToolData,
        clearToolData,
        addToHistory,
        removeToolData
    };
};
