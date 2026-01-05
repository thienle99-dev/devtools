import React, { useEffect, useState, useMemo, useRef } from 'react';
import {type MemoryStats } from '../../../../types/stats';
import { LightweightGraph } from './LightweightGraph';
import { BrainCircuit, X, Info, Database, HardDrive } from 'lucide-react';
import { useStatsStore } from '../store/statsStore';

interface MemoryModuleProps {
  data: MemoryStats;
}

interface DetailModalProps {
  data: MemoryStats;
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

  const usedPercent = (data.active / data.total) * 100;
  const availablePercent = (data.available / data.total) * 100;
  const swapUsedPercent = data.swaptotal > 0 ? (data.swapused / data.swaptotal) * 100 : 0;

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
            <div className="p-2 bg-blue-500/10 dark:bg-blue-500/10 rounded-lg">
              <BrainCircuit className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Memory Details</h3>
              <p className="text-xs text-foreground-muted">System Memory Information</p>
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
            {/* Main Memory */}
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-500" />
                Main Memory
              </h4>
              <div className="space-y-2">
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-foreground-muted">Used</span>
                    <span className="text-sm font-bold text-foreground">{formatBytes(data.active)} ({usedPercent.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-foreground-muted/20 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                </div>
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-foreground-muted">Available</span>
                    <span className="text-sm font-bold text-foreground">{formatBytes(data.available)} ({availablePercent.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-foreground-muted/20 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${availablePercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Memory Breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-500" />
                Memory Breakdown
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <p className="text-xs text-foreground-muted mb-1">Total</p>
                  <p className="text-lg font-bold text-foreground">{formatBytes(data.total)}</p>
                </div>
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <p className="text-xs text-foreground-muted mb-1">Free</p>
                  <p className="text-lg font-bold text-foreground">{formatBytes(data.free)}</p>
                </div>
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <p className="text-xs text-foreground-muted mb-1">Active</p>
                  <p className="text-lg font-bold text-foreground">{formatBytes(data.active)}</p>
                </div>
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <p className="text-xs text-foreground-muted mb-1">Cached</p>
                  <p className="text-lg font-bold text-foreground">{formatBytes(data.total - data.active)}</p>
                </div>
              </div>
            </div>

            {/* Swap Memory */}
            {data.swaptotal > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-blue-500" />
                  Swap Memory
                </h4>
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-foreground-muted">Swap Used</span>
                    <span className="text-sm font-bold text-foreground">{formatBytes(data.swapused)} / {formatBytes(data.swaptotal)} ({swapUsedPercent.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-foreground-muted/20 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${swapUsedPercent}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-foreground-muted">
                    <span>Free: {formatBytes(data.swapfree)}</span>
                    <span>Total: {formatBytes(data.swaptotal)}</span>
                  </div>
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

export const MemoryModule: React.FC<MemoryModuleProps> = React.memo(({ data }) => {
  const { chartHistory, updateChartHistory } = useStatsStore();
  const [history, setHistory] = useState<number[]>(chartHistory.memory || Array(MAX_POINTS).fill(0));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const historyRef = useRef<number[]>(chartHistory.memory || Array(MAX_POINTS).fill(0));
  const isRestoringRef = useRef(false);

  const usedPercent = useMemo(() => (data.active / data.total) * 100, [data.active, data.total]);

  // Restore history from store on mount
  useEffect(() => {
    if (chartHistory.memory && chartHistory.memory.length > 0) {
      isRestoringRef.current = true;
      const restoredHistory = chartHistory.memory;
      historyRef.current = restoredHistory;
      setHistory(restoredHistory);
      setTimeout(() => {
        isRestoringRef.current = false;
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isRestoringRef.current) return;
    
    setHistory(prev => {
      const newData = [...prev.slice(1), usedPercent];
      historyRef.current = newData;
      
      // Debounce store update (save every 2 seconds)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        updateChartHistory('memory', historyRef.current);
      }, 2000);
      
      return newData;
    });
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [usedPercent, updateChartHistory]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      updateChartHistory('memory', historyRef.current);
    };
  }, [updateChartHistory]);

  const usedGB = useMemo(() => (data.active / 1024 / 1024 / 1024).toFixed(1), [data.active]);
  const totalGB = useMemo(() => (data.total / 1024 / 1024 / 1024).toFixed(1), [data.total]);
  const percentage = useMemo(() => Math.round(usedPercent), [usedPercent]);

  // Determine color based on usage
  const color = useMemo(() => {
    if (percentage >= 90) return '#ef4444'; // red-500
    if (percentage >= 75) return '#f59e0b'; // amber-500
    return '#3b82f6'; // blue-500
  }, [percentage]);

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
         <LightweightGraph 
            data={history} 
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
      <div className="flex justify-end">
        <Info className="w-3 h-3 text-foreground-muted opacity-50" />
      </div>
    </div>
    <DetailModal data={data} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
});

MemoryModule.displayName = 'MemoryModule';

export default MemoryModule;
