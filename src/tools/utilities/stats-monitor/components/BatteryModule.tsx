import React from 'react';
import type { BatteryStats } from '../../../../types/stats';
import { Battery, BatteryCharging, BatteryWarning, Plug } from 'lucide-react';

interface BatteryModuleProps {
  data: BatteryStats;
}

export const BatteryModule: React.FC<BatteryModuleProps> = ({ data }) => {
  if (!data.hasBattery) {
      return (
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-4 opacity-50">
             <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-500/10 rounded-lg">
                    <Plug className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-white/90">Power</h3>
                    <p className="text-xs text-white/50">AC Connected</p>
                </div>
             </div>
             <div className="text-xs text-white/50 text-center py-4">
                No battery detected
             </div>
        </div>
      )
  }

  const percent = data.percent;
  const isCharging = data.isCharging;
  const timeRemaining = data.timeRemaining; // in minutes? systeminformation docs say minutes usually

  // Determine color based on percent
  const getColor = (pct: number) => {
    if (pct <= 20) return '#ef4444'; // red-500
    if (pct <= 40) return '#f59e0b'; // amber-500
    return '#22c55e'; // green-500
  };

  const formatTime = (minutes: number) => {
      if (minutes < 0) return 'Calculating...';
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${h}h ${m}m`;
  };

  const color = getColor(percent);

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-500/10 rounded-lg">
            {isCharging ? (
                 <BatteryCharging className="w-5 h-5 text-green-400" />
            ) : (
                 <Battery className="w-5 h-5 text-green-400" />
            )}
           
          </div>
          <div>
            <h3 className="text-sm font-medium text-white/90">Battery</h3>
            <p className="text-xs text-white/50">{isCharging ? 'Charging' : 'Discharging'}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono" style={{ color }}>{percent}%</div>
          <div className="text-xs text-white/50">
            {isCharging ? 'AC Connected' : (data.timeRemaining > 0 ? formatTime(data.timeRemaining) : '...')}
          </div>
        </div>
      </div>

      <div className="w-full bg-white/10 rounded-full h-8 overflow-hidden relative border border-white/5">
         <div 
             className="h-full transition-all duration-500 relative"
             style={{ width: `${percent}%`, backgroundColor: color }}
         >
            {/* Battery glare effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20"></div>
         </div>
         {/* Bolt icon centered if charging? */}
         {isCharging && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <BatteryCharging className="w-4 h-4 text-white drop-shadow-md" />
             </div>
         )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white/5 p-2 rounded flex justify-between">
            <span className="text-white/50">Cycles</span>
            <span className="text-white/90">{data.cycleCount}</span>
        </div>
        <div className="bg-white/5 p-2 rounded flex justify-between">
            <span className="text-white/50">Health</span>
             {/* Simple health calc if maxCapacity and designedCapacity exist */}
            <span className="text-white/90">
                {data.maxCapacity && data.designedCapacity 
                    ? Math.round((data.maxCapacity / data.designedCapacity) * 100) + '%'
                    : 'N/A'
                }
            </span>
        </div>
      </div>
    </div>
  );
};
