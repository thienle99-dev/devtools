/// <reference types="vite/client" />

declare module 'composerize';

interface Window {
    ipcRenderer: {
        on(channel: string, listener: (event: any, ...args: any[]) => void): any;
        off(channel: string, ...args: any[]): any;
        send(channel: string, ...args: any[]): void;
        invoke(channel: string, ...args: any[]): Promise<any>;
        process: {
            platform: string;
        };
        tray: {
            updateMenu: (items: any[]) => void;
        };
        system: {
            getHomeDir: () => Promise<string>;
            selectFolder: () => Promise<{ canceled: boolean; path: string | null }>;
            getInfo: () => Promise<any>;
            getDiskStats: () => Promise<any>;
            getGpuStats: () => Promise<any>;
            getBatteryStats: () => Promise<any>;
            getSensorStats: () => Promise<any>;
            getBluetoothStats: () => Promise<any>;
            getTimezonesStats: () => Promise<any>;
        };

        pluginAPI: import('./types/plugin').PluginAPI;
        bcryptAPI: {
            hash: (text: string, rounds?: number) => Promise<string>;
            compare: (text: string, hash: string) => Promise<boolean>;
        };
        zipAPI: {
            extract: (zipPath: string, targetPath: string) => Promise<{ success: boolean; error?: string }>;
            create: (sourcePath: string, targetPath: string) => Promise<{ success: boolean; error?: string }>;
        };
        cleanerAPI: {
            getPlatform: () => Promise<any>;
            scanJunk: () => Promise<any>;
            getSpaceLens: (path: string) => Promise<void>;
            getFolderSize: (path: string) => Promise<any>;
            clearSizeCache: (path?: string) => Promise<any>;
            getPerformanceData: () => Promise<any>;
            getStartupItems: () => Promise<any>;
            toggleStartupItem: (item: any) => Promise<any>;
            killProcess: (pid: number) => Promise<any>;
            getInstalledApps: () => Promise<any>;
            getLargeFiles: (options: any) => Promise<any>;
            getDuplicates: (path: string) => Promise<any>;
            runCleanup: (files: string[]) => Promise<any>;
            freeRam: () => Promise<any>;
            uninstallApp: (app: any) => Promise<any>;
            scanPrivacy: () => Promise<any>;
            cleanPrivacy: (options: any) => Promise<any>;
            onSpaceLensProgress: (callback: (progress: any) => void) => () => void;
        };
        appManagerAPI: {
            getInstalledApps: () => Promise<any>;
            getRunningProcesses: () => Promise<any>;
            uninstallApp: (app: any) => Promise<any>;
            killProcess: (pid: number) => Promise<any>;
        };
    };
    screenshotAPI: {
        getSources: () => Promise<any[]>;
        captureScreen: () => Promise<any>;
        captureWindow: (sourceId: string) => Promise<any>;
        captureArea: () => Promise<any>;
        captureUrl: (url: string) => Promise<any>;
        saveFile: (dataUrl: string, options: any) => Promise<any>;
    };
    permissionsAPI: {
        checkAll: () => Promise<any>;
        checkAccessibility: () => Promise<boolean>;
        checkFullDiskAccess: () => Promise<boolean>;
        checkScreenRecording: () => Promise<boolean>;
        testClipboard: () => Promise<boolean>;
        testFileAccess: () => Promise<boolean>;
        openSystemPreferences: (type?: string) => Promise<void>;
    };
    electronAPI: {
        sendSelection: (bounds: any) => Promise<void>;
        cancelSelection: () => Promise<void>;
    };
    pluginAPI: {
        getAvailablePlugins: () => Promise<any[]>;
        getInstalledPlugins: () => Promise<any[]>;
        installPlugin: (id: string) => Promise<any>;
        uninstallPlugin: (id: string) => Promise<any>;
        togglePlugin: (id: string, active: boolean) => Promise<any>;
        updateRegistry: () => Promise<any>;
        onPluginProgress: (callback: (progress: any) => void) => () => void;
    };
    videoCompressorAPI: {
        getInfo: (path: string) => Promise<any>;
        generateThumbnail: (path: string) => Promise<string>;
        compress: (options: any) => Promise<any>;
        cancel: (id: string) => Promise<void>;
        chooseInputFile: () => Promise<string | null>;
        openFile: (path: string) => Promise<void>;
        showInFolder: (path: string) => Promise<void>;
        onProgress: (callback: (progress: any) => void) => () => void;
    };
    downloadAPI: {
        getHistory: () => Promise<any[]>;
        getSettings: () => Promise<any>;
        saveSettings: (settings: any) => Promise<any>;
        create: (options: any) => Promise<any>;
        start: (id: string) => Promise<any>;
        pause: (id: string) => Promise<any>;
        resume: (id: string) => Promise<any>;
        cancel: (id: string) => Promise<any>;
        verifyChecksum: (id: string) => Promise<boolean>;
        openFolder: (path: string) => Promise<any>;
        clearHistory: () => Promise<any>;
        reorder: (startIndex: number, endIndex: number) => Promise<any>;
        saveHistory: (history: any[]) => Promise<any>;
        onAnyProgress: (callback: (progress: any) => void) => () => void;
        onStarted: (callback: (task: any) => void) => () => void;
        onCompleted: (callback: (task: any) => void) => () => void;
    };
    universalAPI: {
        getInfo: (url: string) => Promise<any>;
        download: (options: any) => Promise<any>;
        cancel: (id?: string) => Promise<any>;
        getHistory: () => Promise<any[]>;
        clearHistory: () => Promise<any>;
        removeFromHistory: (id: string) => Promise<any>;
        getSettings: () => Promise<any>;
        saveSettings: (settings: any) => Promise<any>;
        chooseFolder: () => Promise<any>;
        openFile: (path: string) => Promise<any>;
        showInFolder: (path: string) => Promise<any>;
        checkDiskSpace: (path?: string) => Promise<any>;
        getQueue: () => Promise<any[]>;
        pause: (id: string) => Promise<any>;
        resume: (id: string) => Promise<any>;
        reorderQueue: (id: string, newIndex: number) => Promise<any>;
        retry: (id: string) => Promise<any>;
        getPendingCount: () => Promise<number>;
        resumePending: () => Promise<any>;
        clearPending: () => Promise<any>;
        getErrorLog: (limit?: number) => Promise<any[]>;
        exportErrorLog: (format: 'json' | 'csv' | 'txt') => Promise<any>;
        getErrorStats: () => Promise<any>;
        clearErrorLog: (type: 'all' | 'resolved') => Promise<any>;
        onProgress: (callback: (progress: any) => void) => () => void;
    };
}
