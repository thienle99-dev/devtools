import React, { useEffect, useState } from 'react';
import type { TimeZonesStats } from '../../../../types/stats';
import { Clock, Globe, X, Info, MapPin } from 'lucide-react';

interface TimeZonesModuleProps {
  data: TimeZonesStats;
}

interface DetailModalProps {
  data: TimeZonesStats;
  isOpen: boolean;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ data, isOpen, onClose }) => {
  if (!isOpen) return null;

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatOffset = (offset: number): string => {
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const hours = Math.floor(absOffset);
    const minutes = Math.round((absOffset - hours) * 60);
    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatTime = (timezone: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(currentTime);
  };

  const formatDate = (timezone: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }).format(currentTime);
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
            <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/10 rounded-lg">
              <Globe className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Time Zones</h3>
              <p className="text-xs text-foreground-muted">World Clock Details</p>
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
            {/* Local Time */}
            <div className="bg-[var(--color-glass-input)] p-4 rounded-lg border border-[var(--color-glass-border)]">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-foreground">{data.local.city}</span>
                <span className="text-xs text-foreground-muted">(Local)</span>
              </div>
              <p className="text-xs text-foreground-muted mb-1">{data.local.timezone}</p>
              <p className="text-3xl font-bold font-mono text-foreground mb-1">{formatTime(data.local.timezone)}</p>
              <p className="text-sm text-foreground-muted">{formatDate(data.local.timezone)}</p>
              <p className="text-xs text-foreground-muted mt-2">UTC{formatOffset(data.local.offset)}</p>
            </div>

            {/* Other Time Zones */}
            {data.zones.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  Other Time Zones
                </h4>
                <div className="space-y-2">
                  {data.zones.map((zone, index) => (
                    <div key={index} className="bg-[var(--color-glass-input)] p-3 rounded-lg border border-[var(--color-glass-border)]">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-foreground">{zone.city}</p>
                          <p className="text-xs text-foreground-muted">{zone.timezone}</p>
                        </div>
                        <span className="text-xs text-foreground-muted">UTC{formatOffset(zone.offset)}</span>
                      </div>
                      <p className="text-xl font-bold font-mono text-foreground mb-1">{formatTime(zone.timezone)}</p>
                      <p className="text-xs text-foreground-muted">{formatDate(zone.timezone)}</p>
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

const formatOffset = (offset: number): string => {
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset);
  const minutes = Math.round((absOffset - hours) * 60);
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const TimeZonesModule: React.FC<TimeZonesModuleProps> = React.memo(({ data }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
    <>
    <div 
      className="bg-[var(--color-glass-panel)] p-4 rounded-xl border border-[var(--color-glass-border)] flex flex-col gap-4 cursor-pointer hover:bg-[var(--color-glass-button-hover)] transition-colors"
      onClick={() => setIsModalOpen(true)}
    >
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
      <div className="flex justify-end">
        <Info className="w-3 h-3 text-foreground-muted opacity-50" />
      </div>
    </div>
    <DetailModal data={data} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
});

TimeZonesModule.displayName = 'TimeZonesModule';

export default TimeZonesModule;

