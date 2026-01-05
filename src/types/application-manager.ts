export interface InstalledApp {
    id: string;
    name: string;
    version?: string;
    publisher?: string;
    installDate?: string;
    installLocation?: string;
    size?: number; // bytes
    isSystemApp: boolean;
    icon?: string; // base64 or path
}

export interface RunningProcess {
    pid: number;
    name: string;
    cpu: number; // percentage
    memory: number; // bytes
    memoryPercent: number; // percentage
    started: string; // ISO date string
    user?: string;
    command?: string;
    path?: string;
}

export interface ProcessGroup {
    name: string;
    processes: RunningProcess[];
    totalCpu: number;
    totalMemory: number;
    totalMemoryPercent: number;
    count: number;
}

export type AppFilterType = 'all' | 'user' | 'system';

export interface AppManagerMetrics {
    totalApps: number;
    systemApps: number;
    userApps: number;
    totalProcesses: number;
    totalCpu: number;
    totalMemory: number;
    totalMemPercent: number;
}

