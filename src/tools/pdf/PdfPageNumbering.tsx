import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument, rgb } from 'pdf-lib';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '../../components/ui/Button';
import { useToolState } from '../../store/toolStore';
import { Hash } from 'lucide-react';

const TOOL_ID = 'pdf-page-numbering';

interface PdfPageNumberingProps {
    tabId?: string;
}

export const PdfPageNumbering: React.FC<PdfPageNumberingProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        options: {
            pdfFile: null as File | null,
            position: 'bottom-center' as 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right',
            format: '{page}' as string,
            fontSize: 12,
            color: '#000000',
            startNumber: 1,
            offset: 0,
            numberedBlob: undefined as Blob | undefined
        }
    };

    const options = data.options || {};
    const pdfFile = options.pdfFile as File | null;
    const position = (options.position || 'bottom-center') as string;
    const format = (options.format || '{page}') as string;
    const fontSize = (options.fontSize || 12) as number;
    const color = (options.color || '#000000') as string;
    const startNumber = (options.startNumber || 1) as number;
    const offset = (options.offset || 0) as number;
    const numberedBlob = options.numberedBlob as Blob | undefined;

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
                numberedBlob: undefined
            }
        });
    };

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                  r: parseInt(result[1], 16) / 255,
                  g: parseInt(result[2], 16) / 255,
                  b: parseInt(result[3], 16) / 255
              }
            : { r: 0, g: 0, b: 0 };
    };

    const getPosition = (page: any, pageIndex: number) => {
        const { width, height } = page.getSize();
        const margin = 20;
        const pageNumber = startNumber + pageIndex + offset;

        let x: number, y: number;
        switch (position) {
            case 'top-left':
                x = margin;
                y = height - margin;
                break;
            case 'top-center':
                x = width / 2;
                y = height - margin;
                break;
            case 'top-right':
                x = width - margin;
                y = height - margin;
                break;
            case 'bottom-left':
                x = margin;
                y = margin;
                break;
            case 'bottom-right':
                x = width - margin;
                y = margin;
                break;
            default: // bottom-center
                x = width / 2;
                y = margin;
        }

        const text = format.replace('{page}', pageNumber.toString()).replace('{total}', '');
        return { x, y, text };
    };

    const addPageNumbers = async () => {
        if (!pdfFile) {
            setToolData(effectiveId, { output: 'Please upload a PDF file.' });
            return;
        }

        setLoadingAction('Adding Page Numbers');

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();
            const rgbColor = hexToRgb(color);

            for (let i = 0; i < totalPages; i++) {
                const page = pdfDoc.getPage(i);
                const pos = getPosition(page, i);
                const text = format.replace('{page}', (startNumber + i + offset).toString()).replace('{total}', totalPages.toString());

                page.drawText(text, {
                    x: pos.x,
                    y: pos.y,
                    size: fontSize,
                    color: rgb(rgbColor.r, rgbColor.g, rgbColor.b)
                });
            }

            const pdfBytes = await pdfDoc.save();
            const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

            setToolData(effectiveId, {
                output: URL.createObjectURL(pdfBlob),
                options: {
                    ...options,
                    numberedBlob: pdfBlob
                }
            });
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error adding page numbers: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const downloadNumbered = () => {
        if (!numberedBlob) return;

        const url = URL.createObjectURL(numberedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pdfFile?.name.replace('.pdf', '') || 'numbered'}-numbered.pdf`;
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
                numberedBlob: undefined
            }
        });
    };

    return (
        <ToolPane
            title="PDF Page Numbering"
            description="Add page numbers to PDF"
            onClear={handleClear}
            onDownload={numberedBlob ? downloadNumbered : undefined}
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
                        <Hash className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-sm">Click to upload PDF file</p>
                        {pdfFile && (
                            <p className="text-xs text-foreground-secondary mt-1">
                                {pdfFile.name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Options */}
                {pdfFile && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Position</label>
                            <select
                                value={position}
                                onChange={(e) => updateOption('position', e.target.value)}
                                className="glass-input w-full text-sm"
                            >
                                <option value="bottom-center">Bottom Center</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="bottom-right">Bottom Right</option>
                                <option value="top-center">Top Center</option>
                                <option value="top-left">Top Left</option>
                                <option value="top-right">Top Right</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                Format (use {'{page}'} for page number, {'{total}'} for total pages)
                            </label>
                            <input
                                type="text"
                                value={format}
                                onChange={(e) => updateOption('format', e.target.value)}
                                placeholder="{page}"
                                className="glass-input w-full text-sm"
                            />
                            <p className="text-xs text-foreground-muted mt-1">
                                Examples: "{'{page}'}", "Page {'{page}'} of {'{total}'}", "{'{page}'} / {'{total}'}"
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Font Size</label>
                                <input
                                    type="number"
                                    min="8"
                                    max="72"
                                    value={fontSize}
                                    onChange={(e) => updateOption('fontSize', parseInt(e.target.value) || 12)}
                                    className="glass-input w-full text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Start Number</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={startNumber}
                                    onChange={(e) => updateOption('startNumber', parseInt(e.target.value) || 1)}
                                    className="glass-input w-full text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Offset</label>
                                <input
                                    type="number"
                                    value={offset}
                                    onChange={(e) => updateOption('offset', parseInt(e.target.value) || 0)}
                                    className="glass-input w-full text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Color</label>
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => updateOption('color', e.target.value)}
                                className="glass-input w-full h-10"
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                {pdfFile && (
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="primary"
                            onClick={addPageNumbers}
                            loading={loadingAction === 'Adding Page Numbers'}
                            className="uppercase tracking-widest"
                        >
                            Add Page Numbers
                        </Button>
                        {numberedBlob && (
                            <Button
                                variant="secondary"
                                onClick={downloadNumbered}
                                className="uppercase tracking-widest"
                            >
                                Download Numbered PDF
                            </Button>
                        )}
                    </div>
                )}

                {!pdfFile && (
                    <div className="text-center text-foreground-muted italic py-8">
                        Upload a PDF file to add page numbers
                    </div>
                )}
            </div>
        </ToolPane>
    );
};

