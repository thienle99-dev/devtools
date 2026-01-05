import React, { useEffect, useState, useMemo } from 'react';
import {type MemoryStats } from '../../../../types/stats';
import { Graph } from './Graph';
import { BrainCircuit } from 'lucide-react';

interface MemoryModuleProps {
  data: MemoryStats;
}

const MAX_POINTS = 30;
const LABELS = Array(MAX_POINTS).fill('');

export const MemoryModule: React.FC<MemoryModuleProps> = React.memo(({ data }) => {
  const [history, setHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));

  const usedPercent = useMemo(() => (data.active / data.total) * 100, [data.active, data.total]);

  useEffect(() => {
    setHistory(prev => {
      const newData = [...prev.slice(1), usedPercent];
      return newData;
    });
  }, [usedPercent]);

  const usedGB = useMemo(() => (data.active / 1024 / 1024 / 1024).toFixed(1), [data.active]);
  const totalGB = useMemo(() => (data.total / 1024 / 1024 / 1024).toFixed(1), [data.total]);
  const percentage = useMemo(() => Math.round(usedPercent), [usedPercent]);

  // Determine color based on usage
  const color = useMemo(() => {
    if (percentage >= 90) return '#ef4444'; // red-500
    if (percentage >= 75) return '#f59e0b'; // amber-500
    return '#3b82f6'; // blue-500
  }, [percentage]);

  return (
    <div className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 dark:bg-blue-500/10 rounded-lg">
            <BrainCircuit className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Memory</h3>
            <p className="text-xs text-foreground-muted">{usedGB} / {totalGB} GB</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono" style={{ color }}>{percentage}%</div>
          <div className="text-xs text-foreground-muted">Used</div>
        </div>
      </div>

      <div className="h-16 w-full bg-black/10 dark:bg-black/20 rounded-lg overflow-hidden relative">
         <Graph 
            data={history} 
            labels={LABELS} 
            color={color} 
            height={64}
            max={100}
            min={0}
         />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[var(--color-glass-input)] p-2 rounded flex justify-between">
            <span className="text-foreground-muted">Swap Used</span>
            <span className="text-foreground">{(data.swapused / 1024 / 1024 / 1024).toFixed(1)} GB</span>
        </div>
        <div className="bg-[var(--color-glass-input)] p-2 rounded flex justify-between">
            <span className="text-foreground-muted">Cached</span>
             {/* Available often includes cached memory that can be freed */}
            <span className="text-foreground">{((data.total - data.active) / 1024 / 1024 / 1024).toFixed(1)} GB</span>
        </div>
      </div>
    </div>
  );
});

MemoryModule.displayName = 'MemoryModule';
