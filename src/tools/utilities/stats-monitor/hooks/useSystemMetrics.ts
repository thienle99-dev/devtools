import { useEffect, useRef, useState } from 'react';
import { SystemMetrics } from '../../../../types/stats';

export const useSystemMetrics = (enabled: boolean, interval: number = 2000) => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchMetrics = async () => {
      try {
        // Check if API is available (only in Electron)
        if (!window.statsAPI) {
          console.warn('statsAPI not available');
          return;
        }

        // Batch requests to reduce IPC overhead
        const [cpu, memory, network] = await Promise.all([
          window.statsAPI.getCPUStats(),
          window.statsAPI.getMemoryStats(),
          window.statsAPI.getNetworkStats(),
        ]);

        setMetrics({ 
          cpu, 
          memory, 
          network, 
          timestamp: Date.now() 
        });
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Polling
    const poll = () => {
      fetchMetrics();
      intervalRef.current = setTimeout(poll, interval);
    };

    intervalRef.current = setTimeout(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [enabled, interval]);

  return metrics;
};
