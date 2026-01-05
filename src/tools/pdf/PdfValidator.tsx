import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolPane } from '../../components/layout/ToolPane';
import { useToolState } from '../../store/toolStore';
import { FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const TOOL_ID = 'pdf-validator';

interface PdfValidatorProps {
    tabId?: string;
}

interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    info: {
        pageCount: number;
        fileSize: number;
        title?: string;
        author?: string;
        creator?: string;
        producer?: string;
        creationDate?: string;
        modificationDate?: string;
    };
}

export const PdfValidator: React.FC<PdfValidatorProps> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [, setLoadingAction] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        output: '',
        options: {
            pdfFile: null as File | null,
            validationResult: null as ValidationResult | null
        }
    };

    const options = data.options || {};
    const pdfFile = options.pdfFile as File | null;
    const validationResult = options.validationResult as ValidationResult | null;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoadingAction('Validating');
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            
            const errors: string[] = [];
            const warnings: string[] = [];
            
            // Basic validation
            const pageCount = pdfDoc.getPageCount();
            if (pageCount === 0) {
                errors.push('PDF has no pages');
            }

            // Check file size
            if (file.size === 0) {
                errors.push('PDF file is empty');
            } else if (file.size > 100 * 1024 * 1024) {
                warnings.push('PDF file is very large (>100MB)');
            }

            // Extract metadata
            const info: ValidationResult['info'] = {
                pageCount,
                fileSize: file.size,
                title: pdfDoc.getTitle() || undefined,
                author: pdfDoc.getAuthor() || undefined,
                creator: pdfDoc.getCreator() || undefined,
                producer: pdfDoc.getProducer() || undefined,
                creationDate: pdfDoc.getCreationDate()?.toString() || undefined,
                modificationDate: pdfDoc.getModificationDate()?.toString() || undefined
            };

            // Check for common issues
            if (!info.title && !info.author) {
                warnings.push('PDF has no title or author metadata');
            }

            const result: ValidationResult = {
                isValid: errors.length === 0,
                errors,
                warnings,
                info
            };

            setToolData(effectiveId, {
                output: result.isValid 
                    ? 'PDF is valid ✓' 
                    : `PDF validation failed with ${errors.length} error(s)`,
                options: {
                    ...options,
                    pdfFile: file,
                    validationResult: result
                }
            });
        } catch (error) {
            setToolData(effectiveId, {
                output: `Invalid PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
                options: {
                    ...options,
                    pdfFile: file,
                    validationResult: {
                        isValid: false,
                        errors: [error instanceof Error ? error.message : 'Unknown error'],
                        warnings: [],
                        info: {
                            pageCount: 0,
                            fileSize: file.size
                        }
                    }
                }
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    return (
        <ToolPane
            title="PDF Validator"
            description="Validate PDF file structure and metadata"
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
                                {pdfFile.name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Validation Results */}
                {validationResult && (
                    <div className="space-y-4">
                        {/* Status */}
                        <div className={`glass-input p-4 flex items-center space-x-3 ${
                            validationResult.isValid ? 'border-green-500/50' : 'border-red-500/50'
                        }`}>
                            {validationResult.isValid ? (
                                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                            ) : (
                                <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                                <p className="font-semibold text-sm">
                                    {validationResult.isValid ? 'PDF is Valid' : 'PDF Validation Failed'}
                                </p>
                                <p className="text-xs text-foreground-muted mt-1">
                                    {validationResult.errors.length} error(s), {validationResult.warnings.length} warning(s)
                                </p>
                            </div>
                        </div>

                        {/* Errors */}
                        {validationResult.errors.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center space-x-2">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                    <span>Errors</span>
                                </label>
                                <div className="glass-input p-3 space-y-1">
                                    {validationResult.errors.map((error, index) => (
                                        <p key={index} className="text-sm text-red-400">• {error}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Warnings */}
                        {validationResult.warnings.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1 flex items-center space-x-2">
                                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                                    <span>Warnings</span>
                                </label>
                                <div className="glass-input p-3 space-y-1">
                                    {validationResult.warnings.map((warning, index) => (
                                        <p key={index} className="text-sm text-yellow-400">• {warning}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Info */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">File Information</label>
                            <div className="glass-input p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-foreground-muted">Pages:</span>
                                    <span className="text-sm font-medium">{validationResult.info.pageCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-foreground-muted">File Size:</span>
                                    <span className="text-sm font-medium">{formatSize(validationResult.info.fileSize)}</span>
                                </div>
                                {validationResult.info.title && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-foreground-muted">Title:</span>
                                        <span className="text-sm font-medium">{validationResult.info.title}</span>
                                    </div>
                                )}
                                {validationResult.info.author && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-foreground-muted">Author:</span>
                                        <span className="text-sm font-medium">{validationResult.info.author}</span>
                                    </div>
                                )}
                                {validationResult.info.creator && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-foreground-muted">Creator:</span>
                                        <span className="text-sm font-medium">{validationResult.info.creator}</span>
                                    </div>
                                )}
                                {validationResult.info.producer && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-foreground-muted">Producer:</span>
                                        <span className="text-sm font-medium">{validationResult.info.producer}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {!pdfFile && (
                    <div className="text-center text-foreground-muted italic py-8">
                        Upload a PDF file to validate
                    </div>
                )}
            </div>
        </ToolPane>
    );
};

