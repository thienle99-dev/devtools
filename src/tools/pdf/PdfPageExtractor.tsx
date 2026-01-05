import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '../../components/ui/Button';
import { useToolState } from '../../store/toolStore';
import { FileText } from 'lucide-react';

const TOOL_ID = 'pdf-page-extractor';

interface PdfPageExtractorProps {
    tabId?: string;
}

export const PdfPageExtractor: React.FC<PdfPageExtractorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        options: {
            pdfFile: null as File | null,
            pageCount: 0,
            selectedPages: '1' as string,
            extractedBlob: undefined as Blob | undefined
        }
    };

    const options = data.options || {};
    const pdfFile = options.pdfFile as File | null;
    const pageCount = (options.pageCount || 0) as number;
    const selectedPages = (options.selectedPages || '1') as string;
    const extractedBlob = options.extractedBlob as Blob | undefined;

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
            const pages = pdfDoc.getPageCount();

            setToolData(effectiveId, {
                options: {
                    ...options,
                    pdfFile: file,
                    pageCount: pages,
                    selectedPages: '1',
                    extractedBlob: undefined
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

    const extractPages = async () => {
        if (!pdfFile) {
            setToolData(effectiveId, { output: 'Please upload a PDF file.' });
            return;
        }

        setLoadingAction('Extracting');

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const sourcePdf = await PDFDocument.load(arrayBuffer);
            const totalPages = sourcePdf.getPageCount();

            // Parse page numbers (e.g., "1,3,5" or "1-5")
            const pageNumbers: number[] = [];
            const parts = selectedPages.split(',').map(p => p.trim());

            for (const part of parts) {
                if (part.includes('-')) {
                    const [start, end] = part.split('-').map(n => parseInt(n.trim()));
                    if (!isNaN(start) && !isNaN(end) && start >= 1 && end <= totalPages && start <= end) {
                        for (let i = start; i <= end; i++) {
                            if (!pageNumbers.includes(i - 1)) {
                                pageNumbers.push(i - 1);
                            }
                        }
                    }
                } else {
                    const pageNum = parseInt(part.trim());
                    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
                        if (!pageNumbers.includes(pageNum - 1)) {
                            pageNumbers.push(pageNum - 1);
                        }
                    }
                }
            }

            if (pageNumbers.length === 0) {
                setToolData(effectiveId, { output: 'No valid pages selected.' });
                setLoadingAction(null);
                return;
            }

            pageNumbers.sort((a, b) => a - b);

            const newPdf = await PDFDocument.create();
            const pages = await newPdf.copyPages(sourcePdf, pageNumbers);
            pages.forEach(page => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

            setToolData(effectiveId, {
                output: URL.createObjectURL(pdfBlob),
                options: {
                    ...options,
                    extractedBlob: pdfBlob
                }
            });
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error extracting pages: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const downloadExtracted = () => {
        if (!extractedBlob) return;

        const url = URL.createObjectURL(extractedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pdfFile?.name.replace('.pdf', '') || 'extracted'}-pages.pdf`;
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
                extractedBlob: undefined
            }
        });
    };

    return (
        <ToolPane
            title="PDF Page Extractor"
            description="Extract specific pages from a PDF"
            onClear={handleClear}
            onDownload={extractedBlob ? downloadExtracted : undefined}
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

                {/* Options */}
                {pdfFile && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                            Pages to Extract (e.g., "1,3,5" or "1-5" or "1-3,5-7")
                        </label>
                        <input
                            type="text"
                            value={selectedPages}
                            onChange={(e) => updateOption('selectedPages', e.target.value)}
                            placeholder="1,3,5"
                            className="glass-input w-full text-sm"
                        />
                        <p className="text-xs text-foreground-muted mt-1">
                            Enter page numbers separated by commas or ranges (e.g., "1-5"). Available pages: 1-{pageCount}
                        </p>
                    </div>
                )}

                {/* Actions */}
                {pdfFile && (
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="primary"
                            onClick={extractPages}
                            loading={loadingAction === 'Extracting'}
                            className="uppercase tracking-widest"
                        >
                            Extract Pages
                        </Button>
                        {extractedBlob && (
                            <Button
                                variant="secondary"
                                onClick={downloadExtracted}
                                className="uppercase tracking-widest"
                            >
                                Download Extracted PDF
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

