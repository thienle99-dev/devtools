import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import type { DiskStats } from '../../../../types/stats';
import { LightweightGraph } from './LightweightGraph';
import { HardDrive, X, Info, Database, Activity } from 'lucide-react';
import { useStatsStore } from '../store/statsStore';

interface DiskModuleProps {
  data: DiskStats;
}

interface DetailModalProps {
  data: DiskStats;
  isOpen: boolean;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ data, isOpen, onClose }) => {
  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec > 1024 * 1024) return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
    if (bytesPerSec > 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    return `${bytesPerSec.toFixed(0)} B/s`;
  };

  const primaryDisk = data.fsSize && data.fsSize.length > 0 
    ? (data.fsSize.find(d => d.mount === '/' || d.mount === 'C:') || data.fsSize[0])
    : null;

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
            <div className="p-2 bg-violet-500/10 dark:bg-violet-500/10 rounded-lg">
              <HardDrive className="w-5 h-5 text-violet-500 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Disk Details</h3>
              <p className="text-xs text-foreground-muted">{primaryDisk?.fs || 'Storage Information'}</p>
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
            {/* Primary Disk */}
            {primaryDisk && (
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-violet-500" />
                  Primary Disk
                </h4>
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-foreground-muted">Usage</span>
                    <span className="text-sm font-bold text-foreground">{primaryDisk.use.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-foreground-muted/20 rounded-full h-2 mb-3">
                    <div 
                      className="bg-violet-500 h-2 rounded-full transition-all"
                      style={{ width: `${primaryDisk.use}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-foreground-muted">Used: </span>
                      <span className="text-foreground font-medium">{formatBytes(primaryDisk.used)}</span>
                    </div>
                    <div>
                      <span className="text-foreground-muted">Free: </span>
                      <span className="text-foreground font-medium">{formatBytes(primaryDisk.available)}</span>
                    </div>
                    <div>
                      <span className="text-foreground-muted">Total: </span>
                      <span className="text-foreground font-medium">{formatBytes(primaryDisk.size)}</span>
                    </div>
                    <div>
                      <span className="text-foreground-muted">Mount: </span>
                      <span className="text-foreground font-medium">{primaryDisk.mount}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* IO Statistics */}
            {data.ioStats && (
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-violet-500" />
                  I/O Statistics
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <p className="text-xs text-foreground-muted mb-1">Read Speed</p>
                    <p className="text-lg font-bold text-foreground">{formatSpeed(data.ioStats.rIO_sec)}</p>
                    <p className="text-xs text-foreground-muted mt-1">Total: {data.ioStats.rIO.toLocaleString()} ops</p>
                  </div>
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <p className="text-xs text-foreground-muted mb-1">Write Speed</p>
                    <p className="text-lg font-bold text-foreground">{formatSpeed(data.ioStats.wIO_sec)}</p>
                    <p className="text-xs text-foreground-muted mt-1">Total: {data.ioStats.wIO.toLocaleString()} ops</p>
                  </div>
                </div>
              </div>
            )}

            {/* All Disks */}
            {data.fsSize && data.fsSize.length > 1 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-violet-500" />
                  All Disks ({data.fsSize.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data.fsSize.map((disk, index) => (
                    <div key={index} className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">{disk.fs}</span>
                        <span className="text-xs font-bold text-foreground">{disk.use.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-foreground-muted/20 rounded-full h-1.5 mb-2">
                        <div 
                          className="bg-violet-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${disk.use}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-foreground-muted">
                        <span>Used: {formatBytes(disk.used)}</span>
                        <span>Free: {formatBytes(disk.available)}</span>
                        <span>Total: {formatBytes(disk.size)}</span>
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

const MAX_POINTS = 20; // Giảm từ 30 xuống 20 để tiết kiệm memory

export const DiskModule: React.FC<DiskModuleProps> = React.memo(({ data }) => {
  const { chartHistory, updateChartHistory } = useStatsStore();
  const [readHistory, setReadHistory] = useState<number[]>(chartHistory.disk?.read || Array(MAX_POINTS).fill(0));
  const [writeHistory, setWriteHistory] = useState<number[]>(chartHistory.disk?.write || Array(MAX_POINTS).fill(0));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const readHistoryRef = useRef<number[]>(chartHistory.disk?.read || Array(MAX_POINTS).fill(0));
  const writeHistoryRef = useRef<number[]>(chartHistory.disk?.write || Array(MAX_POINTS).fill(0));
  const isRestoringRef = useRef(false);

  const rIO_sec = data.ioStats?.rIO_sec ?? 0;
  const wIO_sec = data.ioStats?.wIO_sec ?? 0;
  const hasIOStats = data.ioStats !== null && data.ioStats !== undefined;

  // Restore history from store on mount
  useEffect(() => {
    if (chartHistory.disk?.read && chartHistory.disk.read.length > 0) {
      isRestoringRef.current = true;
      setReadHistory(chartHistory.disk.read);
    }
    if (chartHistory.disk?.write && chartHistory.disk.write.length > 0) {
      setWriteHistory(chartHistory.disk.write);
    }
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasIOStats || isRestoringRef.current) return;

    let newReadHistory: number[];
    let newWriteHistory: number[];
    
    setReadHistory(prev => {
      newReadHistory = [...prev.slice(1), rIO_sec];
      readHistoryRef.current = newReadHistory;
      return newReadHistory;
    });
    
    setWriteHistory(prev => {
      newWriteHistory = [...prev.slice(1), wIO_sec];
      writeHistoryRef.current = newWriteHistory;
      return newWriteHistory;
    });
    
    // Debounce store update (save every 2 seconds)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      updateChartHistory('disk', { read: readHistoryRef.current, write: writeHistoryRef.current });
    }, 2000);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [rIO_sec, wIO_sec, hasIOStats, updateChartHistory]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      updateChartHistory('disk', { read: readHistoryRef.current, write: writeHistoryRef.current });
    };
  }, [updateChartHistory]);

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
      <div className="flex justify-end">
        <Info className="w-3 h-3 text-foreground-muted opacity-50" />
      </div>
    </div>
    <DetailModal data={data} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
});

DiskModule.displayName = 'DiskModule';

export default DiskModule;
