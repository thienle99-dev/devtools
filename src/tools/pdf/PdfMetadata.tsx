import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '../../components/ui/Button';
import { useToolState } from '../../store/toolStore';
import { FileText, Edit2, Eye } from 'lucide-react';

const TOOL_ID = 'pdf-metadata';

interface PdfMetadataProps {
    tabId?: string;
}

export const PdfMetadata: React.FC<PdfMetadataProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [mode, setMode] = useState<'view' | 'edit'>('view');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        options: {
            pdfFile: null as File | null,
            metadata: {
                title: '',
                author: '',
                subject: '',
                keywords: '',
                creator: '',
                producer: '',
                creationDate: '',
                modificationDate: ''
            },
            editedBlob: undefined as Blob | undefined
        }
    };

    const options = data.options || {};
    const pdfFile = options.pdfFile as File | null;
    const metadata = options.metadata || {};
    const editedBlob = options.editedBlob as Blob | undefined;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || file.type !== 'application/pdf') return;

        setLoadingAction('Reading');
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pdfMetadata = pdfDoc.getSubject() ? {
                title: pdfDoc.getTitle() || '',
                author: pdfDoc.getAuthor() || '',
                subject: pdfDoc.getSubject() || '',
                keywords: (() => {
                    const keywords = pdfDoc.getKeywords();
                    if (Array.isArray(keywords)) {
                        return keywords.join(', ');
                    }
                    return keywords || '';
                })(),
                creator: pdfDoc.getCreator() || '',
                producer: pdfDoc.getProducer() || '',
                creationDate: pdfDoc.getCreationDate()?.toString() || '',
                modificationDate: pdfDoc.getModificationDate()?.toString() || ''
            } : {
                title: pdfDoc.getTitle() || '',
                author: pdfDoc.getAuthor() || '',
                subject: pdfDoc.getSubject() || '',
                keywords: (() => {
                    const keywords = pdfDoc.getKeywords();
                    if (Array.isArray(keywords)) {
                        return keywords.join(', ');
                    }
                    return keywords || '';
                })(),
                creator: pdfDoc.getCreator() || '',
                producer: pdfDoc.getProducer() || '',
                creationDate: '',
                modificationDate: ''
            };

            setToolData(effectiveId, {
                options: {
                    ...options,
                    pdfFile: file,
                    metadata: pdfMetadata,
                    editedBlob: undefined
                }
            });
            setMode('view');
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error reading PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const updateMetadata = (key: string, value: string) => {
        setToolData(effectiveId, {
            options: {
                ...options,
                metadata: {
                    ...metadata,
                    [key]: value
                },
                editedBlob: undefined
            }
        });
    };

    const saveMetadata = async () => {
        if (!pdfFile) return;

        setLoadingAction('Saving');
        try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            if (metadata.title) pdfDoc.setTitle(metadata.title);
            if (metadata.author) pdfDoc.setAuthor(metadata.author);
            if (metadata.subject) pdfDoc.setSubject(metadata.subject);
            if (metadata.keywords) {
                const keywords = metadata.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k);
                pdfDoc.setKeywords(keywords);
            }
            if (metadata.creator) pdfDoc.setCreator(metadata.creator);
            if (metadata.producer) pdfDoc.setProducer(metadata.producer);

            const pdfBytes = await pdfDoc.save();
            const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

            setToolData(effectiveId, {
                output: 'Metadata updated successfully',
                options: {
                    ...options,
                    editedBlob: pdfBlob
                }
            });
            setMode('view');
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error saving metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const downloadEdited = () => {
        if (!editedBlob) return;

        const url = URL.createObjectURL(editedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pdfFile?.name.replace('.pdf', '') || 'edited'}-metadata.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setMode('view');
    };

    return (
        <ToolPane
            title="PDF Metadata"
            description="View and edit PDF metadata"
            onClear={handleClear}
            onDownload={editedBlob ? downloadEdited : undefined}
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
                                {pdfFile.name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Metadata Display/Edit */}
                {pdfFile && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold">Metadata</h3>
                            <button
                                onClick={() => setMode(mode === 'view' ? 'edit' : 'view')}
                                className="flex items-center space-x-2 px-3 py-1.5 glass-button-secondary text-xs uppercase tracking-widest"
                            >
                                {mode === 'view' ? (
                                    <>
                                        <Edit2 className="w-4 h-4" />
                                        <span>Edit</span>
                                    </>
                                ) : (
                                    <>
                                        <Eye className="w-4 h-4" />
                                        <span>View</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {['title', 'author', 'subject', 'keywords', 'creator', 'producer'].map((key) => (
                                <div key={key} className="space-y-1">
                                    <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                    </label>
                                    {mode === 'view' ? (
                                        <div className="glass-input p-2 text-sm min-h-[2.5rem]">
                                            {metadata[key] || <span className="text-foreground-muted italic">Not set</span>}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={metadata[key] || ''}
                                            onChange={(e) => updateMetadata(key, e.target.value)}
                                            className="glass-input w-full text-sm"
                                            placeholder={`Enter ${key}`}
                                        />
                                    )}
                                </div>
                            ))}

                            {mode === 'view' && (
                                <>
                                    {metadata.creationDate && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                                Creation Date
                                            </label>
                                            <div className="glass-input p-2 text-sm">
                                                {metadata.creationDate}
                                            </div>
                                        </div>
                                    )}
                                    {metadata.modificationDate && (
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                                Modification Date
                                            </label>
                                            <div className="glass-input p-2 text-sm">
                                                {metadata.modificationDate}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {mode === 'edit' && (
                            <Button
                                variant="primary"
                                onClick={saveMetadata}
                                loading={loadingAction === 'Saving'}
                                className="uppercase tracking-widest w-full"
                            >
                                Save Metadata
                            </Button>
                        )}
                    </div>
                )}

                {!pdfFile && (
                    <div className="text-center text-foreground-muted italic py-8">
                        Upload a PDF file to view/edit metadata
                    </div>
                )}
            </div>
        </ToolPane>
    );
};

