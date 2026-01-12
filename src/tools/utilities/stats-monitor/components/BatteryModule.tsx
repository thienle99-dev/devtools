import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import type { BatteryStats } from '@/types/stats';
import { Battery, BatteryCharging, Plug, Zap, ChevronDown, ChevronUp, X, Info } from 'lucide-react';
import { LightweightGraph } from './LightweightGraph';
import { useStatsStore } from '../store/statsStore';
import { formatPower, formatCapacity, formatETA } from '@utils/format';

interface BatteryModuleProps {
  data: BatteryStats;
}

interface DetailModalProps {
  data: BatteryStats;
  isOpen: boolean;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ data, isOpen, onClose }) => {
  if (!isOpen) return null;


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
            <div className="p-2 bg-green-500/10 dark:bg-green-500/10 rounded-lg">
              <Battery className="w-5 h-5 text-green-500 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Battery Details</h3>
              <p className="text-xs text-foreground-muted">{data.model || 'Battery Information'}</p>
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
            {/* Status */}
            <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {data.isCharging ? (
                    <BatteryCharging className="w-4 h-4 text-green-500" />
                  ) : (
                    <Battery className="w-4 h-4 text-foreground-muted" />
                  )}
                  <span className="text-sm font-medium text-foreground">Status</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${data.isCharging ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'
                  }`}>
                  {data.isCharging ? 'Charging' : 'Discharging'}
                </span>
              </div>
            </div>

            {/* Capacity Information */}
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-green-500" />
                Capacity Information
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <p className="text-xs text-foreground-muted mb-1">Current</p>
                  <p className="text-lg font-bold text-foreground">{formatCapacity(data.currentCapacity, data.capacityUnit)}</p>
                </div>
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <p className="text-xs text-foreground-muted mb-1">Maximum</p>
                  <p className="text-lg font-bold text-foreground">{formatCapacity(data.maxCapacity, data.capacityUnit)}</p>
                </div>
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <p className="text-xs text-foreground-muted mb-1">Designed</p>
                  <p className="text-lg font-bold text-foreground">{formatCapacity(data.designedCapacity, data.capacityUnit)}</p>
                </div>
                <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                  <p className="text-xs text-foreground-muted mb-1">Health</p>
                  <p className="text-lg font-bold text-foreground">{((data.maxCapacity / data.designedCapacity) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Power Information */}
            {(data.powerConsumptionRate !== undefined || data.chargingPower !== undefined) && (
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-green-500" />
                  Power Information
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {data.powerConsumptionRate !== undefined && (
                    <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                      <p className="text-xs text-foreground-muted mb-1">Consumption</p>
                      <p className="text-lg font-bold text-foreground">{formatPower(data.powerConsumptionRate)}</p>
                    </div>
                  )}
                  {data.chargingPower !== undefined && data.isCharging && (
                    <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                      <p className="text-xs text-foreground-muted mb-1">Charging Power</p>
                      <p className="text-lg font-bold text-foreground">{formatPower(data.chargingPower)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-green-500" />
                Additional Information
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {data.voltage && (
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <p className="text-xs text-foreground-muted mb-1">Voltage</p>
                    <p className="text-sm font-medium text-foreground">{data.voltage.toFixed(2)} V</p>
                  </div>
                )}
                {data.cycleCount !== -1 && (
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <p className="text-xs text-foreground-muted mb-1">Cycle Count</p>
                    <p className="text-sm font-medium text-foreground">{data.cycleCount.toLocaleString()}</p>
                  </div>
                )}
                {data.timeRemaining > 0 && (
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <p className="text-xs text-foreground-muted mb-1">Time Remaining</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatETA(data.timeRemaining * 60)}
                    </p>
                  </div>
                )}
                {data.manufacturer && (
                  <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                    <p className="text-xs text-foreground-muted mb-1">Manufacturer</p>
                    <p className="text-sm font-medium text-foreground">{data.manufacturer}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MAX_POINTS = 20;

export const BatteryModule: React.FC<BatteryModuleProps> = React.memo(({ data }) => {
  const { chartHistory, updateChartHistory } = useStatsStore();
  const [consumptionHistory, setConsumptionHistory] = useState<number[]>(chartHistory.battery?.consumption || Array(MAX_POINTS).fill(0));
  const [chargingHistory, setChargingHistory] = useState<number[]>(chartHistory.battery?.charging || Array(MAX_POINTS).fill(0));
  const [showDetails, setShowDetails] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const consumptionHistoryRef = useRef<number[]>(chartHistory.battery?.consumption || Array(MAX_POINTS).fill(0));
  const chargingHistoryRef = useRef<number[]>(chartHistory.battery?.charging || Array(MAX_POINTS).fill(0));
  const isRestoringRef = useRef(false);

  const powerConsumption = data.powerConsumptionRate ?? 0; // mW
  const chargingPower = data.chargingPower ?? 0; // mW

  // Restore history from store on mount
  useEffect(() => {
    if (chartHistory.battery?.consumption && chartHistory.battery.consumption.length > 0) {
      isRestoringRef.current = true;
      setConsumptionHistory(chartHistory.battery.consumption);
    }
    if (chartHistory.battery?.charging && chartHistory.battery.charging.length > 0) {
      setChargingHistory(chartHistory.battery.charging);
    }
    setTimeout(() => {
      isRestoringRef.current = false;
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (data.powerConsumptionRate === undefined || data.powerConsumptionRate <= 0 || isRestoringRef.current) return;

    let newConsumptionHistory: number[];

    setConsumptionHistory(prev => {
      newConsumptionHistory = [...prev.slice(1), powerConsumption];
      consumptionHistoryRef.current = newConsumptionHistory;
      return newConsumptionHistory;
    });

    // Debounce store update (save every 2 seconds)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      updateChartHistory('battery', { consumption: consumptionHistoryRef.current, charging: chargingHistoryRef.current });
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [powerConsumption, data.powerConsumptionRate, chargingHistory, updateChartHistory]);

  useEffect(() => {
    if (isRestoringRef.current) return;

    let newChargingHistory: number[];

    setChargingHistory(prev => {
      newChargingHistory = data.isCharging && data.chargingPower !== undefined && data.chargingPower > 0
        ? [...prev.slice(1), chargingPower]
        : [...prev.slice(1), 0];
      chargingHistoryRef.current = newChargingHistory;
      return newChargingHistory;
    });

    // Debounce store update (save every 2 seconds)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      updateChartHistory('battery', { consumption: consumptionHistoryRef.current, charging: chargingHistoryRef.current });
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [chargingPower, data.isCharging, data.chargingPower, consumptionHistory, updateChartHistory]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      updateChartHistory('battery', { consumption: consumptionHistoryRef.current, charging: chargingHistoryRef.current });
    };
  }, [updateChartHistory]);


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



  const color = useMemo(() => getColor(percent), [percent]);

  // Tính max power để scale graph (ước tính max 100W cho laptop)
  const maxPower = useMemo(() => 100000, []); // 100W = 100000mW

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
                {isCharging ? 'AC Connected' : (data.timeRemaining > 0 ? formatETA(data.timeRemaining * 60) : '...')}
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
        <div className="flex justify-end">
          <Info className="w-3 h-3 text-foreground-muted opacity-50" />
        </div>
      </div>
      <DetailModal data={data} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
});

BatteryModule.displayName = 'BatteryModule';

export default BatteryModule;
