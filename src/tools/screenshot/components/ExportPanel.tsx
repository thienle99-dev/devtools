import React, { useState } from 'react';
import type { CanvasPreviewHandle } from '../types';
import { Download, Copy, FileImage, CloudUpload, Link } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { useXnapperStore } from '../../../store/xnapperStore';
import type { ExportFormat } from '../../../store/xnapperStore';
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

    // Resize / Preset State
    const [resizeMode, setResizeMode] = useState<'original' | 'preset' | 'custom'>('original');
    const [selectedPreset, setSelectedPreset] = useState<SocialPreset | null>(null);
    const [customWidth, setCustomWidth] = useState<number | ''>('');
    const [customHeight, setCustomHeight] = useState<number | ''>('');

    const formats: Array<{ format: ExportFormat; label: string; description: string }> = [
        { format: 'png', label: 'PNG', description: 'Lossless, best quality' },
        { format: 'jpg', label: 'JPG', description: 'Smaller file size' },
        { format: 'webp', label: 'WebP', description: 'Modern format' },
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
            // Generate final processed image
            // Generate final processed image
            let processedDataUrl: string;
            if (canvasRef?.current?.exportImage) {
                const fullRes = canvasRef.current.exportImage();
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
                    outputConfig: getOutputConfig(),
                    borderRadius,
                    shadowBlur,
                    shadowOpacity,
                    shadowOffsetX,
                    shadowOffsetY,
                    inset,
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
                toast.success('Screenshot saved successfully!');
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

        try {
            // Generate final processed image
            // Generate final processed image
            let processedDataUrl: string;
            if (canvasRef?.current?.exportImage) {
                const fullRes = canvasRef.current.exportImage();
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
                    outputConfig: getOutputConfig(),
                    borderRadius,
                    shadowBlur,
                    shadowOpacity,
                    shadowOffsetX,
                    shadowOffsetY,
                    inset,
                });
            }

            // Convert data URL to blob
            const response = await fetch(processedDataUrl);
            const blob = await response.blob();

            // Copy to clipboard
            await navigator.clipboard.write([
                new ClipboardItem({
                    [blob.type]: blob,
                }),
            ]);

            toast.success('Copied to clipboard!');
        } catch (error) {
            console.error('Copy failed:', error);
            toast.error('Failed to copy to clipboard');
        }
    };

    const handleUpload = async () => {
        if (!currentScreenshot) return;

        const { setIsUploading, setLastUploadUrl } = useXnapperStore.getState();
        setIsUploading(true);

        try {
            // Generate final processed image
            // Generate final processed image
            let processedDataUrl: string;
            if (canvasRef?.current?.exportImage) {
                const fullRes = canvasRef.current.exportImage();
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
                    outputConfig: getOutputConfig(),
                    borderRadius,
                    shadowBlur,
                    shadowOpacity,
                    shadowOffsetX,
                    shadowOffsetY,
                    inset,
                });
            }

            // Upload to Imgur
            const result = await uploadToImgur(processedDataUrl);

            if (result.success && result.url) {
                setLastUploadUrl(result.url);
                await navigator.clipboard.writeText(result.url);
                toast.success('Uploaded! Link copied to clipboard.', {
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
                    <FileImage className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Capture a screenshot to export</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div>
                <h3 className="text-lg font-semibold mb-4">Export Format</h3>
                <div className="grid grid-cols-3 gap-3">
                    {formats.map(({ format, label, description }) => (
                        <button
                            key={format}
                            onClick={() => setExportFormat(format)}
                            className={cn(
                                "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                                exportFormat === format
                                    ? "border-indigo-500 bg-indigo-500/10"
                                    : "border-border-glass bg-glass-panel hover:border-indigo-500/50"
                            )}
                        >
                            <span className={cn(
                                "font-semibold text-sm",
                                exportFormat === format ? "text-indigo-400" : "text-foreground-secondary"
                            )}>
                                {label}
                            </span>
                            <span className="text-xs text-foreground-muted text-center">
                                {description}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {(exportFormat === 'jpg' || exportFormat === 'webp') && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Quality</label>
                        <span className="text-sm text-foreground-secondary">{exportQuality}%</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={exportQuality}
                        onChange={(e) => setExportQuality(Number(e.target.value))}
                        className="w-full h-2 bg-glass-panel rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>
            )}

            {/* Resize / Presets */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Dimensions</h3>
                <div className="flex bg-glass-panel rounded-lg p-1 mb-4">
                    {(['original', 'preset', 'custom'] as const).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setResizeMode(mode)}
                            className={cn(
                                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                                resizeMode === mode ? "bg-indigo-500/20 text-indigo-400" : "text-foreground-secondary hover:text-foreground"
                            )}
                        >
                            {mode}
                        </button>
                    ))}
                </div>

                {resizeMode === 'preset' && (
                    <div className="grid grid-cols-2 gap-3">
                        {(Object.entries(SOCIAL_PRESETS) as [SocialPreset, { label: string }][]).map(([key, { label }]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedPreset(key)}
                                className={cn(
                                    "px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left",
                                    selectedPreset === key
                                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                                        : "border-border-glass bg-glass-panel text-foreground-secondary hover:border-indigo-500/50"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {resizeMode === 'custom' && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-foreground-muted mb-1 block">Width</label>
                            <input
                                type="number"
                                value={customWidth}
                                onChange={(e) => setCustomWidth(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Width px"
                                className="w-full px-3 py-2 bg-glass-panel border border-border-glass rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-foreground-muted mb-1 block">Height</label>
                            <input
                                type="number"
                                value={customHeight}
                                onChange={(e) => setCustomHeight(e.target.value ? Number(e.target.value) : '')}
                                placeholder="Height px"
                                className="w-full px-3 py-2 bg-glass-panel border border-border-glass rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                )}
                {resizeMode === 'original' && (
                    <p className="text-xs text-foreground-muted">Export at original screenshot dimensions.</p>
                )}
            </div>

            <div>
                <label className="text-sm font-medium mb-2 block">Filename (optional)</label>
                <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder={`screenshot-${Date.now()}.${exportFormat}`}
                    className="w-full px-4 py-2 bg-glass-panel border border-border-glass rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="flex gap-3 pt-4">
                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                >
                    <Download className="w-5 h-5 mr-2" />
                    {isSaving ? 'Saving...' : 'Save to File'}
                </Button>
                <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleCopyToClipboard}
                    className="flex-1"
                >
                    <Copy className="w-5 h-5 mr-2" />
                    Copy to Clipboard
                </Button>
            </div>

            <Button
                variant="outline"
                size="lg"
                onClick={handleUpload}
                disabled={isUploading || isSaving}
                className="w-full"
            >
                <CloudUpload className="w-5 h-5 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload to Cloud & Copy Link'}
            </Button>
        </div>
    );
};
