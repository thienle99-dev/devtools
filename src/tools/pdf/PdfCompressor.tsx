import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '../../components/ui/Button';
import { useToolState } from '../../store/toolStore';
import { Archive } from 'lucide-react';

const TOOL_ID = 'pdf-compressor';

interface PdfCompressorProps {
    tabId?: string;
}

export const PdfCompressor: React.FC<PdfCompressorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        options: {
            pdfFile: null as File | null,
            originalSize: 0,
            compressionLevel: 'medium' as 'low' | 'medium' | 'high',
            compressedBlob: undefined as Blob | undefined,
            compressedSize: 0
        }
    };

    const options = data.options || {};
    const pdfFile = options.pdfFile as File | null;
    const originalSize = (options.originalSize || 0) as number;
    const compressionLevel = (options.compressionLevel || 'medium') as 'low' | 'medium' | 'high';
    const compressedBlob = options.compressedBlob as Blob | undefined;
    const compressedSize = (options.compressedSize || 0) as number;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || file.type !== 'application/pdf') return;

        setToolData(effectiveId, {
            options: {
                ...options,
                pdfFile: file,
                originalSize: file.size,
                compressedBlob: undefined,
                compressedSize: 0
            }
        });
    };

    const compressPdf = async () => {
        if (!pdfFile) {
            setToolData(effectiveId, { output: 'Please upload a PDF file.' });
            return;
        }

        setLoadingAction('Compressing');

        try {
            const fileArrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(fileArrayBuffer);

            // Compression options based on level
            const saveOptions: any = {};
            if (compressionLevel === 'high') {
                // Use object compression
                saveOptions.useObjectStreams = true;
            }

            const pdfBytes = await pdfDoc.save(saveOptions);
            // Create a new Uint8Array to ensure proper type compatibility
            const pdfBytesArray = new Uint8Array(pdfBytes);
            const pdfBlob = new Blob([pdfBytesArray], { type: 'application/pdf' });

            const reduction = ((originalSize - pdfBlob.size) / originalSize) * 100;

            setToolData(effectiveId, {
                output: `Compression complete. Size reduced by ${reduction.toFixed(1)}%`,
                options: {
                    ...options,
                    compressedBlob: pdfBlob,
                    compressedSize: pdfBlob.size
                }
            });
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error compressing PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const downloadCompressed = () => {
        if (!compressedBlob) return;

        const url = URL.createObjectURL(compressedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pdfFile?.name.replace('.pdf', '') || 'compressed'}-compressed.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const updateOption = (key: string, value: any) => {
        setToolData(effectiveId, {
            options: {
                ...options,
                [key]: value,
                compressedBlob: undefined,
                compressedSize: 0
            }
        });
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <ToolPane
            title="PDF Compressor"
            description="Compress PDF file size"
            onClear={handleClear}
            onDownload={compressedBlob ? downloadCompressed : undefined}
        >
            <div className="space-y-6 h-full flex flex-col">
                {/* Upload Area */}
                <div
                    className="border-2 border-dashed border-border-glass rounded-xl p-6 flex flex-col items-center justify-center space-y-3 hover:bg-bg-glass-hover transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="application/pdf"
                        className="hidden"
                    />
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <Archive className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-sm">Click to upload PDF file</p>
                        {pdfFile && (
                            <p className="text-xs text-foreground-secondary mt-1">
                                {pdfFile.name} ({formatSize(originalSize)})
                            </p>
                        )}
                    </div>
                </div>

                {/* Compression Options */}
                {pdfFile && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Compression Level</label>
                        <select
                            value={compressionLevel}
                            onChange={(e) => updateOption('compressionLevel', e.target.value)}
                            className="glass-input w-full text-sm"
                        >
                            <option value="low">Low (Faster, larger file)</option>
                            <option value="medium">Medium (Balanced)</option>
                            <option value="high">High (Slower, smaller file)</option>
                        </select>
                    </div>
                )}

                {/* Size Comparison */}
                {compressedBlob && (
                    <div className="glass-input p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground-muted">Original Size:</span>
                            <span className="text-sm font-medium">{formatSize(originalSize)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground-muted">Compressed Size:</span>
                            <span className="text-sm font-medium">{formatSize(compressedSize)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border-glass">
                            <span className="text-sm font-semibold">Reduction:</span>
                            <span className="text-sm font-semibold text-primary">
                                {((originalSize - compressedSize) / originalSize * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {pdfFile && (
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="primary"
                            onClick={compressPdf}
                            loading={loadingAction === 'Compressing'}
                            className="uppercase tracking-widest"
                        >
                            Compress PDF
                        </Button>
                        {compressedBlob && (
                            <Button
                                variant="secondary"
                                onClick={downloadCompressed}
                                className="uppercase tracking-widest"
                            >
                                Download Compressed PDF
                            </Button>
                        )}
                    </div>
                )}

                {!pdfFile && (
                    <div className="text-center text-foreground-muted italic py-8">
                        Upload a PDF file to compress
                    </div>
                )}
            </div>
        </ToolPane>
    );
};

