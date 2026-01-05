import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CaptureMode = 'fullscreen' | 'window' | 'area';
export type ExportFormat = 'png' | 'jpg' | 'webp';

export interface Screenshot {
    id: string;
    dataUrl: string;
    width: number;
    height: number;
    timestamp: number;
    format: ExportFormat;
}

interface XnapperState {
    // Current screenshot
    currentScreenshot: Screenshot | null;
    setCurrentScreenshot: (screenshot: Screenshot | null) => void;

    // Capture settings
    captureMode: CaptureMode;
    setCaptureMode: (mode: CaptureMode) => void;

    // Export settings
    exportFormat: ExportFormat;
    setExportFormat: (format: ExportFormat) => void;
    exportQuality: number; // 0-100
    setExportQuality: (quality: number) => void;

    // Auto-balance
    autoBalance: boolean;
    setAutoBalance: (enabled: boolean) => void;

    // Screenshot history
    history: Screenshot[];
    addToHistory: (screenshot: Screenshot) => void;
    removeFromHistory: (id: string) => void;
    clearHistory: () => void;

    // UI state
    isCapturing: boolean;
    setIsCapturing: (capturing: boolean) => void;
    showPreview: boolean;
    setShowPreview: (show: boolean) => void;
}

export const useXnapperStore = create<XnapperState>()(
    persist(
        (set) => ({
            // Current screenshot
            currentScreenshot: null,
            setCurrentScreenshot: (screenshot) => set({ currentScreenshot: screenshot }),

            // Capture settings
            captureMode: 'area',
            setCaptureMode: (mode) => set({ captureMode: mode }),

            // Export settings
            exportFormat: 'png',
            setExportFormat: (format) => set({ exportFormat: format }),
            exportQuality: 90,
            setExportQuality: (quality) => set({ exportQuality: quality }),

            // Auto-balance
            autoBalance: true,
            setAutoBalance: (enabled) => set({ autoBalance: enabled }),

            // Screenshot history
            history: [],
            addToHistory: (screenshot) => set((state) => ({
                history: [screenshot, ...state.history].slice(0, 50) // Keep last 50
            })),
            removeFromHistory: (id) => set((state) => ({
                history: state.history.filter(s => s.id !== id)
            })),
            clearHistory: () => set({ history: [] }),

            // UI state
            isCapturing: false,
            setIsCapturing: (capturing) => set({ isCapturing: capturing }),
            showPreview: false,
            setShowPreview: (show) => set({ showPreview: show }),
        }),
        {
            name: 'xnapper-storage',
            partialize: (state) => ({
                captureMode: state.captureMode,
                exportFormat: state.exportFormat,
                exportQuality: state.exportQuality,
                autoBalance: state.autoBalance,
                history: state.history,
            }),
        }
    )
);
