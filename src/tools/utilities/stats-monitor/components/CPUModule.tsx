import React, { useEffect, useState, useMemo } from 'react';
import type { CPUStats } from '../../../../types/stats';
import { LightweightGraph } from './LightweightGraph';
import { Cpu } from 'lucide-react';

interface CPUModuleProps {
  data: CPUStats;
}

const MAX_POINTS = 20; // Giảm từ 30 xuống 20 để tiết kiệm memory

export const CPUModule: React.FC<CPUModuleProps> = React.memo(({ data }) => {
  const [history, setHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));

  const currentLoad = data.load.currentLoad;

  useEffect(() => {
    setHistory(prev => {
      const newData = [...prev.slice(1), currentLoad];
      return newData;
    });
  }, [currentLoad]);

  const load = useMemo(() => Math.round(currentLoad), [currentLoad]);
  
  // Determine color based on load
  const color = useMemo(() => {
    if (load >= 90) return '#ef4444'; // red-500
    if (load >= 70) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  }, [load]);

  return (
    <div className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-lg">
            <Cpu className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">CPU</h3>
            <p className="text-xs text-foreground-muted">{data.manufacturer} {data.brand}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono" style={{ color }}>{load}%</div>
          <div className="text-xs text-foreground-muted">{data.speed} GHz</div>
        </div>
      </div>

      <div className="h-16 w-full bg-black/10 dark:bg-black/20 rounded-lg overflow-hidden relative">
         <LightweightGraph 
            data={history} 
            color={color} 
            height={64}
            max={100}
         />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[var(--color-glass-input)] p-2 rounded flex justify-between">
            <span className="text-foreground-muted">Cores</span>
            <span className="text-foreground">{data.physicalCores} P / {data.cores} L</span>
        </div>
        <div className="bg-[var(--color-glass-input)] p-2 rounded flex justify-between">
            <span className="text-foreground-muted">System Load</span>
            <span className="text-foreground">{Math.round(data.load.currentLoadSystem)}%</span>
        </div>
      </div>
    </div>
  );
});

CPUModule.displayName = 'CPUModule';

export default CPUModule;
