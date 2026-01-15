# Stats Monitor - Additional Modules & Menu Bar Integration Plan

## Overview

Implement các Additional Modules còn thiếu và Basic menu bar integration cho Stats Monitor:
- **Bluetooth Module**: Hiển thị connected devices
- **Time Zones Module**: Hiển thị multiple time zones
- **Menu Bar Integration**: Tray icon với dropdown menu hiển thị quick stats

## Implementation Plan

### Phase 1: TypeScript Types

**File**: `src/types/stats.ts`

Thêm types mới:

```typescript
export interface BluetoothDevice {
  name: string;
  mac: string;
  type: string; // 'headphones', 'mouse', 'keyboard', 'speaker', etc.
  battery?: number; // Battery level (0-100)
  connected: boolean;
  rssi?: number; // Signal strength
  manufacturer?: string;
}

export interface BluetoothStats {
  enabled: boolean;
  devices: BluetoothDevice[];
}

export interface TimeZoneInfo {
  timezone: string; // e.g., 'America/New_York'
  city: string; // e.g., 'New York'
  time: string; // Formatted time
  date: string; // Formatted date
  offset: number; // UTC offset in hours
}

export interface TimeZonesStats {
  local: TimeZoneInfo;
  zones: TimeZoneInfo[]; // Additional time zones
}
```

Cập nhật `SystemMetrics`:

```typescript
export interface SystemMetrics {
  cpu: CPUStats;
  memory: MemoryStats;
  network: NetworkStats;
  disk?: DiskStats;
  gpu?: GPUStats;
  battery?: BatteryStats;
  sensors?: SensorStats;
  bluetooth?: BluetoothStats;
  timeZones?: TimeZonesStats;
  timestamp: number;
}
```

### Phase 2: Backend IPC Handlers

**File**: `electron/main/main.ts`

Thêm IPC handlers:

```typescript
// Bluetooth stats
ipcMain.handle('get-bluetooth-stats', async () => {
  try {
    const bluetooth = await si.bluetoothDevices();
    return {
      enabled: bluetooth.length > 0 || await checkBluetoothEnabled(),
      devices: bluetooth.map(device => ({
        name: device.name || 'Unknown',
        mac: device.mac || '',
        type: device.type || 'unknown',
        battery: device.battery || undefined,
        connected: device.connected || false,
        rssi: device.rssi || undefined,
        manufacturer: device.manufacturer || undefined,
      }))
    };
  } catch (error) {
    console.error('Error fetching bluetooth stats:', error);
    return { enabled: false, devices: [] };
  }
});

// Time zones stats
ipcMain.handle('get-timezones-stats', async () => {
  try {
    const time = await si.time();
    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Default time zones (có thể config từ preferences)
    const defaultZones = [
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
      'Asia/Shanghai',
    ];
    
    const zones = defaultZones.map(tz => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      
      const offset = getTimezoneOffset(tz);
      const cityName = tz.split('/').pop()?.replace('_', ' ') || tz;
      
      return {
        timezone: tz,
        city: cityName,
        time: formatter.format(now),
        date: dateFormatter.format(now),
        offset,
      };
    });
    
    return {
      local: {
        timezone: localTz,
        city: localTz.split('/').pop()?.replace('_', ' ') || 'Local',
        time: time.current,
        date: time.uptime ? new Date().toLocaleDateString() : '',
        offset: getTimezoneOffset(localTz),
      },
      zones,
    };
  } catch (error) {
    console.error('Error fetching timezones stats:', error);
    return null;
  }
});

// Helper functions
async function checkBluetoothEnabled(): Promise<boolean> {
  try {
    // Platform-specific check
    if (process.platform === 'darwin') {
      // macOS: Check via system_profiler
      const { execSync } = require('child_process');
      const result = execSync('system_profiler SPBluetoothDataType').toString();
      return result.includes('Bluetooth: On');
    }
    // Windows/Linux: Assume enabled if devices found
    return true;
  } catch {
    return false;
  }
}

function getTimezoneOffset(timezone: string): number {
  const now = new Date();
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return (tz.getTime() - utc.getTime()) / (1000 * 60 * 60);
}
```

### Phase 3: Preload API

**File**: `electron/preload/preload.ts`

Thêm methods:

```typescript
contextBridge.exposeInMainWorld('statsAPI', {
  // ... existing methods
  getBluetoothStats: () => ipcRenderer.invoke('get-bluetooth-stats'),
  getTimeZonesStats: () => ipcRenderer.invoke('get-timezones-stats'),
});
```

### Phase 4: Update useSystemMetrics Hook

**File**: `src/tools/utilities/stats-monitor/hooks/useSystemMetrics.ts`

Cập nhật để fetch bluetooth và timezones:

```typescript
if (enabledModules.includes('bluetooth')) {
  promises.push(window.statsAPI.getBluetoothStats());
  keys.push('bluetooth');
}
if (enabledModules.includes('timezones')) {
  promises.push(window.statsAPI.getTimeZonesStats());
  keys.push('timeZones');
}
```

### Phase 5: Bluetooth Module Component

**File**: `src/tools/utilities/stats-monitor/components/BluetoothModule.tsx` (new)

Features:
- Hiển thị danh sách connected devices
- Battery level cho mỗi device (nếu có)
- Device type icon (headphones, mouse, keyboard, etc.)
- Signal strength indicator
- Empty state khi không có devices
- Loading state

### Phase 6: Time Zones Module Component

**File**: `src/tools/utilities/stats-monitor/components/TimeZonesModule.tsx` (new)

Features:
- Hiển thị local time
- Hiển thị multiple time zones
- Format: City name, time, date, UTC offset
- Auto-update mỗi giây
- Compact layout

### Phase 7: Update StatsMonitor Component

**File**: `src/tools/utilities/stats-monitor/StatsMonitor.tsx`

Thêm modules mới:
- Import BluetoothModule và TimeZonesModule
- Thêm vào allModules array
- Thêm vào module selector
- Thêm vào grid rendering

### Phase 8: Update Module Colors

**File**: `src/tools/utilities/stats-monitor/constants/moduleColors.ts`

Thêm colors cho bluetooth và timezones:

```typescript
bluetooth: { 
  bg: 'bg-cyan-500/20 dark:bg-cyan-500/15', 
  text: 'text-cyan-700 dark:text-cyan-400', 
  border: 'border-cyan-500/40', 
  dot: 'bg-cyan-500' 
},
timezones: { 
  bg: 'bg-indigo-500/20 dark:bg-indigo-500/15', 
  text: 'text-indigo-700 dark:text-indigo-400', 
  border: 'border-indigo-500/40', 
  dot: 'bg-indigo-500' 
},
```

### Phase 9: Menu Bar Integration

**File**: `electron/main/main.ts`

Tạo stats-specific tray menu:

```typescript
let statsTray: Tray | null = null;
let statsMenuData: {
  cpu: number;
  memory: { used: number; total: number; percent: number };
  network: { rx: number; tx: number };
} | null = null;

function createStatsTray() {
  if (statsTray) return;
  
  // Tạo dynamic icon dựa trên CPU usage
  const icon = createStatsIcon(statsMenuData?.cpu || 0);
  statsTray = new Tray(icon);
  statsTray.setToolTip('Stats Monitor');
  
  updateStatsTrayMenu();
  
  // Update icon mỗi 2 giây
  setInterval(() => {
    if (statsMenuData) {
      const newIcon = createStatsIcon(statsMenuData.cpu);
      statsTray?.setImage(newIcon);
    }
  }, 2000);
}

function createStatsIcon(cpuUsage: number): Electron.NativeImage {
  // Tạo icon động dựa trên CPU usage
  // Green (0-50%), Yellow (50-80%), Red (80-100%)
  const canvas = document.createElement('canvas');
  canvas.width = 22;
  canvas.height = 22;
  const ctx = canvas.getContext('2d');
  
  // Draw icon based on CPU usage
  // ... implementation
  
  return nativeImage.createFromDataURL(canvas.toDataURL());
}

function updateStatsTrayMenu() {
  if (!statsTray) return;
  
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '📊 Stats Monitor',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: `CPU: ${statsMenuData?.cpu.toFixed(1) || 0}%`,
      enabled: false,
    },
    {
      label: `Memory: ${formatBytes(statsMenuData?.memory.used || 0)} / ${formatBytes(statsMenuData?.memory.total || 0)}`,
      enabled: false,
    },
    {
      label: `Network: ↑${formatSpeed(statsMenuData?.network.rx || 0)} ↓${formatSpeed(statsMenuData?.network.tx || 0)}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Open Stats Monitor',
      click: () => {
        win?.webContents.send('navigate-to', '/stats-monitor');
        win?.show();
      },
    },
    {
      label: 'Preferences...',
      click: () => {
        win?.webContents.send('navigate-to', '/settings');
        win?.show();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ];
  
  const menu = Menu.buildFromTemplate(template);
  statsTray.setContextMenu(menu);
}

// IPC handler để update stats menu data
ipcMain.on('stats-update-tray', (event, data) => {
  statsMenuData = data;
  updateStatsTrayMenu();
  if (statsTray && statsMenuData) {
    const icon = createStatsIcon(statsMenuData.cpu);
    statsTray.setImage(icon);
  }
});
```

### Phase 10: Frontend Tray Integration

**File**: `src/tools/utilities/stats-monitor/StatsMonitor.tsx`

Thêm logic để gửi stats data lên tray:

```typescript
useEffect(() => {
  if (metrics && hasEnabledModules) {
    // Gửi data lên main process để update tray
    window.ipcRenderer?.send('stats-update-tray', {
      cpu: metrics.cpu?.load.currentLoad || 0,
      memory: {
        used: metrics.memory?.used || 0,
        total: metrics.memory?.total || 0,
        percent: metrics.memory ? (metrics.memory.used / metrics.memory.total) * 100 : 0,
      },
      network: {
        rx: metrics.network?.stats[0]?.rx_sec || 0,
        tx: metrics.network?.stats[0]?.tx_sec || 0,
      },
    });
  }
}, [metrics, hasEnabledModules]);
```

## Implementation Todos

1. **Types**: Thêm BluetoothStats, TimeZonesStats vào `src/types/stats.ts`
2. **Backend IPC**: Implement `get-bluetooth-stats` và `get-timezones-stats` handlers
3. **Preload API**: Thêm getBluetoothStats và getTimeZonesStats
4. **useSystemMetrics**: Cập nhật để fetch bluetooth và timezones
5. **BluetoothModule**: Tạo component với device list và battery indicators
6. **TimeZonesModule**: Tạo component với multiple time zones display
7. **StatsMonitor**: Thêm bluetooth và timezones vào module list và rendering
8. **Module Colors**: Thêm colors cho bluetooth và timezones
9. **Menu Bar Tray**: Tạo statsTray với dynamic icon và context menu
10. **Frontend Integration**: Gửi stats data lên tray để update menu

## Platform-Specific Notes

### Bluetooth
- **macOS**: `system_profiler SPBluetoothDataType`
- **Windows**: WMI queries hoặc Bluetooth APIs
- **Linux**: `bluetoothctl` hoặc `/sys/class/bluetooth`

### Time Zones
- Sử dụng `Intl.DateTimeFormat` với timeZone option
- Có thể lấy danh sách time zones từ `Intl.supportedValuesOf('timeZone')`
- UTC offset calculation cần xử lý DST

## UI/UX Considerations

### Bluetooth Module
- Device type icons (lucide-react: Headphones, Mouse, Keyboard, etc.)
- Battery indicator với color coding
- Signal strength bars
- Empty state message

### Time Zones Module
- Compact clock display
- City names với time
- UTC offset indicator (+/-)
- Auto-refresh mỗi giây

### Menu Bar
- Dynamic icon color (green/yellow/red) based on CPU
- Compact stats display
- Quick actions (Open, Preferences)
- Tooltip với summary

## Performance

- Bluetooth: Poll mỗi 5-10 giây (không cần real-time)
- Time Zones: Update mỗi giây (lightweight)
- Tray icon: Update mỗi 2 giây
- Menu: Update khi có data mới

