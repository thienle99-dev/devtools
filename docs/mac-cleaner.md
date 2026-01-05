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
type Platform = 'windows' | 'macos' | 'linux';

interface PlatformInfo {
  platform: Platform;
  version: string;
  architecture: 'x64' | 'arm64';
  isAdmin: boolean;
}

// Platform-specific utilities
const getPlatformPaths = (platform: Platform): PlatformPaths => {
  if (platform === 'windows') {
    return {
      userCache: path.join(process.env.APPDATA || '', '..', 'Local'),
      systemCache: path.join(process.env.WINDIR || '', 'Temp'),
      userLogs: path.join(process.env.APPDATA || '', '..', 'Local', 'Temp'),
      systemLogs: path.join(process.env.WINDIR || '', 'Logs'),
      trashBin: path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Microsoft', 'Windows', 'RecycleBin'),
      // ... more Windows paths
    };
  } else if (platform === 'macos') {
    return {
      userCache: path.join(process.env.HOME || '', 'Library', 'Caches'),
      systemCache: '/Library/Caches',
      userLogs: path.join(process.env.HOME || '', 'Library', 'Logs'),
      systemLogs: '/var/log',
      trashBin: path.join(process.env.HOME || '', '.Trash'),
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
  category: 'cache' | 'log' | 'download' | 'junk' | 'language' | 'trash';
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
  type: 'file' | 'directory';
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
  syncStatus: 'synced' | 'syncing' | 'error';
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
  scanType: 'quick' | 'normal' | 'deep';
  scanDuration: number;
}

interface ThreatInfo {
  name: string;
  type: 'adware' | 'ransomware' | 'trojan' | 'spyware' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  description: string;
  removalAction: 'quarantine' | 'delete' | 'repair';
}

interface AppInfo {
  name: string;
  path: string;
  permissions: PermissionInfo[];
  riskLevel: 'safe' | 'suspicious' | 'dangerous';
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
  type: 'low_space' | 'frozen_app' | 'large_trash' | 'high_cpu' | 'memory_pressure';
  severity: 'info' | 'warning' | 'critical';
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
  category: 'script' | 'indexing' | 'permissions' | 'mail' | 'timemachine' | 'network';
  estimatedTime: number;
  requiresSudo: boolean;
  status: 'pending' | 'running' | 'completed' | 'failed';
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
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  detectedAt: Date;
  resolution?: Resolution;
  autoFixable: boolean;
}

type IssueType = 
  | 'low_space'
  | 'incorrect_uninstall'
  | 'outdated_apps'
  | 'payment_issue'
  | 'malware_detected'
  | 'system_error';

interface Resolution {
  action: string;
  steps: string[];
  estimatedTime: number;
  riskLevel: 'low' | 'medium' | 'high';
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
  type: 'file' | 'folder' | 'pattern';
  action: 'protect' | 'warn' | 'allow';
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
  'system-cleaner:get-platform': () => Promise<PlatformInfo>;
  'system-cleaner:is-admin': () => Promise<boolean>;
  'system-cleaner:request-admin': () => Promise<boolean>;
  
  // Scanning
  'system-cleaner:start-scan': (options: ScanOptions) => Promise<SmartScanResult>;
  'system-cleaner:scan-progress': (progress: ScanProgress) => void;
  'system-cleaner:cancel-scan': () => Promise<void>;
  
  // Cleanup
  'system-cleaner:delete-files': (files: string[]) => Promise<DeleteResult>;
  'system-cleaner:get-junk-files': () => Promise<JunkFileResult>;
  'system-cleaner:get-duplicates': () => Promise<DuplicateResult>;
  'system-cleaner:get-large-files': (threshold: number) => Promise<LargeFileResult>;
  
  // Protection
  'system-cleaner:scan-malware': (type: 'quick' | 'normal' | 'deep') => Promise<MalwareScanResult>;
  'system-cleaner:remove-threat': (threat: ThreatInfo) => Promise<boolean>;
  'system-cleaner:clean-privacy': (options: PrivacyOptions) => Promise<PrivacyCleanupResult>;
  
  // Optimization
  'system-cleaner:uninstall-app': (appId: string) => Promise<UninstallResult>;
  'system-cleaner:check-updates': () => Promise<AppInfo[]>;
  'system-cleaner:free-ram': () => Promise<number>;
  'system-cleaner:get-heavy-apps': () => Promise<ProcessInfo[]>;
  
  // Maintenance
  'system-cleaner:run-maintenance': (task: MaintenanceTask) => Promise<MaintenanceResult>;
  'system-cleaner:reindex-search': () => Promise<boolean>; // Spotlight on macOS, Windows Search on Windows
  'system-cleaner:repair-permissions': () => Promise<boolean>; // macOS only
  'system-cleaner:run-disk-cleanup': () => Promise<boolean>; // Windows only
  'system-cleaner:run-sfc': () => Promise<boolean>; // Windows only
  
  // Health Monitor
  'system-cleaner:get-health-status': () => Promise<HealthStatus>;
  'system-cleaner:start-monitoring': () => void;
  'system-cleaner:stop-monitoring': () => void;
  
  // Safety
  'system-cleaner:check-safety': (files: string[]) => Promise<SafetyCheckResult>;
  'system-cleaner:create-backup': (files: string[]) => Promise<BackupInfo>;
  'system-cleaner:restore-backup': (backupId: string) => Promise<boolean>;
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
- [ ] Platform detection system
- [ ] Setup Electron IPC handlers (cross-platform)
- [ ] Create base store structure
- [ ] Implement file scanning utilities (platform-aware)
- [ ] Setup safety database (platform-specific rules)
- [ ] Create backup system
- [ ] Platform-specific path utilities

### Phase 2: Cleanup Module (Week 3-5)
- [ ] Junk files scanner (Windows + macOS)
- [ ] Cache cleanup (platform-specific paths)
- [ ] Log files cleanup (platform-specific)
- [ ] Large files finder (cross-platform)
- [ ] Duplicate finder (cross-platform)
- [ ] Space Lens visualization (cross-platform)
- [ ] Windows-specific: Windows Update cache, Prefetch files
- [ ] macOS-specific: Time Machine snapshots, iCloud cleanup

### Phase 3: Protection Module (Week 6-8)
- [ ] Malware scanner (basic, platform-aware)
- [ ] Privacy cleanup (platform-specific)
- [ ] Browser data cleanup (all major browsers)
- [ ] Wi-Fi network cleanup (platform-specific)
- [ ] Threat removal
- [ ] Windows: Registry cleanup, Activity history
- [ ] macOS: Spotlight history, Quick Look cache

### Phase 4: Optimization Module (Week 9-11)
- [ ] App uninstaller (Windows + macOS)
- [ ] App updater (Windows Store/Chocolatey + macOS App Store)
- [ ] RAM optimization (platform-specific methods)
- [ ] Speed tools (platform-specific)
- [ ] Heavy apps monitor (cross-platform)
- [ ] Windows: Startup management, Services management
- [ ] macOS: Login items, Launch Agents

### Phase 5: Maintenance & Health (Week 12-14)
- [ ] Maintenance tasks (platform-specific)
- [ ] Health monitor (cross-platform)
- [ ] Menu bar widget (platform-specific UI)
- [ ] Alert system
- [ ] Issue detection
- [ ] Windows: SFC, DISM, Disk Cleanup automation
- [ ] macOS: Spotlight reindexing, Disk permissions

### Phase 6: Polish & Testing (Week 15-16)
- [ ] UI/UX improvements
- [ ] Platform-specific UI adaptations
- [ ] Performance optimization
- [ ] Safety testing (both platforms)
- [ ] Error handling
- [ ] Documentation
- [ ] Cross-platform testing

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

## Future Enhancements

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

