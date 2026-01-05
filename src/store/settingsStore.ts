import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
    fontSize: number;
    wordWrap: boolean;
    theme: 'light' | 'dark' | 'system';
    historyLimit: number;
    minimizeToTray: boolean;
    startMinimized: boolean;
    launchAtLogin: boolean;

    toolShortcuts: Record<string, string>;
    setToolShortcut: (toolId: string, shortcut: string | null) => void;

    setFontSize: (size: number) => void;
    setWordWrap: (wrap: boolean) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setMinimizeToTray: (value: boolean) => void;
    setStartMinimized: (value: boolean) => void;
    setLaunchAtLogin: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            fontSize: 14,
            wordWrap: true,
            theme: 'dark',
            historyLimit: 50,
            minimizeToTray: true,
            startMinimized: false,
            launchAtLogin: false,
            toolShortcuts: {},

            setToolShortcut: (toolId, shortcut) => set((state) => {
                const newShortcuts = { ...state.toolShortcuts };
                if (shortcut) {
                    newShortcuts[toolId] = shortcut;
                } else {
                    delete newShortcuts[toolId];
                }
                return { toolShortcuts: newShortcuts };
            }),

            setFontSize: (fontSize) => set({ fontSize }),
            setWordWrap: (wordWrap) => set({ wordWrap }),
            setTheme: (theme) => set({ theme }),
            setMinimizeToTray: (minimizeToTray) => {
                set({ minimizeToTray });
                // Sync with electron store if possible, or main process reads from local storage via IPC?
                // Main process uses 'electron-store', this is 'zustand-persist'.
                // We need to sync them or just have main process read this value.
                // Actually, simpler: Use IPC to invoke 'store-set'
                (window as any).ipcRenderer?.invoke('store-set', 'minimizeToTray', minimizeToTray);
            },
            setStartMinimized: (startMinimized) => {
                set({ startMinimized });
                (window as any).ipcRenderer?.invoke('store-set', 'startMinimized', startMinimized);
            },
            setLaunchAtLogin: (launchAtLogin) => {
                set({ launchAtLogin });
                (window as any).ipcRenderer?.invoke('store-set', 'launchAtLogin', launchAtLogin);
            },
        }),
        {
            name: 'antigravity-settings',
        }
    )
);
