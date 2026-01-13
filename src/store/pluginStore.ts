import { create } from 'zustand';
import type { InstalledPlugin } from '@/types/plugin';

interface PluginStore {
    activePlugins: InstalledPlugin[];
    isLoading: boolean;
    error: string | null;
    fetchActivePlugins: () => Promise<void>;
}

export const usePluginStore = create<PluginStore>((set) => ({
    activePlugins: [],
    isLoading: false,
    error: null,
    fetchActivePlugins: async () => {
        try {
            set({ isLoading: true });
            const installed = await window.pluginAPI.getInstalledPlugins();
            const active = installed.filter(p => p.active);
            set({ activePlugins: active, isLoading: false, error: null });
        } catch (error: any) {
            set({ error: error.message, isLoading: false });
        }
    }
}));
