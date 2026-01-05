import React, { useEffect, useState } from 'react';
import {type MemoryStats } from '../../../../types/stats';
import { Graph } from './Graph';
import { BrainCircuit } from 'lucide-react';

interface MemoryModuleProps {
  data: MemoryStats;
}

const MAX_POINTS = 30;

export const MemoryModule: React.FC<MemoryModuleProps> = ({ data }) => {
  const [history, setHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));

  useEffect(() => {
    setHistory(prev => {
      const usedPercent = (data.active / data.total) * 100;
      const newData = [...prev.slice(1), usedPercent];
      return newData;
    });
  }, [data]);

  const usedGB = (data.active / 1024 / 1024 / 1024).toFixed(1);
  const totalGB = (data.total / 1024 / 1024 / 1024).toFixed(1);
  const percentage = Math.round((data.active / data.total) * 100);

  // Determine color based on usage
  const getColor = (usage: number) => {
    if (usage >= 90) return '#ef4444'; // red-500
    if (usage >= 75) return '#f59e0b'; // amber-500
    return '#3b82f6'; // blue-500
  };

  const color = getColor(percentage);

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <BrainCircuit className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white/90">Memory</h3>
            <p className="text-xs text-white/50">{usedGB} / {totalGB} GB</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono" style={{ color }}>{percentage}%</div>
          <div className="text-xs text-white/50">Used</div>
        </div>
      </div>

      <div className="h-16 w-full bg-black/20 rounded-lg overflow-hidden relative">
         <Graph 
            data={history} 
            labels={Array(MAX_POINTS).fill('')} 
            color={color} 
            height={64}
            max={100}
            min={0}
         />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/5 p-2 rounded flex justify-between">
            <span className="text-white/50">Swap Used</span>
            <span className="text-white/90">{(data.swapused / 1024 / 1024 / 1024).toFixed(1)} GB</span>
        </div>
        <div className="bg-white/5 p-2 rounded flex justify-between">
            <span className="text-white/50">Cached</span>
             {/* Available often includes cached memory that can be freed */}
            <span className="text-white/90">{((data.total - data.active) / 1024 / 1024 / 1024).toFixed(1)} GB</span>
        </div>
      </div>
    </div>
  );
};
