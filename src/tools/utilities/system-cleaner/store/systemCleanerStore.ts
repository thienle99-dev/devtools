import { create } from 'zustand';
import type {
    PlatformInfo,
    SmartScanResult,
    SpaceLensNode,
    StartupItem,
    InstalledApp,
    PerformanceData,
    PrivacyScanResult,
    BrowserScanResult,
    WifiNetwork,
    BackupInfo,
    LargeFile,
    DuplicateGroup
} from '../types';

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
    browserData: BrowserScanResult | null;
    wifiNetworks: WifiNetwork[] | null;
    backups: BackupInfo[] | null;
    
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
    setBrowserData: (data: BrowserScanResult | null) => void;
    setWifiNetworks: (networks: WifiNetwork[] | null) => void;
    setBackups: (backups: BackupInfo[] | null) => void;
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
    browserData: null,
    wifiNetworks: null,
    backups: null,

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
    setBrowserData: (browserData) => set({ browserData }),
    setWifiNetworks: (wifiNetworks) => set({ wifiNetworks }),
    setBackups: (backups) => set({ backups }),
    clearResults: () => set({ 
        results: null, 
        largeFiles: [], 
        duplicates: [], 
        spaceLensData: null, 
        performanceData: null,
        startupItems: [],
        installedApps: [],
        privacyData: null,
        browserData: null,
        wifiNetworks: null,
        scanProgress: 0, 
        scanStatus: 'Idle' 
    }),
}));

// Re-export types for convenience
export type {
    Platform,
    PlatformInfo,
    FileItem,
    JunkFileResult,
    LargeFile,
    DuplicateGroup,
    MalwareResult,
    RAMStatus,
    SmartScanResult,
    SpaceLensNode,
    HeavyApp,
    StartupItem,
    InstalledApp,
    PerformanceData,
    PrivacyItem,
    PrivacyScanResult,
    BrowserScanResult,
    WifiNetwork,
    BackupInfo
} from '../types';
