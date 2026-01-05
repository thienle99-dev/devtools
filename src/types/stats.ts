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

export interface DiskStats {
  fsSize: {
    fs: string;
    type: string;
    size: number;
    used: number;
    available: number;
    use: number;
    mount: string;
  }[];
  ioStats: {
    rIO: number;
    wIO: number;
    tIO: number;
    rIO_sec: number;
    wIO_sec: number;
    tIO_sec: number;
  } | null;
}

export interface GPUStats {
  controllers: {
    vendor: string;
    model: string;
    bus: string;
    vram: number;
    vramDynamic: boolean;
    utilizationGpu: number;
    utilizationMemory: number; 
    temperatureGpu: number;
  }[];
}

export interface BatteryStats {
  hasBattery: boolean;
  cycleCount: number;
  isCharging: boolean;
  designedCapacity: number;
  maxCapacity: number;
  currentCapacity: number;
  voltage: number;
  capacityUnit: string;
  percent: number;
  timeRemaining: number;
  acConnected: boolean;
  type: string;
  model: string;
  manufacturer: string;
  serial: string;
  // Power metrics (mW)
  powerConsumptionRate?: number; // Điện tiêu thụ trực tiếp
  chargingPower?: number; // Điện sạc vào pin
}

export interface SensorStats {
  cpuTemperature: {
    main: number;
    cores: number[];
    max: number;
  };
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
  disk?: DiskStats;
  gpu?: GPUStats;
  battery?: BatteryStats;
  sensors?: SensorStats;
  timestamp: number;
}

declare global {
  interface Window {
    statsAPI: {
      getCPUStats: () => Promise<CPUStats>;
      getMemoryStats: () => Promise<MemoryStats>;
      getNetworkStats: () => Promise<NetworkStats>;
      getDiskStats: () => Promise<DiskStats>;
      getGPUStats: () => Promise<GPUStats>;
      getBatteryStats: () => Promise<BatteryStats>;
      getSensorStats: () => Promise<SensorStats>;
    }
  }
}
