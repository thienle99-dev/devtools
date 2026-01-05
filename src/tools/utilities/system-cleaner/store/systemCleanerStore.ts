import { create } from 'zustand';

export type Platform = 'windows' | 'macos' | 'linux';

export interface PlatformInfo {
    platform: Platform;
    version: string;
    architecture: 'x64' | 'arm64';
    isAdmin: boolean;
}

export interface FileItem {
    name: string;
    path: string;
    size: number;
    sizeFormatted: string;
    category: string;
}

export interface JunkFileResult {
    items: FileItem[];
    totalSize: number;
    totalSizeFormatted: string;
    safeToDelete: boolean;
}

export interface LargeFile {
    name: string;
    path: string;
    size: number;
    sizeFormatted: string;
    lastAccessed: string | Date;
    type: string;
}

export interface DuplicateGroup {
    hash: string;
    size: number;
    sizeFormatted: string;
    totalWasted: number;
    totalWastedFormatted: string;
    files: string[];
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
    largeFiles: LargeFile[];
    duplicates: DuplicateGroup[];
    
    // Actions
    setPlatformInfo: (info: PlatformInfo) => void;
    startScan: () => void;
    stopScan: () => void;
    setScanProgress: (progress: number, status: string) => void;
    setResults: (results: SmartScanResult) => void;
    setLargeFiles: (files: LargeFile[]) => void;
    setDuplicates: (duplicates: DuplicateGroup[]) => void;
    clearResults: () => void;
}

export const useSystemCleanerStore = create<SystemCleanerState>((set) => ({
    platformInfo: null,
    isScanning: false,
    scanProgress: 0,
    scanStatus: 'Idle',
    results: null,
    largeFiles: [],
    duplicates: [],

    setPlatformInfo: (platformInfo) => set({ platformInfo }),
    startScan: () => set({ isScanning: true, scanProgress: 0, scanStatus: 'Starting scan...' }),
    stopScan: () => set({ isScanning: false, scanStatus: 'Scan stopped' }),
    setScanProgress: (scanProgress, scanStatus) => set({ scanProgress, scanStatus }),
    setResults: (results) => set({ results, isScanning: false, scanProgress: 100, scanStatus: 'Scan complete' }),
    setLargeFiles: (largeFiles) => set({ largeFiles }),
    setDuplicates: (duplicates) => set({ duplicates }),
    clearResults: () => set({ results: null, largeFiles: [], duplicates: [], scanProgress: 0, scanStatus: 'Idle' }),
}));
