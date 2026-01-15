# Stats Monitor - UI Snapshot & Documentation

## Overview

Stats Monitor là một hệ thống monitoring toàn diện với UI hiện đại, glassmorphism design, và real-time metrics cho tất cả các thành phần hệ thống.

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header Section                                              │
│  ┌─────────────────────────┐  ┌──────────┐  ┌──────────┐   │
│  │ System Monitor (Title)  │  │ Interval │  │ Settings │   │
│  │ Real-time metrics       │  │  Control │  │  Button  │   │
│  └─────────────────────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Module Selector Tabs                                       │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ...    │
│  │CPU │ │MEM │ │NET │ │DISK│ │GPU │ │BAT │ │SEN │ ...    │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘        │
├─────────────────────────────────────────────────────────────┤
│  Modules Grid (Responsive)                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ CPU      │  │ Memory   │  │ Network  │                 │
│  │ Module   │  │ Module   │  │ Module   │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ Disk     │  │ GPU      │  │ Battery  │                 │
│  │ Module   │  │ Module   │  │ Module   │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ Sensors  │  │ Bluetooth│  │ TimeZones│                 │
│  │ Module   │  │ Module   │  │ Module   │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Header Section

### Title
- **Text**: "System Monitor"
- **Style**: Gradient text (emerald-400 → blue-500)
- **Subtitle**: "Real-time performance metrics"
- **Font**: Bold, 2xl

### Controls
- **Interval Control**: Dropdown với presets (1s, 2s, 5s, 10s, 30s)
- **Settings Button**: Icon button (chưa implement functionality)

## Module Selector

### Design
- **Container**: Glass panel với rounded-xl, border
- **Layout**: Horizontal scrollable tabs
- **State Indicators**:
  - **Enabled**: Colored background, border, dot indicator
  - **Disabled**: Transparent, muted text, hover effects

### Module Colors

| Module | Background | Text | Border | Dot |
|--------|-----------|------|--------|-----|
| CPU | emerald-500/20 | emerald-700/400 | emerald-500/40 | emerald-500 |
| Memory | blue-500/20 | blue-700/400 | blue-500/40 | blue-500 |
| Network | purple-500/20 | purple-700/400 | purple-500/40 | purple-500 |
| Disk | violet-500/20 | violet-700/400 | violet-500/40 | violet-500 |
| GPU | pink-500/20 | pink-700/400 | pink-500/40 | pink-500 |
| Battery | green-500/20 | green-700/400 | green-500/40 | green-500 |
| Sensors | orange-500/20 | orange-700/400 | orange-500/40 | orange-500 |
| Bluetooth | cyan-500/20 | cyan-700/400 | cyan-500/40 | cyan-500 |
| TimeZones | indigo-500/20 | indigo-700/400 | indigo-500/40 | indigo-500 |

## Module Cards

### Common Structure
```
┌─────────────────────────────────────┐
│  Header                             │
│  ┌────┐  ┌─────────────┐  ┌─────┐ │
│  │Icon│  │ Title       │  │Value│ │
│  │    │  │ Subtitle    │  │     │ │
│  └────┘  └─────────────┘  └─────┘ │
├─────────────────────────────────────┤
│  Graph/Visualization                │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │   LightweightGraph            │ │
│  │                               │ │
│  └───────────────────────────────┘ │
├─────────────────────────────────────┤
│  Stats Grid                         │
│  ┌──────────┐  ┌──────────┐       │
│  │ Label    │  │ Label    │       │
│  │ Value    │  │ Value    │       │
│  └──────────┘  └──────────┘       │
├─────────────────────────────────────┤
│  Info Icon (Modal Trigger)          │
└─────────────────────────────────────┘
```

### Styling
- **Container**: `bg-[var(--color-glass-panel)]`, rounded-xl, border
- **Hover**: `hover:bg-[var(--color-glass-button-hover)]`, cursor-pointer
- **Padding**: p-4
- **Gap**: gap-4 (flex-col)

### Interactive Features
- **Click**: Opens detail modal
- **Hover**: Background color change
- **Info Icon**: Bottom-right corner, opacity-50

## Module Details

### 1. CPU Module
**Color**: Emerald (#10b981)

**Display**:
- Current load percentage (large, color-coded)
- Clock speed (GHz)
- Manufacturer & brand
- Graph: 20-point history
- Stats: Cores (Physical/Logical), System Load

**Modal Details**:
- Load breakdown (User/System) với progress bars
- Core information (Physical/Logical/Threads)
- Per-core load visualization

### 2. Memory Module
**Color**: Blue (#3b82f6)

**Display**:
- Usage percentage (large, color-coded)
- Used/Total GB
- Graph: 20-point history
- Stats: Swap Used, Cached

**Modal Details**:
- Main memory breakdown (Used/Available)
- Memory details (Total/Free/Active/Cached)
- Swap memory với visualization

### 3. Network Module
**Color**: Purple (#a855f7)

**Display**:
- Interface name
- Download/Upload speeds
- Dual graphs (RX/TX)
- IP & MAC address

**Modal Details**:
- Interface information (IPv4, MAC, Type)
- Traffic statistics (Download/Upload totals)
- All interfaces list

### 4. Disk Module
**Color**: Violet (#8b5cf6)

**Display**:
- Usage percentage (large, color-coded)
- Filesystem name
- Dual graphs (Read/Write)
- Progress bar
- Free/Total GB

**Modal Details**:
- Primary disk details
- I/O statistics (Read/Write speeds)
- All disks list với usage bars

### 5. GPU Module
**Color**: Pink (#ec4899)

**Display**:
- GPU utilization percentage
- Temperature (°C)
- Model name
- Graph: 20-point history
- Stats: VRAM, Memory Load

**Modal Details**:
- GPU & Memory utilization với progress bars
- VRAM information
- Temperature display
- Hardware info (Vendor, Bus)
- All GPUs list (if multiple)

### 6. Battery Module
**Color**: Green (#10b981)

**Display**:
- Battery percentage (large, color-coded)
- Charging/Discharging status
- Time remaining
- Dual graphs (Consumption/Charging)
- Expandable details (Chevron button)

**Modal Details**:
- Status (Charging/Discharging)
- Capacity information (Current/Max/Designed/Health)
- Power information (Consumption/Charging Power)
- Additional info (Voltage, Cycle Count, Time, Manufacturer)

### 7. Sensors Module
**Color**: Orange (#f97316)

**Display**:
- Average temperature (°C, large, color-coded)
- Per-core temperatures (4-column grid)
- Max recorded temperature

**Modal Details**:
- Average & Maximum temperatures
- Per-core temperatures với visual indicators
- Temperature color coding

### 8. Bluetooth Module
**Color**: Cyan (#06b6d4)

**Display**:
- Status (On/Off với indicator)
- Connected devices count
- Device list với:
  - Device icon (headphones, mouse, keyboard, etc.)
  - Device name
  - Connection status badge
  - Signal strength bars
  - Battery level (if available)
  - Device type

**Modal Details**:
- Connection status
- MAC Address
- Device Type
- Manufacturer
- Signal Strength (RSSI với bars)
- Battery Level (progress bar)

**Filtering**:
- Tự động loại bỏ system connections
- Loại bỏ Bluetooth services/profiles

### 9. TimeZones Module
**Color**: Indigo (#6366f1)

**Display**:
- Local time zone
- Multiple time zones (default: NY, London, Tokyo, Shanghai)
- Real-time updates (every second)
- UTC offset

**Modal Details**:
- Local time với full date/time
- All time zones với real-time updates
- UTC offset information
- Formatted dates

## Detail Modals

### Common Structure
```
┌─────────────────────────────────────┐
│  Header                             │
│  ┌────┐  ┌─────────────┐  ┌─────┐ │
│  │Icon│  │ Title       │  │  X  │ │
│  │    │  │ Subtitle    │  │     │ │
│  └────┘  └─────────────┘  └─────┘ │
├─────────────────────────────────────┤
│  Content (Scrollable)               │
│  ┌───────────────────────────────┐ │
│  │  Section 1                    │ │
│  │  ┌──────────┐  ┌──────────┐   │ │
│  │  │  Card    │  │  Card    │   │ │
│  │  └──────────┘  └──────────┘   │ │
│  ├───────────────────────────────┤ │
│  │  Section 2                    │ │
│  │  ...                          │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Styling
- **Backdrop**: `bg-black/50 backdrop-blur-sm`
- **Container**: `bg-[var(--color-glass-panel)]`, max-w-2xl, rounded-xl
- **Max Height**: 90vh với overflow-y-auto
- **Z-index**: z-50

### Interactions
- **Open**: Click on module card
- **Close**: 
  - Click X button
  - Click outside modal
  - Press Escape key

## States

### 1. No Modules Enabled
- Empty state với icon
- Message: "No modules enabled"
- Instruction text

### 2. Loading
- Module skeletons (animate-pulse)
- Loading message
- Module selector visible

### 3. Active Monitoring
- Grid layout với enabled modules
- Real-time updates
- Graphs animating

## Responsive Design

### Grid Layout
- **Mobile**: 1 column (`grid-cols-1`)
- **Tablet**: 2 columns (`lg:grid-cols-2`)
- **Desktop**: 3 columns (`xl:grid-cols-3`)

### Module Selector
- Horizontal scrollable
- `overflow-x-auto scrollbar-hide`
- Responsive button sizing

## Color System

### CSS Variables
- `--color-glass-panel`: Glass panel background
- `--color-glass-border`: Border color
- `--color-glass-input`: Input/input-like backgrounds
- `--color-glass-button-hover`: Hover state
- `--foreground`: Primary text
- `--foreground-muted`: Secondary text

### Color Coding
- **Green** (0-70%): Normal/Good
- **Amber** (70-90%): Warning
- **Red** (90-100%): Critical

## Performance Optimizations

### Code Splitting
- Lazy loading cho tất cả modules
- React.lazy() với Suspense
- Module skeletons during loading

### Data Fetching
- Chỉ fetch enabled modules
- Configurable update interval
- Efficient IPC communication

### Rendering
- React.memo() cho tất cả modules
- useMemo() cho computed values
- Optimized graph rendering (20 points max)

## Menu Bar Integration

### Tray Menu
- CPU usage percentage
- Memory usage (used/total với percentage)
- Network speeds (upload/download)
- Quick link to open Stats Monitor

### Update Frequency
- Tray icon: Every 2 seconds
- Menu data: On metrics update

## Accessibility

### Keyboard Navigation
- Escape key closes modals
- Tab navigation (native)
- Focus indicators

### Visual Indicators
- Color-coded status
- Progress bars
- Icon indicators
- Hover states

## Future Enhancements

### Potential Features
- [ ] Settings modal functionality
- [ ] Module reordering (drag & drop)
- [ ] Customizable time zones
- [ ] Export metrics data
- [ ] Historical data charts
- [ ] Alerts/notifications
- [ ] Dark/Light theme toggle
- [ ] Module size customization

