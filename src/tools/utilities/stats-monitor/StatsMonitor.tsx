import React, { useMemo, Suspense } from 'react';
import { useSystemMetrics } from './hooks/useSystemMetrics';
import { useStatsStore } from './store/statsStore';
import { getModuleColors } from './constants/moduleColors';
import { Settings, Activity, RefreshCw, ChevronDown } from 'lucide-react';

// Lazy load modules để code splitting
const CPUModule = React.lazy(() => import('./components/CPUModule'));
const MemoryModule = React.lazy(() => import('./components/MemoryModule'));
const NetworkModule = React.lazy(() => import('./components/NetworkModule'));
const DiskModule = React.lazy(() => import('./components/DiskModule'));
const GPUModule = React.lazy(() => import('./components/GPUModule'));
const BatteryModule = React.lazy(() => import('./components/BatteryModule'));
const SensorsModule = React.lazy(() => import('./components/SensorsModule'));
const BluetoothModule = React.lazy(() => import('./components/BluetoothModule'));
const TimeZonesModule = React.lazy(() => import('./components/TimeZonesModule'));

// Loading skeleton cho modules
const ModuleSkeleton = () => (
  <div className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] animate-pulse">
    <div className="h-20 bg-[var(--color-glass-input)] rounded-lg mb-4" />
    <div className="h-4 bg-[var(--color-glass-input)] rounded w-3/4" />
  </div>
);

// Skeleton cho module selector tabs
const ModuleSelectorSkeleton = () => (
  <div className="flex items-center gap-3 mb-4">
    <div className="flex-1 bg-[var(--color-glass-panel)] rounded-xl p-1.5 border border-[var(--color-glass-border)] shadow-sm">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-10 w-20 bg-[var(--color-glass-input)] rounded-lg animate-pulse"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  </div>
);

const INTERVAL_PRESETS = [
  { label: '1s', value: 1000 },
  { label: '2s', value: 2000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
];

const StatsMonitor: React.FC = () => {
  const { enabledModules, preferences, toggleModule, updatePreferences } = useStatsStore();
  // Chỉ fetch metrics cho modules được bật
  const metrics = useSystemMetrics(enabledModules, preferences.updateInterval);
  const hasEnabledModules = enabledModules.length > 0;

  // Send stats data to tray for menu bar display
  React.useEffect(() => {
    if (metrics && hasEnabledModules && window.ipcRenderer) {
      // Gửi data lên main process để update tray
      window.ipcRenderer.send('stats-update-tray', {
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

  const allModules = React.useMemo(() => ['cpu', 'memory', 'network', 'disk', 'gpu', 'battery', 'sensors', 'bluetooth', 'timezones'], []);

  const [showIntervalMenu, setShowIntervalMenu] = React.useState(false);
  const intervalMenuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (intervalMenuRef.current && !intervalMenuRef.current.contains(event.target as Node)) {
        setShowIntervalMenu(false);
      }
    };

    if (showIntervalMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showIntervalMenu]);

  const currentIntervalLabel = useMemo(() => {
    const preset = INTERVAL_PRESETS.find(p => p.value === preferences.updateInterval);
    return preset ? preset.label : `${preferences.updateInterval / 1000}s`;
  }, [preferences.updateInterval]);

  // Helper function để render module selector
  const renderModuleSelector = (isLoading = false) => {
    if (isLoading) {
      return <ModuleSelectorSkeleton />;
    }

    return (
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-[var(--color-glass-panel)] rounded-xl p-1.5 border border-[var(--color-glass-border)] shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {allModules.map(mod => {
              const isEnabled = enabledModules.includes(mod);
              const colors = getModuleColors(mod);
              
              return (
                <button
                  key={mod}
                  onClick={() => toggleModule(mod)}
                  className={`
                    px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap
                    flex items-center gap-2 min-w-fit relative
                    ${isEnabled 
                      ? `${colors.bg} ${colors.text} shadow-sm border ${colors.border}` 
                      : 'bg-transparent text-foreground-muted/60 border border-transparent hover:bg-[var(--color-glass-input)] hover:text-foreground-muted hover:border-[var(--color-glass-border)]'
                    }
                  `}
                >
                  <span 
                    className={`w-2 h-2 rounded-full transition-colors duration-200 shrink-0 ${
                      isEnabled ? colors.dot : 'bg-foreground-muted/40'
                    }`} 
                  />
                  <span className="font-semibold">{mod.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Helper function để render interval control
  const renderIntervalControl = () => (
    <div className="relative" ref={intervalMenuRef}>
      <button
        onClick={() => setShowIntervalMenu(!showIntervalMenu)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--color-glass-button-hover)] rounded-lg transition-colors text-foreground-muted hover:text-foreground border border-[var(--color-glass-border)] text-xs font-medium"
      >
        <RefreshCw className="w-4 h-4" />
        <span>{currentIntervalLabel}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${showIntervalMenu ? 'rotate-180' : ''}`} />
      </button>

      {showIntervalMenu && (
        <div className="absolute right-0 mt-2 bg-[var(--color-glass-panel)] border border-[var(--color-glass-border)] rounded-lg shadow-lg z-50 min-w-[120px] overflow-hidden">
          {INTERVAL_PRESETS.map(preset => (
            <button
              key={preset.value}
              onClick={() => {
                updatePreferences({ updateInterval: preset.value });
                setShowIntervalMenu(false);
              }}
              className={`w-full px-4 py-2 text-left text-xs font-medium transition-colors ${
                preferences.updateInterval === preset.value
                  ? 'bg-[var(--color-glass-button-hover)] text-foreground'
                  : 'text-foreground-muted hover:bg-[var(--color-glass-input)] hover:text-foreground'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  // Hiển thị thông báo khi không có module nào được bật
  if (!hasEnabledModules) {
    return (
      <div className="h-full flex flex-col p-6 gap-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
              System Monitor
            </h1>
            <p className="text-foreground-muted text-sm mt-1">Real-time performance metrics</p>
          </div>
          
          <div className="flex items-center gap-2">
            {renderIntervalControl()}
            <button className="p-2.5 hover:bg-[var(--color-glass-button-hover)] rounded-lg transition-colors text-foreground-muted hover:text-foreground border border-[var(--color-glass-border)]">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {renderModuleSelector()}

        <div className="flex-1 flex flex-col items-center justify-center text-foreground-muted">
          <Activity className="w-16 h-16 mb-4 text-foreground-muted opacity-30" />
          <p className="text-lg font-medium mb-2">No modules enabled</p>
          <p className="text-sm text-center max-w-md">
            Click on any module button above to start monitoring system metrics.
            Metrics will only be collected when at least one module is enabled.
          </p>
        </div>
      </div>
    );
  }

  // Hiển thị loading khi đang khởi tạo
  if (!metrics && hasEnabledModules) {
    return (
      <div className="h-full flex flex-col p-6 gap-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
              System Monitor
            </h1>
            <p className="text-foreground-muted text-sm mt-1">Real-time performance metrics</p>
          </div>
          
          <div className="flex items-center gap-2">
            {renderIntervalControl()}
            <button className="p-2.5 hover:bg-[var(--color-glass-button-hover)] rounded-lg transition-colors text-foreground-muted hover:text-foreground border border-[var(--color-glass-border)]">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {renderModuleSelector()}

        {/* Loading skeletons cho modules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {enabledModules.map((mod) => (
            <ModuleSkeleton key={mod} />
          ))}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-foreground-muted">
          <Activity className="w-12 h-12 mb-4 animate-pulse text-foreground-muted opacity-50" />
          <p>Initializing system sensors...</p>
          <p className="text-sm mt-2">Checking Electron IPC permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
           <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
            System Monitor
          </h1>
          <p className="text-foreground-muted text-sm mt-1">Real-time performance metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          {renderIntervalControl()}
          <button className="p-2.5 hover:bg-[var(--color-glass-button-hover)] rounded-lg transition-colors text-foreground-muted hover:text-foreground border border-[var(--color-glass-border)]">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {renderModuleSelector()}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {enabledModules.includes('cpu') && metrics?.cpu && (
          <Suspense fallback={<ModuleSkeleton />}>
            <CPUModule data={metrics.cpu} />
          </Suspense>
        )}
        
        {enabledModules.includes('memory') && metrics?.memory && (
          <Suspense fallback={<ModuleSkeleton />}>
            <MemoryModule data={metrics.memory} />
          </Suspense>
        )}

        {enabledModules.includes('network') && metrics?.network && (
          <Suspense fallback={<ModuleSkeleton />}>
            <NetworkModule data={metrics.network} />
          </Suspense>
        )}

        {enabledModules.includes('disk') && metrics?.disk && (
          <Suspense fallback={<ModuleSkeleton />}>
            <DiskModule data={metrics.disk} />
          </Suspense>
        )}

        {enabledModules.includes('gpu') && metrics?.gpu && (
          <Suspense fallback={<ModuleSkeleton />}>
            <GPUModule data={metrics.gpu} />
          </Suspense>
        )}

        {enabledModules.includes('battery') && metrics?.battery && (
          <Suspense fallback={<ModuleSkeleton />}>
            <BatteryModule data={metrics.battery} />
          </Suspense>
        )}

        {enabledModules.includes('sensors') && metrics?.sensors && (
          <Suspense fallback={<ModuleSkeleton />}>
            <SensorsModule data={metrics.sensors} />
          </Suspense>
        )}

        {enabledModules.includes('bluetooth') && metrics?.bluetooth && (
          <Suspense fallback={<ModuleSkeleton />}>
            <BluetoothModule data={metrics.bluetooth} />
          </Suspense>
        )}

        {enabledModules.includes('timezones') && metrics?.timeZones && (
          <Suspense fallback={<ModuleSkeleton />}>
            <TimeZonesModule data={metrics.timeZones} />
          </Suspense>
        )}
      </div>

       {/* Debug / Raw Data View (Optional, maybe hidden or collapsible) */}
       {/* <div className="mt-8 p-4 bg-black/40 rounded-lg overflow-auto max-h-60 text-xs font-mono text-white/30">
        <pre>{JSON.stringify(metrics, null, 2)}</pre>
       </div> */}
    </div>
  );
};

export default StatsMonitor;
