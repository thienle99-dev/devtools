# Stats Monitor Tool - Specification

## Overview

A comprehensive system monitoring tool inspired by Stats (34.4k stars on GitHub), providing real-time system metrics in a native menu bar interface. The tool focuses on low CPU impact, keyboard-driven UX, and modular architecture for easy customization.

## Tool Definition

```typescript
{
    id: 'stats-monitor',
    name: 'Stats Monitor',
    path: '/stats-monitor',
    description: 'Real-time system monitoring with CPU, GPU, memory, network, and more',
    category: 'utilities',
    icon: Activity, // from lucide-react
    keywords: ['monitor', 'system', 'cpu', 'gpu', 'memory', 'network', 'stats', 'performance']
}
```

## Core Features

### 1. System Monitoring Modules (9+)

#### CPU Module

- **Real-time CPU utilization** (percentage)
- **Per-core usage** (multi-core visualization)
- **Top processes** (CPU usage sorted)
- **CPU temperature** (if available)
- **Frequency/clock speed**

#### GPU Module

- **GPU utilization** (percentage)
- **GPU memory usage** (VRAM)
- **GPU temperature**
- **Active GPU** (integrated vs discrete)

#### Memory Module

- **RAM usage** (used/total)
- **Memory pressure** (color-coded)
- **Swap usage**
- **Memory breakdown** (wired, active, inactive, free)

#### Disk Module

- **Disk activity** (read/write speeds)
- **Disk space** (used/free per volume)
- **Disk I/O** (real-time graphs)
- **Disk health** (SMART data if available)

#### Network Module

- **Network in/out** (upload/download speeds)
- **Active connections** (TCP/UDP)
- **Network interface** (WiFi/Ethernet)
- **Data usage** (total sent/received)

#### Battery Module (Laptop)

- **Battery level** (percentage)
- **Battery status** (charging/discharging)
- **Time remaining** (estimated)
- **Battery health** (cycle count, capacity)

#### Sensors Module

- **Temperature sensors** (CPU, GPU, SSD, etc.)
- **Voltage sensors**
- **Power consumption**
- **Fan speed** (if available)

#### Bluetooth Module

- **Connected devices** (list)
- **Device status** (battery level, signal strength)
- **Device type** (headphones, mouse, keyboard, etc.)

#### Time Zones Module

- **Multiple time zones** (configurable)
- **World clock** (with city names)
- **Time zone indicators**

### 2. Menu Bar Integration

#### Native Menu Bar Dropdown

- **Menu bar icon** (compact, color-coded)
- **Click to open dropdown** (native macOS style)
- **Module list** (expandable sections)
- **Quick actions** (toggle modules on/off)
- **Real-time graphs** (mini charts in menu)

#### Menu Bar Icon States

- **Color-coded** (green = normal, yellow = warning, red = critical)
- **Animated** (pulse on high usage)
- **Customizable** (icon style, position)

### 3. Customizable Widgets (13+)

#### Widget Types

1. **CPU Widget** - Real-time CPU usage graph
2. **GPU Widget** - GPU utilization and temperature
3. **Memory Widget** - RAM usage with breakdown
4. **Disk Widget** - Disk activity and space
5. **Network Widget** - Upload/download speeds
6. **Battery Widget** - Battery level and status
7. **Temperature Widget** - System temperatures
8. **Network Speed Widget** - Large speed display
9. **Top Processes Widget** - CPU/Memory top processes
10. **Bluetooth Widget** - Connected devices
11. **Time Zones Widget** - Multiple clocks
12. **System Info Widget** - OS version, uptime
13. **Combined Widget** - Multiple metrics in one

#### Widget Features

- **Drag-drop positioning** (anywhere on desktop)
- **Resizable** (small, medium, large)
- **Customizable appearance** (theme, colors, transparency)
- **Always on top** (overlay mode)
- **Click-through** (optional)

### 4. Real-time Data Visualization

#### Graph Types

- **Line graphs** (time-series data)
- **Bar charts** (instantaneous values)
- **Gauge charts** (percentage indicators)
- **Sparklines** (mini trends)

#### Update Frequency

- **High priority** (CPU, GPU): 1 second
- **Medium priority** (Memory, Network): 2-3 seconds
- **Low priority** (Disk, Battery): 5-10 seconds
- **Configurable** (user can adjust)

### 5. Preferences & Customization

#### Module Management

- **Enable/disable modules** (reduce CPU usage)
- **Reorder modules** (drag-drop in menu)
- **Module settings** (update frequency, thresholds)
- **Module visibility** (show/hide in menu bar)

#### Appearance

- **Theme** (dark/light/auto)
- **Color scheme** (custom colors)
- **Font size** (compact/normal/large)
- **Graph style** (line/bar/gradient)

#### Widget Configuration

- **Widget placement** (grid/absolute)
- **Widget size** (presets or custom)
- **Widget transparency** (0-100%)
- **Widget behavior** (click-through, always on top)

### 6. Advanced Features

#### Stats Remote (Web Dashboard)

- **Enable remote access** (local network)
- **Web interface** (responsive design)
- **Access from iPhone/PC** (browser-based)
- **Authentication** (optional password)
- **Real-time sync** (WebSocket connection)

#### Fan Control (Legacy Macs)

- **Manual fan control** (if supported)
- **Fan speed adjustment** (RPM)
- **Temperature-based auto** (custom curves)
- **Warning** (use at own risk)

#### External API

- **REST API** (for updates)
- **Public IP detection** (network info)
- **System info endpoint** (JSON)
- **Health check endpoint**

#### Multi-language Support

- **39 languages** (including Vietnamese)
- **Auto-detect** (system language)
- **Manual selection** (preferences)
- **RTL support** (right-to-left languages)

## Technical Implementation

### Architecture

```
src/tools/utilities/stats-monitor/
├── StatsMonitor.tsx              # Main component
├── components/
│   ├── MenuBarIcon.tsx          # Menu bar icon component
│   ├── ModuleList.tsx           # Dropdown module list
│   ├── CPUModule.tsx            # CPU monitoring module
│   ├── GPUModule.tsx            # GPU monitoring module
│   ├── MemoryModule.tsx         # Memory monitoring module
│   ├── DiskModule.tsx           # Disk monitoring module
│   ├── NetworkModule.tsx        # Network monitoring module
│   ├── BatteryModule.tsx       # Battery monitoring module
│   ├── SensorsModule.tsx       # Sensors module
│   ├── BluetoothModule.tsx     # Bluetooth module
│   ├── TimeZonesModule.tsx     # Time zones module
│   ├── Graph.tsx                # Reusable graph component
│   ├── Widget.tsx               # Base widget component
│   ├── WidgetManager.tsx        # Widget overlay manager
│   └── Preferences.tsx          # Settings/preferences modal
├── hooks/
│   ├── useSystemMetrics.ts      # System metrics hook
│   ├── useCPU.ts                # CPU monitoring hook
│   ├── useGPU.ts                # GPU monitoring hook
│   ├── useMemory.ts             # Memory monitoring hook
│   ├── useDisk.ts               # Disk monitoring hook
│   ├── useNetwork.ts            # Network monitoring hook
│   ├── useBattery.ts            # Battery monitoring hook
│   ├── useSensors.ts            # Sensors hook
│   ├── useBluetooth.ts          # Bluetooth hook
│   └── useTimeZones.ts          # Time zones hook
├── utils/
│   ├── systemInfo.ts            # System info utilities
│   ├── chartHelpers.ts          # Chart.js helpers
│   ├── polling.ts                # Low-impact polling
│   └── colorUtils.ts            # Color coding utilities
└── store/
    └── statsStore.ts            # Zustand store for stats data
```

### Electron Integration

#### Main Process (electron/main/main.ts)

```typescript
// System monitoring via Electron/systeminformation
import si from "systeminformation";

// Menu bar integration
let statsTray: Tray | null = null;

function createStatsTray() {
  const icon = createStatsIcon(); // Dynamic icon based on CPU usage
  statsTray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: "CPU: 45%", enabled: false },
    { label: "Memory: 8.2/16 GB", enabled: false },
    { type: "separator" },
    { label: "Open Stats Monitor", click: () => openStatsWindow() },
    { label: "Preferences...", click: () => openPreferences() },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]);

  statsTray.setContextMenu(contextMenu);
  statsTray.setToolTip("Stats Monitor");
}

// IPC handlers for system metrics
ipcMain.handle("get-cpu-stats", async () => {
  const cpu = await si.cpu();
  const currentLoad = await si.currentLoad();
  return { cpu, load: currentLoad };
});

ipcMain.handle("get-memory-stats", async () => {
  return await si.mem();
});

ipcMain.handle("get-network-stats", async () => {
  const networkStats = await si.networkStats();
  const networkInterfaces = await si.networkInterfaces();
  return { stats: networkStats, interfaces: networkInterfaces };
});

// ... more IPC handlers
```

#### Preload Script

```typescript
// electron/preload/preload.ts
contextBridge.exposeInMainWorld("statsAPI", {
  getCPUStats: () => ipcRenderer.invoke("get-cpu-stats"),
  getMemoryStats: () => ipcRenderer.invoke("get-memory-stats"),
  getNetworkStats: () => ipcRenderer.invoke("get-network-stats"),
  // ... more methods
});
```

### Data Polling Strategy

#### Low-Impact Polling

```typescript
// src/tools/utilities/stats-monitor/hooks/useSystemMetrics.ts
import { useEffect, useRef } from "react";

export const useSystemMetrics = (enabled: boolean, interval: number = 1000) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchMetrics = async () => {
      try {
        // Batch requests to reduce IPC overhead
        const [cpu, memory, network] = await Promise.all([
          (window as any).statsAPI.getCPUStats(),
          (window as any).statsAPI.getMemoryStats(),
          (window as any).statsAPI.getNetworkStats(),
        ]);

        setMetrics({ cpu, memory, network, timestamp: Date.now() });
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Polling with requestAnimationFrame for smooth updates
    const poll = () => {
      fetchMetrics();
      intervalRef.current = setTimeout(poll, interval);
    };

    intervalRef.current = setTimeout(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [enabled, interval]);

  return metrics;
};
```

### Chart Visualization

#### Chart.js Integration

```typescript
// src/tools/utilities/stats-monitor/components/Graph.tsx
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface GraphProps {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
}

export const Graph: React.FC<GraphProps> = ({ data, labels, color, height = 60 }) => {
  const chartData = {
    labels,
    datasets: [{
      label: 'Usage',
      data,
      borderColor: color,
      backgroundColor: `${color}20`,
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      borderWidth: 2,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: {
        display: false,
        min: 0,
        max: 100
      }
    }
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
```

### Widget System

#### Widget Overlay Manager

```typescript
// src/tools/utilities/stats-monitor/components/WidgetManager.tsx
import { createPortal } from 'react-dom';

export const WidgetManager: React.FC = () => {
  const widgets = useStatsStore(state => state.widgets);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.id = 'stats-widget-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(overlay);
    setContainer(overlay);

    return () => {
      document.body.removeChild(overlay);
    };
  }, []);

  if (!container) return null;

  return createPortal(
    <>
      {widgets.map(widget => (
        <Widget
          key={widget.id}
          type={widget.type}
          position={widget.position}
          size={widget.size}
          config={widget.config}
        />
      ))}
    </>,
    container
  );
};
```

### State Management

#### Zustand Store

```typescript
// src/tools/utilities/stats-monitor/store/statsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SystemMetrics {
  cpu: CPUStats;
  gpu: GPUStats;
  memory: MemoryStats;
  disk: DiskStats;
  network: NetworkStats;
  battery?: BatteryStats;
  sensors?: SensorStats;
  bluetooth?: BluetoothDevice[];
  timestamp: number;
}

interface Widget {
  id: string;
  type: WidgetType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  enabled: boolean;
}

interface StatsStore {
  metrics: SystemMetrics | null;
  enabledModules: string[];
  moduleOrder: string[];
  widgets: Widget[];
  preferences: {
    updateInterval: number;
    theme: "dark" | "light" | "auto";
    colorScheme: "default" | "custom";
    showMenuBar: boolean;
    menuBarPosition: "left" | "right";
  };

  // Actions
  updateMetrics: (metrics: SystemMetrics) => void;
  toggleModule: (moduleId: string) => void;
  reorderModules: (order: string[]) => void;
  addWidget: (widget: Omit<Widget, "id">) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  updatePreferences: (prefs: Partial<StatsStore["preferences"]>) => void;
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      metrics: null,
      enabledModules: ["cpu", "memory", "network", "disk"],
      moduleOrder: ["cpu", "memory", "network", "disk", "gpu", "battery"],
      widgets: [],
      preferences: {
        updateInterval: 1000,
        theme: "auto",
        colorScheme: "default",
        showMenuBar: true,
        menuBarPosition: "right",
      },

      updateMetrics: (metrics) => set({ metrics }),
      toggleModule: (moduleId) =>
        set((state) => ({
          enabledModules: state.enabledModules.includes(moduleId)
            ? state.enabledModules.filter((id) => id !== moduleId)
            : [...state.enabledModules, moduleId],
        })),
      reorderModules: (order) => set({ moduleOrder: order }),
      addWidget: (widget) =>
        set((state) => ({
          widgets: [
            ...state.widgets,
            { ...widget, id: `widget-${Date.now()}` },
          ],
        })),
      removeWidget: (id) =>
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== id),
        })),
      updateWidget: (id, updates) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        })),
      updatePreferences: (prefs) =>
        set((state) => ({
          preferences: { ...state.preferences, ...prefs },
        })),
    }),
    { name: "stats-monitor-storage" }
  )
);
```

## UI/UX Design

### Menu Bar Dropdown

```
┌─────────────────────────────────────┐
│  📊 Stats Monitor                   │
├─────────────────────────────────────┤
│  CPU                                │
│  ┌─────────────────────────────┐   │
│  │  [Real-time graph]          │   │
│  └─────────────────────────────┘   │
│  Usage: 45%  │  Temp: 65°C         │
│  Top: Chrome (12%)                  │
│  [Toggle] [Settings]                │
├─────────────────────────────────────┤
│  Memory                             │
│  ┌─────────────────────────────┐   │
│  │  [Memory graph]             │   │
│  └─────────────────────────────┘   │
│  8.2 / 16 GB (51%)                  │
│  [Toggle] [Settings]                │
├─────────────────────────────────────┤
│  Network                            │
│  ↑ 2.5 MB/s  ↓ 1.2 MB/s            │
│  [Toggle] [Settings]                │
├─────────────────────────────────────┤
│  Preferences...                      │
│  Quit                               │
└─────────────────────────────────────┘
```

### Main Window Layout

```
┌─────────────────────────────────────────────────────────┐
│  Stats Monitor                    [⚙️] [×]              │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   CPU    │  │  Memory  │  │  Network │             │
│  │  45%     │  │  8.2 GB  │  │ ↑2.5 MB/s│             │
│  │ [Graph]  │  │ [Graph]  │  │ ↓1.2 MB/s│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   Disk   │  │   GPU    │  │  Battery │             │
│  │ 500 GB   │  │  30%     │  │   85%    │             │
│  │ [Graph]  │  │ [Graph]  │  │ 3h left  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  [Widgets] [Preferences] [Remote]                      │
└─────────────────────────────────────────────────────────┘
```

### Color Coding

- **Green** (0-50%): Normal usage
- **Yellow** (50-80%): Moderate usage
- **Orange** (80-95%): High usage
- **Red** (95-100%): Critical usage

## User Flow

### Initial Setup

1. **Install** → Open app
2. **Grant Permissions** → Accessibility, Full Disk Access (if needed)
3. **Menu bar icon appears** → Click to open
4. **Onboarding** → Quick tour of features

### Daily Usage

1. **Click menu bar icon** → View quick stats
2. **Toggle modules** → Enable/disable as needed
3. **Open full window** → Detailed view
4. **Customize widgets** → Drag-drop on desktop
5. **Check preferences** → Adjust settings

### Customization Flow

1. **Open Preferences** → Settings modal
2. **Reorder modules** → Drag-drop in list
3. **Configure widgets** → Add/remove/resize
4. **Adjust update frequency** → Balance performance
5. **Save** → Changes apply immediately

## Performance Optimization

### Low CPU Impact Strategies

1. **Adaptive Polling**
   - Reduce frequency when window not visible
   - Pause polling when all modules disabled
   - Use requestAnimationFrame for smooth updates

2. **Data Batching**
   - Batch IPC calls (Promise.all)
   - Cache static data (CPU cores, disk volumes)
   - Debounce expensive operations

3. **Efficient Rendering**
   - Virtual scrolling for long lists
   - Memoize graph components
   - Use CSS transforms for animations

4. **Module Toggling**
   - Disable unused modules (50% CPU reduction)
   - Lazy load module components
   - Unmount disabled modules

## Dependencies

### Core

- `systeminformation` - System metrics (Electron main process)
- `chart.js` + `react-chartjs-2` - Graph visualization
- `zustand` - State management
- `date-fns` - Time formatting

### Optional

- `react-draggable` - Widget dragging
- `react-resizable` - Widget resizing
- `express` - Stats Remote web server
- `ws` - WebSocket for real-time remote

## Implementation Checklist

### Phase 1: Core Monitoring

- [x] Setup Electron IPC for system metrics
- [x] Implement CPU module
- [x] Implement Memory module
- [x] Implement Network module
- [ ] Basic menu bar integration
- [x] Real-time graph visualization

### Phase 2: Additional Modules

- [x] Disk module
- [x] GPU module
- [x] Battery module
- [x] Sensors module
- [ ] Bluetooth module
- [ ] Time zones module

### Phase 3: Widgets & Customization

- [ ] Widget system architecture
- [ ] Drag-drop widget positioning
- [ ] Widget resizing
- [ ] Widget configuration
- [ ] Module reordering
- [ ] Preferences UI

### Phase 4: Advanced Features

- [ ] Stats Remote (web dashboard)
- [ ] Multi-language support
- [ ] Fan control (if supported)
- [ ] External API
- [ ] Auto-update mechanism

### Phase 5: Polish

- [ ] Keyboard shortcuts
- [ ] Onboarding flow
- [ ] Performance optimization
- [ ] Accessibility
- [ ] Documentation

## Security & Privacy

- **Local-only** - No data sent to external servers
- **Optional Remote** - User must explicitly enable
- **Permissions** - Request only necessary permissions
- **Data Storage** - All data stored locally
- **No Telemetry** - Privacy-first approach

## Future Enhancements

- **Plugin System** - Custom modules via plugins
- **Themes Marketplace** - Community themes
- **Export Reports** - CSV/JSON export
- **Alerts** - Threshold-based notifications
- **Historical Data** - Long-term trends
- **Mobile App** - Companion app for remote monitoring
