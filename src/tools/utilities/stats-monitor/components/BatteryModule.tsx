import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type { BatteryStats } from '../../../../types/stats';
import { Battery, BatteryCharging, Plug, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { LightweightGraph } from './LightweightGraph';

interface BatteryModuleProps {
  data: BatteryStats;
}

const MAX_POINTS = 20;

export const BatteryModule: React.FC<BatteryModuleProps> = React.memo(({ data }) => {
  const [consumptionHistory, setConsumptionHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));
  const [chargingHistory, setChargingHistory] = useState<number[]>(Array(MAX_POINTS).fill(0));
  const [showDetails, setShowDetails] = useState(false);

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

  const formatCycles = useCallback((cycles: number) => {
    if (cycles === -1 || cycles === null || cycles === undefined) return 'N/A';
    return cycles.toLocaleString('en-US');
  }, []);

  const getCycleHealth = useCallback((cycles: number) => {
    if (cycles === -1 || cycles === null || cycles === undefined) return { status: 'Unknown', color: '#6b7280', percent: 0 };
    
    // Typical laptop battery: 300-1000 cycles before significant degradation
    const maxCycles = 1000;
    const percent = Math.min((cycles / maxCycles) * 100, 100);
    
    if (cycles < 300) {
      return { status: 'Excellent', color: '#22c55e', percent }; // green
    } else if (cycles < 500) {
      return { status: 'Good', color: '#10b981', percent }; // emerald
    } else if (cycles < 800) {
      return { status: 'Fair', color: '#f59e0b', percent }; // amber
    } else {
      return { status: 'Poor', color: '#ef4444', percent }; // red
    }
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
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold font-mono" style={{ color }}>{percent}%</div>
            <div className="text-xs text-foreground-muted">
              {isCharging ? 'AC Connected' : (data.timeRemaining > 0 ? formatTime(data.timeRemaining) : '...')}
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 hover:bg-[var(--color-glass-button-hover)] rounded-lg transition-colors text-foreground-muted hover:text-foreground"
            aria-label="Toggle details"
          >
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Power Consumption & Charging Graphs - Always visible */}
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
          {data.powerConsumptionRate !== undefined && data.powerConsumptionRate > 0 && (
            <div className="absolute bottom-1 right-1 text-[10px] text-foreground-muted font-mono">
              {formatPower(powerConsumption)}
            </div>
          )}
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
          {isCharging && data.chargingPower !== undefined && data.chargingPower > 0 && (
            <div className="absolute bottom-1 right-1 text-[10px] text-foreground-muted font-mono">
              {formatPower(chargingPower)}
            </div>
          )}
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

      {/* Basic Info - Always visible */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {data.cycleCount !== -1 && data.cycleCount !== null && data.cycleCount !== undefined && (
          <div className="bg-[var(--color-glass-input)] p-2 rounded flex justify-between items-center">
            <span className="text-foreground-muted">Cycles</span>
            <span className="text-foreground font-medium">{formatCycles(data.cycleCount)}</span>
          </div>
        )}
        {data.maxCapacity && data.designedCapacity && data.maxCapacity > 0 && data.designedCapacity > 0 && (
          <div className="bg-[var(--color-glass-input)] p-2 rounded flex justify-between items-center">
            <span className="text-foreground-muted">Health</span>
            <span className="text-foreground font-medium">
              {Math.round((data.maxCapacity / data.designedCapacity) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Detailed Info - Toggleable */}
      {showDetails && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Cycles Details - Only show if cycleCount is available */}
          {data.cycleCount !== -1 && data.cycleCount !== null && data.cycleCount !== undefined && (
            <div className="bg-[var(--color-glass-input)] p-3 rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-foreground-muted">Charge Cycles</span>
                <span className="text-sm font-bold text-foreground">{formatCycles(data.cycleCount)}</span>
              </div>
              <div className="w-full bg-[var(--color-glass-panel)] rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${getCycleHealth(data.cycleCount).percent}%`, 
                    backgroundColor: getCycleHealth(data.cycleCount).color 
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground-muted">Status</span>
                <span 
                  className="font-medium"
                  style={{ color: getCycleHealth(data.cycleCount).color }}
                >
                  {getCycleHealth(data.cycleCount).status}
                </span>
              </div>
            </div>
          )}

          {/* Battery Specifications */}
          {(data.type || data.voltage || data.manufacturer || data.model || data.designedCapacity || data.maxCapacity || data.currentCapacity) && (
            <div className="bg-[var(--color-glass-input)] p-3 rounded-lg space-y-2">
              <div className="text-xs font-medium text-foreground mb-2">Specifications</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {data.type && (
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Type</span>
                    <span className="text-foreground">{data.type}</span>
                  </div>
                )}
                {data.voltage && data.voltage > 0 && (
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Voltage</span>
                    <span className="text-foreground">{data.voltage.toFixed(2)} V</span>
                  </div>
                )}
                {data.manufacturer && (
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Manufacturer</span>
                    <span className="text-foreground">{data.manufacturer}</span>
                  </div>
                )}
                {data.model && (
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Model</span>
                    <span className="text-foreground">{data.model}</span>
                  </div>
                )}
                {data.designedCapacity && data.designedCapacity > 0 && (
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Designed Capacity</span>
                    <span className="text-foreground">
                      {(data.designedCapacity / 1000).toFixed(0)} {data.capacityUnit || 'mAh'}
                    </span>
                  </div>
                )}
                {data.maxCapacity && data.maxCapacity > 0 && (
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Max Capacity</span>
                    <span className="text-foreground">
                      {(data.maxCapacity / 1000).toFixed(0)} {data.capacityUnit || 'mAh'}
                    </span>
                  </div>
                )}
                {data.currentCapacity && data.currentCapacity > 0 && (
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Current Capacity</span>
                    <span className="text-foreground">
                      {(data.currentCapacity / 1000).toFixed(0)} {data.capacityUnit || 'mAh'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

BatteryModule.displayName = 'BatteryModule';

export default BatteryModule;
