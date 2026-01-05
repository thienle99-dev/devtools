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

export interface SpaceLensNode {
    name: string;
    path: string;
    size: number;
    sizeFormatted: string;
    type: 'dir' | 'file';
    children?: SpaceLensNode[];
}

export interface HeavyApp {
    pid: number;
    name: string;
    cpu: number;
    mem: number;
    user: string;
    path: string;
}

export interface StartupItem {
    name: string;
    path: string;
    type: string;
    location?: string;
    enabled?: boolean;
}

export interface InstalledApp {
    name: string;
    version?: string;
    path: string;
    size?: number;
    installDate?: string | Date;
    type: string;
}

export interface PerformanceData {
    heavyApps: HeavyApp[];
    memory: {
        total: number;
        used: number;
        percent: number;
    };
    cpuLoad: number;
}

export interface PrivacyItem {
    name: string;
    path: string;
    type: 'registry' | 'files';
    count: number;
    size: number;
    sizeFormatted?: string;
    files?: string[];
    description: string;
}

export interface PrivacyScanResult {
    registryEntries: PrivacyItem[];
    activityHistory: PrivacyItem[];
    spotlightHistory: PrivacyItem[];
    quickLookCache: PrivacyItem[];
    totalItems: number;
    totalSize: number;
}

export interface SystemCleanerState {
    platformInfo: PlatformInfo | null;
    isScanning: boolean;
    scanProgress: number;
    scanStatus: string;
    results: SmartScanResult | null;
    largeFiles: LargeFile[];
    duplicates: DuplicateGroup[];
    spaceLensData: SpaceLensNode | null;
    performanceData: PerformanceData | null;
    startupItems: StartupItem[];
    installedApps: InstalledApp[];
    privacyData: PrivacyScanResult | null;
    
    // Actions
    setPlatformInfo: (info: PlatformInfo) => void;
    startScan: () => void;
    stopScan: () => void;
    setScanProgress: (progress: number, status: string) => void;
    setResults: (results: SmartScanResult) => void;
    setLargeFiles: (files: LargeFile[]) => void;
    setDuplicates: (duplicates: DuplicateGroup[]) => void;
    setSpaceLensData: (data: SpaceLensNode | null) => void;
    setPerformanceData: (data: PerformanceData | null) => void;
    setStartupItems: (items: StartupItem[]) => void;
    setInstalledApps: (apps: InstalledApp[]) => void;
    setPrivacyData: (data: PrivacyScanResult | null) => void;
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
    spaceLensData: null,
    performanceData: null,
    startupItems: [],
    installedApps: [],
    privacyData: null,

    setPlatformInfo: (platformInfo) => set({ platformInfo }),
    startScan: () => set({ isScanning: true, scanProgress: 0, scanStatus: 'Starting scan...' }),
    stopScan: () => set({ isScanning: false, scanStatus: 'Scan stopped' }),
    setScanProgress: (scanProgress, scanStatus) => set({ scanProgress, scanStatus }),
    setResults: (results) => set({ results, isScanning: false, scanProgress: 100, scanStatus: 'Scan complete' }),
    setLargeFiles: (largeFiles) => set({ largeFiles }),
    setDuplicates: (duplicates) => set({ duplicates }),
    setSpaceLensData: (spaceLensData) => set({ spaceLensData }),
    setPerformanceData: (performanceData) => set({ performanceData }),
    setStartupItems: (startupItems) => set({ startupItems }),
    setInstalledApps: (installedApps) => set({ installedApps }),
    setPrivacyData: (privacyData) => set({ privacyData }),
    clearResults: () => set({ 
        results: null, 
        largeFiles: [], 
        duplicates: [], 
        spaceLensData: null, 
        performanceData: null,
        startupItems: [],
        installedApps: [],
        privacyData: null,
        scanProgress: 0, 
        scanStatus: 'Idle' 
    }),
}));
