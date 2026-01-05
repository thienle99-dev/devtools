import { useEffect, useRef, useState } from 'react';
import type { SystemMetrics } from '../../../../types/stats';

export const useSystemMetrics = (enabledModules: string[], interval: number = 2000) => {
  const [metrics, setMetrics] = useState<Partial<SystemMetrics> | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (enabledModules.length === 0) {
      setMetrics(null);
      return;
    }

    const fetchMetrics = async () => {
      try {
        // Check if API is available (only in Electron)
        if (!window.statsAPI) {
          console.warn('statsAPI not available');
          return;
        }

        // Chỉ fetch metrics cho modules được bật để giảm IPC overhead
        const promises: Promise<any>[] = [];
        const keys: (keyof SystemMetrics)[] = [];

        if (enabledModules.includes('cpu')) {
          promises.push(window.statsAPI.getCPUStats());
          keys.push('cpu');
        }
        if (enabledModules.includes('memory')) {
          promises.push(window.statsAPI.getMemoryStats());
          keys.push('memory');
        }
        if (enabledModules.includes('network')) {
          promises.push(window.statsAPI.getNetworkStats());
          keys.push('network');
        }
        if (enabledModules.includes('disk')) {
          promises.push(window.statsAPI.getDiskStats());
          keys.push('disk');
        }
        if (enabledModules.includes('gpu')) {
          promises.push(window.statsAPI.getGPUStats());
          keys.push('gpu');
        }
        if (enabledModules.includes('battery')) {
          promises.push(window.statsAPI.getBatteryStats());
          keys.push('battery');
        }
        if (enabledModules.includes('sensors')) {
          promises.push(window.statsAPI.getSensorStats());
          keys.push('sensors');
        }
        if (enabledModules.includes('bluetooth')) {
          promises.push(window.statsAPI.getBluetoothStats());
          keys.push('bluetooth');
        }
        if (enabledModules.includes('timezones')) {
          promises.push(window.statsAPI.getTimeZonesStats());
          keys.push('timeZones');
        }

        const results = await Promise.all(promises);
        
        // Only update if component is still mounted
        if (isMountedRef.current) {
          const newMetrics: Partial<SystemMetrics> = {
            timestamp: Date.now()
          };
          
          keys.forEach((key, index) => {
            newMetrics[key] = results[index];
          });
          
          setMetrics(newMetrics);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Polling
    const poll = () => {
      if (!isMountedRef.current) return;
      fetchMetrics();
      intervalRef.current = setTimeout(poll, interval);
    };

    intervalRef.current = setTimeout(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabledModules, interval]);

  return metrics;
};
