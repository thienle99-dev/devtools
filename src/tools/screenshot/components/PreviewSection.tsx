import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useXnapperStore } from '../../../store/xnapperStore';
import { applyAutoBalance } from '../utils/imageEnhancement';
import { applyRedaction } from '../utils/redaction';
import { applyGradientBackground, applyImageBackground, applySolidBackground, addPaddingToScreenshot } from '../utils/backgroundGenerator';

export const PreviewSection: React.FC = () => {
    const {
        currentScreenshot,
        autoBalance,
        setAutoBalance,
        redactionAreas,
        background,
        backgroundPadding,
    } = useXnapperStore();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [zoom, setZoom] = useState(1);
    const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!currentScreenshot || !canvasRef.current) return;

        const processImage = async () => {
            const canvas = canvasRef.current!;
            const ctx = canvas.getContext('2d')!;

            const img = new Image();
            img.onload = async () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                // Apply auto-balance
                if (autoBalance) {
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const enhanced = applyAutoBalance(imageData);
                    ctx.putImageData(enhanced, 0, 0);
                }

                // Apply redactions
                for (const area of redactionAreas) {
                    applyRedaction(ctx, area);
                }

                // If background is set, create a new canvas with background
                if (background && backgroundPadding > 0) {
                    const finalCanvas = addPaddingToScreenshot(canvas, backgroundPadding, background);

                    // If it's an image background, we need to handle it differently
                    if (background.type === 'image') {
                        const bgCanvas = document.createElement('canvas');
                        bgCanvas.width = finalCanvas.width;
                        bgCanvas.height = finalCanvas.height;
                        const bgCtx = bgCanvas.getContext('2d')!;

                        await applyImageBackground(
                            bgCtx,
                            bgCanvas.width,
                            bgCanvas.height,
                            background.imageUrl,
                            background.blur,
                            background.opacity
                        );

                        // Draw screenshot on top
                        bgCtx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                        bgCtx.shadowBlur = 20;
                        bgCtx.shadowOffsetX = 0;
                        bgCtx.shadowOffsetY = 10;
                        bgCtx.drawImage(canvas, backgroundPadding, backgroundPadding);

                        setProcessedDataUrl(bgCanvas.toDataURL('image/png'));
                    } else {
                        setProcessedDataUrl(finalCanvas.toDataURL('image/png'));
                    }
                } else if (background && backgroundPadding === 0) {
                    // Background without padding - just apply to existing canvas
                    const bgCanvas = document.createElement('canvas');
                    bgCanvas.width = canvas.width;
                    bgCanvas.height = canvas.height;
                    const bgCtx = bgCanvas.getContext('2d')!;

                    if (background.type === 'solid') {
                        applySolidBackground(bgCtx, bgCanvas.width, bgCanvas.height, background.color);
                    } else if ('colors' in background) {
                        applyGradientBackground(bgCtx, bgCanvas.width, bgCanvas.height, background);
                    } else if (background.type === 'image') {
                        await applyImageBackground(
                            bgCtx,
                            bgCanvas.width,
                            bgCanvas.height,
                            background.imageUrl,
                            background.blur,
                            background.opacity
                        );
                    }

                    bgCtx.drawImage(canvas, 0, 0);
                    setProcessedDataUrl(bgCanvas.toDataURL('image/png'));
                } else {
                    setProcessedDataUrl(canvas.toDataURL('image/png'));
                }
            };
            img.src = currentScreenshot.dataUrl;
        };

        processImage();
    }, [currentScreenshot, autoBalance, redactionAreas, background, backgroundPadding]);

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

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.25));
    const handleResetZoom = () => setZoom(1);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-border-glass">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground-secondary">
                        {currentScreenshot.width} × {currentScreenshot.height}
                    </span>
                    <span className="text-xs text-foreground-muted">
                        {Math.round((currentScreenshot.dataUrl.length * 3) / 4 / 1024)} KB
                    </span>
                    {redactionAreas.length > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
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
                    >
                        <Sparkles className="w-4 h-4" />
                        Auto-balance
                    </Button>

                    {/* Zoom controls */}
                    <div className="flex items-center gap-1 border border-border-glass rounded-lg p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.25}
                        >
                            <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-sm px-2 min-w-[60px] text-center">
                            {Math.round(zoom * 100)}%
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomIn}
                            disabled={zoom >= 3}
                        >
                            <ZoomIn className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetZoom}
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Preview area */}
            <div className="flex-1 overflow-auto bg-[#1a1a1a] p-4">
                <div className="flex items-center justify-center min-h-full">
                    <div
                        style={{
                            transform: `scale(${zoom})`,
                            transformOrigin: 'center',
                            transition: 'transform 0.2s ease',
                        }}
                        className="shadow-2xl"
                    >
                        <canvas
                            ref={canvasRef}
                            className="max-w-full h-auto rounded-lg"
                            style={{ display: 'none' }}
                        />
                        {processedDataUrl && (
                            <img
                                src={processedDataUrl}
                                alt="Screenshot preview"
                                className="max-w-full h-auto rounded-lg"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
