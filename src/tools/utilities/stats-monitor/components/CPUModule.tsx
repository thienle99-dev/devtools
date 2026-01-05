import React, { useEffect, useState } from 'react';
import { CPUStats } from '../../../../types/stats';
import { Graph } from './Graph';
import { Cpu } from 'lucide-react';

interface CPUModuleProps {
  data: CPUStats;
}

const MAX_POINTS = 30;

export const CPUModule: React.FC<CPUModuleProps> = ({ data }) => {
  const [history, setHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));

  useEffect(() => {
    setHistory(prev => {
      const newData = [...prev.slice(1), data.load.currentLoad];
      return newData;
    });
  }, [data]);

  const load = Math.round(data.load.currentLoad);
  
  // Determine color based on load
  const getColor = (load: number) => {
    if (load >= 90) return '#ef4444'; // red-500
    if (load >= 70) return '#f59e0b'; // amber-500
    return '#10b981'; // emerald-500
  };

  const color = getColor(load);

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Cpu className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white/90">CPU</h3>
            <p className="text-xs text-white/50">{data.manufacturer} {data.brand}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono" style={{ color }}>{load}%</div>
          <div className="text-xs text-white/50">{data.speed} GHz</div>
        </div>
      </div>

      <div className="h-16 w-full bg-black/20 rounded-lg overflow-hidden relative">
         <Graph 
            data={history} 
            labels={Array(MAX_POINTS).fill('')} 
            color={color} 
            height={64}
            max={100}
         />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/5 p-2 rounded flex justify-between">
            <span className="text-white/50">Cores</span>
            <span className="text-white/90">{data.physicalCores} P / {data.cores} L</span>
        </div>
        <div className="bg-white/5 p-2 rounded flex justify-between">
            <span className="text-white/50">System Load</span>
            <span className="text-white/90">{Math.round(data.load.currentLoadSystem)}%</span>
        </div>
      </div>
    </div>
  );
};
