import React from 'react';
import type { SensorStats } from '../../../../types/stats';
import { Thermometer } from 'lucide-react';

interface SensorsModuleProps {
  data: SensorStats;
}

export const SensorsModule: React.FC<SensorsModuleProps> = ({ data }) => {
  if (!data?.cpuTemperature) return null;

  const { main, cores, max } = data.cpuTemperature;

  // Function to get color based on temperature
  const getTempColor = (temp: number) => {
    if (temp >= 80) return 'text-red-500';
    if (temp >= 60) return 'text-amber-500';
    return 'text-blue-400';
  };

  return (
    <div className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-4">
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

    </div>
  );
};
