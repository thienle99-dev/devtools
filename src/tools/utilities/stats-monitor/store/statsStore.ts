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

interface StatsStore {
  metrics: SystemMetrics | null;
  enabledModules: string[];
  moduleOrder: string[];
  widgets: Widget[];
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
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      metrics: null,
      enabledModules: [], // Mặc định tất cả modules đều tắt
      moduleOrder: ['cpu', 'memory', 'network', 'disk', 'gpu', 'battery', 'sensors'],
      widgets: [],
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
    }),
    { name: 'stats-monitor-storage' }
  )
);
