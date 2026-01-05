import React, { useEffect, useState, useMemo } from 'react';
import type { CPUStats } from '../../../../types/stats';
import { LightweightGraph } from './LightweightGraph';
import { Cpu, X, Info, Zap, Activity } from 'lucide-react';

interface CPUModuleProps {
  data: CPUStats;
}

interface DetailModalProps {
  data: CPUStats;
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
            <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-lg">
              <Cpu className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">CPU Details</h3>
              <p className="text-xs text-foreground-muted">{data.manufacturer} {data.brand}</p>
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
            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">Current Load</span>
                </div>
                <p className="text-lg font-bold text-foreground">{data.load.currentLoad.toFixed(1)}%</p>
              </div>
              <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">Clock Speed</span>
                </div>
                <p className="text-lg font-bold text-foreground">{data.speed} GHz</p>
              </div>
            </div>

            {/* Load Breakdown */}
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-emerald-500" />
                Load Breakdown
              </h4>
              <div className="space-y-2">
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-foreground-muted">User Load</span>
                    <span className="text-sm font-medium text-foreground">{data.load.currentLoadUser.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-foreground-muted/20 rounded-full h-1.5">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${data.load.currentLoadUser}%` }}
                    />
                  </div>
                </div>
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-foreground-muted">System Load</span>
                    <span className="text-sm font-medium text-foreground">{data.load.currentLoadSystem.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-foreground-muted/20 rounded-full h-1.5">
                    <div 
                      className="bg-amber-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${data.load.currentLoadSystem}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Core Information */}
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-emerald-500" />
                Core Information
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)] text-center">
                  <p className="text-xs text-foreground-muted mb-1">Physical Cores</p>
                  <p className="text-lg font-bold text-foreground">{data.physicalCores}</p>
                </div>
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)] text-center">
                  <p className="text-xs text-foreground-muted mb-1">Logical Cores</p>
                  <p className="text-lg font-bold text-foreground">{data.cores}</p>
                </div>
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)] text-center">
                  <p className="text-xs text-foreground-muted mb-1">Threads</p>
                  <p className="text-lg font-bold text-foreground">{data.cores - data.physicalCores}</p>
                </div>
              </div>
            </div>

            {/* Per-Core Load */}
            {data.load.cpus && data.load.cpus.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Per-Core Load
                </h4>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {data.load.cpus.map((cpu, index) => (
                    <div key={index} className="bg-[var(--color-glass-input)] p-2 rounded-lg border border-[var(--color-glass-border)]">
                      <p className="text-[10px] text-foreground-muted mb-1">Core {index}</p>
                      <p className="text-sm font-bold text-foreground">{cpu.load.toFixed(1)}%</p>
                      <div className="w-full bg-foreground-muted/20 rounded-full h-1 mt-1">
                        <div 
                          className="bg-emerald-500 h-1 rounded-full transition-all"
                          style={{ width: `${cpu.load}%` }}
                        />
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

export const CPUModule: React.FC<CPUModuleProps> = React.memo(({ data }) => {
  const [history, setHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="flex justify-end">
        <Info className="w-3 h-3 text-foreground-muted opacity-50" />
      </div>
    </div>
    <DetailModal data={data} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
});

CPUModule.displayName = 'CPUModule';

export default CPUModule;
