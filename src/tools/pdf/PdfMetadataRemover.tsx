import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '../../components/ui/Button';
import { useToolState } from '../../store/toolStore';
import { FileText, Trash2 } from 'lucide-react';

const TOOL_ID = 'pdf-metadata-remover';

interface PdfMetadataRemoverProps {
    tabId?: string;
}

export const PdfMetadataRemover: React.FC<PdfMetadataRemoverProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        options: {
            pdfFile: null as File | null,
            removedBlob: undefined as Blob | undefined
        }
    };

    const options = data.options || {};
    const pdfFile = options.pdfFile as File | null;
    const removedBlob = options.removedBlob as Blob | undefined;

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
                removedBlob: undefined
            }
        });
    };

    const removeMetadata = async () => {
        if (!pdfFile) {
            setToolData(effectiveId, { output: 'Please upload a PDF file.' });
            return;
        }

        setLoadingAction('Removing Metadata');

        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            // Remove all metadata by creating a new PDF without metadata
            // Note: pdf-lib doesn't have a direct method to remove metadata,
            // so we create a new PDF and copy pages without metadata
            const newPdf = await PDFDocument.create();
            const pages = await newPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            pages.forEach((page) => newPdf.addPage(page));

            // Don't set any metadata - leave it empty
            // This effectively removes all metadata

            const pdfBytes = await newPdf.save();
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

            setToolData(effectiveId, {
                output: 'Metadata removed successfully',
                options: {
                    ...options,
                    removedBlob: pdfBlob
                }
            });
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error removing metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const downloadCleaned = () => {
        if (!removedBlob) return;

        const url = URL.createObjectURL(removedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pdfFile?.name.replace('.pdf', '') || 'cleaned'}-no-metadata.pdf`;
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
            title="PDF Metadata Remover"
            description="Remove all metadata from PDF"
            onClear={handleClear}
            onDownload={removedBlob ? downloadCleaned : undefined}
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
                        <Trash2 className="w-6 h-6" />
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

                {/* Info */}
                {pdfFile && (
                    <div className="glass-input p-4 space-y-2">
                        <p className="text-sm font-semibold">Metadata Removal</p>
                        <p className="text-xs text-foreground-muted">
                            This will remove all metadata including title, author, subject, keywords, creator, producer, and dates from the PDF file.
                        </p>
                    </div>
                )}

                {/* Actions */}
                {pdfFile && (
                    <div className="flex flex-wrap gap-3">
                        <Button
                            variant="primary"
                            onClick={removeMetadata}
                            loading={loadingAction === 'Removing Metadata'}
                            className="uppercase tracking-widest"
                        >
                            Remove Metadata
                        </Button>
                        {removedBlob && (
                            <Button
                                variant="secondary"
                                onClick={downloadCleaned}
                                className="uppercase tracking-widest"
                            >
                                Download Cleaned PDF
                            </Button>
                        )}
                    </div>
                )}

                {!pdfFile && (
                    <div className="text-center text-foreground-muted italic py-8">
                        Upload a PDF file to remove metadata
                    </div>
                )}
            </div>
        </ToolPane>
    );
};

