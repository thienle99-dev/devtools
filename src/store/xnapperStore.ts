import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RedactionArea } from '../tools/screenshot/utils/redaction';
import type { Background } from '../tools/screenshot/utils/backgroundGenerator';
import type { AnnotationType, AnnotationConfig } from '../tools/screenshot/utils/annotations';
import { DEFAULT_ANNOTATION_CONFIG } from '../tools/screenshot/utils/annotations';
import type { CropBounds } from '../tools/screenshot/utils/crop';

export type CaptureMode = 'fullscreen' | 'window' | 'area' | 'url';
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

    // Delay
    captureDelay: number;
    setCaptureDelay: (delay: number) => void;

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

    // Style controls (Xnapper-like)
    borderRadius: number; // 0-40px
    setBorderRadius: (radius: number) => void;
    shadowBlur: number; // 0-100px
    setShadowBlur: (blur: number) => void;
    shadowOpacity: number; // 0-1
    setShadowOpacity: (opacity: number) => void;
    shadowOffsetX: number; // -50 to 50
    setShadowOffsetX: (offset: number) => void;
    shadowOffsetY: number; // -50 to 50
    setShadowOffsetY: (offset: number) => void;
    inset: number; // Inner padding, 0-100px
    setInset: (inset: number) => void;

    // Window Controls & Watermark
    showWindowControls: boolean;
    setShowWindowControls: (show: boolean) => void;
    watermark: {
        text: string;
        opacity: number;
        position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
    };
    setWatermark: (watermark: Partial<{ text: string; opacity: number; position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' }>) => void;

    // Annotations
    activeAnnotationTool: AnnotationType | null;
    setActiveAnnotationTool: (tool: AnnotationType | null) => void;
    annotationConfig: AnnotationConfig;
    setAnnotationConfig: (config: Partial<AnnotationConfig>) => void;
    canvasData: string | null; // Serialized Fabric.js canvas
    setCanvasData: (data: string | null) => void;

    // Crop
    cropBounds: CropBounds | null;
    setCropBounds: (bounds: CropBounds | null) => void;
    isCropping: boolean;
    setIsCropping: (cropping: boolean) => void;

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
    isUploading: boolean;
    setIsUploading: (uploading: boolean) => void;
    // Aspect Ratio
    aspectRatio: string; // 'auto', '1:1', '16:9', etc.
    setAspectRatio: (ratio: string) => void;

    lastUploadUrl: string | null;
    setLastUploadUrl: (url: string | null) => void;
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

            // Delay
            captureDelay: 0,
            setCaptureDelay: (delay) => set({ captureDelay: delay }),

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

            // Style controls (Xnapper-like)
            borderRadius: 12,
            setBorderRadius: (radius) => set({ borderRadius: radius }),
            shadowBlur: 40,
            setShadowBlur: (blur) => set({ shadowBlur: blur }),
            shadowOpacity: 0.3,
            setShadowOpacity: (opacity) => set({ shadowOpacity: opacity }),
            shadowOffsetX: 0,
            setShadowOffsetX: (offset) => set({ shadowOffsetX: offset }),
            shadowOffsetY: 10,
            setShadowOffsetY: (offset) => set({ shadowOffsetY: offset }),
            inset: 0,
            setInset: (inset) => set({ inset: inset }),

            // Window Controls & Watermark
            showWindowControls: true,
            setShowWindowControls: (show) => set({ showWindowControls: show }),
            watermark: { text: '', opacity: 0.3, position: 'bottom-right' },
            setWatermark: (watermark) => set((state) => ({ watermark: { ...state.watermark, ...watermark } })),

            // Annotations
            activeAnnotationTool: null,
            setActiveAnnotationTool: (tool) => set({ activeAnnotationTool: tool }),
            annotationConfig: DEFAULT_ANNOTATION_CONFIG,
            setAnnotationConfig: (config) => set((state) => ({
                annotationConfig: { ...state.annotationConfig, ...config }
            })),
            canvasData: null,
            setCanvasData: (data) => set({ canvasData: data }),

            // Crop
            cropBounds: null,
            setCropBounds: (bounds) => set({ cropBounds: bounds }),
            isCropping: false,
            setIsCropping: (cropping) => set({ isCropping: cropping }),

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
            isUploading: false,
            setIsUploading: (uploading) => set({ isUploading: uploading }),
            lastUploadUrl: null,
            setLastUploadUrl: (url) => set({ lastUploadUrl: url }),

            // Aspect Ratio
            aspectRatio: 'auto',
            setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
        }),
        {
            name: 'xnapper-storage',
            partialize: (state) => ({
                captureMode: state.captureMode,
                exportFormat: state.exportFormat,
                exportQuality: state.exportQuality,
                autoBalance: state.autoBalance,
                aspectRatio: state.aspectRatio,
                backgroundPadding: state.backgroundPadding,
                borderRadius: state.borderRadius,
                shadowBlur: state.shadowBlur,
                shadowOpacity: state.shadowOpacity,
                shadowOffsetX: state.shadowOffsetX,
                shadowOffsetY: state.shadowOffsetY,
                inset: state.inset,
                showWindowControls: state.showWindowControls,
                watermark: state.watermark,
                annotationConfig: state.annotationConfig,
                history: state.history,
            }),
        }
    )
);
