import React, { useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles, Check, X, Copy } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useXnapperStore } from '../../../store/xnapperStore';
import { AnnotationToolbar } from './AnnotationToolbar';
import { CanvasPreview } from './CanvasPreview';
import type { CanvasPreviewHandle } from './CanvasPreview';
import { cropImage } from '../utils/crop';
import { generateFinalImage } from '../utils/exportUtils';
import { toast } from 'sonner';

export const PreviewSection: React.FC = () => {
    const {
        currentScreenshot,
        autoBalance,
        setAutoBalance,
        redactionAreas,
        isCropping,
        setIsCropping,
        cropBounds,
        setCropBounds,
        setCurrentScreenshot,
        background,
        backgroundPadding,
        canvasData,
        borderRadius,
        shadowBlur,
        shadowOpacity,
        shadowOffsetX,
        shadowOffsetY,
        inset,
        showWindowControls,
        watermark,
    } = useXnapperStore();

    const canvasPreviewRef = useRef<CanvasPreviewHandle>(null);
    const [zoom, setZoom] = useState(1);
    const [canUndo, setCanUndo] = useState(false);
    const [canRedo, setCanRedo] = useState(false);
    const [annotationCount, setAnnotationCount] = useState(0);
    const [showCopyFlash, setShowCopyFlash] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

    // Handle history updates from CanvasPreview
    const handleHistoryChange = useCallback((undo: boolean, redo: boolean, count: number) => {
        setCanUndo(undo);
        setCanRedo(redo);
        setAnnotationCount(count);
    }, []);

    // Double-click to copy
    const handleDoubleClickCopy = async () => {
        if (!currentScreenshot || isCopying || isCropping) return;

        setIsCopying(true);
        try {
            // Generate final image with all effects
            const processedDataUrl = await generateFinalImage(currentScreenshot.dataUrl, {
                autoBalance,
                redactionAreas,
                background,
                backgroundPadding,
                annotations: canvasData || undefined,
                borderRadius,
                shadowBlur,
                shadowOpacity,
                shadowOffsetX,
                shadowOffsetY,
                inset,
                showWindowControls,
                watermark,
            });

            // Convert to blob and copy
            const response = await fetch(processedDataUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob,
                }),
            ]);

            // Show visual feedback
            setShowCopyFlash(true);
            toast.success('Copied to clipboard!', {
                icon: <Copy className="w-4 h-4" />,
            });

            setTimeout(() => setShowCopyFlash(false), 500);
        } catch (error) {
            console.error('Copy failed:', error);
            toast.error('Failed to copy to clipboard');
        } finally {
            setIsCopying(false);
        }
    };

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

    const handleApplyCrop = async () => {
        if (!cropBounds || !currentScreenshot) return;

        try {
            // Crop the image
            const croppedDataUrl = await cropImage(currentScreenshot.dataUrl, cropBounds);

            // Update the screenshot with cropped version
            setCurrentScreenshot({
                ...currentScreenshot,
                dataUrl: croppedDataUrl,
                width: cropBounds.width,
                height: cropBounds.height,
            });

            // Exit crop mode
            setIsCropping(false);
            setCropBounds(null);

            toast.success('Image cropped successfully!');
        } catch (error) {
            console.error('Failed to crop image:', error);
            toast.error('Failed to crop image');
        }
    };

    const handleCancelCrop = () => {
        setIsCropping(false);
        setCropBounds(null);
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
            <div
                className="flex-1 overflow-hidden relative"
                onDoubleClick={handleDoubleClickCopy}
                style={{ cursor: isCopying ? 'wait' : 'default' }}
            >
                <CanvasPreview
                    ref={canvasPreviewRef}
                    onHistoryChange={handleHistoryChange}
                />

                {/* Copy Flash Feedback */}
                {showCopyFlash && (
                    <div className="absolute inset-0 bg-indigo-500/20 pointer-events-none animate-pulse z-50" />
                )}

                {/* Double-Click Hint (show when not cropping and not copying) */}
                {!isCropping && !isCopying && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-sm text-white text-sm rounded-lg border border-white/10 pointer-events-none opacity-60 hover:opacity-100 transition-opacity">
                        💡 Double-click to copy
                    </div>
                )}

                {/* Crop Controls */}
                {isCropping && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-glass-panel p-3 rounded-lg border border-border-glass shadow-lg z-10">
                        <Button
                            variant="primary"
                            onClick={handleApplyCrop}
                            disabled={!cropBounds}
                            size="sm"
                            className="gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Apply Crop
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleCancelCrop}
                            size="sm"
                            className="gap-2"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
