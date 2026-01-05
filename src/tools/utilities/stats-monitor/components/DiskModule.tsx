import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { DiskStats } from '../../../../types/stats';
import { LightweightGraph } from './LightweightGraph';
import { HardDrive } from 'lucide-react';

interface DiskModuleProps {
  data: DiskStats;
}

const MAX_POINTS = 20; // Giảm từ 30 xuống 20 để tiết kiệm memory

export const DiskModule: React.FC<DiskModuleProps> = React.memo(({ data }) => {
  const [readHistory, setReadHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));
  const [writeHistory, setWriteHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));

  const rIO_sec = data.ioStats?.rIO_sec ?? 0;
  const wIO_sec = data.ioStats?.wIO_sec ?? 0;
  const hasIOStats = data.ioStats !== null && data.ioStats !== undefined;

  useEffect(() => {
    if (hasIOStats) {
      setReadHistory(prev => [...prev.slice(1), rIO_sec]);
      setWriteHistory(prev => [...prev.slice(1), wIO_sec]);
    }
  }, [rIO_sec, wIO_sec, hasIOStats]);

  const formatSpeed = useCallback((bytesPerSec: number) => {
    if (bytesPerSec > 1024 * 1024) {
      return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
    }
    if (bytesPerSec > 1024) {
      return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    }
    return `${bytesPerSec.toFixed(0)} B/s`;
  }, []);

  // Primary disk (usually C: or /)
  const primaryDisk = useMemo(() => 
    data.fsSize && data.fsSize.length > 0 
      ? (data.fsSize.find(d => d.mount === '/' || d.mount === 'C:') || data.fsSize[0])
      : null,
    [data.fsSize]
  );
  const usedPercent = useMemo(() => primaryDisk ? Math.round(primaryDisk.use) : 0, [primaryDisk]);
  
  // Determine color based on usage
  const color = useMemo(() => {
    if (usedPercent >= 90) return '#ef4444'; // red-500
    if (usedPercent >= 75) return '#f59e0b'; // amber-500
    return '#8b5cf6'; // violet-500
  }, [usedPercent]);

  const readSpeed = useMemo(() => {
    if (!hasIOStats) return 'N/A';
    if (rIO_sec === 0 || isNaN(rIO_sec)) return '0 B/s';
    return formatSpeed(rIO_sec);
  }, [hasIOStats, rIO_sec, formatSpeed]);
  
  const writeSpeed = useMemo(() => {
    if (!hasIOStats) return 'N/A';
    if (wIO_sec === 0 || isNaN(wIO_sec)) return '0 B/s';
    return formatSpeed(wIO_sec);
  }, [hasIOStats, wIO_sec, formatSpeed]);

  return (
        <div className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-violet-500/10 dark:bg-violet-500/10 rounded-lg">
            <HardDrive className="w-5 h-5 text-violet-500 dark:text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Disk</h3>
             <p className="text-xs text-foreground-muted">{primaryDisk ? primaryDisk.fs : 'Unknown'}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono" style={{ color }}>{usedPercent}%</div>
          <div className="text-xs text-foreground-muted">Used</div>
        </div>
      </div>

       <div className="grid grid-cols-2 gap-2">
        {/* Read Graph */}
        <div className="h-16 w-full bg-black/10 dark:bg-black/20 rounded-lg overflow-hidden relative">
            <LightweightGraph 
                data={readHistory} 
                color="#10b981" 
                height={64}
                min={0}
            />
             <div className="absolute bottom-1 right-1 text-[10px] text-foreground-muted">Read: {readSpeed}</div>
        </div>
        
        {/* Write Graph */}
        <div className="h-16 w-full bg-black/10 dark:bg-black/20 rounded-lg overflow-hidden relative">
            <LightweightGraph 
                data={writeHistory} 
                color="#f43f5e" 
                height={64}
                min={0}
            />
            <div className="absolute bottom-1 right-1 text-[10px] text-foreground-muted">Write: {writeSpeed}</div>
        </div>
      </div>

       {primaryDisk && (
        <div className="w-full bg-[var(--color-glass-input)] rounded-full h-1.5 overflow-hidden">
            <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${primaryDisk.use}%`, backgroundColor: color }}
            />
        </div>
       )}

      <div className="flex items-center justify-between text-xs text-foreground-muted px-1">
        <span>Free: {primaryDisk ? (primaryDisk.available / 1024 / 1024 / 1024).toFixed(0) : 0} GB</span>
        <span>Total: {primaryDisk ? (primaryDisk.size / 1024 / 1024 / 1024).toFixed(0) : 0} GB</span>
      </div>
    </div>
  );
});

DiskModule.displayName = 'DiskModule';

export default DiskModule;
