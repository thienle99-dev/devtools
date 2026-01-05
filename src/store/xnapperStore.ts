import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RedactionArea } from '../tools/screenshot/utils/redaction';
import type { Background } from '../tools/screenshot/utils/backgroundGenerator';

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

    // Redaction
    redactionAreas: RedactionArea[];
    addRedactionArea: (area: RedactionArea) => void;
    removeRedactionArea: (id: string) => void;
    clearRedactionAreas: () => void;
    updateRedactionArea: (id: string, updates: Partial<RedactionArea>) => void;

    // Background
    background: Background | null;
    setBackground: (background: Background | null) => void;
    backgroundPadding: number;
    setBackgroundPadding: (padding: number) => void;

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
    isAnalyzing: boolean;
    setIsAnalyzing: (analyzing: boolean) => void;
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

            // Redaction
            redactionAreas: [],
            addRedactionArea: (area) => set((state) => ({
                redactionAreas: [...state.redactionAreas, area]
            })),
            removeRedactionArea: (id) => set((state) => ({
                redactionAreas: state.redactionAreas.filter(a => a.id !== id)
            })),
            clearRedactionAreas: () => set({ redactionAreas: [] }),
            updateRedactionArea: (id, updates) => set((state) => ({
                redactionAreas: state.redactionAreas.map(a =>
                    a.id === id ? { ...a, ...updates } : a
                )
            })),

            // Background
            background: null,
            setBackground: (background) => set({ background }),
            backgroundPadding: 40,
            setBackgroundPadding: (padding) => set({ backgroundPadding: padding }),

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
            isAnalyzing: false,
            setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
        }),
        {
            name: 'xnapper-storage',
            partialize: (state) => ({
                captureMode: state.captureMode,
                exportFormat: state.exportFormat,
                exportQuality: state.exportQuality,
                autoBalance: state.autoBalance,
                backgroundPadding: state.backgroundPadding,
                history: state.history,
            }),
        }
    )
);
