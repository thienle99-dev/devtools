import React, { useEffect, useState, useMemo } from 'react';
import type { GPUStats } from '../../../../types/stats';
import { Graph } from './Graph';
import { MonitorPlay } from 'lucide-react';

interface GPUModuleProps {
  data: GPUStats;
}

const MAX_POINTS = 30;
const LABELS = Array(MAX_POINTS).fill('');

export const GPUModule: React.FC<GPUModuleProps> = React.memo(({ data }) => {
    const [history, setHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));
    
    // Usually take the first distinct GPU or the one with highest load?
    // For simplicity, let's take the first one or if multiple, maybe aggregate?
    const controller = useMemo(() => data.controllers[0], [data.controllers]);

    const utilizationGpu = controller?.utilizationGpu ?? 0;

    useEffect(() => {
        if (!controller) return;
        setHistory(prev => [...prev.slice(1), utilizationGpu]);
    }, [utilizationGpu, controller]);

    if (!controller) return null;

    const load = useMemo(() => Math.round(utilizationGpu), [utilizationGpu]);
    const temp = controller.temperatureGpu;
    const memoryUtil = controller.utilizationMemory || 0;

  // Determine color based on load
  const color = useMemo(() => {
    if (load >= 90) return '#ef4444'; // red-500
    if (load >= 70) return '#f59e0b'; // amber-500
    return '#ec4899'; // pink-500
  }, [load]);

  return (
    <div className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-500/10 dark:bg-pink-500/10 rounded-lg">
            <MonitorPlay className="w-5 h-5 text-pink-500 dark:text-pink-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">GPU</h3>
            <p className="text-xs text-foreground-muted truncate w-32" title={controller.model}>{controller.model}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono" style={{ color }}>{load}%</div>
             {typeof temp === 'number' && (
                 <div className="text-xs text-foreground-muted">{temp}°C</div>
             )}
        </div>
      </div>

      <div className="h-16 w-full bg-black/10 dark:bg-black/20 rounded-lg overflow-hidden relative">
         <Graph 
            data={history} 
            labels={LABELS} 
            color={color} 
            height={64}
            max={100}
         />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[var(--color-glass-input)] p-2 rounded flex justify-between">
            <span className="text-foreground-muted">VRAM</span>
            <span className="text-foreground">{controller.vram} MB</span>
        </div>
        <div className="bg-[var(--color-glass-input)] p-2 rounded flex justify-between">
            <span className="text-foreground-muted">Mem Load</span>
            <span className="text-foreground">{memoryUtil}%</span>
        </div>
      </div>
    </div>
  );
});

GPUModule.displayName = 'GPUModule';
