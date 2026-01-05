import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '../../components/ui/Button';
import { useToolState } from '../../store/toolStore';
import { X, FileText, ArrowUp, ArrowDown } from 'lucide-react';

const TOOL_ID = 'pdf-merger';

interface PdfFile {
    id: string;
    file: File;
    name: string;
    pageCount?: number;
}

interface PdfMergerProps {
    tabId?: string;
}

export const PdfMerger: React.FC<PdfMergerProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        options: {
            pdfs: [] as PdfFile[],
            mergedBlob: undefined as Blob | undefined
        }
    };

    const options = data.options || {};
    const pdfs = (options.pdfs || []) as PdfFile[];
    const mergedBlob = options.mergedBlob as Blob | undefined;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const pdfFiles: PdfFile[] = files
            .filter(file => file.type === 'application/pdf')
            .map(file => ({
                id: `${Date.now()}-${Math.random()}`,
                file,
                name: file.name
            }));

        // Get page count for each PDF
        setLoadingAction('Analyzing');
        const pdfsWithPageCount = await Promise.all(
            pdfFiles.map(async (pdf) => {
                try {
                    const arrayBuffer = await pdf.file.arrayBuffer();
                    const pdfDoc = await PDFDocument.load(arrayBuffer);
                    return {
                        ...pdf,
                        pageCount: pdfDoc.getPageCount()
                    };
                } catch {
                    return { ...pdf, pageCount: 0 };
                }
            })
        );

        setToolData(effectiveId, {
            options: {
                ...options,
                pdfs: [...pdfs, ...pdfsWithPageCount]
            }
        });

        setLoadingAction(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removePdf = (id: string) => {
        const updatedPdfs = pdfs.filter(pdf => pdf.id !== id);
        setToolData(effectiveId, {
            options: {
                ...options,
                pdfs: updatedPdfs,
                mergedBlob: undefined
            }
        });
    };

    const movePdf = (index: number, direction: 'up' | 'down') => {
        const updatedPdfs = [...pdfs];
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= updatedPdfs.length) return;

        [updatedPdfs[index], updatedPdfs[newIndex]] = [updatedPdfs[newIndex], updatedPdfs[index]];
        setToolData(effectiveId, {
            options: {
                ...options,
                pdfs: updatedPdfs,
                mergedBlob: undefined
            }
        });
    };

    const mergePdfs = async () => {
        if (!pdfs || pdfs.length === 0) {
            setToolData(effectiveId, { output: 'Please add at least one PDF file.' });
            return;
        }

        if (pdfs.length < 2) {
            setToolData(effectiveId, { output: 'Please add at least two PDF files to merge.' });
            return;
        }

        setLoadingAction('Merging');

        try {
            const mergedPdf = await PDFDocument.create();

            for (const pdfFile of pdfs) {
                const arrayBuffer = await pdfFile.file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                pages.forEach((page) => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

            setToolData(effectiveId, {
                output: URL.createObjectURL(pdfBlob),
                options: {
                    ...options,
                    mergedBlob: pdfBlob
                }
            });
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error merging PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const downloadMerged = () => {
        if (!mergedBlob) return;

        const url = URL.createObjectURL(mergedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `merged-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const totalPages = pdfs.reduce((sum, pdf) => sum + (pdf.pageCount || 0), 0);

    return (
        <ToolPane
            title="PDF Merger"
            description="Merge multiple PDF files into one"
            onClear={handleClear}
            onDownload={mergedBlob ? downloadMerged : undefined}
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
                        multiple
                        accept="application/pdf"
                        className="hidden"
                    />
                    <div className="p-3 bg-primary/10 rounded-full text-primary">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-sm">Click to upload PDF files</p>
                        <p className="text-xs text-foreground-secondary mt-1">Multiple PDFs supported</p>
                    </div>
                </div>

                {/* PDF List */}
                {pdfs && pdfs.length > 0 && (
                    <div className="flex-1 min-h-0 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                PDFs ({pdfs.length}) - {totalPages} pages total
                            </label>
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-[400px]">
                            {pdfs.map((pdf, index) => (
                                <div
                                    key={pdf.id}
                                    className="glass-input p-3 flex items-center space-x-3"
                                >
                                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{pdf.name}</p>
                                        <p className="text-xs text-foreground-secondary">
                                            {(pdf.file.size / 1024).toFixed(1)} KB
                                            {pdf.pageCount !== undefined && ` • ${pdf.pageCount} page${pdf.pageCount !== 1 ? 's' : ''}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => movePdf(index, 'up')}
                                            disabled={index === 0}
                                            className="p-1 rounded hover:bg-bg-glass-hover disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move up"
                                        >
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => movePdf(index, 'down')}
                                            disabled={index === pdfs.length - 1}
                                            className="p-1 rounded hover:bg-bg-glass-hover disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Move down"
                                        >
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => removePdf(pdf.id)}
                                            className="p-1 rounded hover:bg-red-500/20 text-red-400"
                                            title="Remove"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                {pdfs && pdfs.length >= 2 && (
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="primary"
                            onClick={mergePdfs}
                            loading={loadingAction === 'Merging'}
                            className="uppercase tracking-widest"
                        >
                            Merge PDFs
                        </Button>
                        {mergedBlob && (
                            <Button
                                variant="secondary"
                                onClick={downloadMerged}
                                className="uppercase tracking-widest"
                            >
                                Download Merged PDF
                            </Button>
                        )}
                    </div>
                )}

                {(!pdfs || pdfs.length === 0) && (
                    <div className="text-center text-foreground-muted italic py-8">
                        Upload PDF files to get started
                    </div>
                )}

                {pdfs && pdfs.length === 1 && (
                    <div className="text-center text-foreground-muted italic py-4">
                        Add at least one more PDF file to merge
                    </div>
                )}
            </div>
        </ToolPane>
    );
};

