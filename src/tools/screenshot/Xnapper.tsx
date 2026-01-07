import React from 'react';
import { Camera, ArrowLeft } from 'lucide-react';
import { useXnapperStore } from '../../store/xnapperStore';
import { CaptureSection } from './components/CaptureSection';
import { PreviewSection } from './components/PreviewSection';
import { XnapperStylePanel } from './components/XnapperStylePanel';

export const Xnapper: React.FC = () => {
    const { currentScreenshot } = useXnapperStore();

    return (
        <div className="h-full flex flex-col bg-background/50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border-glass bg-glass-background/30 backdrop-blur-sm z-10 w-full">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400">
                        <Camera className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            Screenshot Tool
                        </h1>
                        <p className="text-xs text-foreground-secondary">
                            Capture, enhance, and export beautiful screenshots
                        </p>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-hidden">
                {!currentScreenshot ? (
                    /* Capture mode - no screenshot yet */
                    <div className="h-full overflow-y-auto p-4">
                        <CaptureSection />
                    </div>
                ) : (
                    /* Preview and edit mode - screenshot captured */
                    <div className="h-full flex flex-col lg:flex-row p-1 gap-1">
                        {/* Preview */}
                        <div className="flex-1 overflow-hidden rounded-xl border border-border-glass bg-black/20 relative">
                            <PreviewSection />
                        </div>

                        {/* Xnapper Style Panel - Always visible on right */}
                        <div className="w-full lg:w-80 border-l border-border-glass bg-glass-panel/30">
                            <XnapperStylePanel />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer with quick actions */}
            {currentScreenshot && (
                <div className="px-4 py-2 border-t border-border-glass flex items-center justify-between bg-glass-background/30 backdrop-blur-sm">
                    <button
                        onClick={() => {
                            useXnapperStore.getState().setCurrentScreenshot(null);
                            useXnapperStore.getState().setShowPreview(false);
                            useXnapperStore.getState().clearRedactionAreas();
                            useXnapperStore.getState().setBackground(null);
                        }}
                        className="flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 rounded hover:bg-indigo-500/10"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Capture New
                    </button>
                    <div className="text-[10px] font-mono text-foreground-secondary flex gap-3">
                        <span>{currentScreenshot.width} × {currentScreenshot.height}</span>
                        <span className="opacity-50">|</span>
                        <span>{currentScreenshot.format.toUpperCase()}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Xnapper;
