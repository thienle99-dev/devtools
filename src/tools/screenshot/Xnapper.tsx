import React from 'react';
import { useXnapperStore } from '../../store/xnapperStore';
import { CaptureSection } from './components/CaptureSection';
import { PreviewSection } from './components/PreviewSection';
import { ExportPanel } from './components/ExportPanel';

export const Xnapper: React.FC = () => {
    const { currentScreenshot } = useXnapperStore();

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-border-glass">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Screenshot Tool
                </h1>
                <p className="text-sm text-foreground-secondary mt-1">
                    Capture, enhance, and export beautiful screenshots
                </p>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-hidden">
                {!currentScreenshot ? (
                    /* Capture mode - no screenshot yet */
                    <div className="h-full overflow-y-auto p-6">
                        <CaptureSection />
                    </div>
                ) : (
                    /* Preview and export mode - screenshot captured */
                    <div className="h-full grid grid-cols-[1fr,400px]">
                        {/* Preview */}
                        <div className="border-r border-border-glass">
                            <PreviewSection />
                        </div>

                        {/* Export panel */}
                        <div className="overflow-y-auto">
                            <ExportPanel />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer with quick actions */}
            {currentScreenshot && (
                <div className="p-4 border-t border-border-glass flex items-center justify-between bg-glass-panel/50">
                    <button
                        onClick={() => {
                            useXnapperStore.getState().setCurrentScreenshot(null);
                            useXnapperStore.getState().setShowPreview(false);
                        }}
                        className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                        ← Capture New Screenshot
                    </button>
                    <div className="text-xs text-foreground-muted">
                        {currentScreenshot.width} × {currentScreenshot.height} • {currentScreenshot.format.toUpperCase()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Xnapper;
