import React, { useEffect, useState } from 'react';
import type { DiskStats } from '../../../../types/stats';
import { Graph } from './Graph';
import { HardDrive } from 'lucide-react';

interface DiskModuleProps {
  data: DiskStats;
}

const MAX_POINTS = 30;

export const DiskModule: React.FC<DiskModuleProps> = ({ data }) => {
  const [readHistory, setReadHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));
  const [writeHistory, setWriteHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));

  useEffect(() => {
    if (data.ioStats) {
      const ioStats = data.ioStats;
      setReadHistory(prev => {
        // Use log scale or just raw MB/s
        return [...prev.slice(1), ioStats.rIO_sec || 0];
      });

      setWriteHistory(prev => {
        return [...prev.slice(1), ioStats.wIO_sec || 0];
      });
    }
  }, [data]);

   const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec > 1024 * 1024) {
      return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
    }
    if (bytesPerSec > 1024) {
      return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    }
    return `${bytesPerSec.toFixed(0)} B/s`;
  };

  // Primary disk (usually C: or /)
  const primaryDisk = data.fsSize && data.fsSize.length > 0 
    ? (data.fsSize.find(d => d.mount === '/' || d.mount === 'C:') || data.fsSize[0])
    : null;
  const usedPercent = primaryDisk ? Math.round(primaryDisk.use) : 0;
  
  // Determine color based on usage
  const getColor = (usage: number) => {
    if (usage >= 90) return '#ef4444'; // red-500
    if (usage >= 75) return '#f59e0b'; // amber-500
    return '#8b5cf6'; // violet-500
  };

  const color = getColor(usedPercent);

  return (
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-violet-500/10 rounded-lg">
            <HardDrive className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white/90">Disk</h3>
             <p className="text-xs text-white/50">{primaryDisk ? primaryDisk.fs : 'Unknown'}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono" style={{ color }}>{usedPercent}%</div>
          <div className="text-xs text-white/50">Used</div>
        </div>
      </div>

       <div className="grid grid-cols-2 gap-2">
        {/* Read Graph */}
        <div className="h-16 w-full bg-black/20 rounded-lg overflow-hidden relative">
            <Graph 
                data={readHistory} 
                labels={Array(MAX_POINTS).fill('')} 
                color="#10b981" 
                height={64}
                min={0}
            />
             <div className="absolute bottom-1 right-1 text-[10px] text-white/30">Read: {data.ioStats ? formatSpeed(data.ioStats.rIO_sec) : 'N/A'}</div>
        </div>
        
        {/* Write Graph */}
        <div className="h-16 w-full bg-black/20 rounded-lg overflow-hidden relative">
            <Graph 
                data={writeHistory} 
                labels={Array(MAX_POINTS).fill('')} 
                color="#f43f5e" 
                height={64}
                min={0}
            />
            <div className="absolute bottom-1 right-1 text-[10px] text-white/30">Write: {data.ioStats ? formatSpeed(data.ioStats.wIO_sec) : 'N/A'}</div>
        </div>
      </div>

       {primaryDisk && (
        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${primaryDisk.use}%`, backgroundColor: color }}
            />
        </div>
       )}

      <div className="flex items-center justify-between text-xs text-white/50 px-1">
        <span>Free: {primaryDisk ? (primaryDisk.available / 1024 / 1024 / 1024).toFixed(0) : 0} GB</span>
        <span>Total: {primaryDisk ? (primaryDisk.size / 1024 / 1024 / 1024).toFixed(0) : 0} GB</span>
      </div>
    </div>
  );
};
