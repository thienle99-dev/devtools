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
        };
    };
    appManagerAPI?: {
        getInstalledApps: () => Promise<any[]>;
        getRunningProcesses: () => Promise<any[]>;
        uninstallApp: (app: any) => Promise<{ success: boolean; error?: string }>;
        killProcess: (pid: number) => Promise<{ success: boolean; error?: string }>;
    };
    tiktokAPI: {
        getInfo: (url: string) => Promise<any>;
        download: (options: any) => Promise<any>;
        cancel: (id?: string) => Promise<void>;
        getHistory: () => Promise<any[]>;
        clearHistory: () => Promise<void>;
        removeFromHistory: (id: string) => Promise<void>;
        getSettings: () => Promise<any>;
        saveSettings: (settings: any) => Promise<void>;
        chooseFolder: () => Promise<string | null>;
        onProgress: (callback: (progress: any) => void) => () => void;
        openFile: (path: string) => Promise<void>;
        showInFolder: (path: string) => Promise<void>;
    };
    universalAPI: {
        getInfo: (url: string) => Promise<any>;
        download: (options: any) => Promise<any>;
        cancel: (id?: string) => Promise<void>;
        getHistory: () => Promise<any[]>;
        clearHistory: () => Promise<void>;
        removeFromHistory: (id: string) => Promise<void>;
        getSettings: () => Promise<any>;
        saveSettings: (settings: any) => Promise<void>;
        chooseFolder: () => Promise<string | null>;
        onProgress: (callback: (progress: any) => void) => () => void;
        openFile: (path: string) => Promise<void>;
        showInFolder: (path: string) => Promise<void>;
        checkDiskSpace: (path?: string) => Promise<{ available: number; total: number; warning: boolean }>;
        getQueue: () => Promise<any[]>;
    };
    audioAPI: {
        getInfo: (filePath: string) => Promise<any>;
        extract: (options: any) => Promise<string>;
        cancel: (id: string) => Promise<void>;
        cancelAll: () => Promise<void>;
        chooseInputFile: () => Promise<string | null>;
        chooseInputFiles: () => Promise<string[]>;
        chooseOutputFolder: () => Promise<string | null>;
        onProgress: (callback: (progress: any) => void) => () => void;
        openFile: (path: string) => Promise<void>;
        showInFolder: (path: string) => Promise<void>;
    };
    videoMergerAPI: {
        getVideoInfo: (filePath: string) => Promise<any>;
        generateThumbnail: (filePath: string, time: number) => Promise<string>;
        generateFilmstrip: (filePath: string, duration: number, count?: number) => Promise<string[]>;
        extractWaveform: (filePath: string) => Promise<number[]>;
        merge: (options: any) => Promise<string>;
        createFromImages: (options: any) => Promise<string>;
        cancel: (id: string) => Promise<void>;
        chooseInputFiles: () => Promise<string[] | null>;
        onProgress: (callback: (progress: any) => void) => () => void;
        onFilmstripProgress: (callback: (progress: any) => void) => () => void;
        openFile: (path: string) => Promise<void>;
        showInFolder: (path: string) => Promise<void>;
    };
    downloadAPI: {
        getHistory: () => Promise<import('./types/network/download').DownloadTask[]>;
        getSettings: () => Promise<import('./types/network/download').DownloadSettings>;
        saveSettings: (settings: Partial<import('./types/network/download').DownloadSettings>) => Promise<void>;
        create: (options: { url: string, filename?: string }) => Promise<import('./types/network/download').DownloadTask>;
        start: (taskId: string) => Promise<void>;
        pause: (taskId: string) => Promise<void>;
        resume: (taskId: string) => Promise<void>;
        cancel: (taskId: string) => Promise<void>;
        openFolder: (filePath: string) => Promise<void>;
        clearHistory: () => Promise<void>;
        onProgress: (taskId: string, callback: (progress: import('./types/network/download').DownloadProgress) => void) => () => void;
        onAnyProgress: (callback: (progress: import('./types/network/download').DownloadProgress) => void) => () => void;
    };
}
