import React from 'react';
import { Camera, ArrowLeft, Sparkles, Image as ImageIcon, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useXnapperStore } from '../../store/xnapperStore';
import { CaptureSection } from './components/CaptureSection';
import { PreviewSection } from './components/PreviewSection';
import { XnapperStylePanel } from './components/XnapperStylePanel';
import type { CanvasPreviewHandle } from './types';

export const Xnapper: React.FC = () => {
    const { currentScreenshot } = useXnapperStore();
    const canvasRef = React.useRef<CanvasPreviewHandle | null>(null);
    const [historyState, setHistoryState] = React.useState({
        canUndo: false,
        canRedo: false,
        count: 0
    });
    const [zoom, setZoom] = React.useState(1);
    const [isPanelOpen, setIsPanelOpen] = React.useState(true);

    const handleHistoryChange = React.useCallback((canUndo: boolean, canRedo: boolean, count: number) => {
        setHistoryState({ canUndo, canRedo, count });
    }, []);

    const handleZoomChange = React.useCallback((newZoom: number) => {
        setZoom(newZoom);
    }, []);

    // Keyboard shortcut to toggle panel (Cmd/Ctrl + \)
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
                e.preventDefault();
                setIsPanelOpen(prev => !prev);
            }
        };

        if (currentScreenshot) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [currentScreenshot]);

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-indigo-500/5">
            {/* Pro Header */}
            <div className="relative px-6 py-4 border-b border-border-glass bg-glass-panel backdrop-blur-xl z-10">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 opacity-50" />

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Icon with Animation */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-40 animate-pulse" />
                            <div className="relative p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                                <Camera className="w-5 h-5 text-white" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Screenshot Studio
                                </h1>
                                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                            </div>
                            <p
                                className="text-xs mt-0.5 font-medium"
                                style={{ color: 'var(--color-text-muted)' }}
                            >
                                Professional screenshot capture & enhancement
                            </p>
                        </div>
                    </div>

                    {/* Right side actions */}
                    <div className="flex items-center gap-2">
                        {/* Panel Toggle Button - Compact */}
                        {currentScreenshot && (
                            <button
                                onClick={() => setIsPanelOpen(!isPanelOpen)}
                                className="p-2 rounded-lg bg-glass-panel border border-border-glass hover:border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-400 transition-all duration-200 group"
                                title={`${isPanelOpen ? 'Hide' : 'Show'} Panel (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + \\)`}
                            >
                                {isPanelOpen ? (
                                    <PanelRightClose className="w-4 h-4 transition-transform group-hover:scale-110" />
                                ) : (
                                    <PanelRightOpen className="w-4 h-4 transition-transform group-hover:scale-110" />
                                )}
                            </button>
                        )}

                        {/* Stats Badge (when screenshot captured) */}
                        {currentScreenshot && (
                            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-glass-panel border border-border-glass">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                                    <span
                                        className="text-xs font-mono font-semibold"
                                        style={{ color: 'var(--color-text-secondary)' }}
                                    >
                                        {currentScreenshot.width} × {currentScreenshot.height}
                                    </span>
                                </div>
                                <div className="w-px h-4 bg-border-glass" />
                                <span
                                    className="text-xs font-mono font-semibold text-indigo-400"
                                >
                                    {currentScreenshot.format.toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden relative">
                {!currentScreenshot ? (
                    /* Capture Mode - Centered with max width */
                    <div className="h-full overflow-y-auto">
                        <div className="max-w-5xl mx-auto p-8">
                            <CaptureSection />
                        </div>
                    </div>
                ) : (
                    /* Preview & Edit Mode */
                    <div className="h-full flex flex-row gap-0 relative overflow-hidden">
                        {/* Preview Canvas - Dynamic width */}
                        <div
                            className="relative transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                            style={{
                                width: isPanelOpen ? 'calc(100% - 400px)' : '100%',
                                height: '100%',
                                overflow: 'hidden',
                                display: 'flex',
                                background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05), transparent 70%), rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <PreviewSection
                                canvasRef={canvasRef}
                                onHistoryChange={handleHistoryChange}
                                onZoomChange={handleZoomChange}
                            />

                        </div>

                        {/* Style Panel - Sliding sidebar with smooth animation */}
                        <div
                            className="transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden shadow-2xl"
                            style={{
                                width: isPanelOpen ? '400px' : '0px',
                                opacity: isPanelOpen ? 1 : 0,
                                transform: isPanelOpen ? 'translateX(0)' : 'translateX(20px)',
                                borderLeft: isPanelOpen ? '1px solid rgba(99, 102, 241, 0.1)' : 'none'
                            }}
                        >
                            <XnapperStylePanel
                                canvasRef={canvasRef}
                                historyState={historyState}
                                zoom={zoom}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Pro Footer */}
            {currentScreenshot && (
                <div className="relative px-6 py-3 border-t border-border-glass bg-glass-panel backdrop-blur-xl">
                    {/* Background Accent */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent opacity-50" />

                    <div className="relative flex items-center justify-between">
                        {/* New Capture Button */}
                        <button
                            onClick={() => {
                                useXnapperStore.getState().setCurrentScreenshot(null);
                                useXnapperStore.getState().setShowPreview(false);
                                useXnapperStore.getState().clearRedactionAreas();
                                useXnapperStore.getState().setBackground(null);
                            }}
                            className="group flex items-center gap-2 px-4 py-2 rounded-xl border border-border-glass transition-all duration-200 hover:border-indigo-500/50 hover:bg-indigo-500/10"
                        >
                            <ArrowLeft className="w-4 h-4 text-indigo-400 transition-transform group-hover:-translate-x-1" />
                            <span
                                className="text-sm font-semibold text-indigo-400"
                            >
                                New Capture
                            </span>
                        </button>

                        {/* Quick Info */}
                        <div
                            className="flex items-center gap-4 text-xs font-mono"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-indigo-400">●</span>
                                <span>Ready to export</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Xnapper;
