import React, { useMemo } from 'react';
import { useSystemMetrics } from './hooks/useSystemMetrics';
import { useStatsStore } from './store/statsStore';
import { CPUModule } from './components/CPUModule';
import { MemoryModule } from './components/MemoryModule';
import { NetworkModule } from './components/NetworkModule';
import { DiskModule } from './components/DiskModule';
import { GPUModule } from './components/GPUModule';
import { BatteryModule } from './components/BatteryModule';
import { SensorsModule } from './components/SensorsModule';
import { Settings, Activity, RefreshCw, ChevronDown } from 'lucide-react';

const INTERVAL_PRESETS = [
  { label: '1s', value: 1000 },
  { label: '2s', value: 2000 },
  { label: '5s', value: 5000 },
  { label: '10s', value: 10000 },
  { label: '30s', value: 30000 },
];

const StatsMonitor: React.FC = () => {
  const { enabledModules, preferences, toggleModule, updatePreferences } = useStatsStore();
  // Chỉ bắt đầu đọc metrics khi có ít nhất một module được bật
  const hasEnabledModules = enabledModules.length > 0;
  const metrics = useSystemMetrics(hasEnabledModules, preferences.updateInterval);

  const allModules = React.useMemo(() => ['cpu', 'memory', 'network', 'disk', 'gpu', 'battery', 'sensors'], []);

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
  const renderModuleSelector = () => {
    return (
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-[var(--color-glass-panel)] rounded-xl p-1.5 border border-[var(--color-glass-border)] shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {allModules.map(mod => {
              const isEnabled = enabledModules.includes(mod);
              const moduleColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
                cpu: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-500' },
                memory: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', dot: 'bg-blue-500' },
                network: { bg: 'bg-purple-500/15', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', dot: 'bg-purple-500' },
                disk: { bg: 'bg-violet-500/15', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-500/30', dot: 'bg-violet-500' },
                gpu: { bg: 'bg-pink-500/15', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-500/30', dot: 'bg-pink-500' },
                battery: { bg: 'bg-green-500/15', text: 'text-green-600 dark:text-green-400', border: 'border-green-500/30', dot: 'bg-green-500' },
                sensors: { bg: 'bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-500' },
              };
              const colors = moduleColors[mod] || { bg: 'bg-gray-500/15', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/30', dot: 'bg-gray-500' };
              
              return (
                <button
                  key={mod}
                  onClick={() => toggleModule(mod)}
                  className={`
                    px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap
                    flex items-center gap-2 min-w-fit
                    ${isEnabled 
                      ? `${colors.bg} ${colors.text} border-2 ${colors.border} shadow-sm scale-105` 
                      : 'bg-transparent text-foreground-muted border-2 border-transparent hover:bg-[var(--color-glass-input)] hover:text-foreground hover:border-[var(--color-glass-border)]'
                    }
                  `}
                >
                  <span className={`w-2 h-2 rounded-full ${isEnabled ? colors.dot : 'bg-foreground-muted'}`} />
                  {mod.toUpperCase()}
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
  if (!metrics) {
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
        {enabledModules.includes('cpu') && metrics.cpu && (
            <CPUModule data={metrics.cpu} />
        )}
        
        {enabledModules.includes('memory') && metrics.memory && (
            <MemoryModule data={metrics.memory} />
        )}

        {enabledModules.includes('network') && metrics.network && (
            <NetworkModule data={metrics.network} />
        )}

        {enabledModules.includes('disk') && metrics.disk && (
            <DiskModule data={metrics.disk} />
        )}

        {enabledModules.includes('gpu') && metrics.gpu && (
            <GPUModule data={metrics.gpu} />
        )}

        {enabledModules.includes('battery') && metrics.battery && (
            <BatteryModule data={metrics.battery} />
        )}

        {enabledModules.includes('sensors') && metrics.sensors && (
            <SensorsModule data={metrics.sensors} />
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
