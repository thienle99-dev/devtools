import React, { useEffect, useState, useMemo, useRef } from 'react';
import type { NetworkStats } from '@/types/stats';
import { LightweightGraph } from './LightweightGraph';
import { Network, ArrowDown, ArrowUp, X, Info, Wifi, Globe } from 'lucide-react';
import { useStatsStore } from '../store/statsStore';
import { formatBytes, formatSpeed } from '@utils/format';

interface NetworkModuleProps {
  data: NetworkStats;
}

interface DetailModalProps {
  data: NetworkStats;
  isOpen: boolean;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ data, isOpen, onClose }) => {
  if (!isOpen) return null;


  const activeStats = data.stats.find(s => s.operstate === 'up') || data.stats[0];
  const activeInterface = data.interfaces.find(i => i.iface === activeStats?.iface);

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
            <div className="p-2 bg-purple-500/10 dark:bg-purple-500/10 rounded-lg">
              <Network className="w-5 h-5 text-purple-500 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Network Details</h3>
              <p className="text-xs text-foreground-muted">{activeInterface?.ifaceName || activeStats?.iface || 'Unknown'}</p>
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
            {/* Active Interface */}
            {activeInterface && (
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Wifi className="w-4 h-4 text-purple-500" />
                  Interface Information
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <p className="text-xs text-foreground-muted mb-1">Interface</p>
                    <p className="text-sm font-bold text-foreground">{activeInterface.ifaceName || activeInterface.iface}</p>
                  </div>
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <p className="text-xs text-foreground-muted mb-1">Type</p>
                    <p className="text-sm font-bold text-foreground capitalize">{activeInterface.type || 'Unknown'}</p>
                  </div>
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <p className="text-xs text-foreground-muted mb-1">IPv4</p>
                    <p className="text-sm font-mono text-foreground">{activeInterface.ip4 || 'N/A'}</p>
                  </div>
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <p className="text-xs text-foreground-muted mb-1">MAC Address</p>
                    <p className="text-sm font-mono text-foreground">{activeInterface.mac || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Traffic Statistics */}
            {activeStats && (
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-purple-500" />
                  Traffic Statistics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowDown className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-foreground-muted">Download</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{formatSpeed(activeStats.rx_sec)}</p>
                    <p className="text-xs text-foreground-muted mt-1">Total: {formatBytes(activeStats.rx_bytes)}</p>
                  </div>
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowUp className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-foreground-muted">Upload</span>
                    </div>
                    <p className="text-lg font-bold text-foreground">{formatSpeed(activeStats.tx_sec)}</p>
                    <p className="text-xs text-foreground-muted mt-1">Total: {formatBytes(activeStats.tx_bytes)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* All Interfaces */}
            {data.interfaces.length > 1 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-purple-500" />
                  All Interfaces ({data.interfaces.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.interfaces.map((iface, index) => (
                    <div key={index} className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-foreground">{iface.ifaceName || iface.iface}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${iface.internal ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'}`}>
                          {iface.internal ? 'Internal' : 'External'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-foreground-muted">
                        <span>IPv4: {iface.ip4 || 'N/A'}</span>
                        <span>Type: {iface.type || 'Unknown'}</span>
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

export const NetworkModule: React.FC<NetworkModuleProps> = React.memo(({ data }) => {
  const { chartHistory, updateChartHistory } = useStatsStore();
  const [rxHistory, setRxHistory] = useState<number[]>(chartHistory.network?.rx || Array(MAX_POINTS).fill(0));
  const [txHistory, setTxHistory] = useState<number[]>(chartHistory.network?.tx || Array(MAX_POINTS).fill(0));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rxHistoryRef = useRef<number[]>(chartHistory.network?.rx || Array(MAX_POINTS).fill(0));
  const txHistoryRef = useRef<number[]>(chartHistory.network?.tx || Array(MAX_POINTS).fill(0));
  const isRestoringRef = useRef(false);

  // Determine active interface
  const activeStats = useMemo(() => 
    data.stats.find(s => s.operstate === 'up') || data.stats[0],
    [data.stats]
  );
  const activeInterface = useMemo(() => 
    data.interfaces.find(i => i.iface === activeStats?.iface),
    [data.interfaces, activeStats?.iface]
  );

  const rxSec = activeStats?.rx_sec ?? 0;
  const txSec = activeStats?.tx_sec ?? 0;

  // Restore history from store on mount
  useEffect(() => {
    if (chartHistory.network?.rx && chartHistory.network.rx.length > 0) {
      isRestoringRef.current = true;
      setRxHistory(chartHistory.network.rx);
    }
    if (chartHistory.network?.tx && chartHistory.network.tx.length > 0) {
      setTxHistory(chartHistory.network.tx);
    }
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeStats || isRestoringRef.current) return;

    let newRxHistory: number[];
    let newTxHistory: number[];
    
    setRxHistory(prev => {
      newRxHistory = [...prev.slice(1), rxSec];
      rxHistoryRef.current = newRxHistory;
      return newRxHistory;
    });
    
    setTxHistory(prev => {
      newTxHistory = [...prev.slice(1), txSec];
      txHistoryRef.current = newTxHistory;
      return newTxHistory;
    });
    
    // Debounce store update (save every 2 seconds)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      updateChartHistory('network', { rx: rxHistoryRef.current, tx: txHistoryRef.current });
    }, 2000);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [rxSec, txSec, activeStats, updateChartHistory]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      updateChartHistory('network', { rx: rxHistoryRef.current, tx: txHistoryRef.current });
    };
  }, [updateChartHistory]);


  const rxSpeed = useMemo(() => activeStats ? formatSpeed(rxSec) : '0 B/s', [activeStats, rxSec, formatSpeed]);
  const txSpeed = useMemo(() => activeStats ? formatSpeed(txSec) : '0 B/s', [activeStats, txSec, formatSpeed]);

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
          <div className="p-2 bg-purple-500/10 dark:bg-purple-500/10 rounded-lg">
            <Network className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Network</h3>
            <p className="text-xs text-foreground-muted">{activeInterface?.ifaceName || activeStats?.iface || 'Unknown'}</p>
          </div>
        </div>
        <div className="text-right">
           <div className="flex flex-col items-end">
              <span className="text-xs text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                <ArrowDown className="w-3 h-3" /> {rxSpeed}
              </span>
              <span className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> {txSpeed}
              </span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Download Graph */}
        <div className="h-16 w-full bg-black/10 dark:bg-black/20 rounded-lg overflow-hidden relative">
            <LightweightGraph 
                data={rxHistory} 
                color="#10b981" 
                height={64}
                min={0}
            />
             <div className="absolute bottom-1 right-1 text-[10px] text-foreground-muted">Down</div>
        </div>
        
        {/* Upload Graph */}
        <div className="h-16 w-full bg-black/10 dark:bg-black/20 rounded-lg overflow-hidden relative">
            <LightweightGraph 
                data={txHistory} 
                color="#3b82f6" 
                height={64}
                min={0}
            />
            <div className="absolute bottom-1 right-1 text-[10px] text-foreground-muted">Up</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-foreground-muted px-1">
        <span>IP: {activeInterface?.ip4 || 'N/A'}</span>
        <span>MAC: {activeInterface?.mac || 'N/A'}</span>
      </div>
      <div className="flex justify-end">
        <Info className="w-3 h-3 text-foreground-muted opacity-50" />
      </div>
    </div>
    <DetailModal data={data} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
});

NetworkModule.displayName = 'NetworkModule';

export default NetworkModule;
