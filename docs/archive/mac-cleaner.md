# System Cleaner Tool - Specification

## Overview

A comprehensive cross-platform cleaning, protection, and optimization tool inspired by CleanMyMac and CCleaner, providing automated system maintenance, malware protection, and performance optimization for both Windows and macOS. The tool focuses on safety-first operations, low CPU impact, and modular architecture for easy customization and extension.

**Supported Platforms**: Windows 10/11, macOS 11+ (Big Sur and later)

## Tool Definition

```typescript
{
    id: 'system-cleaner',
    name: 'System Cleaner',
    path: '/system-cleaner',
    description: 'Comprehensive cross-platform cleaning, protection, and optimization suite',
    category: 'utilities',
    icon: Trash2, // from lucide-react
    keywords: ['cleaner', 'windows', 'macos', 'cleanup', 'optimization', 'malware', 'protection', 'maintenance', 'junk', 'duplicates', 'pc', 'system']
}
```

## Platform Detection

```typescript
type Platform = "windows" | "macos" | "linux";

interface PlatformInfo {
  platform: Platform;
  version: string;
  architecture: "x64" | "arm64";
  isAdmin: boolean;
}

// Platform-specific utilities
const getPlatformPaths = (platform: Platform): PlatformPaths => {
  if (platform === "windows") {
    return {
      userCache: path.join(process.env.APPDATA || "", "..", "Local"),
      systemCache: path.join(process.env.WINDIR || "", "Temp"),
      userLogs: path.join(process.env.APPDATA || "", "..", "Local", "Temp"),
      systemLogs: path.join(process.env.WINDIR || "", "Logs"),
      trashBin: path.join(
        process.env.USERPROFILE || "",
        "AppData",
        "Local",
        "Microsoft",
        "Windows",
        "RecycleBin"
      ),
      // ... more Windows paths
    };
  } else if (platform === "macos") {
    return {
      userCache: path.join(process.env.HOME || "", "Library", "Caches"),
      systemCache: "/Library/Caches",
      userLogs: path.join(process.env.HOME || "", "Library", "Logs"),
      systemLogs: "/var/log",
      trashBin: path.join(process.env.HOME || "", ".Trash"),
      // ... more macOS paths
    };
  }
};
```

## Core Modules

### Module 1: Cleanup

#### 1.1 Smart Scan/Care

**Purpose**: Automated comprehensive system scan combining multiple cleaning tasks

**Features**:

- **Unified Scan**: Combines 5 main tasks in one operation
  - Junk files detection
  - Malware scanning
  - RAM optimization
  - System updates check
  - Clutter identification
- **Customizable Actions**: User can select which tasks to include
- **Progress Tracking**: Real-time progress for each scan phase
- **Results Summary**: Detailed report of findings with space savings
- **One-Click Fix**: Apply all recommended fixes at once

**Implementation**:

```typescript
interface SmartScanResult {
  junkFiles: JunkFileResult;
  malware: MalwareResult;
  ramStatus: RAMStatus;
  updates: UpdateInfo[];
  clutter: ClutterResult;
  totalSpaceSavings: number;
  estimatedTime: number;
}

interface ScanOptions {
  includeJunk: boolean;
  includeMalware: boolean;
  includeRAM: boolean;
  includeUpdates: boolean;
  includeClutter: boolean;
  deepScan: boolean;
}
```

**Technical Requirements**:

- IPC communication with Electron main process
- Native macOS APIs for file system access
- Background worker threads for scanning
- Progress reporting via IPC events

#### 1.2 Junk/System Trash

**Purpose**: Remove unnecessary files and system junk

**Features**:

**Windows**:

- **Cache Cleanup**:
  - User cache (`%LOCALAPPDATA%`)
  - System cache (`%WINDIR%\Temp`)
  - Application-specific caches (`%APPDATA%`, `%LOCALAPPDATA%`)
  - Windows Update cache (`%WINDIR%\SoftwareDistribution\Download`)
  - Windows Store cache (`%LOCALAPPDATA%\Packages`)
- **Log Files**:
  - System logs (`%WINDIR%\Logs`)
  - Event Viewer logs
  - Application logs (`%APPDATA%`, `%LOCALAPPDATA%`)
  - Windows Error Reporting logs
- **Temporary Files**:
  - Temp folders (`%TEMP%`, `%TMP%`)
  - Windows temp files
  - Recent files cache
- **Application Junk**:
  - Browser caches (Chrome, Edge, Firefox)
  - Office temp files
  - Windows thumbnail cache
  - Windows icon cache
  - Windows prefetch files
- **Language Files**: Unused Windows language packs
- **Recycle Bin**: Empty recycle bin safely

**macOS**:

- **Cache Cleanup**:
  - User cache (`~/Library/Caches`)
  - System cache (`/Library/Caches`)
  - Application-specific caches
- **Log Files**:
  - System logs (`/var/log`)
  - User logs (`~/Library/Logs`)
  - Diagnostic reports
- **Application Junk**:
  - iTunes junk files
  - Mail attachments cache
  - Photos cache and thumbnails
  - Browser caches (Safari, Chrome, Firefox)
- **Language Files**: Unused localization files
- **Trash Bins**: Empty all trash bins safely

**Common**:

- **Broken Downloads**: Incomplete or corrupted downloads
- **Review Before Delete**: Show files before deletion
- **Safety Database**: Whitelist important files/folders

**Implementation**:

```typescript
interface JunkFileResult {
  cacheFiles: FileInfo[];
  logFiles: FileInfo[];
  brokenDownloads: FileInfo[];
  appJunk: AppJunkInfo[];
  languageFiles: FileInfo[];
  trashBins: TrashBinInfo[];
  totalSize: number;
  safeToDelete: boolean;
}

interface FileInfo {
  path: string;
  size: number;
  type: string;
  lastAccessed: Date;
  category: "cache" | "log" | "download" | "junk" | "language" | "trash";
}
```

**Technical Requirements**:

- File system scanning with `fs` module
- Size calculation for large directories
- Safety checks against whitelist
- Batch deletion with progress tracking

#### 1.3 Large/Old Files & Duplicates

**Purpose**: Identify and manage large files, old files, and duplicates

**Features**:

- **Large Files Finder**:
  - Configurable size threshold (e.g., >100MB, >500MB, >1GB)
  - Sort by size, date, type
  - Filter by location, extension, age
- **Old Files Finder**:
  - Files not accessed in X days/months/years
  - Configurable time thresholds
- **Duplicate Finder**:
  - Content-based duplicate detection (MD5/SHA256)
  - Name-based duplicates
  - Similar images (optional)
  - Smart selection (keep newest, keep in specific location)
- **Space Lens**:
  - Visual bubble chart showing disk usage
  - Interactive exploration of folder sizes
  - Color-coded by file type
  - Drill-down navigation

**Implementation**:

```typescript
interface LargeFileResult {
  files: FileInfo[];
  totalSize: number;
  threshold: number;
}

interface DuplicateResult {
  groups: DuplicateGroup[];
  totalWastedSpace: number;
}

interface DuplicateGroup {
  files: FileInfo[];
  size: number;
  recommendedKeep: FileInfo; // Smart selection
}

interface SpaceLensNode {
  path: string;
  size: number;
  children: SpaceLensNode[];
  type: "file" | "directory";
  color: string;
}
```

**Technical Requirements**:

- Recursive directory scanning
- Hash calculation for duplicates (with progress)
- Tree structure for Space Lens
- Efficient algorithms for large file systems

#### 1.4 Cloud Cleanup

**Purpose**: Clean up cloud storage files while maintaining backups

**Features**:

**Windows**:

- **OneDrive Cleanup**:
  - Scan OneDrive folder (`%USERPROFILE%\OneDrive`)
  - Remove local copies of synced files
  - Free up space (Files On-Demand)
- **Google Drive Cleanup**:
  - Scan Google Drive folder
  - Remove local copies of synced files
- **Dropbox Cleanup**:
  - Scan Dropbox folder
  - Remove local copies of synced files

**macOS**:

- **iCloud Drive Cleanup**:
  - Scan `~/Library/Mobile Documents`
  - Identify files already synced
  - Remove local copies (keep cloud backup)
- **Google Drive Cleanup**:
  - Scan Google Drive folder
  - Remove local copies of synced files
- **OneDrive Cleanup**:
  - Scan OneDrive folder
  - Remove local copies of synced files

**Common**:

- **Safety Checks**: Verify cloud sync status before deletion
- **Selective Cleanup**: Choose specific folders/files
- **Sync Status Detection**: Check if files are fully synced before deletion

**Implementation**:

```typescript
interface CloudCleanupResult {
  iCloudFiles: CloudFileInfo[];
  googleDriveFiles: CloudFileInfo[];
  oneDriveFiles: CloudFileInfo[];
  totalSpaceSavings: number;
}

interface CloudFileInfo {
  path: string;
  size: number;
  syncStatus: "synced" | "syncing" | "error";
  lastSynced: Date;
  safeToDelete: boolean;
}
```

**Technical Requirements**:

- Cloud service API integration (optional)
- File system monitoring for sync status
- Safety verification before deletion

### Module 2: Protection

#### 2.1 Malware Removal

**Purpose**: Detect and remove malware, adware, and threats

**Features**:

- **Moonlock Engine** (or similar):
  - Quick scan (common locations)
  - Normal scan (system-wide)
  - Deep scan (thorough analysis)
- **Threat Detection**:
  - 99% detection rate for adware
  - Ransomware detection
  - macOS-specific threats
  - Browser hijackers
- **App Permission Control**:
  - Monitor app permissions
  - Detect suspicious permissions
  - Revoke unnecessary permissions
- **Quarantine**: Isolate threats before removal
- **Threat Database**: Regular updates

**Implementation**:

```typescript
interface MalwareScanResult {
  threats: ThreatInfo[];
  suspiciousApps: AppInfo[];
  scanType: "quick" | "normal" | "deep";
  scanDuration: number;
}

interface ThreatInfo {
  name: string;
  type: "adware" | "ransomware" | "trojan" | "spyware" | "other";
  severity: "low" | "medium" | "high" | "critical";
  location: string;
  description: string;
  removalAction: "quarantine" | "delete" | "repair";
}

interface AppInfo {
  name: string;
  path: string;
  permissions: PermissionInfo[];
  riskLevel: "safe" | "suspicious" | "dangerous";
}
```

**Technical Requirements**:

- Malware signature database
- Heuristic analysis
- System integrity checks
- Safe removal procedures

#### 2.2 Privacy Tools

**Purpose**: Protect user privacy by cleaning sensitive data

**Features**:

**Windows**:

- **Browser Data Cleanup**:
  - History (Edge, Chrome, Firefox)
  - Cookies and site data
  - Cache files
  - Download history
  - Form data
  - Saved passwords (optional)
- **Windows Privacy**:
  - Activity history
  - Location history
  - Cortana data
  - Windows Search history
  - Recent files list
  - Jump lists
  - Thumbnail cache
- **Wi-Fi Networks**:
  - Remove old/forgotten networks
  - Clear network passwords (via netsh)
- **Registry Cleanup**:
  - Recent documents registry entries
  - Recent programs registry entries
  - MRU (Most Recently Used) lists

**macOS**:

- **Browser Data Cleanup**:
  - History (Safari, Chrome, Firefox, Edge)
  - Cookies and site data
  - Cache files
  - Download history
  - Form data
  - Saved passwords (optional)
- **Wi-Fi Networks**:
  - Remove old/forgotten networks
  - Clear network passwords
- **Private Files**:
  - Recently opened files
  - Spotlight search history
  - Quick Look cache
  - Recent items

**Common**:

- **Selective Cleaning**: Choose what to clean
- **Secure Deletion**: Overwrite deleted files (optional)

**Implementation**:

```typescript
interface PrivacyCleanupResult {
  browserData: BrowserDataResult;
  wifiNetworks: WifiNetworkInfo[];
  privateFiles: PrivateFileInfo[];
  totalItemsRemoved: number;
}

interface BrowserDataResult {
  history: number;
  cookies: number;
  cache: number;
  downloads: number;
  forms: number;
  browsers: string[];
}
```

**Technical Requirements**:

- Browser database access (SQLite)
- System preferences access
- Secure deletion methods

### Module 3: Optimization/Performance

#### 3.1 App Management

**Purpose**: Manage applications efficiently

**Features**:

**Windows**:

- **Uninstaller**:
  - Complete app removal via Windows Installer
  - Registry cleanup (uninstall registry entries)
  - Leftover files in Program Files, AppData
  - Start menu shortcuts
  - Desktop shortcuts
  - Windows Store app removal
- **Bulk Updater**:
  - Check for app updates
  - Update multiple apps at once
  - Windows Store apps
  - Chocolatey/Winget integration
- **App Reset**:
  - Reset Windows Store apps
  - Clear app data
  - Reset app permissions
- **Startup Management**:
  - View startup programs (Task Manager, Registry, Startup folder)
  - Enable/disable startup items
  - Remove unnecessary startup items
  - Services management
- **Background Items**:
  - Monitor background processes
  - Disable unnecessary background apps
  - Windows background apps settings

**macOS**:

- **Uninstaller**:
  - Complete app removal (app + leftovers)
  - Preference Panes removal
  - Application Support files
  - Caches and logs
  - Launch Agents/Daemons
- **Bulk Updater**:
  - Check for app updates
  - Update multiple apps at once
  - App Store and non-App Store apps
- **App Reset**:
  - Reset app to default settings
  - Clear app data
- **Login Items Management**:
  - View startup items
  - Enable/disable items
  - Remove unnecessary items
- **Background Items**:
  - Monitor background processes
  - Disable unnecessary background items

**Common**:

- **App Size Analysis**: Show app sizes and disk usage
- **App Usage Statistics**: Track app usage patterns

**Implementation**:

```typescript
interface AppInfo {
  name: string;
  bundleId: string;
  version: string;
  path: string;
  size: number;
  leftOverFiles: string[];
  updateAvailable: boolean;
  updateVersion?: string;
  loginItem: boolean;
  backgroundItem: boolean;
}

interface UninstallResult {
  appRemoved: boolean;
  leftOversRemoved: string[];
  spaceFreed: number;
}
```

**Technical Requirements**:

- Application bundle analysis
- Leftover file detection
- Update checking APIs
- Launch Services integration

#### 3.2 Speed Tools

**Purpose**: Improve system performance

**Features**:

**Windows**:

- **Free Up RAM**:
  - Identify memory-hungry processes
  - Clear standby memory
  - Empty working sets
  - Memory pressure relief
- **Disk Cleanup**:
  - Disk Cleanup utility integration
  - Clear Windows Update files
  - Clear system restore points (old)
  - Clear Windows.old folder
- **Speed Test**:
  - Disk read/write speed (CrystalDiskMark style)
  - Network speed
  - System performance benchmark
- **Heavy Apps Monitor**:
  - Real-time CPU usage
  - Memory usage per app
  - Disk I/O per process
  - Kill heavy processes
- **System Optimization**:
  - Disable unnecessary Windows services
  - Optimize startup programs
  - Defragment registry (if needed)
  - Optimize virtual memory

**macOS**:

- **Free Up RAM**:
  - Identify memory-hungry processes
  - Clear inactive memory
  - Memory pressure relief
- **Purgeable Space**:
  - Clear purgeable disk space
  - Optimize storage
- **Speed Test**:
  - Disk read/write speed
  - Network speed
  - System performance benchmark
- **Heavy Apps Monitor**:
  - Real-time CPU usage
  - Memory usage per app
  - Energy impact
  - Kill heavy processes

**Common**:

- **System Info**:
  - Uptime tracking
  - Temperature monitoring (if available)
  - System load average
  - Disk health status

**Implementation**:

```typescript
interface SpeedToolsResult {
  ramFreed: number;
  purgeableSpace: number;
  speedTest: SpeedTestResult;
  heavyApps: ProcessInfo[];
  systemInfo: SystemInfo;
}

interface ProcessInfo {
  name: string;
  pid: number;
  cpuUsage: number;
  memoryUsage: number;
  energyImpact: number;
}

interface SystemInfo {
  uptime: number;
  temperature: number;
  loadAverage: number[];
}
```

**Technical Requirements**:

- System metrics APIs
- Process management
- Performance monitoring

#### 3.3 Health Monitor

**Purpose**: Continuous system health monitoring

**Features**:

- **Menu Bar Widget**:
  - CPU usage indicator
  - RAM usage indicator
  - Battery status (if applicable)
  - Free disk space
  - Quick actions
- **Alerts**:
  - Low disk space warnings
  - Frozen app detection
  - Large trash bin alerts
  - High CPU usage alerts
  - Memory pressure warnings
- **Notifications**: System notifications for critical issues
- **Dashboard**: Detailed health metrics view

**Implementation**:

```typescript
interface HealthStatus {
  cpu: number;
  ram: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    free: number;
    total: number;
    percentage: number;
  };
  battery?: {
    level: number;
    charging: boolean;
  };
  alerts: Alert[];
}

interface Alert {
  type:
    | "low_space"
    | "frozen_app"
    | "large_trash"
    | "high_cpu"
    | "memory_pressure";
  severity: "info" | "warning" | "critical";
  message: string;
  action?: string;
}
```

**Technical Requirements**:

- System tray integration
- Real-time monitoring
- Alert system
- Notification APIs

### Module 4: Maintenance

#### 4.1 Scripts & Tasks

**Purpose**: Automated maintenance tasks

**Features**:

**Windows**:

- **Periodic Scripts**:
  - Run maintenance scripts on schedule
  - PowerShell script support
  - Batch script support
  - Log script execution
- **Windows Maintenance**:
  - Disk Cleanup automation
  - Windows Update cleanup
  - System File Checker (SFC)
  - DISM health restore
  - Check Disk (CHKDSK)
- **Registry Maintenance**:
  - Registry cleanup (safe entries only)
  - Registry defragmentation
  - Registry backup/restore
- **Network Optimization**:
  - Flush DNS cache (`ipconfig /flushdns`)
  - Reset network settings
  - Clear ARP cache
  - Reset Winsock
- **Windows Search**:
  - Rebuild Windows Search index
  - Fix indexing issues

**macOS**:

- **Periodic Scripts**:
  - Run maintenance scripts on schedule
  - Shell script support
  - AppleScript support
  - Log script execution
- **Spotlight Reindexing**:
  - Rebuild Spotlight index
  - Fix indexing issues
- **Disk Permissions Repair**:
  - Verify disk permissions
  - Repair permissions (if supported)
- **Mail Optimization**:
  - Rebuild Mail database
  - Compact mailboxes
  - Speed up Mail app
- **Time Machine**:
  - Thin old snapshots
  - Clean up snapshots
- **DNS Cache**:
  - Flush DNS cache
  - Reset network settings

**Common**:

- **Scheduled Tasks**: Create scheduled maintenance tasks
- **Task History**: View execution history and logs

**Implementation**:

```typescript
interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  category:
    | "script"
    | "indexing"
    | "permissions"
    | "mail"
    | "timemachine"
    | "network";
  estimatedTime: number;
  requiresSudo: boolean;
  status: "pending" | "running" | "completed" | "failed";
}

interface MaintenanceResult {
  taskId: string;
  success: boolean;
  duration: number;
  output?: string;
  error?: string;
}
```

**Technical Requirements**:

- Sudo elevation for system tasks
- Script execution engine
- Task scheduling
- Logging system

#### 4.2 Issues/Alerts

**Purpose**: Proactive issue detection and resolution

**Features**:

- **Issue Detection**:
  - Low disk space
  - Incorrect uninstallations
  - Outdated apps
  - Payment issues (subscriptions)
  - Malware detection
  - System errors
- **Alert System**:
  - Visual alerts in UI
  - Notification center alerts
  - Actionable recommendations
- **Resolution Suggestions**:
  - One-click fixes
  - Step-by-step guides
  - Links to resources

**Implementation**:

```typescript
interface Issue {
  id: string;
  type: IssueType;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  detectedAt: Date;
  resolution?: Resolution;
  autoFixable: boolean;
}

type IssueType =
  | "low_space"
  | "incorrect_uninstall"
  | "outdated_apps"
  | "payment_issue"
  | "malware_detected"
  | "system_error";

interface Resolution {
  action: string;
  steps: string[];
  estimatedTime: number;
  riskLevel: "low" | "medium" | "high";
}
```

**Technical Requirements**:

- Issue detection engine
- Alert management system
- Resolution workflow

### Module 5: Additional Features

#### 5.1 Customization & Safety

**Purpose**: User control and safety features

**Features**:

- **Safety Database**:
  - Whitelist important files/folders
  - System file protection
  - Custom safety rules
  - Community-maintained database
- **Review Before Delete**:
  - Preview files before deletion
  - Batch selection
  - Undo capability
- **Backup Files**:
  - Automatic backup before deletion
  - Restore from backup
  - Backup management
- **Notifications**:
  - Trash bin size alerts
  - Health status notifications
  - Scan completion notifications
  - Customizable notification settings

**Implementation**:

```typescript
interface SafetyRule {
  path: string;
  type: "file" | "folder" | "pattern";
  action: "protect" | "warn" | "allow";
  reason: string;
}

interface BackupInfo {
  id: string;
  timestamp: Date;
  files: string[];
  totalSize: number;
  location: string;
}
```

#### 5.2 Upcoming Features (In Progress)

**Purpose**: Planned enhancements

**Features**:

- **Advanced File Search/Management**:
  - Advanced search with filters
  - File tagging
  - Batch operations
- **Photo/Video/Screenshots Cleanup**:
  - Duplicate photos detection
  - Similar images
  - Screenshot cleanup
  - Video optimization
- **Privacy Enhancements**:
  - VPN integration
  - Privacy score
  - Data breach monitoring
  - Secure file deletion

## Technical Architecture

### Frontend Components

```
src/tools/utilities/system-cleaner/
├── SystemCleaner.tsx              # Main component
├── components/
│   ├── SmartScan.tsx              # Smart Scan interface
│   ├── CleanupModule.tsx         # Cleanup module UI
│   ├── ProtectionModule.tsx       # Protection module UI
│   ├── OptimizationModule.tsx     # Optimization module UI
│   ├── MaintenanceModule.tsx      # Maintenance module UI
│   ├── HealthMonitor.tsx          # Health monitor widget
│   ├── SpaceLens.tsx              # Space Lens visualization
│   ├── DuplicateFinder.tsx        # Duplicate finder UI
│   ├── MalwareScanner.tsx         # Malware scanner UI
│   ├── AppManager.tsx             # App management UI
│   ├── PlatformBadge.tsx          # Platform indicator
│   └── ResultsView.tsx            # Scan results display
├── hooks/
│   ├── useSystemCleaner.ts        # Main hook
│   ├── useSmartScan.ts            # Smart scan logic
│   ├── useFileScanner.ts          # File scanning
│   ├── useMalwareScan.ts          # Malware scanning
│   ├── useSystemMetrics.ts       # System metrics
│   └── usePlatform.ts             # Platform detection
├── store/
│   └── systemCleanerStore.ts      # Zustand store
└── utils/
    ├── fileUtils.ts               # File operations
    ├── safetyUtils.ts             # Safety checks
    ├── scanUtils.ts               # Scanning utilities
    ├── platformUtils.ts           # Platform-specific utilities
    ├── windowsUtils.ts            # Windows-specific utilities
    ├── macosUtils.ts              # macOS-specific utilities
    └── nativeBridge.ts            # Electron IPC bridge
```

### Electron Main Process

```typescript
// electron/main/systemCleaner.ts

interface SystemCleanerIPC {
  // Platform
  "system-cleaner:get-platform": () => Promise<PlatformInfo>;
  "system-cleaner:is-admin": () => Promise<boolean>;
  "system-cleaner:request-admin": () => Promise<boolean>;

  // Scanning
  "system-cleaner:start-scan": (
    options: ScanOptions
  ) => Promise<SmartScanResult>;
  "system-cleaner:scan-progress": (progress: ScanProgress) => void;
  "system-cleaner:cancel-scan": () => Promise<void>;

  // Cleanup
  "system-cleaner:delete-files": (files: string[]) => Promise<DeleteResult>;
  "system-cleaner:get-junk-files": () => Promise<JunkFileResult>;
  "system-cleaner:get-duplicates": () => Promise<DuplicateResult>;
  "system-cleaner:get-large-files": (
    threshold: number
  ) => Promise<LargeFileResult>;

  // Protection
  "system-cleaner:scan-malware": (
    type: "quick" | "normal" | "deep"
  ) => Promise<MalwareScanResult>;
  "system-cleaner:remove-threat": (threat: ThreatInfo) => Promise<boolean>;
  "system-cleaner:clean-privacy": (
    options: PrivacyOptions
  ) => Promise<PrivacyCleanupResult>;

  // Optimization
  "system-cleaner:uninstall-app": (appId: string) => Promise<UninstallResult>;
  "system-cleaner:check-updates": () => Promise<AppInfo[]>;
  "system-cleaner:free-ram": () => Promise<number>;
  "system-cleaner:get-heavy-apps": () => Promise<ProcessInfo[]>;

  // Maintenance
  "system-cleaner:run-maintenance": (
    task: MaintenanceTask
  ) => Promise<MaintenanceResult>;
  "system-cleaner:reindex-search": () => Promise<boolean>; // Spotlight on macOS, Windows Search on Windows
  "system-cleaner:repair-permissions": () => Promise<boolean>; // macOS only
  "system-cleaner:run-disk-cleanup": () => Promise<boolean>; // Windows only
  "system-cleaner:run-sfc": () => Promise<boolean>; // Windows only

  // Health Monitor
  "system-cleaner:get-health-status": () => Promise<HealthStatus>;
  "system-cleaner:start-monitoring": () => void;
  "system-cleaner:stop-monitoring": () => void;

  // Safety
  "system-cleaner:check-safety": (
    files: string[]
  ) => Promise<SafetyCheckResult>;
  "system-cleaner:create-backup": (files: string[]) => Promise<BackupInfo>;
  "system-cleaner:restore-backup": (backupId: string) => Promise<boolean>;
}
```

### Native Dependencies

**Required npm packages**:

- `systeminformation` - System metrics (cross-platform)
- `chokidar` - File system watching
- `crypto` - Hash calculation (built-in)
- `fs-extra` - Enhanced file operations
- `glob` - File pattern matching
- `archiver` - Backup creation
- `node-windows-registry` - Windows registry access (Windows)
- `node-mac-permissions` - Permission management (macOS)
- `winreg` - Windows registry operations (Windows)
- `powershell` - PowerShell script execution (Windows)

**Platform-specific APIs**:

**Windows**:

- File System APIs (via Node.js `fs`)
- Windows Registry APIs (via `winreg` or `node-windows-registry`)
- Windows Management Instrumentation (WMI) via PowerShell
- Windows Services APIs
- Windows Task Scheduler APIs
- Windows Search APIs
- Windows Update APIs
- Windows Defender APIs (for malware scanning)

**macOS**:

- File System APIs (via Node.js `fs`)
- System Preferences APIs
- Process Management APIs
- Network APIs
- Spotlight APIs (via `mdfind` command)
- Launch Services APIs
- AppleScript execution

### Safety & Security Considerations

1. **Safety Database**:
   - Whitelist system files
   - Protect user documents
   - Community-maintained rules
   - Regular updates

2. **Review Before Delete**:
   - Always show files before deletion
   - Batch selection UI
   - Undo capability
   - Confirmation dialogs

3. **Backup System**:
   - Automatic backups
   - Versioned backups
   - Restore functionality
   - Backup cleanup

4. **Permissions**:
   - Request necessary permissions
   - Explain permission usage
   - Minimal permission requests
   - Privacy-focused

5. **Error Handling**:
   - Graceful error handling
   - User-friendly error messages
   - Recovery procedures
   - Logging system

### Performance Optimization

1. **Background Processing**:
   - Worker threads for scanning
   - Chunked file processing
   - Progress reporting
   - Cancellation support

2. **Caching**:
   - Cache scan results
   - Cache file metadata
   - Invalidate on changes
   - Smart cache management

3. **Resource Management**:
   - Low CPU impact
   - Memory-efficient scanning
   - Disk I/O optimization
   - Background priority

4. **UI Responsiveness**:
   - Non-blocking operations
   - Progress indicators
   - Skeleton loaders
   - Optimistic updates

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

- [x] Platform detection system
- [x] Setup Electron IPC handlers (cross-platform)
- [x] Create base store structure
- [x] Implement file scanning utilities (platform-aware)
- [x] Setup safety database (platform-specific rules)
- [x] Create backup system
- [x] Platform-specific path utilities

### Phase 2: Cleanup Module (Week 3-5)

- [x] Junk files scanner (Windows + macOS)
- [x] Cache cleanup (platform-specific paths)
- [x] Log files cleanup (platform-specific)
- [x] Large files finder (cross-platform)
- [x] Duplicate finder (cross-platform)
- [x] Space Lens visualization (cross-platform)
- [x] Windows-specific: Windows Update cache, Prefetch files
- [x] macOS-specific: Time Machine snapshots, iCloud cleanup
- [x] **FIX**: Space Lens navigation logic (needs rescan when entering directories)
- [x] **FIX**: Space Lens delete refresh (incorrect path after deletion)
- [x] **FIX**: Duplicates scan path selector (currently hardcoded to home directory)

### Phase 3: Protection Module (Week 6-8)

- [ ] Malware scanner (basic, platform-aware)
- [x] Privacy cleanup (platform-specific)
- [ ] Browser data cleanup (all major browsers)
- [ ] Wi-Fi network cleanup (platform-specific)
- [ ] Threat removal
- [x] Windows: Registry cleanup, Activity history
- [x] macOS: Spotlight history, Quick Look cache

### Phase 4: Optimization Module (Week 9-11)

- [x] App uninstaller (Windows + macOS)
- [ ] App updater (Windows Store/Chocolatey + macOS App Store)
- [x] RAM optimization (platform-specific methods)
- [x] Speed tools (platform-specific)
- [x] Heavy apps monitor (cross-platform)
- [x] Windows: Startup management, Services management
- [x] macOS: Login items, Launch Agents
- [x] **FIX**: Startup items enable/disable functionality (button not working)
- [x] **FIX**: Proper app uninstall logic (currently only deletes folder)

### Phase 5: Maintenance & Health (Week 12-14)

- [x] Maintenance tasks (platform-specific)
- [x] Health monitor (cross-platform)
- [x] Menu bar widget (platform-specific UI)
- [x] Alert system
- [x] Issue detection
- [x] Windows: SFC, DISM, Disk Cleanup automation, DNS flush, Winsock reset, Windows Search rebuild
- [x] macOS: Spotlight reindexing, Disk permissions, DNS flush, Mail rebuild

### Phase 6: Polish & Testing (Week 15-16)

- [x] UI/UX improvements
- [x] Platform-specific UI adaptations
- [x] Performance optimization
- [ ] Safety testing (both platforms)
- [x] **FIX**: Comprehensive error handling across all views
- [x] Documentation
- [ ] Cross-platform testing
- [x] **FIX**: Platform detection on component mount
- [x] **FIX**: Progress tracking improvements (remove fake progress where possible)

### Phase 7: UI/UX Enhancements (Week 17-18)

- [ ] Search & Filter functionality (across all views)
- [ ] Bulk Actions (Select All, Bulk Delete, Bulk Enable/Disable)
- [ ] Better Empty States (with helpful tips and quick actions)
- [ ] Export & Reports (scan results, history, CSV/JSON export)
- [ ] Settings & Preferences panel
- [ ] Keyboard Shortcuts (Ctrl/Cmd+F, Ctrl/Cmd+A, Delete, Escape)

### Phase 8: Feature Improvements (Week 19-20)

- [ ] Smart Scan Improvements (replace simulated steps with real scans)
- [ ] Progress Tracking (real-time progress from backend, ETA calculations)
- [ ] Backup Management UI (view backups, restore, delete old backups)
- [ ] Advanced Space Lens Features (export tree, compare snapshots, size trends)
- [ ] Error Recovery (retry failed operations, partial success handling)
- [ ] Memory Management (chunked processing, virtual scrolling, cleanup listeners)
- [ ] Caching Strategy (cache scan results with TTL, cache size limits)

### Phase 9: Code Quality & Testing (Week 21-22)

- [ ] Type Safety (strict TypeScript types, remove `any` types, better error types)
- [ ] Unit Tests (utilities, hooks, components)
- [ ] Integration Tests (IPC handlers, Electron main process)
- [ ] E2E Tests (critical user flows)
- [ ] Performance Testing (memory leaks, CPU usage, large dataset handling)
- [ ] Cross-platform Testing (Windows 10/11, macOS Big Sur+)

## Known Issues & Bugs

### Critical Issues (Must Fix)

1. ~~**Startup Items - Disable Button Not Working**~~ ✅ FIXED
   - **Status**: Fixed - IPC handler `cleaner:toggle-startup-item` implemented with platform-specific logic
   - **Location**: `SystemCleaner.tsx` line 389-401, `cleaner.ts` line 201-243

2. ~~**App Uninstaller - Incorrect Logic**~~ ✅ FIXED
   - **Status**: Fixed - Proper uninstall logic implemented for both macOS and Windows
   - **Location**: `SystemCleaner.tsx` line 459-476, `cleaner.ts` line 379-472

3. ~~**Space Lens - Navigation Logic Error**~~ ✅ FIXED
   - **Status**: Fixed - Now calls `scanSpace(node.path)` when entering directories
   - **Location**: `SystemCleaner.tsx` line 680-686

4. ~~**Space Lens - Delete Refresh Issue**~~ ✅ FIXED
   - **Status**: Fixed - Stores current path before delete operation
   - **Location**: `SystemCleaner.tsx` line 658-678

### High Priority Issues

5. ~~**Error Handling - Missing in Multiple Views**~~ ✅ FIXED
   - **Status**: Fixed - Comprehensive error handling added with try-catch and success checks
   - **Location**: All views in `SystemCleaner.tsx` now have proper error handling

6. ~~**Platform Detection - Not Called on Mount**~~ ✅ FIXED
   - **Status**: Fixed - `useEffect` added to call `getPlatform()` on component mount
   - **Location**: `SystemCleaner.tsx` line 1507-1520

7. ~~**Duplicates - Hardcoded Scan Path**~~ ✅ FIXED
   - **Status**: Fixed - UI added to select scan path with input field
   - **Location**: `SystemCleaner.tsx` line 1138, 1190-1196, 1228-1234

### Medium Priority Issues

8. ~~**Progress Tracking - Fake Progress**~~ ✅ IMPROVED
   - **Status**: Improved - Progress tracking documented as estimated where real progress unavailable
   - **Note**: Some operations (like file scanning) use estimated progress due to async nature, but error handling improved

9. **Smart Scan - Simulated Steps**
   - **Location**: `hooks/useSmartScan.ts` line 28-35
   - **Issue**: Malware and RAM steps are simulated with `setTimeout`, not real scanning
   - **Impact**: Not performing actual scans, misleading to users
   - **Fix Required**: Implement real malware scan or remove simulated steps until ready
   - **Status**: Low priority - Can be implemented in future phase

### Missing Features

10. ~~**Protection Module - Not Implemented**~~ ✅ PARTIALLY IMPLEMENTED
    - **Location**: `SystemCleaner.tsx` ProtectionView
    - **Status**: Privacy cleanup implemented, malware scanner placeholder
    - **Required**: Basic malware scan implementation
    - **IPC Handlers Needed**: `cleaner:scan-malware`

11. ~~**Maintenance Module - Not Implemented**~~ ✅ IMPLEMENTED
    - **Location**: `SystemCleaner.tsx` MaintenanceView
    - **Status**: Fully implemented with platform-specific tasks
    - **IPC Handlers**: All implemented

12. ~~**Startup Items - Status Tracking**~~ ✅ FIXED
    - **Location**: `store/systemCleanerStore.ts`
    - **Status**: Fixed - `enabled` field added, status detection implemented

### Planned Enhancements

13. **Browser Data Cleanup** ✅ **COMPLETED**
    - **Priority**: High
    - **Required**: Clean history, cookies, cache for Chrome, Firefox, Edge, Safari
    - **IPC Handlers Needed**: `cleaner:scan-browser-data`, `cleaner:clean-browser-data`
    - **Platform-specific**: Different browser paths for Windows/macOS
    - **Status**: ✅ Implemented in `ProtectionView` with browser data tab

14. **Wi-Fi Network Cleanup** ✅ **COMPLETED**
    - **Priority**: High
    - **Required**: Remove old/forgotten Wi-Fi networks
    - **IPC Handlers Needed**: `cleaner:get-wifi-networks`, `cleaner:remove-wifi-network`
    - **Platform-specific**: Windows (netsh), macOS (networksetup)
    - **Status**: ✅ Implemented in `ProtectionView` with Wi-Fi networks tab

15. **Search & Filter** ✅ **COMPLETED**
    - **Priority**: Medium
    - **Required**: Add search and filter to Large Files, Duplicates, Space Lens, Startup Items
    - **Implementation**: Search input, filter dropdowns, sort options
    - **Status**: ✅ Implemented in `LargeFilesView`, `DuplicatesView`, `StartupItemsView`, `SpaceLensView`

16. **Bulk Actions** ✅ **COMPLETED**
    - **Priority**: Medium
    - **Required**: Select All, Bulk Delete, Bulk Enable/Disable
    - **Implementation**: Checkbox selection, bulk action buttons
    - **Status**: ✅ Implemented with Select All/Deselect All buttons and bulk operations in all relevant views

17. **Better Empty States** ✅ **COMPLETED**
    - **Priority**: Low
    - **Required**: Improved empty states with tips, quick actions, illustrations
    - **Implementation**: Enhanced ScanPlaceholder component
    - **Status**: ✅ Implemented with tips, quick actions, and improved UI in all views

18. **Smart Scan Improvements** ✅ **COMPLETED**
    - **Priority**: Medium
    - **Required**: Replace simulated malware/RAM steps with real scans
    - **Implementation**: Real malware scan integration, real RAM optimization
    - **Status**: ✅ Replaced simulated steps with real performance data and privacy scans, added retry logic

19. **Progress Tracking** ✅ **COMPLETED**
    - **Priority**: Medium
    - **Required**: Real-time progress from backend, ETA calculations
    - **Implementation**: IPC progress events, progress calculation utilities
    - **Status**: ✅ Implemented progress tracking utilities with ETA calculations and smoothed progress

20. **Backup Management UI** ✅ **COMPLETED**
    - **Priority**: Medium
    - **Required**: View backups list, restore from backup, delete old backups
    - **Implementation**: Backup list view, restore dialog, backup info display
    - **Status**: ✅ Implemented BackupManagementView with full CRUD operations

21. **Advanced Space Lens Features** ✅ **COMPLETED**
    - **Priority**: Low
    - **Required**: Export tree structure, compare snapshots, size trends
    - **Implementation**: Export functionality, snapshot system, trend visualization
    - **Status**: ✅ Implemented export to JSON/CSV, snapshot creation, and comparison utilities

22. **Error Recovery** ✅ **COMPLETED**
    - **Priority**: Medium
    - **Required**: Retry failed operations, partial success handling
    - **Implementation**: Retry logic, error state management, partial results display
    - **Status**: ✅ Implemented retry utilities with exponential backoff and batch processing with error recovery

23. **Memory Management** ✅ **COMPLETED**
    - **Priority**: High
    - **Required**: Chunked processing, virtual scrolling, proper cleanup
    - **Implementation**: Virtual scrolling for long lists, chunked file processing, listener cleanup
    - **Status**: ✅ Implemented VirtualizedList component, chunked batch processing, and proper cleanup

24. **Caching Strategy** ✅ **COMPLETED**
    - **Priority**: Medium
    - **Required**: Cache scan results with TTL, cache size limits
    - **Implementation**: Cache utilities, TTL management, cache invalidation
    - **Status**: ✅ Implemented Cache class with TTL, size limits, and cache decorator

25. **Type Safety** ✅ **COMPLETED**
    - **Priority**: High
    - **Required**: Strict TypeScript types, remove `any` types, better error types
    - **Implementation**: Type definitions, strict mode, error type system
    - **Status**: ✅ Created comprehensive type definitions in types/index.ts, added error types, improved type safety across codebase

26. **Testing**
    - **Priority**: High
    - **Required**: Unit tests, integration tests, E2E tests
    - **Implementation**: Jest/Vitest setup, test utilities, E2E test framework

## Current Status & Next Steps

### Completed Features ✅
- Core infrastructure (platform detection, IPC handlers, store structure)
- Cleanup module (junk files, large files, duplicates, space lens)
- Performance optimization (RAM optimization, heavy apps monitor)
- Basic UI/UX with tab navigation
- Platform-specific path utilities
- **Safety database** with platform-specific protection rules
- **Backup system** with automatic backup before deletion
- Safety checks integrated into cleanup operations
- Performance optimizations (caching, chunked processing)
- Platform-specific UI adaptations
- **Browser Data Cleanup** - Clean history, cookies, cache for Chrome, Firefox, Edge, Safari
- **Wi-Fi Network Cleanup** - Remove old/forgotten Wi-Fi networks (Windows & macOS)
- **Search & Filter** - Search and filter functionality across Large Files, Duplicates, Space Lens, Startup Items
- **Bulk Actions** - Select All, Bulk Delete, Bulk Enable/Disable functionality

### In Progress / Needs Fix 🔧
- ✅ All critical fixes completed

### Not Started ⏳
- App updater functionality (Windows Store/Chocolatey + macOS App Store)
- Malware scanner (basic, platform-aware)

### UI/UX Enhancements 🎨
- ✅ **Search & Filter functionality** (across all views) - COMPLETED
- ✅ **Bulk Actions** (Select All, Bulk Delete, Bulk Enable/Disable) - COMPLETED
- ✅ **Better Empty States** (with helpful tips and quick actions) - COMPLETED
- ✅ **Export & Reports** (scan results, history, CSV/JSON export) - COMPLETED (Space Lens export)
- Settings & Preferences panel
- Keyboard Shortcuts (Ctrl/Cmd+F, Ctrl/Cmd+A, Delete, Escape)

### Feature Improvements 🚀
- ✅ **Smart Scan Improvements** (replace simulated steps with real scans) - COMPLETED
- ✅ **Progress Tracking** (real-time progress from backend, ETA calculations) - COMPLETED
- ✅ **Backup Management UI** (view backups, restore, delete old backups) - COMPLETED
- ✅ **Advanced Space Lens Features** (export tree, compare snapshots, size trends) - COMPLETED
- ✅ **Error Recovery** (retry failed operations, partial success handling) - COMPLETED
- ✅ **Memory Management** (chunked processing, virtual scrolling, cleanup listeners) - COMPLETED
- ✅ **Caching Strategy** (cache scan results with TTL, cache size limits) - COMPLETED

### Code Quality 🔧
- ✅ **Type Safety** (strict TypeScript types, remove `any` types, better error types) - COMPLETED
- Testing (unit tests for utilities, integration tests for IPC handlers, E2E tests)

### Next Steps (Priority Order)
1. ✅ **Completed**: Browser Data Cleanup, Wi-Fi Network Cleanup, Search & Filter, Bulk Actions
2. ✅ **Completed**: Better Empty States, Smart Scan Improvements, Progress Tracking, Backup Management UI
3. ✅ **Completed**: Advanced Space Lens Features, Error Recovery, Memory Management, Caching Strategy, Type Safety
4. **Testing**: Cross-platform testing, safety testing, performance optimization
5. **Settings & Preferences**: Add settings panel for user preferences
6. **Keyboard Shortcuts**: Implement keyboard shortcuts for common actions

## User Experience Flow

1. **First Launch**:
   - Welcome screen with platform detection
   - Platform badge/indicator
   - Permission requests (platform-specific)
   - Safety database download (platform-specific rules)
   - Initial scan suggestion

2. **Smart Scan**:
   - Select scan options (platform-aware options)
   - Progress visualization
   - Results summary (platform-specific findings)
   - Review findings
   - Apply fixes

3. **Module Navigation**:
   - Sidebar navigation
   - Module-specific views (platform-aware)
   - Quick actions (platform-specific)
   - Status indicators
   - Platform-specific feature badges

4. **Health Monitoring**:
   - Menu bar widget (platform-specific UI)
   - Dashboard view
   - Alert notifications
   - Quick fixes (platform-aware)

5. **Maintenance**:
   - Scheduled tasks (platform-specific tasks)
   - Manual execution
   - Results logging
   - History view
   - Platform-specific maintenance options

## Success Metrics

- **Performance**: <5% CPU usage during scans
- **Safety**: 0% false positive deletions
- **Efficiency**: Average 2-5GB space freed per scan
- **User Satisfaction**: <2 clicks to common actions
- **Reliability**: 99.9% successful operations

## Platform-Specific Considerations

### Windows-Specific Features

- **Windows Update Cleanup**: Remove old Windows Update files
- **System Restore Points**: Manage and clean restore points
- **Windows.old Cleanup**: Remove old Windows installation files
- **Registry Cleanup**: Safe registry cleanup (with backups)
- **Windows Defender Integration**: Use Windows Defender for malware scanning
- **Windows Services Management**: Enable/disable services
- **Task Scheduler Integration**: Schedule maintenance tasks
- **Windows Search Optimization**: Rebuild and optimize Windows Search index

### macOS-Specific Features

- **Time Machine Management**: Clean up Time Machine snapshots
- **Spotlight Optimization**: Rebuild Spotlight index
- **Disk Permissions**: Repair disk permissions (if supported)
- **Launch Services**: Manage Launch Agents and Daemons
- **Gatekeeper Integration**: Check app security
- **iCloud Optimization**: Manage iCloud storage
- **Mail.app Optimization**: Rebuild Mail database

### Cross-Platform Considerations

- **Path Normalization**: Handle different path separators
- **Permission Handling**: Different permission models
- **Admin/Elevation**: Different elevation methods
- **File System Differences**: Case sensitivity, file attributes
- **Browser Paths**: Different browser data locations
- **Cloud Services**: Platform-specific cloud folder locations

## Known Issues & Bugs

### Critical Issues (Must Fix)

1. **Startup Items - Disable Button Not Working**
   - **Location**: `SystemCleaner.tsx` line 390
   - **Issue**: Button "Disable" has no onClick handler
   - **Impact**: Users cannot disable startup items
   - **Fix Required**: 
     - Add IPC handler `cleaner:toggle-startup-item`
     - Implement platform-specific enable/disable logic
     - Add state tracking for enabled/disabled status

2. **App Uninstaller - Incorrect Logic**
   - **Location**: `SystemCleaner.tsx` line 425
   - **Issue**: Uses `runCleanup([app.path])` which only deletes folder, not properly uninstalling
   - **Impact**: Apps are not fully removed, leaving registry entries and leftover files
   - **Fix Required**:
     - Add IPC handler `cleaner:uninstall-app`
     - Implement platform-specific uninstall logic (MSI, Windows Store, macOS app removal)
     - Remove associated files (preferences, caches, launch agents)

3. **Space Lens - Navigation Logic Error**
   - **Location**: `SystemCleaner.tsx` line 529-542
   - **Issue**: When navigating into directory, sets `spaceLensData = node` but node may not have complete children
   - **Impact**: Incomplete directory tree display
   - **Fix Required**: Call `scanSpace(node.path)` when entering new directory

4. **Space Lens - Delete Refresh Issue**
   - **Location**: `SystemCleaner.tsx` line 525
   - **Issue**: After delete, calls `scanSpace(spaceLensData?.path)` but `spaceLensData` may have changed
   - **Impact**: Incorrect refresh after deletion
   - **Fix Required**: Store current path before delete, refresh from stored path

### High Priority Issues

5. **Error Handling - Missing in Multiple Views**
   - **Location**: Multiple views in `SystemCleaner.tsx`
   - **Issue**: Missing try-catch blocks and error state checks
   - **Impact**: Poor user experience when operations fail
   - **Fix Required**: Add comprehensive error handling with user-friendly messages

6. **Platform Detection - Not Called on Mount**
   - **Location**: `SystemCleaner.tsx` main component
   - **Issue**: `platformInfo` may be null when component mounts
   - **Impact**: Platform-specific features may not work correctly
   - **Fix Required**: Add `useEffect` to call `getPlatform()` on mount

7. **Duplicates - Hardcoded Scan Path**
   - **Location**: `SystemCleaner.tsx` DuplicatesView
   - **Issue**: Scan path is hardcoded to home directory
   - **Impact**: Users cannot scan specific directories
   - **Fix Required**: Add UI to select scan path, pass to IPC handler

### Medium Priority Issues

8. **Progress Tracking - Fake Progress**
   - **Location**: Multiple views using `setInterval` for progress
   - **Issue**: Progress bars use simulated progress instead of real progress
   - **Impact**: Progress indicators are inaccurate
   - **Fix Required**: Sync with real operation progress where possible, or document as estimated

9. **Smart Scan - Simulated Steps**
   - **Location**: `hooks/useSmartScan.ts` line 28-35
   - **Issue**: Malware and RAM steps are simulated with `setTimeout`
   - **Impact**: Not real scanning, misleading to users
   - **Fix Required**: Implement real malware scan or remove simulated steps

### Missing Features

10. **Protection Module - Not Implemented**
    - **Location**: `SystemCleaner.tsx` line 995-1001
    - **Status**: Placeholder only
    - **Required**: Basic malware scan and privacy cleanup implementation

11. **Maintenance Module - Not Implemented**
    - **Location**: `SystemCleaner.tsx` line 1002-1008
    - **Status**: Placeholder only
    - **Required**: Platform-specific maintenance tasks (Spotlight reindex, DNS flush, etc.)

12. **Startup Items - Status Tracking**
    - **Location**: `store/systemCleanerStore.ts`
    - **Issue**: No state to track enabled/disabled status
    - **Required**: Add `enabled` field to `StartupItem` interface, detect current status

## Current Status & Next Steps

### Completed Features
- ✅ Core infrastructure (platform detection, IPC handlers, store structure)
- ✅ Cleanup module (junk files, large files, duplicates, space lens)
- ✅ Performance optimization (RAM optimization, heavy apps monitor)
- ✅ Basic UI/UX with tab navigation
- ✅ Platform-specific path utilities

### In Progress / Needs Fix
- ✅ All critical fixes completed

### Not Started
- ⏳ App updater functionality
- ⏳ Browser data cleanup
- ⏳ Wi-Fi network cleanup
- ⏳ Malware scanner (basic)
- ⏳ Search & Filter
- ⏳ Bulk Actions
- ⏳ Better Empty States
- ⏳ Smart Scan Improvements
- ⏳ Progress Tracking improvements
- ⏳ Backup Management UI
- ⏳ Advanced Space Lens Features
- ⏳ Error Recovery
- ⏳ Memory Management optimizations
- ⏳ Caching Strategy
- ⏳ Type Safety improvements
- ⏳ Testing suite

## Future Enhancements

### Planned Features (High Priority)
1. **Browser Data Cleanup**: Clean history, cookies, cache for Chrome, Firefox, Edge, Safari
2. **Wi-Fi Network Cleanup**: Remove old/forgotten Wi-Fi networks (platform-specific)
3. **Search & Filter**: Add search and filter functionality across all views
4. **Bulk Actions**: Select All, Bulk Delete, Bulk Enable/Disable operations
5. **Better Empty States**: Improved empty states with tips and quick actions
6. **Smart Scan Improvements**: Replace simulated steps with real malware/RAM scans
7. **Progress Tracking**: Real-time progress from backend with ETA calculations
8. **Backup Management UI**: View backups list, restore from backup, delete old backups
9. **Advanced Space Lens**: Export tree structure, compare snapshots, size trends
10. **Error Recovery**: Retry failed operations, partial success handling
11. **Memory Management**: Chunked processing, virtual scrolling, proper cleanup
12. **Caching Strategy**: Cache scan results with TTL, cache size limits
13. **Type Safety**: Strict TypeScript types, remove `any` types
14. **Testing**: Unit tests, integration tests, E2E tests

### Long-term Enhancements
1. **AI-Powered Recommendations**: ML-based cleaning suggestions
2. **Cloud Integration**: Sync settings across devices
3. **Advanced Analytics**: Detailed usage statistics
4. **Custom Scripts**: User-defined maintenance scripts (PowerShell for Windows, Shell/AppleScript for macOS)
5. **Community Features**: Share safety rules, tips
6. **Multi-language Support**: Internationalization
7. **Dark Mode**: Enhanced dark theme
8. **Accessibility**: Full keyboard navigation, screen reader support
9. **Linux Support**: Extend to Linux distributions
10. **Remote Management**: Manage multiple devices
11. **Scheduled Tasks**: Schedule automatic scans and maintenance
12. **Export & Reports**: Export scan results, print-friendly reports, history logs
