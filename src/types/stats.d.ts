export interface CPUStats {
  manufacturer: string;
  brand: string;
  speed: number;
  cores: number;
  physicalCores: number;
  load: {
    currentLoad: number;
    currentLoadUser: number;
    currentLoadSystem: number;
    cpus: {
      load: number;
      loadUser: number;
      loadSystem: number;
    }[];
  };
  metrics?: {
    avg: number;
    currentLoad: number;
  }
}

export interface MemoryStats {
  total: number;
  free: number;
  used: number;
  active: number;
  available: number;
  swaptotal: number;
  swapused: number;
  swapfree: number;
}

export interface NetworkStats {
  stats: {
    iface: string;
    rx_bytes: number;
    rx_sec: number;
    tx_bytes: number;
    tx_sec: number;
    operstate: string;
  }[];
  interfaces: {
    iface: string;
    ifaceName: string;
    ip4: string;
    ip6: string;
    mac: string;
    internal: boolean;
    virtual: boolean;
    type: string;
  }[];
}

export interface SystemMetrics {
  cpu: CPUStats;
  memory: MemoryStats;
  network: NetworkStats;
  timestamp: number;
}

declare global {
  interface Window {
    statsAPI: {
      getCPUStats: () => Promise<CPUStats>;
      getMemoryStats: () => Promise<MemoryStats>;
      getNetworkStats: () => Promise<NetworkStats>;
    }
  }
}
