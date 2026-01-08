import { useState, useEffect } from 'react';

/**
 * Interface for network speed information
 */
export interface NetworkSpeed {
  downloadSpeed: number; // Mbps
  lastUpdated: number;
  samples: number[];
}

/**
 * Hook to track and estimate network speed based on download samples
 */
export const useNetworkSpeed = () => {
  const [networkSpeed, setNetworkSpeed] = useState<NetworkSpeed>({
    downloadSpeed: 10, // Default 10 Mbps
    lastUpdated: Date.now(),
    samples: []
  });

  useEffect(() => {
    // Estimate network speed from recent downloads
    const estimateSpeed = () => {
      // This will be populated from actual download speeds
      const speeds = networkSpeed.samples.slice(-5); // Last 5 samples
      if (speeds.length > 0) {
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        setNetworkSpeed(prev => ({
          ...prev,
          downloadSpeed: avgSpeed,
          lastUpdated: Date.now()
        }));
      }
    };

    const interval = setInterval(estimateSpeed, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [networkSpeed.samples]);

  const updateSpeed = (bytesPerSecond: number) => {
    const mbps = (bytesPerSecond * 8) / (1024 * 1024); // Convert to Mbps
    setNetworkSpeed(prev => ({
      downloadSpeed: mbps,
      lastUpdated: Date.now(),
      samples: [...prev.samples.slice(-9), mbps] // Keep last 10 samples
    }));
  };

  return { networkSpeed, updateSpeed };
};

/**
 * Get recommended video quality based on download speed in Mbps
 */
export const getRecommendedQuality = (downloadSpeedMbps: number): string => {
  // Smart quality selection based on network speed
  if (downloadSpeedMbps >= 25) return '1080p'; // 25+ Mbps → 1080p
  if (downloadSpeedMbps >= 10) return '720p';  // 10-25 Mbps → 720p
  if (downloadSpeedMbps >= 5) return '480p';   // 5-10 Mbps → 480p
  return '360p';                                // < 5 Mbps → 360p
};

/**
 * Format speed in Mbps for display
 */
export const formatNetworkSpeed = (mbps: number): string => {
  if (mbps >= 1) return `${mbps.toFixed(1)} Mbps`;
  return `${(mbps * 1024).toFixed(0)} Kbps`;
};
