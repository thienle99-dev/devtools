import React, { useState } from 'react';
import type { CanvasPreviewHandle } from '../konva/KonvaCanvas';
import { Download, Copy, FileImage, CloudUpload, Link, Check, Loader2 } from 'lucide-react';
import { useXnapperStore } from '../store/xnapperStore';
import type { ExportFormat } from '../store/xnapperStore';
import { cn } from '@utils/cn';
import { toast } from 'sonner';
import { generateFinalImage, SOCIAL_PRESETS, type SocialPreset, type OutputConfig, applyOutputConfig } from '../utils/exportUtils';
import { uploadToImgur } from '../utils/uploadUtils';

interface ExportPanelProps {
    canvasRef?: React.RefObject<CanvasPreviewHandle | null>;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ canvasRef }) => {
    const {
        currentScreenshot,
        exportFormat,
        setExportFormat,
        exportQuality,
        setExportQuality,
        autoBalance,
        redactionAreas,
        background,
        backgroundPadding,
        canvasData,
        borderRadius,
        shadowBlur,
        shadowOpacity,
        shadowOffsetX,
        shadowOffsetY,
        inset,
        isUploading,
    } = useXnapperStore();

    const [filename, setFilename] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [copied, setCopied] = useState(false);

    // Resize / Preset State
    const [resizeMode, setResizeMode] = useState<'original' | 'preset' | 'custom'>('original');
    const [selectedPreset, setSelectedPreset] = useState<SocialPreset | null>(null);
    const [customWidth, setCustomWidth] = useState<number | ''>('');
    const [customHeight, setCustomHeight] = useState<number | ''>('');

    const formats: Array<{ format: ExportFormat; label: string; ext: string }> = [
        { format: 'png', label: 'PNG', ext: '.png' },
        { format: 'jpg', label: 'JPG', ext: '.jpg' },
        { format: 'webp', label: 'WebP', ext: '.webp' },
    ];

    const getOutputConfig = (): OutputConfig | undefined => {
        if (resizeMode === 'original') return undefined;

        const config: OutputConfig = {};
        if (resizeMode === 'preset' && selectedPreset) {
            config.preset = selectedPreset;
        } else if (resizeMode === 'custom') {
            if (customWidth) config.width = Number(customWidth);
            if (customHeight) config.height = Number(customHeight);
        }
        return Object.keys(config).length > 0 ? config : undefined;
    };

    const handleSave = async () => {
        if (!currentScreenshot) return;

        setIsSaving(true);
        try {
            let processedDataUrl: string;
            if (canvasRef?.current?.exportImage) {
                const fullRes = canvasRef.current.exportImage({ format: exportFormat, quality: exportQuality });
                const config = getOutputConfig();
                if (config) {
                    processedDataUrl = await applyOutputConfig(fullRes, config, background);
                } else {
                    processedDataUrl = fullRes;
                }
            } else {
                processedDataUrl = await generateFinalImage(currentScreenshot.dataUrl, {
                    autoBalance,
                    redactionAreas,
                    background,
                    backgroundPadding,
                    annotations: canvasData || undefined,
                    outputConfig: getOutputConfig(),
                    borderRadius,
                    shadowBlur,
                    shadowOpacity,
                    shadowOffsetX,
                    shadowOffsetY,
                    inset,
                    format: exportFormat,
                    quality: exportQuality,
                });
            }

            const result = await (window as any).screenshotAPI?.saveFile(
                processedDataUrl,
                {
                    filename: filename || `screenshot-${Date.now()}.${exportFormat}`,
                    format: exportFormat,
                }
            );

            if (result?.success) {
                toast.success('Screenshot saved!');
            } else if (result?.canceled) {
                toast.info('Save canceled');
            } else {
                toast.error('Failed to save screenshot');
            }
        } catch (error) {
            console.error('Save failed:', error);
            toast.error('Failed to save screenshot');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyToClipboard = async () => {
        if (!currentScreenshot) return;

        setIsCopying(true);
        try {
            let processedDataUrl: string;
            if (canvasRef?.current?.exportImage) {
                 const fullRes = canvasRef.current.exportImage({ format: exportFormat, quality: exportQuality });
                 const config = getOutputConfig();
                 if (config) {
                     processedDataUrl = await applyOutputConfig(fullRes, config, background);
                 } else {
                     processedDataUrl = fullRes;
                 }
            } else {
                processedDataUrl = await generateFinalImage(currentScreenshot.dataUrl, {
                    autoBalance,
                    redactionAreas,
                    background,
                    backgroundPadding,
                    annotations: canvasData || undefined,
                    outputConfig: getOutputConfig(),
                    borderRadius,
                    shadowBlur,
                    shadowOpacity,
                    shadowOffsetX,
                    shadowOffsetY,
                    inset,
                    format: exportFormat,
                    quality: exportQuality,
                });
            }

            const response = await fetch(processedDataUrl);
            const blob = await response.blob();

            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob,
                }),
            ]);

            setCopied(true);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Copy failed:', error);
            toast.error('Failed to copy to clipboard');
        } finally {
            setIsCopying(false);
        }
    };

    const handleUpload = async () => {
        if (!currentScreenshot) return;

        const { setIsUploading, setLastUploadUrl } = useXnapperStore.getState();
        setIsUploading(true);

        try {
            let processedDataUrl: string;
            if (canvasRef?.current?.exportImage) {
                const fullRes = canvasRef.current.exportImage({ format: exportFormat, quality: exportQuality });
                const config = getOutputConfig();
                if (config) {
                    processedDataUrl = await applyOutputConfig(fullRes, config, background);
                } else {
                    processedDataUrl = fullRes;
                }
            } else {
                processedDataUrl = await generateFinalImage(currentScreenshot.dataUrl, {
                    autoBalance,
                    redactionAreas,
                    background,
                    backgroundPadding,
                    annotations: canvasData || undefined,
                    outputConfig: getOutputConfig(),
                    borderRadius,
                    shadowBlur,
                    shadowOpacity,
                    shadowOffsetX,
                    shadowOffsetY,
                    inset,
                    format: exportFormat,
                    quality: exportQuality,
                });
            }

            const result = await uploadToImgur(processedDataUrl);

            if (result.success && result.url) {
                setLastUploadUrl(result.url);
                await navigator.clipboard.writeText(result.url);
                toast.success('Uploaded! Link copied.', {
                    icon: <Link className="w-4 h-4" />,
                    duration: 5000,
                });
            } else {
                toast.error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload screenshot');
        } finally {
            setIsUploading(false);
        }
    };

    if (!currentScreenshot) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px] text-foreground-muted">
                <div className="text-center">
                    <FileImage className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Capture a screenshot to export</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {/* Format Selection */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Format</label>
                <div className="grid grid-cols-3 gap-2">
                    {formats.map(({ format, label, ext }) => (
                        <button
                            key={format}
                            onClick={() => setExportFormat(format)}
                            className={cn(
                                "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all duration-200",
                                exportFormat === format
                                    ? "border-indigo-500 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"
                                    : "border-border-glass/50 bg-background/40 hover:border-indigo-500/50"
                            )}
                        >
                            <span className={cn(
                                "font-bold text-sm",
                                exportFormat === format ? "text-indigo-400" : "text-foreground-secondary"
                            )}>
                                {label}
                            </span>
                            <span className="text-[10px] text-foreground-muted">{ext}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quality Slider */}
            {(exportFormat === 'jpg' || exportFormat === 'webp') && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Quality</label>
                        <span className="text-xs font-bold text-indigo-400">{exportQuality}%</span>
                    </div>
                    <div className="relative h-2">
                        <div className="absolute inset-0 bg-background/60 rounded-full overflow-hidden border border-border-glass/50">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-100"
                                style={{ width: `${exportQuality}%` }}
                            />
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={exportQuality}
                            onChange={(e) => setExportQuality(Number(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-sm pointer-events-none"
                            style={{ left: `calc(${exportQuality}% - 8px)` }}
                        />
                    </div>
                </div>
            )}

            {/* Dimensions */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Dimensions</label>
                <div className="flex bg-background/40 rounded-lg p-0.5 border border-border-glass/50">
                    {(['original', 'preset', 'custom'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setResizeMode(mode)}
                            className={cn(
                                "flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all capitalize",
                                resizeMode === mode 
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm" 
                                    : "text-foreground-secondary hover:text-foreground"
                            )}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                {resizeMode === 'preset' && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        {(Object.entries(SOCIAL_PRESETS) as [SocialPreset, { label: string }][]).map(([key, { label }]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedPreset(key)}
                                className={cn(
                                    "px-3 py-2 rounded-lg border text-[11px] font-semibold transition-all",
                                    selectedPreset === key
                                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                                        : "border-border-glass/50 bg-background/40 text-foreground-secondary hover:border-indigo-500/50"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {resizeMode === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                            <label className="text-[10px] text-foreground-muted mb-1 block">Width</label>
                            <input
                                type="number"
                                value={customWidth}
                                onChange={(e) => setCustomWidth(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Width"
                                className="w-full px-3 py-2 bg-background/60 border border-border-glass/50 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-foreground-muted mb-1 block">Height</label>
                            <input
                                type="number"
                                value={customHeight}
                                onChange={(e) => setCustomHeight(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Height"
                                className="w-full px-3 py-2 bg-background/60 border border-border-glass/50 rounded-lg text-xs focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Filename */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Filename</label>
                <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder={`screenshot-${Date.now()}.${exportFormat}`}
                    className="w-full px-3 py-2 bg-background/60 border border-border-glass/50 rounded-lg text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={cn(
                            "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
                            "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30",
                            "hover:shadow-indigo-500/50 hover:scale-[1.02]",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                        )}
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4" />
                        )}
                        Save
                    </button>
                    <button
                        onClick={handleCopyToClipboard}
                        disabled={isCopying}
                        className={cn(
                            "flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
                            "bg-glass-panel border border-border-glass text-foreground-secondary",
                            "hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-400",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        {isCopying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : copied ? (
                            <Check className="w-4 h-4 text-green-500" />
                        ) : (
                            <Copy className="w-4 h-4" />
                        )}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                {/* Upload Button */}
                <button
                    onClick={handleUpload}
                    disabled={isUploading || isSaving}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
                        "bg-background/40 border border-dashed border-border-glass text-foreground-secondary",
                        "hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:text-indigo-400",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <CloudUpload className="w-4 h-4" />
                    )}
                    {isUploading ? 'Uploading...' : 'Upload & Copy Link'}
                </button>
            </div>
        </div>
    );
};
