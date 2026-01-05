import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '../../components/ui/Button';
import { useToolState } from '../../store/toolStore';
import { FileText, ArrowUp, ArrowDown, GripVertical } from 'lucide-react';

const TOOL_ID = 'pdf-page-reorder';

interface PdfPageReorderProps {
    tabId?: string;
}

export const PdfPageReorder: React.FC<PdfPageReorderProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        options: {
            pdfFile: null as File | null,
            pageCount: 0,
            pageOrder: [] as number[],
            reorderedBlob: undefined as Blob | undefined
        }
    };

    const options = data.options || {};
    const pdfFile = options.pdfFile as File | null;
    const pageCount = (options.pageCount || 0) as number;
    const pageOrder = (options.pageOrder || []) as number[];
    const reorderedBlob = options.reorderedBlob as Blob | undefined;

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
            const totalPages = pdfDoc.getPageCount();
            const initialOrder = Array.from({ length: totalPages }, (_, i) => i);

            setToolData(effectiveId, {
                options: {
                    ...options,
                    pdfFile: file,
                    pageCount: totalPages,
                    pageOrder: initialOrder,
                    reorderedBlob: undefined
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

    const movePage = (index: number, direction: 'up' | 'down') => {
        if (pageOrder.length === 0) return;

        const newOrder = [...pageOrder];
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= newOrder.length) return;

        [newOrder[index], newOrder[newIndex]] = [newOrder[newIndex], newOrder[index]];

        setToolData(effectiveId, {
            options: {
                ...options,
                pageOrder: newOrder,
                reorderedBlob: undefined
            }
        });
    };

    const resetOrder = () => {
        const initialOrder = Array.from({ length: pageCount }, (_, i) => i);
        setToolData(effectiveId, {
            options: {
                ...options,
                pageOrder: initialOrder,
                reorderedBlob: undefined
            }
        });
    };

    const reorderPdf = async () => {
        if (!pdfFile || pageOrder.length === 0) {
            setToolData(effectiveId, { output: 'Please upload a PDF file.' });
            return;
        }

        setLoadingAction('Reordering');

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const sourcePdf = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();

            // Copy pages in the new order
            for (const pageIndex of pageOrder) {
                const [page] = await newPdf.copyPages(sourcePdf, [pageIndex]);
                newPdf.addPage(page);
            }

            const pdfBytes = await newPdf.save();
            const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

            setToolData(effectiveId, {
                output: URL.createObjectURL(pdfBlob),
                options: {
                    ...options,
                    reorderedBlob: pdfBlob
                }
            });
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error reordering pages: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const downloadReordered = () => {
        if (!reorderedBlob) return;

        const url = URL.createObjectURL(reorderedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pdfFile?.name.replace('.pdf', '') || 'reordered'}-reordered.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <ToolPane
            title="PDF Page Reorder"
            description="Reorder pages in a PDF"
            onClear={handleClear}
            onDownload={reorderedBlob ? downloadReordered : undefined}
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
                        <FileText className="w-6 h-6" />
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

                {/* Page Order List */}
                {pdfFile && pageOrder.length > 0 && (
                    <div className="flex-1 min-h-0 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                Page Order (drag to reorder)
                            </label>
                            <button
                                onClick={resetOrder}
                                className="text-xs text-foreground-muted hover:text-foreground transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-[400px]">
                            {pageOrder.map((pageIndex, index) => (
                                <div
                                    key={`${pageIndex}-${index}`}
                                    className="glass-input p-3 flex items-center space-x-3"
                                >
                                    <GripVertical className="w-5 h-5 text-foreground-muted flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">
                                            Page {pageIndex + 1} → Position {index + 1}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => movePage(index, 'up')}
                                            disabled={index === 0}
                                            className="p-1 rounded hover:bg-bg-glass-hover disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move up"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => movePage(index, 'down')}
                                            disabled={index === pageOrder.length - 1}
                                            className="p-1 rounded hover:bg-bg-glass-hover disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move down"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                {pdfFile && pageOrder.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="primary"
                            onClick={reorderPdf}
                            loading={loadingAction === 'Reordering'}
                            className="uppercase tracking-widest"
                        >
                            Reorder Pages
                        </Button>
                        {reorderedBlob && (
                            <Button
                                variant="secondary"
                                onClick={downloadReordered}
                                className="uppercase tracking-widest"
                            >
                                Download Reordered PDF
                            </Button>
                        )}
                    </div>
                )}

                {!pdfFile && (
                    <div className="text-center text-foreground-muted italic py-8">
                        Upload a PDF file to reorder pages
                    </div>
                )}
            </div>
        </ToolPane>
    );
};

