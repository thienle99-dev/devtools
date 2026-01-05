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
    statsAPI?: {
        getCPUStats: () => Promise<any>;
        getMemoryStats: () => Promise<any>;
        getNetworkStats: () => Promise<any>;
        getDiskStats: () => Promise<any>;
        getGPUStats: () => Promise<any>;
        getBatteryStats: () => Promise<any>;
        getSensorStats: () => Promise<any>;
        getBluetoothStats: () => Promise<any>;
        getTimeZonesStats: () => Promise<any>;
    };
    cleanerAPI?: {
        getPlatform: () => Promise<any>;
        scanJunk: () => Promise<any>;
        getLargeFiles: (options: any) => Promise<any>;
        getDuplicates: (scanPath: string) => Promise<any>;
        getSpaceLens: (scanPath: string) => Promise<any>;
        getPerformanceData: () => Promise<any>;
        getStartupItems: () => Promise<any>;
        toggleStartupItem: (item: any) => Promise<any>;
        killProcess: (pid: number) => Promise<any>;
        getInstalledApps: () => Promise<any>;
        uninstallApp: (app: any) => Promise<any>;
        runCleanup: (files: string[]) => Promise<any>;
        freeRam: () => Promise<any>;
        scanPrivacy: () => Promise<any>;
        cleanPrivacy: (options: any) => Promise<any>;
        scanBrowserData: () => Promise<any>;
        cleanBrowserData: (options: any) => Promise<any>;
        getWifiNetworks: () => Promise<any>;
        removeWifiNetwork: (networkName: string) => Promise<any>;
        onSpaceLensProgress: (callback: (progress: any) => void) => () => void;
        runMaintenance: (task: any) => Promise<any>;
        getHealthStatus: () => Promise<any>;
        checkSafety: (files: string[]) => Promise<any>;
        createBackup: (files: string[]) => Promise<any>;
        listBackups: () => Promise<any>;
        getBackupInfo: (backupId: string) => Promise<any>;
        restoreBackup: (backupId: string) => Promise<any>;
        deleteBackup: (backupId: string) => Promise<any>;
        startHealthMonitoring: () => Promise<any>;
        stopHealthMonitoring: () => Promise<any>;
        updateHealthTray: (data: any) => void;
    };
}
