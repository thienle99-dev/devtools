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
    };
}
