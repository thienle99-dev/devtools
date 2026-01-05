import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DashboardStore {
    toolUsageCount: Record<string, number>;
    lastUsed: Record<string, string>; // ISO strings for persistence
    totalUsageCount: number;

    incrementUsage: (toolId: string) => void;
    getMostUsed: (limit?: number) => { toolId: string; count: number }[];
    getUsageStats: () => {
        totalToolsUsed: number;
        totalUsageCount: number;
    };
}

export const useDashboardStore = create<DashboardStore>()(
    persist(
        (set, get) => ({
            toolUsageCount: {},
            lastUsed: {},
            totalUsageCount: 0,

            incrementUsage: (toolId: string) => {
                const now = new Date().toISOString();
                set((state) => {
                    const current = state.toolUsageCount[toolId] || 0;
                    return {
                        toolUsageCount: {
                            ...state.toolUsageCount,
                            [toolId]: current + 1,
                        },
                        lastUsed: {
                            ...state.lastUsed,
                            [toolId]: now,
                        },
                        totalUsageCount: state.totalUsageCount + 1,
                    };
                });
            },

            getMostUsed: (limit = 6) => {
                const { toolUsageCount } = get();
                return Object.entries(toolUsageCount)
                    .map(([toolId, count]) => ({ toolId, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, limit);
            },

            getUsageStats: () => {
                const { toolUsageCount, totalUsageCount } = get();
                const totalToolsUsed = Object.keys(toolUsageCount).length;
                return {
                    totalToolsUsed,
                    totalUsageCount,
                };
            },
        }),
        {
            name: 'antigravity-dashboard',
        }
    )
);


