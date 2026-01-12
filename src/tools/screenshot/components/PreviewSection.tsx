import React, { useState } from 'react';
import { Check, X, Copy } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useXnapperStore } from '../../../store/xnapperStore';
import { CanvasPreview } from './CanvasPreview';
import type { CanvasPreviewHandle } from './CanvasPreview';
import { cropImage } from '../utils/crop';
import { generateFinalImage } from '../utils/exportUtils';
import { toast } from 'sonner';

interface PreviewSectionProps {
    canvasRef: React.RefObject<CanvasPreviewHandle | null>;
    onHistoryChange: (undo: boolean, redo: boolean, count: number) => void;
}

export const PreviewSection: React.FC<PreviewSectionProps> = ({
    canvasRef,
    onHistoryChange
}) => {
    const {
        currentScreenshot,
        autoBalance,
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
        aspectRatio,
    } = useXnapperStore();

    const [showCopyFlash, setShowCopyFlash] = useState(false);
    const [isCopying, setIsCopying] = useState(false);

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
                aspectRatio,
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
        <div className="flex flex-col h-full bg-transparent">
            {/* Canvas Preview Area */}
            <div
                className="flex-1 overflow-hidden relative"
                onDoubleClick={handleDoubleClickCopy}
                style={{ cursor: isCopying ? 'wait' : 'default' }}
            >
                <CanvasPreview
                    ref={canvasRef}
                    onHistoryChange={onHistoryChange}
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

                {/* Crop Controls - Keep these overlaying the canvas */}
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
