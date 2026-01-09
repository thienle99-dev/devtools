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
    sidebarCollapsed: boolean;
    
    // Responsive settings
    autoCollapseSidebar: boolean;
    compactMode: boolean;
    adaptiveLayout: boolean;
    setSidebarOpen: (open: boolean) => void;

    // Notifications
    notificationsEnabled: boolean;
    notificationSound: boolean;
    toastDuration: number;
    notifyOnScanComplete: boolean;
    notifyOnCleanupComplete: boolean;
    notifyOnErrors: boolean;

    // Window & Behavior
    windowOpacity: number;
    alwaysOnTop: boolean;
    rememberWindowPosition: boolean;
    animationSpeed: 'fast' | 'normal' | 'slow';
    reduceMotion: boolean;

    // Performance
    enableAnimations: boolean;
    lazyLoading: boolean;
    memoryLimit: number; // MB
    backgroundProcessing: boolean;
    maxBackgroundTabs: number; // Maximum tabs that can run in background

    // Data Management
    autoBackup: boolean;
    backupRetentionDays: number;

    toolShortcuts: Record<string, string>;
    setToolShortcut: (toolId: string, shortcut: string | null) => void;

    setFontSize: (size: number) => void;
    setWordWrap: (wrap: boolean) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setMinimizeToTray: (value: boolean) => void;
    setStartMinimized: (value: boolean) => void;
    setLaunchAtLogin: (value: boolean) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleSidebar: () => void;
    
    // Responsive setters
    setAutoCollapseSidebar: (value: boolean) => void;
    setCompactMode: (value: boolean) => void;
    setAdaptiveLayout: (value: boolean) => void;

    // Notifications setters
    setNotificationsEnabled: (value: boolean) => void;
    setNotificationSound: (value: boolean) => void;
    setToastDuration: (duration: number) => void;
    setNotifyOnScanComplete: (value: boolean) => void;
    setNotifyOnCleanupComplete: (value: boolean) => void;
    setNotifyOnErrors: (value: boolean) => void;

    // Window & Behavior setters
    setWindowOpacity: (opacity: number) => void;
    setAlwaysOnTop: (value: boolean) => void;
    setRememberWindowPosition: (value: boolean) => void;
    setAnimationSpeed: (speed: 'fast' | 'normal' | 'slow') => void;
    setReduceMotion: (value: boolean) => void;

    // Performance setters
    setEnableAnimations: (value: boolean) => void;
    setLazyLoading: (value: boolean) => void;
    setMemoryLimit: (limit: number) => void;
    setBackgroundProcessing: (value: boolean) => void;
    setMaxBackgroundTabs: (max: number) => void;

    // Data Management setters
    setAutoBackup: (value: boolean) => void;
    setBackupRetentionDays: (days: number) => void;

    // Export/Import
    exportSettings: () => string;
    importSettings: (json: string) => boolean;
    resetToDefaults: () => void;
}

const defaultSettings = {
    fontSize: 14,
    wordWrap: true,
    theme: 'dark' as const,
    historyLimit: 50,
    minimizeToTray: true,
    startMinimized: false,
    launchAtLogin: false,
    sidebarCollapsed: false,
    toolShortcuts: {},
    
    // Responsive defaults
    autoCollapseSidebar: true,
    compactMode: false,
    adaptiveLayout: true,

    // Notifications
    notificationsEnabled: true,
    notificationSound: false,
    toastDuration: 3000,
    notifyOnScanComplete: true,
    notifyOnCleanupComplete: true,
    notifyOnErrors: true,

    // Window & Behavior
    windowOpacity: 1.0,
    alwaysOnTop: false,
    rememberWindowPosition: true,
    animationSpeed: 'normal' as const,
    reduceMotion: false,

    // Performance
    enableAnimations: true,
    lazyLoading: true,
    memoryLimit: 512,
    backgroundProcessing: true,
    maxBackgroundTabs: 5, // Default: allow up to 5 tabs

    // Data Management
    autoBackup: true,
    backupRetentionDays: 30,
};

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set, get) => ({
            ...defaultSettings,

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
            setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            setSidebarOpen: (open) => set({ sidebarCollapsed: !open }),
            
            // Responsive setters
            setAutoCollapseSidebar: (autoCollapseSidebar) => set({ autoCollapseSidebar }),
            setCompactMode: (compactMode) => set({ compactMode }),
            setAdaptiveLayout: (adaptiveLayout) => set({ adaptiveLayout }),

            // Notifications setters
            setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
            setNotificationSound: (notificationSound) => set({ notificationSound }),
            setToastDuration: (toastDuration) => set({ toastDuration }),
            setNotifyOnScanComplete: (notifyOnScanComplete) => set({ notifyOnScanComplete }),
            setNotifyOnCleanupComplete: (notifyOnCleanupComplete) => set({ notifyOnCleanupComplete }),
            setNotifyOnErrors: (notifyOnErrors) => set({ notifyOnErrors }),

            // Window & Behavior setters
            setWindowOpacity: (windowOpacity) => {
                set({ windowOpacity });
                // Sync with main process if needed
                (window as any).ipcRenderer?.send('window-set-opacity', windowOpacity);
            },
            setAlwaysOnTop: (alwaysOnTop) => {
                set({ alwaysOnTop });
                (window as any).ipcRenderer?.send('window-set-always-on-top', alwaysOnTop);
            },
            setRememberWindowPosition: (rememberWindowPosition) => set({ rememberWindowPosition }),
            setAnimationSpeed: (animationSpeed) => set({ animationSpeed }),
            setReduceMotion: (reduceMotion) => set({ reduceMotion }),

            // Performance setters
            setEnableAnimations: (enableAnimations) => set({ enableAnimations }),
            setLazyLoading: (lazyLoading) => set({ lazyLoading }),
            setMemoryLimit: (memoryLimit) => set({ memoryLimit }),
            setBackgroundProcessing: (backgroundProcessing) => set({ backgroundProcessing }),
            setMaxBackgroundTabs: (maxBackgroundTabs) => set({ maxBackgroundTabs }),

            // Data Management setters
            setAutoBackup: (autoBackup) => set({ autoBackup }),
            setBackupRetentionDays: (backupRetentionDays) => set({ backupRetentionDays }),

            // Export/Import
            exportSettings: () => {
                const state = get();
                const exportData = {
                    ...state,
                    toolShortcuts: state.toolShortcuts,
                    exportedAt: new Date().toISOString(),
                    version: '1.0',
                };
                return JSON.stringify(exportData, null, 2);
            },
            importSettings: (json: string) => {
                try {
                    const data = JSON.parse(json);
                    // Validate and import
                    const {
                        fontSize, wordWrap, theme, historyLimit,
                        minimizeToTray, startMinimized, launchAtLogin, sidebarCollapsed,
                        notificationsEnabled, notificationSound, toastDuration,
                        notifyOnScanComplete, notifyOnCleanupComplete, notifyOnErrors,
                        windowOpacity, alwaysOnTop, rememberWindowPosition,
                        animationSpeed, reduceMotion,
                        enableAnimations, lazyLoading, memoryLimit, backgroundProcessing, maxBackgroundTabs,
                        autoBackup, backupRetentionDays,
                        toolShortcuts,
                        autoCollapseSidebar, compactMode, adaptiveLayout,
                    } = data;

                    set({
                        fontSize: fontSize ?? defaultSettings.fontSize,
                        wordWrap: wordWrap ?? defaultSettings.wordWrap,
                        theme: theme ?? defaultSettings.theme,
                        historyLimit: historyLimit ?? defaultSettings.historyLimit,
                        minimizeToTray: minimizeToTray ?? defaultSettings.minimizeToTray,
                        startMinimized: startMinimized ?? defaultSettings.startMinimized,
                        launchAtLogin: launchAtLogin ?? defaultSettings.launchAtLogin,
                        sidebarCollapsed: sidebarCollapsed ?? defaultSettings.sidebarCollapsed,
                        notificationsEnabled: notificationsEnabled ?? defaultSettings.notificationsEnabled,
                        notificationSound: notificationSound ?? defaultSettings.notificationSound,
                        toastDuration: toastDuration ?? defaultSettings.toastDuration,
                        notifyOnScanComplete: notifyOnScanComplete ?? defaultSettings.notifyOnScanComplete,
                        notifyOnCleanupComplete: notifyOnCleanupComplete ?? defaultSettings.notifyOnCleanupComplete,
                        notifyOnErrors: notifyOnErrors ?? defaultSettings.notifyOnErrors,
                        windowOpacity: windowOpacity ?? defaultSettings.windowOpacity,
                        alwaysOnTop: alwaysOnTop ?? defaultSettings.alwaysOnTop,
                        rememberWindowPosition: rememberWindowPosition ?? defaultSettings.rememberWindowPosition,
                        animationSpeed: animationSpeed ?? defaultSettings.animationSpeed,
                        reduceMotion: reduceMotion ?? defaultSettings.reduceMotion,
                        enableAnimations: enableAnimations ?? defaultSettings.enableAnimations,
                        lazyLoading: lazyLoading ?? defaultSettings.lazyLoading,
                        memoryLimit: memoryLimit ?? defaultSettings.memoryLimit,
                        backgroundProcessing: backgroundProcessing ?? defaultSettings.backgroundProcessing,
                        maxBackgroundTabs: maxBackgroundTabs ?? defaultSettings.maxBackgroundTabs,
                        autoBackup: autoBackup ?? defaultSettings.autoBackup,
                        backupRetentionDays: backupRetentionDays ?? defaultSettings.backupRetentionDays,
                        toolShortcuts: toolShortcuts ?? defaultSettings.toolShortcuts,
                        autoCollapseSidebar: autoCollapseSidebar ?? defaultSettings.autoCollapseSidebar,
                        compactMode: compactMode ?? defaultSettings.compactMode,
                        adaptiveLayout: adaptiveLayout ?? defaultSettings.adaptiveLayout,
                    });

                    return true;
                } catch (error) {
                    console.error('Failed to import settings:', error);
                    return false;
                }
            },
            resetToDefaults: () => {
                set(defaultSettings);
            },
        }),
        {
            name: 'antigravity-settings',
        }
    )
);
