import React, { useEffect, useState } from 'react';
import type { GPUStats } from '../../../../types/stats';
import { Graph } from './Graph';
import { MonitorPlay } from 'lucide-react';

interface GPUModuleProps {
  data: GPUStats;
}

const MAX_POINTS = 30;

export const GPUModule: React.FC<GPUModuleProps> = ({ data }) => {
    const [history, setHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));
    
    // Usually take the first distinct GPU or the one with highest load?
    // For simplicity, let's take the first one or if multiple, maybe aggregate?
    const controller = data.controllers[0];

    useEffect(() => {
        if (!controller) return;
        setHistory(prev => {
            // Some systems might not report utilizationGpu, fallback to 0
            const load = controller.utilizationGpu || 0;
            return [...prev.slice(1), load];
        });
    }, [controller]);

    if (!controller) return null;

    const load = controller.utilizationGpu || 0;
    const temp = controller.temperatureGpu;
    const memoryUtil = controller.utilizationMemory || 0;

  // Determine color based on load
  const getColor = (load: number) => {
    if (load >= 90) return '#ef4444'; // red-500
    if (load >= 70) return '#f59e0b'; // amber-500
    return '#ec4899'; // pink-500
  };

  const color = getColor(load);

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-500/10 rounded-lg">
            <MonitorPlay className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white/90">GPU</h3>
            <p className="text-xs text-white/50 truncate w-32" title={controller.model}>{controller.model}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono" style={{ color }}>{load}%</div>
             {typeof temp === 'number' && (
                 <div className="text-xs text-white/50">{temp}°C</div>
             )}
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
            <span className="text-white/50">VRAM</span>
            <span className="text-white/90">{controller.vram} MB</span>
        </div>
        <div className="bg-white/5 p-2 rounded flex justify-between">
            <span className="text-white/50">Mem Load</span>
            <span className="text-white/90">{memoryUtil}%</span>
        </div>
      </div>
    </div>
  );
};
