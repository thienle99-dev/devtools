import { create } from 'zustand';

export type Platform = 'windows' | 'macos' | 'linux';

export interface PlatformInfo {
    platform: Platform;
    version: string;
    architecture: 'x64' | 'arm64';
    isAdmin: boolean;
}

export interface FileInfo {
    path: string;
    size: number;
    type: string;
    lastAccessed: Date;
    category: 'cache' | 'log' | 'download' | 'junk' | 'language' | 'trash';
}

export interface JunkFileResult {
    cacheFiles: FileInfo[];
    logFiles: FileInfo[];
    brokenDownloads: FileInfo[];
    appJunk: any[];
    languageFiles: FileInfo[];
    trashBins: any[];
    totalSize: number;
    safeToDelete: boolean;
}

export interface MalwareResult {
    threats: any[];
    suspiciousApps: any[];
    scanType: 'quick' | 'normal' | 'deep';
    scanDuration: number;
}

export interface RAMStatus {
    used: number;
    total: number;
    percentage: number;
}

export interface SmartScanResult {
    junkFiles: JunkFileResult | null;
    malware: MalwareResult | null;
    ramStatus: RAMStatus | null;
    updates: any[];
    clutter: any | null;
    totalSpaceSavings: number;
    estimatedTime: number;
}

export interface SystemCleanerState {
    platformInfo: PlatformInfo | null;
    isScanning: boolean;
    scanProgress: number;
    scanStatus: string;
    results: SmartScanResult | null;
    
    // Actions
    setPlatformInfo: (info: PlatformInfo) => void;
    startScan: () => void;
    stopScan: () => void;
    setScanProgress: (progress: number, status: string) => void;
    setResults: (results: SmartScanResult) => void;
    clearResults: () => void;
}

export const useSystemCleanerStore = create<SystemCleanerState>((set) => ({
    platformInfo: null,
    isScanning: false,
    scanProgress: 0,
    scanStatus: 'Idle',
    results: null,

    setPlatformInfo: (platformInfo) => set({ platformInfo }),
    startScan: () => set({ isScanning: true, scanProgress: 0, scanStatus: 'Starting scan...' }),
    stopScan: () => set({ isScanning: false, scanStatus: 'Scan stopped' }),
    setScanProgress: (scanProgress, scanStatus) => set({ scanProgress, scanStatus }),
    setResults: (results) => set({ results, isScanning: false, scanProgress: 100, scanStatus: 'Scan complete' }),
    clearResults: () => set({ results: null, scanProgress: 0, scanStatus: 'Idle' }),
}));
