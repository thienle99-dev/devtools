import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CleanerSettings {
    // General Settings
    autoBackup: boolean;
    autoScanOnLaunch: boolean;
    showPlatformBadge: boolean;
    theme: 'light' | 'dark' | 'auto';
    
    // Scan Settings
    defaultScanPath: string;
    minFileSize: number; // MB
    scanDepth: number;
    includeHiddenFiles: boolean;
    
    // Safety Settings
    safetyCheckEnabled: boolean;
    requireConfirmation: boolean;
    maxBackups: number;
    backupRetentionDays: number;
    
    // Performance Settings
    cacheEnabled: boolean;
    cacheTTL: number; // minutes
    maxCacheSize: number; // MB
    chunkSize: number; // files per batch
    
    // Notification Settings
    showNotifications: boolean;
    notifyOnScanComplete: boolean;
    notifyOnCleanupComplete: boolean;
    notifyOnErrors: boolean;
    
    // Advanced Settings
    enableDebugMode: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enableTelemetry: boolean;
    
    // UI Settings
    defaultViewMode: 'grid' | 'list' | 'tree' | 'detail' | 'compact';
    showFilePaths: boolean;
    compactMode: boolean;
    
    // First Launch
    hasCompletedOnboarding: boolean;
    lastVersion: string;
}

export const defaultSettings: CleanerSettings = {
    autoBackup: true,
    autoScanOnLaunch: false,
    showPlatformBadge: true,
    theme: 'auto',
    
    defaultScanPath: '',
    minFileSize: 50,
    scanDepth: 10,
    includeHiddenFiles: false,
    
    safetyCheckEnabled: true,
    requireConfirmation: true,
    maxBackups: 10,
    backupRetentionDays: 30,
    
    cacheEnabled: true,
    cacheTTL: 10,
    maxCacheSize: 100,
    chunkSize: 20,
    
    showNotifications: true,
    notifyOnScanComplete: true,
    notifyOnCleanupComplete: true,
    notifyOnErrors: true,
    
    enableDebugMode: false,
    logLevel: 'info',
    enableTelemetry: false,
    
    defaultViewMode: 'grid',
    showFilePaths: true,
    compactMode: false,
    
    hasCompletedOnboarding: false,
    lastVersion: '1.0.0',
};

export interface SettingsState {
    settings: CleanerSettings;
    updateSetting: <K extends keyof CleanerSettings>(key: K, value: CleanerSettings[K]) => void;
    updateSettings: (updates: Partial<CleanerSettings>) => void;
    resetSettings: () => void;
    resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            settings: defaultSettings,
            
            updateSetting: (key, value) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        [key]: value,
                    },
                })),
            
            updateSettings: (updates) =>
                set((state) => ({
                    settings: {
                        ...state.settings,
                        ...updates,
                    },
                })),
            
            resetSettings: () =>
                set({
                    settings: defaultSettings,
                }),
            
            resetToDefaults: () =>
                set({
                    settings: defaultSettings,
                }),
        }),
        {
            name: 'system-cleaner-settings',
            version: 1,
        }
    )
);

