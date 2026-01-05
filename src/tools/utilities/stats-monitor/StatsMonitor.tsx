import React from 'react';
import { useSystemMetrics } from './hooks/useSystemMetrics';
import { useStatsStore } from './store/statsStore';
import { CPUModule } from './components/CPUModule';
import { MemoryModule } from './components/MemoryModule';
import { NetworkModule } from './components/NetworkModule';
import { DiskModule } from './components/DiskModule';
import { GPUModule } from './components/GPUModule';
import { BatteryModule } from './components/BatteryModule';
import { SensorsModule } from './components/SensorsModule';
import { Settings, Activity } from 'lucide-react';

const StatsMonitor: React.FC = () => {
  const { enabledModules, preferences, toggleModule } = useStatsStore();
  const metrics = useSystemMetrics(true, preferences.updateInterval);

  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-foreground-muted">
        <Activity className="w-12 h-12 mb-4 animate-pulse text-foreground-muted opacity-50" />
        <p>Initializing system sensors...</p>
        <p className="text-sm mt-2">Checking Electron IPC permissions...</p>
      </div>
    );
  }

  const allModules = ['cpu', 'memory', 'network', 'disk', 'gpu', 'battery', 'sensors'];

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
            System Monitor
          </h1>
          <p className="text-foreground-muted text-sm">Real-time performance metrics</p>
        </div>
        
        <div className="flex gap-2">
            {/* Quick toggles for modules */}
            <div className="bg-[var(--color-glass-input)] p-1 rounded-lg flex items-center gap-1 border border-[var(--color-glass-border)] overflow-x-auto max-w-[400px]">
                {allModules.map(mod => (
                    <button
                        key={mod}
                        onClick={() => toggleModule(mod)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                            enabledModules.includes(mod) 
                                ? 'bg-[var(--color-glass-button-hover)] text-foreground shadow-sm' 
                                : 'text-foreground-muted hover:text-foreground'
                        }`}
                    >
                        {mod.toUpperCase()}
                    </button>
                ))}
            </div>
            
            <button className="p-2 hover:bg-[var(--color-glass-button-hover)] rounded-lg transition-colors text-foreground-muted hover:text-foreground">
                <Settings className="w-5 h-5" />
            </button>
        </div>
      </div>

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
