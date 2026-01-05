import React, { useState } from 'react';
import { Download, Copy, FileImage } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useXnapperStore } from '../../../store/xnapperStore';
import type { ExportFormat } from '../../../store/xnapperStore';
import { cn } from '../../../utils/cn';
import { toast } from 'sonner';
import { generateFinalImage } from '../utils/exportUtils';

export const ExportPanel: React.FC = () => {
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
    } = useXnapperStore();

    const [filename, setFilename] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const formats: Array<{ format: ExportFormat; label: string; description: string }> = [
        { format: 'png', label: 'PNG', description: 'Lossless, best quality' },
        { format: 'jpg', label: 'JPG', description: 'Smaller file size' },
        { format: 'webp', label: 'WebP', description: 'Modern format' },
    ];

    const handleSave = async () => {
        if (!currentScreenshot) return;

        setIsSaving(true);
        try {
            // Generate final processed image
            const processedDataUrl = await generateFinalImage(currentScreenshot.dataUrl, {
                autoBalance,
                redactionAreas,
                background,
                backgroundPadding,
            });

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
            const processedDataUrl = await generateFinalImage(currentScreenshot.dataUrl, {
                autoBalance,
                redactionAreas,
                background,
                backgroundPadding,
            });

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
        </div>
    );
};
