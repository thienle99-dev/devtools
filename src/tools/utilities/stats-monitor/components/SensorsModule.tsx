import React, { useState } from 'react';
import type { SensorStats } from '../../../../types/stats';
import { Thermometer, X, Info, Activity } from 'lucide-react';

interface SensorsModuleProps {
  data: SensorStats;
}

interface DetailModalProps {
  data: SensorStats;
  isOpen: boolean;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ data, isOpen, onClose }) => {
  if (!isOpen || !data?.cpuTemperature) return null;

  const { main, cores, max } = data.cpuTemperature;

  const getTempColor = (temp: number) => {
    if (temp >= 80) return 'text-red-500';
    if (temp >= 60) return 'text-amber-500';
    return 'text-blue-400';
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--color-glass-panel)] rounded-xl border border-[var(--color-glass-border)] shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-glass-border)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 dark:bg-orange-500/10 rounded-lg">
              <Thermometer className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Temperature Sensors</h3>
              <p className="text-xs text-foreground-muted">CPU Temperature Monitoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-glass-button-hover)] rounded-lg transition-colors text-foreground-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)] text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">Average</span>
                </div>
                <p className={`text-2xl font-bold font-mono ${getTempColor(main)}`}>{main.toFixed(1)}°C</p>
              </div>
              <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)] text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Thermometer className="w-4 h-4 text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">Maximum</span>
                </div>
                <p className={`text-2xl font-bold font-mono ${getTempColor(max)}`}>{max.toFixed(1)}°C</p>
              </div>
              <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)] text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">Cores</span>
                </div>
                <p className="text-2xl font-bold font-mono text-foreground">{cores?.length || 0}</p>
              </div>
            </div>

            {cores && cores.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  Per-Core Temperatures
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {cores.map((temp, index) => (
                    <div key={index} className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)] text-center">
                      <p className="text-[10px] text-foreground-muted mb-1">Core {index}</p>
                      <p className={`text-lg font-bold font-mono ${getTempColor(temp)}`}>{temp.toFixed(1)}°C</p>
                      <div className="w-full bg-foreground-muted/20 rounded-full h-1 mt-2">
                        <div 
                          className={`h-1 rounded-full transition-all ${
                            temp >= 80 ? 'bg-red-500' :
                            temp >= 60 ? 'bg-amber-500' : 'bg-blue-400'
                          }`}
                          style={{ width: `${Math.min((temp / 100) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const SensorsModule: React.FC<SensorsModuleProps> = ({ data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!data?.cpuTemperature) return null;

  const { main, cores, max } = data.cpuTemperature;

  // Function to get color based on temperature
  const getTempColor = (temp: number) => {
    if (temp >= 80) return 'text-red-500';
    if (temp >= 60) return 'text-amber-500';
    return 'text-blue-400';
  };

  // Close modal on Escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  return (
    <>
    <div 
      className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-4 cursor-pointer hover:bg-[var(--color-glass-button-hover)] transition-colors"
      onClick={() => setIsModalOpen(true)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-500/10 dark:bg-orange-500/10 rounded-lg">
            <Thermometer className="w-5 h-5 text-orange-500 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Sensors</h3>
            <p className="text-xs text-foreground-muted">Temperatures</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold font-mono ${getTempColor(main)}`}>
            {main.toFixed(1)}°C
          </div>
          <div className="text-xs text-foreground-muted">CPU Avg</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cores && cores.length > 0 ? (
          cores.map((temp, index) => (
            <div key={index} className="bg-[var(--color-glass-input)] p-2 rounded flex flex-col items-center">
              <span className="text-[10px] text-foreground-muted">Core {index}</span>
              <span className={`text-sm font-mono font-medium ${getTempColor(temp)}`}>
                {temp}°C
              </span>
            </div>
          ))
        ) : (
             <div className="col-span-4 text-center text-foreground-muted text-xs py-2">
                Individual core temperatures not available
             </div>
        )}
      </div>

       <div className="flex items-center justify-between text-xs text-foreground-muted px-1 pt-2 border-t border-[var(--color-glass-border)]">
        <span>Max Recorded:</span>
        <span className={getTempColor(max)}>{max.toFixed(1)}°C</span>
      </div>
      <div className="flex justify-end">
        <Info className="w-3 h-3 text-foreground-muted opacity-50" />
      </div>
    </div>
    <DetailModal data={data} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default SensorsModule;
