import React, { useState, type JSX } from 'react';
import { Check, X, Copy, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useXnapperStore } from '../../../store/xnapperStore';
import { CanvasPreview } from './CanvasPreview';
import { KonvaCanvas } from '../konva/KonvaCanvas';
import type { CanvasPreviewHandle } from './CanvasPreview';
import { cropImage } from '../utils/crop';
import { generateFinalImage } from '../utils/exportUtils';
import { toast } from 'sonner';

interface PreviewSectionProps {
    canvasRef: React.RefObject<CanvasPreviewHandle | null>;
    onHistoryChange: (undo: boolean, redo: boolean, count: number) => void;
    onZoomChange?: (zoom: number) => void;
}

const USE_KONVA = true;

export const PreviewSection = ({
    canvasRef,
    onHistoryChange,
    onZoomChange
}: PreviewSectionProps): JSX.Element => {
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
                duration: 2000,
            });

            setTimeout(() => setShowCopyFlash(false), 1000);
        } catch (error) {
            console.error('Copy failed:', error);
            toast.error('Failed to copy to clipboard');
        } finally {
            setIsCopying(false);
        }
    };

    if (!currentScreenshot) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center space-y-6 max-w-md mx-auto p-8">
                    {/* Icon with glow */}
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl blur-3xl opacity-20 animate-pulse" />
                        <div className="relative w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/30 flex items-center justify-center backdrop-blur-sm">
                            <ImageIcon
                                className="w-12 h-12"
                                style={{ color: '#818cf8' }}
                            />
                        </div>
                    </div>

                    {/* Text */}
                    <div className="space-y-2">
                        <h3
                            className="text-2xl font-bold"
                            style={{ color: 'var(--color-text-primary)' }}
                        >
                            No Screenshot Yet
                        </h3>
                        <p
                            className="text-sm"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            Capture a screenshot to start editing and enhancing
                        </p>
                    </div>

                    {/* Hint badges */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                        <span className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400">
                            📸 Multiple modes
                        </span>
                        <span className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400">
                            ✨ Auto enhance
                        </span>
                        <span className="px-3 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-bold text-pink-400">
                            🎨 Backgrounds
                        </span>
                    </div>
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
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}
        >
            {/* Canvas Preview Area - Full height */}
            <div
                onDoubleClick={handleDoubleClickCopy}
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    cursor: isCopying ? 'wait' : 'default',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {USE_KONVA ? (
                    <KonvaCanvas
                        ref={canvasRef as any}
                        onHistoryChange={onHistoryChange}
                        onZoomChange={onZoomChange}
                    />
                ) : (
                    <CanvasPreview
                        ref={canvasRef as any}
                        onHistoryChange={onHistoryChange}
                        onZoomChange={onZoomChange}
                    />
                )}

                {/* Copy Flash Feedback - Premium */}
                {showCopyFlash && (
                    <>
                        {/* Flash overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 pointer-events-none animate-pulse z-50" />

                        {/* Success badge */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in zoom-in-95 duration-300">
                            <div className="relative">
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl blur-2xl opacity-50 animate-pulse" />

                                {/* Badge content */}
                                <div className="relative px-8 py-6 rounded-3xl bg-glass-panel border-2 border-indigo-500 backdrop-blur-xl shadow-2xl shadow-indigo-500/50">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                                            <Check className="w-8 h-8 text-white" />
                                        </div>
                                        <span className="text-lg font-bold text-indigo-400">
                                            Copied!
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Double-Click Hint (show when not cropping and not copying) */}
                {!isCropping && !isCopying && (
                    <div
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 backdrop-blur-xl text-sm rounded-2xl pointer-events-none opacity-70 hover:opacity-100 transition-all duration-300 border-2"
                        style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            color: 'var(--color-text-primary)',
                            borderColor: 'rgba(99, 102, 241, 0.3)',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-base">💡</span>
                            <span className="font-semibold">Double-click to copy</span>
                        </div>
                    </div>
                )}

                {/* Crop Controls - Premium overlay */}
                {isCropping && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-in slide-in-from-bottom-4 duration-300">
                        {/* Background with blur and glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl" />

                        <div className="relative flex gap-3 bg-glass-panel p-4 rounded-2xl border-2 border-border-glass backdrop-blur-xl shadow-2xl shadow-indigo-500/30">
                            <Button
                                variant="primary"
                                onClick={handleApplyCrop}
                                disabled={!cropBounds}
                                size="sm"
                                className="gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                <Check className="w-4 h-4" />
                                Apply Crop
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={handleCancelCrop}
                                size="sm"
                                className="gap-2 px-6 py-2.5 bg-glass-panel hover:bg-glass-panel-light border-2 border-border-glass hover:border-indigo-500/30 font-bold rounded-xl transition-all duration-200 hover:scale-105"
                                style={{ color: 'var(--color-text-secondary)' }}
                            >
                                <X className="w-4 h-4" />
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
