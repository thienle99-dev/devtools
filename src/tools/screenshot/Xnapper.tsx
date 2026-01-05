import React, { useState } from 'react';
import { useXnapperStore } from '../../store/xnapperStore';
import { CaptureSection } from './components/CaptureSection';
import { PreviewSection } from './components/PreviewSection';
import { ExportPanel } from './components/ExportPanel';
import { RedactionPanel } from './components/RedactionPanel';
import { BackgroundPanel } from './components/BackgroundPanel';
import { Shield, Palette, Download } from 'lucide-react';
import { cn } from '../../utils/cn';

type SidePanel = 'redaction' | 'background' | 'export';

export const Xnapper: React.FC = () => {
    const { currentScreenshot } = useXnapperStore();
    const [activePanel, setActivePanel] = useState<SidePanel>('export');

    const panels: Array<{ id: SidePanel; label: string; icon: any }> = [
        { id: 'redaction', label: 'Redaction', icon: Shield },
        { id: 'background', label: 'Background', icon: Palette },
        { id: 'export', label: 'Export', icon: Download },
    ];

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
                    /* Preview and edit mode - screenshot captured */
                    <div className="h-full flex">
                        {/* Preview */}
                        <div className="flex-1 border-r border-border-glass">
                            <PreviewSection />
                        </div>

                        {/* Side panel */}
                        <div className="w-[380px] flex flex-col">
                            {/* Panel tabs */}
                            <div className="flex border-b border-border-glass">
                                {panels.map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        onClick={() => setActivePanel(id)}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-3 px-4 transition-all text-sm font-medium border-b-2",
                                            activePanel === id
                                                ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                                                : "border-transparent text-foreground-secondary hover:text-foreground hover:bg-glass-panel/50"
                                        )}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Panel content */}
                            <div className="flex-1 overflow-y-auto">
                                {activePanel === 'redaction' && <RedactionPanel />}
                                {activePanel === 'background' && <BackgroundPanel />}
                                {activePanel === 'export' && <ExportPanel />}
                            </div>
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
                            useXnapperStore.getState().clearRedactionAreas();
                            useXnapperStore.getState().setBackground(null);
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
