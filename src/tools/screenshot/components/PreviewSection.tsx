import React, { useEffect, useRef, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useXnapperStore } from '../../../store/xnapperStore';
import { applyAutoBalance } from '../utils/imageEnhancement';

export const PreviewSection: React.FC = () => {
    const { currentScreenshot, autoBalance, setAutoBalance } = useXnapperStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [zoom, setZoom] = useState(1);
    const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!currentScreenshot || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            if (autoBalance) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const enhanced = applyAutoBalance(imageData);
                ctx.putImageData(enhanced, 0, 0);
            }

            setProcessedDataUrl(canvas.toDataURL('image/png'));
        };
        img.src = currentScreenshot.dataUrl;
    }, [currentScreenshot, autoBalance]);

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
