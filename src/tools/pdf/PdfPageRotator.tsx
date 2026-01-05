import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '../../components/ui/Button';
import { useToolState } from '../../store/toolStore';
import { FileText, RotateCw } from 'lucide-react';

const TOOL_ID = 'pdf-page-rotator';

interface PdfPageRotatorProps {
    tabId?: string;
}

export const PdfPageRotator: React.FC<PdfPageRotatorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        options: {
            pdfFile: null as File | null,
            pageCount: 0,
            rotation: '90' as '90' | '180' | '270',
            pages: 'all' as string,
            rotatedBlob: undefined as Blob | undefined
        }
    };

    const options = data.options || {};
    const pdfFile = options.pdfFile as File | null;
    const pageCount = (options.pageCount || 0) as number;
    const rotation = (options.rotation || '90') as '90' | '180' | '270';
    const pages = (options.pages || 'all') as string;
    const rotatedBlob = options.rotatedBlob as Blob | undefined;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || file.type !== 'application/pdf') return;

        setLoadingAction('Analyzing');
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pageCount = pdfDoc.getPageCount();

            setToolData(effectiveId, {
                options: {
                    ...options,
                    pdfFile: file,
                    pageCount: pageCount,
                    rotatedBlob: undefined
                }
            });
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error reading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const rotatePages = async () => {
        if (!pdfFile) {
            setToolData(effectiveId, { output: 'Please upload a PDF file.' });
            return;
        }

        setLoadingAction('Rotating');

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const totalPages = pdfDoc.getPageCount();

            // Parse which pages to rotate
            let pagesToRotate: number[] = [];
            if (pages === 'all') {
                pagesToRotate = Array.from({ length: totalPages }, (_, i) => i);
            } else {
                const parts = pages.split(',').map(p => p.trim());
                for (const part of parts) {
                    if (part.includes('-')) {
                        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
                        if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
                            for (let i = start; i <= end; i++) {
                                if (!pagesToRotate.includes(i - 1)) {
                                    pagesToRotate.push(i - 1);
                                }
                            }
                        }
                    } else {
                        const pageNum = parseInt(part.trim());
                        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                            if (!pagesToRotate.includes(pageNum - 1)) {
                                pagesToRotate.push(pageNum - 1);
                            }
                        }
                    }
                }
            }

            if (pagesToRotate.length === 0) {
                setToolData(effectiveId, { output: 'No valid pages selected.' });
                setLoadingAction(null);
                return;
            }

            // Apply rotation
            const rotationAngle = degrees(parseInt(rotation));
            pagesToRotate.forEach(pageIndex => {
                const page = pdfDoc.getPage(pageIndex);
                page.setRotation(page.getRotation().angle + rotationAngle.angle);
            });

            const pdfBytes = await pdfDoc.save();
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

            setToolData(effectiveId, {
                output: URL.createObjectURL(pdfBlob),
                options: {
                    ...options,
                    rotatedBlob: pdfBlob
                }
            });
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error rotating pages: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const downloadRotated = () => {
        if (!rotatedBlob) return;

        const url = URL.createObjectURL(rotatedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pdfFile?.name.replace('.pdf', '') || 'rotated'}-rotated.pdf`;
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
                rotatedBlob: undefined
            }
        });
    };

    return (
        <ToolPane
            title="PDF Page Rotator"
            description="Rotate pages in a PDF"
            onClear={handleClear}
            onDownload={rotatedBlob ? downloadRotated : undefined}
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
                        <RotateCw className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-sm">Click to upload PDF file</p>
                        {pdfFile && (
                            <p className="text-xs text-foreground-secondary mt-1">
                                {pdfFile.name} ({pageCount} pages)
                            </p>
                        )}
                    </div>
                </div>

                {/* Options */}
                {pdfFile && (
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Rotation Angle</label>
                            <select
                                value={rotation}
                                onChange={(e) => updateOption('rotation', e.target.value)}
                                className="glass-input w-full text-sm"
                            >
                                <option value="90">90° Clockwise</option>
                                <option value="180">180°</option>
                                <option value="270">270° Clockwise (90° Counter-clockwise)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                Pages to Rotate (e.g., "1,3,5" or "1-5" or "all")
                            </label>
                            <input
                                type="text"
                                value={pages}
                                onChange={(e) => updateOption('pages', e.target.value)}
                                placeholder="all"
                                className="glass-input w-full text-sm"
                            />
                            <p className="text-xs text-foreground-muted mt-1">
                                Enter "all" to rotate all pages, or specific page numbers/ranges. Available pages: 1-{pageCount}
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {pdfFile && (
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="primary"
                            onClick={rotatePages}
                            loading={loadingAction === 'Rotating'}
                            className="uppercase tracking-widest"
                        >
                            Rotate Pages
                        </Button>
                        {rotatedBlob && (
                            <Button
                                variant="secondary"
                                onClick={downloadRotated}
                                className="uppercase tracking-widest"
                            >
                                Download Rotated PDF
                            </Button>
                        )}
                    </div>
                )}

                {!pdfFile && (
                    <div className="text-center text-foreground-muted italic py-8">
                        Upload a PDF file to get started
                    </div>
                )}
            </div>
        </ToolPane>
    );
};

