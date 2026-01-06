import React, { useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useXnapperStore } from '../../../store/xnapperStore';
import { AnnotationToolbar } from './AnnotationToolbar';
import { CanvasPreview } from './CanvasPreview';
import type { CanvasPreviewHandle } from './CanvasPreview';

export const PreviewSection: React.FC = () => {
    const {
        currentScreenshot,
        autoBalance,
        setAutoBalance,
        redactionAreas,
    } = useXnapperStore();

    const canvasPreviewRef = useRef<CanvasPreviewHandle>(null);
    const [zoom, setZoom] = useState(1);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [annotationCount, setAnnotationCount] = useState(0);

    // Handle history updates from CanvasPreview
    const handleHistoryChange = useCallback((undo: boolean, redo: boolean, count: number) => {
        setCanUndo(undo);
        setCanRedo(redo);
        setAnnotationCount(count);
    }, []);

    if (!currentScreenshot) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px] text-foreground-muted">
                <div className="text-center">
                    <p className="text-lg">No screenshot captured yet</p>
                    <p className="text-sm mt-2">Capture a screenshot to see the preview</p>
                </div>
            </div>
        );
    }

    const handleZoomIn = () => {
        canvasPreviewRef.current?.zoomIn();
        if (canvasPreviewRef.current) setZoom(canvasPreviewRef.current.getZoom());
    };

    const handleZoomOut = () => {
        canvasPreviewRef.current?.zoomOut();
        if (canvasPreviewRef.current) setZoom(canvasPreviewRef.current.getZoom());
    };

    const handleResetZoom = () => {
        canvasPreviewRef.current?.resetZoom();
        setZoom(1);
    };

    return (
        <div className="flex flex-col h-full bg-[#1a1a1a]">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-border-glass bg-glass-panel">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-foreground-secondary">
                            {currentScreenshot.width} × {currentScreenshot.height}
                        </span>
                        <span className="text-xs text-foreground-muted">
                            {Math.round((currentScreenshot.dataUrl.length * 3) / 4 / 1024)} KB
                        </span>
                    </div>
                    {redactionAreas.length > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
                            {redactionAreas.length} redaction{redactionAreas.length > 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Auto-balance toggle */}
                    <Button
                        variant={autoBalance ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setAutoBalance(!autoBalance)}
                        className="gap-2"
                        title="Enhance image automatically"
                    >
                        <Sparkles className="w-4 h-4" />
                        <span className="hidden sm:inline">Auto-balance</span>
                    </Button>

                    <div className="w-px h-6 bg-border-glass mx-2" />

                    {/* Zoom controls */}
                    <div className="flex items-center gap-1 border border-border-glass rounded-lg p-1 bg-glass-panel">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomOut}
                        >
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-sm px-2 min-w-[50px] text-center text-foreground-secondary">
                            {Math.round(zoom * 100)}%
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomIn}
                        >
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetZoom}
                            title="Reset Zoom"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Annotation Toolbar */}
            <AnnotationToolbar
                onUndo={() => canvasPreviewRef.current?.undo()}
                onRedo={() => canvasPreviewRef.current?.redo()}
                onClear={() => canvasPreviewRef.current?.clear()}
                canUndo={canUndo}
                canRedo={canRedo}
                annotationCount={annotationCount}
            />

            {/* Canvas Preview Area */}
            <div className="flex-1 overflow-hidden relative">
                <CanvasPreview
                    ref={canvasPreviewRef}
                    onHistoryChange={handleHistoryChange}
                />
            </div>
        </div>
    );
};
