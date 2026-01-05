import React, { useEffect, useState } from 'react';
import type { NetworkStats } from '../../../../types/stats';
import { Graph } from './Graph';
import { Network, ArrowDown, ArrowUp } from 'lucide-react';

interface NetworkModuleProps {
  data: NetworkStats;
}

const MAX_POINTS = 30;

export const NetworkModule: React.FC<NetworkModuleProps> = ({ data }) => {
  const [rxHistory, setRxHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));
  const [txHistory, setTxHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));

  // Determine active interface
  const activeStats = data.stats.find(s => s.operstate === 'up') || data.stats[0];
  const activeInterface = data.interfaces.find(i => i.iface === activeStats?.iface);

  useEffect(() => {
    if (!activeStats) return;

    setRxHistory(prev => {
      // Log scale or simple KB/s for graph visualization
      return [...prev.slice(1), activeStats.rx_sec];
    });

    setTxHistory(prev => {
      return [...prev.slice(1), activeStats.tx_sec];
    });
  }, [activeStats]);

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec > 1024 * 1024) {
      return `${(bytesPerSec / 1024 / 1024).toFixed(1)} MB/s`;
    }
    if (bytesPerSec > 1024) {
      return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    }
    return `${bytesPerSec} B/s`;
  };

  const maxRx = Math.max(...rxHistory, 1024); // at least 1KB scale
  const maxTx = Math.max(...txHistory, 1024);

  return (
    <div className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-4">
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
                <ArrowDown className="w-3 h-3" /> {activeStats ? formatSpeed(activeStats.rx_sec) : '0 B/s'}
              </span>
              <span className="text-xs text-blue-500 dark:text-blue-400 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" /> {activeStats ? formatSpeed(activeStats.tx_sec) : '0 B/s'}
              </span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Download Graph */}
        <div className="h-16 w-full bg-black/10 dark:bg-black/20 rounded-lg overflow-hidden relative">
            <Graph 
                data={rxHistory} 
                labels={Array(MAX_POINTS).fill('')} 
                color="#10b981" 
                height={64}
                min={0}
                // max={maxRx * 1.2} // Dynamic scale
            />
             <div className="absolute bottom-1 right-1 text-[10px] text-foreground-muted">Down</div>
        </div>
        
        {/* Upload Graph */}
        <div className="h-16 w-full bg-black/10 dark:bg-black/20 rounded-lg overflow-hidden relative">
            <Graph 
                data={txHistory} 
                labels={Array(MAX_POINTS).fill('')} 
                color="#3b82f6" 
                height={64}
                min={0}
                // max={maxTx * 1.2} // Dynamic scale
            />
            <div className="absolute bottom-1 right-1 text-[10px] text-foreground-muted">Up</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-foreground-muted px-1">
        <span>IP: {activeInterface?.ip4 || 'N/A'}</span>
        <span>MAC: {activeInterface?.mac || 'N/A'}</span>
      </div>
    </div>
  );
};
