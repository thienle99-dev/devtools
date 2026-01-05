import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { GPUStats } from '../../../../types/stats';
import { LightweightGraph } from './LightweightGraph';
import { MonitorPlay, X, Info, Thermometer, MemoryStick } from 'lucide-react';
import { useStatsStore } from '../store/statsStore';

interface GPUModuleProps {
  data: GPUStats;
}

interface DetailModalProps {
  data: GPUStats;
  isOpen: boolean;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ data, isOpen, onClose }) => {
  if (!isOpen) return null;

  const controller = data.controllers[0];
  if (!controller) return null;

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
            <div className="p-2 bg-pink-500/10 dark:bg-pink-500/10 rounded-lg">
              <MonitorPlay className="w-5 h-5 text-pink-500 dark:text-pink-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">GPU Details</h3>
              <p className="text-xs text-foreground-muted">{controller.model}</p>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">GPU Utilization</span>
                </div>
                <p className="text-lg font-bold text-foreground">{controller.utilizationGpu.toFixed(1)}%</p>
                <div className="w-full bg-foreground-muted/20 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-pink-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${controller.utilizationGpu}%` }}
                  />
                </div>
              </div>
              <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                <div className="flex items-center gap-2 mb-1">
                  <MemoryStick className="w-4 h-4 text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">Memory Utilization</span>
                </div>
                <p className="text-lg font-bold text-foreground">{controller.utilizationMemory.toFixed(1)}%</p>
                <div className="w-full bg-foreground-muted/20 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${controller.utilizationMemory}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                <div className="flex items-center gap-2 mb-1">
                  <MemoryStick className="w-4 h-4 text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">VRAM</span>
                </div>
                <p className="text-lg font-bold text-foreground">{controller.vram} MB</p>
                <p className="text-xs text-foreground-muted mt-1">{controller.vramDynamic ? 'Dynamic' : 'Fixed'}</p>
              </div>
              {typeof controller.temperatureGpu === 'number' && (
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="w-4 h-4 text-foreground-muted" />
                    <span className="text-xs text-foreground-muted">Temperature</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{controller.temperatureGpu}°C</p>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-pink-500" />
                Hardware Information
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <p className="text-xs text-foreground-muted mb-1">Vendor</p>
                  <p className="text-sm font-medium text-foreground">{controller.vendor}</p>
                </div>
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <p className="text-xs text-foreground-muted mb-1">Bus</p>
                  <p className="text-sm font-medium text-foreground">{controller.bus}</p>
                </div>
              </div>
            </div>

            {data.controllers.length > 1 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <MonitorPlay className="w-4 h-4 text-pink-500" />
                  All GPUs ({data.controllers.length})
                </h4>
                <div className="space-y-2">
                  {data.controllers.map((gpu, index) => (
                    <div key={index} className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">{gpu.model}</span>
                        <span className="text-xs font-bold text-foreground">{gpu.utilizationGpu.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-foreground-muted/20 rounded-full h-1.5">
                        <div 
                          className="bg-pink-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${gpu.utilizationGpu}%` }}
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

export const GPUModule: React.FC<GPUModuleProps> = React.memo(({ data }) => {
    const { chartHistory, updateChartHistory } = useStatsStore();
    const [history, setHistory] = useState<number[]>(chartHistory.gpu || Array(MAX_POINTS).fill(0));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const historyRef = useRef<number[]>(chartHistory.gpu || Array(MAX_POINTS).fill(0));
    const isRestoringRef = useRef(false);
    
    // Usually take the first distinct GPU or the one with highest load?
    // For simplicity, let's take the first one or if multiple, maybe aggregate?
    const controller = useMemo(() => data.controllers[0], [data.controllers]);

    const utilizationGpu = controller?.utilizationGpu ?? 0;

    // Restore history from store on mount
    useEffect(() => {
      if (chartHistory.gpu && chartHistory.gpu.length > 0) {
        isRestoringRef.current = true;
        setHistory(chartHistory.gpu);
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!controller || isRestoringRef.current) return;
        setHistory(prev => {
          const newData = [...prev.slice(1), utilizationGpu];
          historyRef.current = newData;
          
          // Debounce store update (save every 2 seconds)
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }
          saveTimeoutRef.current = setTimeout(() => {
            updateChartHistory('gpu', historyRef.current);
          }, 2000);
          
          return newData;
        });
        
        return () => {
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }
        };
    }, [utilizationGpu, controller, updateChartHistory]);

    // Save on unmount
    useEffect(() => {
      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        updateChartHistory('gpu', historyRef.current);
      };
    }, [updateChartHistory]);

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
         <LightweightGraph 
            data={history} 
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
      <div className="flex justify-end">
        <Info className="w-3 h-3 text-foreground-muted opacity-50" />
      </div>
    </div>
    <DetailModal data={data} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
});

GPUModule.displayName = 'GPUModule';

export default GPUModule;
