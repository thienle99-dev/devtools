import React, { useEffect, useState } from 'react';
import type { TimeZonesStats } from '../../../../types/stats';
import { Clock, Globe } from 'lucide-react';

interface TimeZonesModuleProps {
  data: TimeZonesStats;
}

const formatOffset = (offset: number): string => {
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset);
  const minutes = Math.round((absOffset - hours) * 60);
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const TimeZonesModule: React.FC<TimeZonesModuleProps> = React.memo(({ data }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Format time for a timezone
  const formatTime = (timezone: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(currentTime);
  };

  // Format date for a timezone
  const formatDate = (timezone: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(currentTime);
  };

  return (
    <div className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-lg">
            <Globe className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">Time Zones</h3>
            <p className="text-xs text-foreground-muted">{data.zones.length + 1} zones</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Local time zone */}
        <div className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-medium text-foreground">
                {data.local.city}
              </span>
            </div>
            <span className="text-xs text-foreground-muted">
              UTC{formatOffset(data.local.offset)}
            </span>
          </div>
          <div className="text-lg font-mono font-bold text-foreground">
            {formatTime(data.local.timezone)}
          </div>
          <div className="text-xs text-foreground-muted mt-1">
            {formatDate(data.local.timezone)}
          </div>
        </div>

        {/* Additional time zones */}
        {data.zones.map((zone, index) => (
          <div
            key={`${zone.timezone}-${index}`}
            className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-foreground">
                  {zone.city}
                </span>
              </div>
              <span className="text-xs text-foreground-muted">
                UTC{formatOffset(zone.offset)}
              </span>
            </div>
            <div className="text-lg font-mono font-bold text-foreground">
              {formatTime(zone.timezone)}
            </div>
            <div className="text-xs text-foreground-muted mt-1">
              {formatDate(zone.timezone)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

TimeZonesModule.displayName = 'TimeZonesModule';

export default TimeZonesModule;

