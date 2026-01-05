import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SystemMetrics } from '../../../../types/stats';

interface Widget {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  config: Record<string, any>;
  enabled: boolean;
}

interface ChartHistory {
  cpu: number[];
  memory: number[];
  network: {
    rx: number[];
    tx: number[];
  };
  disk: {
    read: number[];
    write: number[];
  };
  gpu: number[];
  battery: {
    consumption: number[];
    charging: number[];
  };
}

interface StatsStore {
  metrics: SystemMetrics | null;
  enabledModules: string[];
  moduleOrder: string[];
  widgets: Widget[];
  chartHistory: ChartHistory;
  preferences: {
    updateInterval: number;
    theme: 'dark' | 'light' | 'auto';
    colorScheme: 'default' | 'custom';
    showMenuBar: boolean;
    menuBarPosition: 'left' | 'right';
  };

  // Actions
  updateMetrics: (metrics: SystemMetrics) => void;
  toggleModule: (moduleId: string) => void;
  reorderModules: (order: string[]) => void;
  addWidget: (widget: Omit<Widget, 'id'>) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Widget>) => void;
  updatePreferences: (prefs: Partial<StatsStore['preferences']>) => void;
  updateChartHistory: (moduleId: string, history: number[] | { rx?: number[]; tx?: number[]; read?: number[]; write?: number[]; consumption?: number[]; charging?: number[] }) => void;
}

const MAX_POINTS = 20;

const initialChartHistory: ChartHistory = {
  cpu: Array(MAX_POINTS).fill(0),
  memory: Array(MAX_POINTS).fill(0),
  network: {
    rx: Array(MAX_POINTS).fill(0),
    tx: Array(MAX_POINTS).fill(0),
  },
  disk: {
    read: Array(MAX_POINTS).fill(0),
    write: Array(MAX_POINTS).fill(0),
  },
  gpu: Array(MAX_POINTS).fill(0),
  battery: {
    consumption: Array(MAX_POINTS).fill(0),
    charging: Array(MAX_POINTS).fill(0),
  },
};

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      metrics: null,
      enabledModules: [], // Mặc định tất cả modules đều tắt
      moduleOrder: ['cpu', 'memory', 'network', 'disk', 'gpu', 'battery', 'sensors'],
      widgets: [],
      chartHistory: initialChartHistory,
      preferences: {
        updateInterval: 2000,
        theme: 'auto',
        colorScheme: 'default',
        showMenuBar: true,
        menuBarPosition: 'right',
      },

      updateMetrics: (metrics) => set({ metrics }),
      toggleModule: (moduleId) => set((state) => ({
        enabledModules: state.enabledModules.includes(moduleId)
          ? state.enabledModules.filter(id => id !== moduleId)
          : [...state.enabledModules, moduleId]
      })),
      reorderModules: (order) => set({ moduleOrder: order }),
      addWidget: (widget) => set((state) => ({
        widgets: [...state.widgets, { ...widget, id: `widget-${Date.now()}` }]
      })),
      removeWidget: (id) => set((state) => ({
        widgets: state.widgets.filter(w => w.id !== id)
      })),
      updateWidget: (id, updates) => set((state) => ({
        widgets: state.widgets.map(w => w.id === id ? { ...w, ...updates } : w)
      })),
      updatePreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs }
      })),
      updateChartHistory: (moduleId, history) => set((state) => {
        const newHistory = { ...state.chartHistory };
        
        if (moduleId === 'cpu' && Array.isArray(history)) {
          newHistory.cpu = history;
        } else if (moduleId === 'memory' && Array.isArray(history)) {
          newHistory.memory = history;
        } else if (moduleId === 'network' && typeof history === 'object' && !Array.isArray(history)) {
          if ('rx' in history && Array.isArray(history.rx)) newHistory.network.rx = history.rx;
          if ('tx' in history && Array.isArray(history.tx)) newHistory.network.tx = history.tx;
        } else if (moduleId === 'disk' && typeof history === 'object' && !Array.isArray(history)) {
          if ('read' in history && Array.isArray(history.read)) newHistory.disk.read = history.read;
          if ('write' in history && Array.isArray(history.write)) newHistory.disk.write = history.write;
        } else if (moduleId === 'gpu' && Array.isArray(history)) {
          newHistory.gpu = history;
        } else if (moduleId === 'battery' && typeof history === 'object' && !Array.isArray(history)) {
          if ('consumption' in history && Array.isArray(history.consumption)) newHistory.battery.consumption = history.consumption;
          if ('charging' in history && Array.isArray(history.charging)) newHistory.battery.charging = history.charging;
        }
        
        return { chartHistory: newHistory };
      }),
    }),
    { 
      name: 'stats-monitor-storage',
      // Only persist chartHistory, không persist metrics (quá lớn và không cần thiết)
      partialize: (state) => ({
        enabledModules: state.enabledModules,
        moduleOrder: state.moduleOrder,
        widgets: state.widgets,
        chartHistory: state.chartHistory,
        preferences: state.preferences,
      }),
    }
  )
);
