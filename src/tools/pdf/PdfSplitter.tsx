import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '../../components/ui/Button';
import { useToolState } from '../../store/toolStore';
import { FileText, Download } from 'lucide-react';

const TOOL_ID = 'pdf-splitter';

interface PdfSplitterProps {
    tabId?: string;
}

export const PdfSplitter: React.FC<PdfSplitterProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        options: {
            pdfFile: null as File | null,
            pageCount: 0,
            splitMode: 'all' as 'all' | 'range' | 'every',
            range: '1',
            every: '1',
            splitBlobs: [] as Blob[]
        }
    };

    const options = data.options || {};
    const pdfFile = options.pdfFile as File | null;
    const pageCount = (options.pageCount || 0) as number;
    const splitMode = (options.splitMode || 'all') as 'all' | 'range' | 'every';
    const range = (options.range || '1') as string;
    const every = (options.every || '1') as string;
    const splitBlobs = (options.splitBlobs || []) as Blob[];

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
                    splitBlobs: []
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

    const splitPdf = async () => {
        if (!pdfFile) {
            setToolData(effectiveId, { output: 'Please upload a PDF file.' });
            return;
        }

        setLoadingAction('Splitting');

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const sourcePdf = await PDFDocument.load(arrayBuffer);
            const totalPages = sourcePdf.getPageCount();
            const blobs: Blob[] = [];

            if (splitMode === 'all') {
                // Split each page into separate PDF
                for (let i = 0; i < totalPages; i++) {
                    const newPdf = await PDFDocument.create();
                    const [page] = await newPdf.copyPages(sourcePdf, [i]);
                    newPdf.addPage(page);
                    const pdfBytes = await newPdf.save();
                    blobs.push(new Blob([pdfBytes], { type: 'application/pdf' }));
                }
            } else if (splitMode === 'range') {
                // Split by page range (e.g., "1-3,5-7")
                const ranges = range.split(',').map(r => r.trim());
                for (const rangeStr of ranges) {
                    if (rangeStr.includes('-')) {
                        const [start, end] = rangeStr.split('-').map(n => parseInt(n.trim()) - 1);
                        if (isNaN(start) || isNaN(end) || start < 0 || end >= totalPages || start > end) {
                            continue;
                        }
                        const newPdf = await PDFDocument.create();
                        const pages = await newPdf.copyPages(sourcePdf, Array.from({ length: end - start + 1 }, (_, i) => start + i));
                        pages.forEach(page => newPdf.addPage(page));
                        const pdfBytes = await newPdf.save();
                        blobs.push(new Blob([pdfBytes], { type: 'application/pdf' }));
                    } else {
                        const pageNum = parseInt(rangeStr.trim()) - 1;
                        if (pageNum >= 0 && pageNum < totalPages) {
                            const newPdf = await PDFDocument.create();
                            const [page] = await newPdf.copyPages(sourcePdf, [pageNum]);
                            newPdf.addPage(page);
                            const pdfBytes = await newPdf.save();
                            blobs.push(new Blob([pdfBytes], { type: 'application/pdf' }));
                        }
                    }
                }
            } else if (splitMode === 'every') {
                // Split every N pages
                const n = parseInt(every) || 1;
                if (n < 1) {
                    setToolData(effectiveId, { output: 'Invalid page count. Must be at least 1.' });
                    setLoadingAction(null);
                    return;
                }

                for (let i = 0; i < totalPages; i += n) {
                    const newPdf = await PDFDocument.create();
                    const endPage = Math.min(i + n, totalPages);
                    const pages = await newPdf.copyPages(sourcePdf, Array.from({ length: endPage - i }, (_, j) => i + j));
                    pages.forEach(page => newPdf.addPage(page));
                    const pdfBytes = await newPdf.save();
                    blobs.push(new Blob([pdfBytes], { type: 'application/pdf' }));
                }
            }

            setToolData(effectiveId, {
                output: `Successfully split PDF into ${blobs.length} file(s)`,
                options: {
                    ...options,
                    splitBlobs: blobs
                }
            });
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error splitting PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const downloadAll = () => {
        splitBlobs.forEach((blob, index) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${pdfFile?.name.replace('.pdf', '') || 'split'}-${index + 1}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
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
                splitBlobs: [] // Clear previous splits when options change
            }
        });
    };

    return (
        <ToolPane
            title="PDF Splitter"
            description="Split PDF into multiple files"
            onClear={handleClear}
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
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">Split Mode</label>
                            <select
                                value={splitMode}
                                onChange={(e) => updateOption('splitMode', e.target.value)}
                                className="glass-input w-full text-sm"
                            >
                                <option value="all">Split all pages (one per file)</option>
                                <option value="range">Split by page range</option>
                                <option value="every">Split every N pages</option>
                            </select>
                        </div>

                        {splitMode === 'range' && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                    Page Range (e.g., "1-3,5-7" or "1,3,5")
                                </label>
                                <input
                                    type="text"
                                    value={range}
                                    onChange={(e) => updateOption('range', e.target.value)}
                                    placeholder="1-3,5-7"
                                    className="glass-input w-full text-sm"
                                />
                                <p className="text-xs text-foreground-muted mt-1">
                                    Enter page ranges separated by commas. Example: "1-3,5-7" or "1,3,5"
                                </p>
                            </div>
                        )}

                        {splitMode === 'every' && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                    Pages per file
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max={pageCount}
                                    value={every}
                                    onChange={(e) => updateOption('every', e.target.value)}
                                    className="glass-input w-full text-sm"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                {pdfFile && (
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="primary"
                            onClick={splitPdf}
                            loading={loadingAction === 'Splitting'}
                            className="uppercase tracking-widest"
                        >
                            Split PDF
                        </Button>
                        {splitBlobs.length > 0 && (
                            <Button
                                variant="secondary"
                                onClick={downloadAll}
                                className="uppercase tracking-widest"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download All ({splitBlobs.length} files)
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

