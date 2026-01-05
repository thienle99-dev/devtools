import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { BatteryStats } from '../../../../types/stats';
import { Battery, BatteryCharging, Plug, Zap } from 'lucide-react';
import { LightweightGraph } from './LightweightGraph';

interface BatteryModuleProps {
  data: BatteryStats;
}

const MAX_POINTS = 20;

export const BatteryModule: React.FC<BatteryModuleProps> = React.memo(({ data }) => {
  const [consumptionHistory, setConsumptionHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));
  const [chargingHistory, setChargingHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));

  const powerConsumption = data.powerConsumptionRate ?? 0; // mW
  const chargingPower = data.chargingPower ?? 0; // mW

  useEffect(() => {
    if (data.powerConsumptionRate !== undefined && data.powerConsumptionRate > 0) {
      setConsumptionHistory(prev => [...prev.slice(1), powerConsumption]);
    }
  }, [powerConsumption, data.powerConsumptionRate]);

  useEffect(() => {
    if (data.isCharging && data.chargingPower !== undefined && data.chargingPower > 0) {
      setChargingHistory(prev => [...prev.slice(1), chargingPower]);
    } else {
      setChargingHistory(prev => [...prev.slice(1), 0]);
    }
  }, [chargingPower, data.isCharging, data.chargingPower]);

  const formatPower = useCallback((mW: number) => {
    if (mW >= 1000) {
      return `${(mW / 1000).toFixed(2)} W`;
    }
    return `${mW.toFixed(0)} mW`;
  }, []);
  if (!data.hasBattery) {
      return (
        <div className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-4 opacity-50">
             <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-500/10 dark:bg-gray-500/10 rounded-lg">
                    <Plug className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-foreground">Power</h3>
                    <p className="text-xs text-foreground-muted">AC Connected</p>
                </div>
             </div>
             <div className="text-xs text-foreground-muted text-center py-4">
                No battery detected
             </div>
        </div>
      )
  }

  const percent = data.percent;
  const isCharging = data.isCharging;

  // Determine color based on percent
  const getColor = (pct: number) => {
    if (pct <= 20) return '#ef4444'; // red-500
    if (pct <= 40) return '#f59e0b'; // amber-500
    return '#22c55e'; // green-500
  };

  const formatTime = useCallback((minutes: number) => {
    if (minutes < 0) return 'Calculating...';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  }, []);

  const color = useMemo(() => getColor(percent), [percent]);

  // Tính max power để scale graph (ước tính max 100W cho laptop)
  const maxPower = useMemo(() => 100000, []); // 100W = 100000mW

  return (
    <div className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-500/10 dark:bg-green-500/10 rounded-lg">
            {isCharging ? (
                 <BatteryCharging className="w-5 h-5 text-green-500 dark:text-green-400" />
            ) : (
                 <Battery className="w-5 h-5 text-green-500 dark:text-green-400" />
            )}
           
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Battery</h3>
            <p className="text-xs text-foreground-muted">{isCharging ? 'Charging' : 'Discharging'}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono" style={{ color }}>{percent}%</div>
          <div className="text-xs text-foreground-muted">
            {isCharging ? 'AC Connected' : (data.timeRemaining > 0 ? formatTime(data.timeRemaining) : '...')}
          </div>
        </div>
      </div>

      {/* Power Consumption & Charging Graphs */}
      <div className="grid grid-cols-2 gap-2">
        {/* Power Consumption Graph */}
        <div className="h-16 w-full bg-black/10 dark:bg-black/20 rounded-lg overflow-hidden relative">
          <LightweightGraph 
            data={consumptionHistory} 
            color="#f59e0b" 
            height={64}
            min={0}
            max={maxPower}
          />
          <div className="absolute bottom-1 left-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-foreground-muted" />
            <span className="text-[10px] text-foreground-muted">Consumption</span>
          </div>
          <div className="absolute bottom-1 right-1 text-[10px] text-foreground-muted font-mono">
            {data.powerConsumptionRate !== undefined && data.powerConsumptionRate > 0 
              ? formatPower(powerConsumption) 
              : 'N/A'}
          </div>
        </div>
        
        {/* Charging Power Graph */}
        <div className="h-16 w-full bg-black/10 dark:bg-black/20 rounded-lg overflow-hidden relative">
          <LightweightGraph 
            data={chargingHistory} 
            color="#22c55e" 
            height={64}
            min={0}
            max={maxPower}
          />
          <div className="absolute bottom-1 left-1 flex items-center gap-1">
            <BatteryCharging className="w-3 h-3 text-foreground-muted" />
            <span className="text-[10px] text-foreground-muted">Charging</span>
          </div>
          <div className="absolute bottom-1 right-1 text-[10px] text-foreground-muted font-mono">
            {isCharging && data.chargingPower !== undefined && data.chargingPower > 0 
              ? formatPower(chargingPower) 
              : 'N/A'}
          </div>
        </div>
      </div>

      <div className="w-full bg-[var(--color-glass-input)] rounded-full h-8 overflow-hidden relative border border-[var(--color-glass-border)]">
         <div 
             className="h-full transition-all duration-500 relative"
             style={{ width: `${percent}%`, backgroundColor: color }}
         >
            {/* Battery glare effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 dark:bg-white/20"></div>
         </div>
         {/* Bolt icon centered if charging? */}
         {isCharging && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <BatteryCharging className="w-4 h-4 text-white dark:text-white drop-shadow-md" />
             </div>
         )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-[var(--color-glass-input)] p-2 rounded flex justify-between">
            <span className="text-foreground-muted">Cycles</span>
            <span className="text-foreground">{data.cycleCount}</span>
        </div>
        <div className="bg-[var(--color-glass-input)] p-2 rounded flex justify-between">
            <span className="text-foreground-muted">Health</span>
             {/* Simple health calc if maxCapacity and designedCapacity exist */}
            <span className="text-foreground">
                {data.maxCapacity && data.designedCapacity 
                    ? Math.round((data.maxCapacity / data.designedCapacity) * 100) + '%'
                    : 'N/A'
                }
            </span>
        </div>
      </div>
    </div>
  );
});

BatteryModule.displayName = 'BatteryModule';

export default BatteryModule;
