import React, { useEffect, useState, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { ToolPane } from '../../components/layout/ToolPane';
import { Button } from '../../components/ui/Button';
import { useToolState } from '../../store/toolStore';
import { FileText, Upload, Download } from 'lucide-react';

const TOOL_ID = 'pdf-base64';

interface PdfBase64Props {
    tabId?: string;
}

export const PdfBase64: React.FC<PdfBase64Props> = ({ tabId }) => {
    const effectiveId = tabId || TOOL_ID;
    const { data: toolData, setToolData, clearToolData, addToHistory } = useToolState(effectiveId);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [mode, setMode] = useState<'encode' | 'decode'>('encode');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        input: '',
        output: '',
        options: {
            pdfFile: null as File | null,
            base64String: '',
            decodedBlob: undefined as Blob | undefined
        }
    };

    const options = data.options || {};
    const pdfFile = options.pdfFile as File | null;
    const base64String = (options.base64String || '') as string;
    const decodedBlob = options.decodedBlob as Blob | undefined;

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || file.type !== 'application/pdf') return;

        setLoadingAction('Encoding');
        try {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1]; // Remove data:application/pdf;base64, prefix
                setToolData(effectiveId, {
                    output: base64,
                    options: {
                        ...options,
                        pdfFile: file,
                        base64String: base64
                    }
                });
                setLoadingAction(null);
            };
            reader.onerror = () => {
                setToolData(effectiveId, { output: 'Error reading file' });
                setLoadingAction(null);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error encoding PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
            setLoadingAction(null);
        }
    };

    const handleBase64Input = (value: string) => {
        setToolData(effectiveId, {
            input: value,
            options: {
                ...options,
                base64String: value,
                decodedBlob: undefined
            }
        });
    };

    const decodeBase64 = async () => {
        const base64 = base64String.trim();
        if (!base64) {
            setToolData(effectiveId, { output: 'Please enter a Base64 string.' });
            return;
        }

        setLoadingAction('Decoding');
        try {
            // Remove data URL prefix if present
            const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
            const binaryString = atob(cleanBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Validate it's a PDF
            const pdfDoc = await PDFDocument.load(bytes);
            const blob = new Blob([bytes], { type: 'application/pdf' });

            setToolData(effectiveId, {
                output: `Successfully decoded PDF (${pdfDoc.getPageCount()} pages)`,
                options: {
                    ...options,
                    decodedBlob: blob
                }
            });
        } catch (error) {
            setToolData(effectiveId, {
                output: `Error decoding Base64: ${error instanceof Error ? error.message : 'Invalid Base64 or not a valid PDF'}`
            });
        } finally {
            setLoadingAction(null);
        }
    };

    const downloadDecoded = () => {
        if (!decodedBlob) return;

        const url = URL.createObjectURL(decodedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `decoded-${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        if (mode === 'encode' && base64String) {
            navigator.clipboard.writeText(base64String);
        } else if (mode === 'decode' && data.output) {
            navigator.clipboard.writeText(data.output);
        }
    };

    const handleClear = () => {
        clearToolData(effectiveId);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <ToolPane
            title="PDF Base64 Converter"
            description="Convert PDF to Base64 or decode Base64 to PDF"
            onClear={handleClear}
            onCopy={handleCopy}
            onDownload={decodedBlob ? downloadDecoded : undefined}
        >
            <div className="space-y-6 h-full flex flex-col">
                {/* Mode Toggle */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setMode('encode')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            mode === 'encode'
                                ? 'glass-button-primary'
                                : 'glass-button-secondary'
                        }`}
                    >
                        <Upload className="w-4 h-4 inline mr-2" />
                        PDF to Base64
                    </button>
                    <button
                        onClick={() => setMode('decode')}
                        className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            mode === 'decode'
                                ? 'glass-button-primary'
                                : 'glass-button-secondary'
                        }`}
                    >
                        <Download className="w-4 h-4 inline mr-2" />
                        Base64 to PDF
                    </button>
                </div>

                {mode === 'encode' ? (
                    <>
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

                        {/* Base64 Output */}
                        {base64String && (
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                    Base64 String
                                </label>
                                <textarea
                                    value={base64String}
                                    readOnly
                                    className="glass-input w-full text-xs font-mono min-h-[200px] resize-none"
                                />
                                <p className="text-xs text-foreground-muted">
                                    Length: {base64String.length} characters
                                </p>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* Base64 Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                                Base64 String
                            </label>
                            <textarea
                                value={base64String}
                                onChange={(e) => handleBase64Input(e.target.value)}
                                placeholder="Paste Base64 string here..."
                                className="glass-input w-full text-xs font-mono min-h-[200px] resize-none"
                            />
                        </div>

                        {/* Decode Button */}
                        <Button
                            variant="primary"
                            onClick={decodeBase64}
                            loading={loadingAction === 'Decoding'}
                            disabled={!base64String.trim()}
                            className="uppercase tracking-widest w-full"
                        >
                            Decode Base64 to PDF
                        </Button>
                    </>
                )}

                {!pdfFile && mode === 'encode' && (
                    <div className="text-center text-foreground-muted italic py-8">
                        Upload a PDF file to encode to Base64
                    </div>
                )}

                {!base64String && mode === 'decode' && (
                    <div className="text-center text-foreground-muted italic py-8">
                        Paste a Base64 string to decode to PDF
                    </div>
                )}
            </div>
        </ToolPane>
    );
};

