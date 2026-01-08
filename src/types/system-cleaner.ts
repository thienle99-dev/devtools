/**
 * System Cleaner Type Definitions
 */

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
    threats: MalwareThreat[];
    suspiciousApps: SuspiciousApp[];
    scanType: 'quick' | 'normal' | 'deep';
    scanDuration: number;
}

export interface MalwareThreat {
    name: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    path: string;
    description?: string;
}

export interface SuspiciousApp {
    name: string;
    path: string;
    reason: string;
    riskLevel: 'low' | 'medium' | 'high';
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
    updates: SystemUpdate[];
    clutter: ClutterResult | null;
    totalSpaceSavings: number;
    estimatedTime: number;
}

export interface SystemUpdate {
    name: string;
    version: string;
    type: 'security' | 'feature' | 'bugfix';
    priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ClutterResult {
    items: ClutterItem[];
    totalSize: number;
    totalSizeFormatted: string;
}

export interface ClutterItem {
    name: string;
    path: string;
    size: number;
    sizeFormatted: string;
    category: string;
    lastUsed?: string | Date;
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

export interface BrowserData {
    name: string;
    totalSize: number;
    totalSizeFormatted: string;
    history?: { size: number; count: number };
    cookies?: { size: number; count: number };
    cache?: { size: number; count: number };
    downloads?: { size: number; count: number };
}

export interface BrowserScanResult {
    browsers: BrowserData[];
    totalSize: number;
    totalItems: number;
}

export interface WifiNetwork {
    name: string;
    hasPassword: boolean;
    security?: string;
    lastConnected?: string | Date;
}

export interface BackupInfo {
    id: string;
    timestamp: string | Date;
    files: string[];
    totalSize: number;
    location: string;
    platform: string;
}

export interface BackupResult {
    success: boolean;
    backupId?: string;
    backupInfo?: BackupInfo;
    error?: string;
}

export interface CleanupResult {
    success: boolean;
    freedSize: number;
    freedSizeFormatted?: string;
    deletedCount?: number;
    errors?: string[];
    error?: string;
}

export interface SafetyCheckResult {
    safe: boolean;
    blocked: string[];
    warnings: string[];
}

export interface MaintenanceTask {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    estimatedTime: string;
    requiresSudo: boolean;
}

export interface MaintenanceResult {
    success: boolean;
    output?: string;
    error?: string;
}

export interface HealthStatus {
    cpu?: number;
    ram?: {
        used: number;
        total: number;
        percentage: number;
    };
    disk?: {
        free: number;
        total: number;
        percentage: number;
    };
    battery?: {
        level: number;
        charging: boolean;
    };
    alerts?: HealthAlert[];
}

export interface HealthAlert {
    message: string;
    severity: 'info' | 'warning' | 'critical';
    action?: string;
}

export interface CleanerAPI {
    getPlatform: () => Promise<PlatformInfo>;
    scanJunk: () => Promise<{ success: boolean; result?: JunkFileResult; error?: string }>;
    getLargeFiles: (options: { minSize?: number }) => Promise<LargeFile[]>;
    getDuplicates: (scanPath?: string) => Promise<DuplicateGroup[]>;
    getSpaceLens: (scanPath?: string) => Promise<SpaceLensNode>;
    getPerformanceData: () => Promise<PerformanceData>;
    getStartupItems: () => Promise<StartupItem[]>;
    toggleStartupItem: (item: StartupItem) => Promise<{ success: boolean; enabled?: boolean; error?: string }>;
    killProcess: (pid: number) => Promise<{ success: boolean; error?: string }>;
    getInstalledApps: () => Promise<InstalledApp[]>;
    uninstallApp: (app: InstalledApp) => Promise<{ success: boolean; freedSizeFormatted?: string; error?: string }>;
    runCleanup: (files: string[]) => Promise<CleanupResult>;
    freeRam: () => Promise<{ success: boolean; ramFreed?: number; error?: string }>;
    scanPrivacy: () => Promise<{ success: boolean; results?: PrivacyScanResult; error?: string }>;
    cleanPrivacy: (options: Record<string, boolean>) => Promise<{ success: boolean; cleanedItems?: number; freedSizeFormatted?: string; errors?: string[] }>;
    scanBrowserData: () => Promise<{ success: boolean; results?: BrowserScanResult; error?: string }>;
    cleanBrowserData: (options: { browsers: string[]; types: string[] }) => Promise<{ success: boolean; cleanedItems?: number; freedSizeFormatted?: string; errors?: string[] }>;
    getWifiNetworks: () => Promise<{ success: boolean; networks?: WifiNetwork[]; error?: string }>;
    removeWifiNetwork: (networkName: string) => Promise<{ success: boolean; error?: string }>;
    onSpaceLensProgress: (callback: (progress: any) => void) => () => void;
    runMaintenance: (task: MaintenanceTask) => Promise<MaintenanceResult>;
    getHealthStatus: () => Promise<HealthStatus>;
    checkSafety: (files: string[]) => Promise<SafetyCheckResult>;
    createBackup: (files: string[]) => Promise<BackupResult>;
    listBackups: () => Promise<{ success: boolean; backups?: BackupInfo[]; error?: string }>;
    getBackupInfo: (backupId: string) => Promise<{ success: boolean; backupInfo?: BackupInfo; error?: string }>;
    restoreBackup: (backupId: string) => Promise<{ success: boolean; error?: string }>;
    deleteBackup: (backupId: string) => Promise<{ success: boolean; error?: string }>;
    startHealthMonitoring: () => Promise<void>;
    stopHealthMonitoring: () => Promise<void>;
    updateHealthTray: (data: HealthStatus) => void;
}
