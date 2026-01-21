import React, { useState, useRef } from 'react';
import { FileUp, Image as ImageIcon, FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import type JSZip from 'jszip';
import { Button } from '@components/ui/Button';
import { Card } from '@components/ui/Card';
import { Label } from '@components/ui/Label';
import { toast } from 'sonner';
import { cn } from '@utils/cn';
import { loadPdfJs, loadJsZip } from './utils/lazyDeps';

type ConvertMode = 'to-image' | 'to-text';
type PdfJsModule = typeof import('pdfjs-dist/build/pdf.mjs');
type JSZipConstructor = typeof JSZip;

export function PdfConverter() {
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<ConvertMode>('to-image');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type !== 'application/pdf') {
                toast.error("Please select a valid PDF file");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleConvert = async () => {
        if (!file) return;

        setIsProcessing(true);
        setProgress(0);

        try {
            const pdfjsLib = await loadPdfJs();
            const arrayBuffer = await file.arrayBuffer();

            if (mode === 'to-image') {
                const JSZipLib = await loadJsZip();
                await convertToImages(pdfjsLib, JSZipLib, arrayBuffer, file.name, setProgress);
            } else {
                await convertToText(pdfjsLib, arrayBuffer, file.name, setProgress);
            }

            toast.success("Conversion completed successfully!");
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to convert PDF: " + err.message);
        } finally {
            setIsProcessing(false);
            setProgress(0);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col space-y-2">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="w-8 h-8 text-rose-500" />
                    PDF Converter
                </h2>
                <p className="text-slate-400">Convert PDF documents to images or extract text content</p>
            </div>

            <Card className="p-6 space-y-6 bg-slate-900/50 border-slate-800">
                {/* File Upload Area */}
                <div
                    className={cn(
                        "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer",
                        file ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50"
                    )}
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="application/pdf"
                        className="hidden"
                    />

                    {file ? (
                        <div className="flex flex-col items-center gap-2 text-emerald-400">
                            <FileText className="w-12 h-12" />
                            <span className="font-semibold text-lg">{file.name}</span>
                            <span className="text-sm opacity-70">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            <Button size="sm" variant="ghost" className="mt-2 text-slate-400 hover:text-white" onClick={(e) => {
                                e.stopPropagation();
                                setFile(null);
                            }}>
                                Change File
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <FileUp className="w-12 h-12 mb-2" />
                            <span className="font-semibold text-lg">Click to load PDF</span>
                            <span className="text-sm">or drag and drop here</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label>Conversion Mode</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setMode('to-image')}
                                className={cn(
                                    "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                    mode === 'to-image'
                                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                                        : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-400"
                                )}
                            >
                                <ImageIcon className="w-6 h-6" />
                                <span className="font-medium">To Images</span>
                            </button>
                            <button
                                onClick={() => setMode('to-text')}
                                className={cn(
                                    "p-4 rounded-xl border flex flex-col items-center gap-2 transition-all",
                                    mode === 'to-text'
                                        ? "bg-indigo-500/20 border-indigo-500 text-indigo-300"
                                        : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 text-slate-400"
                                )}
                            >
                                <FileText className="w-6 h-6" />
                                <span className="font-medium">Extract Text</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col justify-end">
                        <Button
                            className="w-full h-14 text-lg"
                            variant="primary"
                            disabled={!file || isProcessing}
                            onClick={handleConvert}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Converting {progress}%...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-5 w-5" />
                                    Start Conversion
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3 text-blue-300 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>
                        Processing happens entirely in your browser. Large files might take a few moments.
                        {mode === 'to-image' && " Images will be downloaded as a ZIP archive."}
                        {mode === 'to-text' && " Text will be downloaded as a .txt file."}
                    </p>
                </div>
            </Card>
        </div>
    );
}

async function convertToImages(
    pdfjsLib: PdfJsModule,
    JSZipLib: JSZipConstructor,
    pdfData: ArrayBuffer,
    fileName: string,
    onProgress: (value: number) => void
) {
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const zip = new JSZipLib();
    const totalPages = pdf.numPages;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Canvas context is not available in this browser.');
    }

    for (let i = 1; i <= totalPages; i++) {
        onProgress(Math.round((i / totalPages) * 100));
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport } as any).promise;
        const imgData = canvas.toDataURL('image/png').split(',')[1];
        zip.file(`page-${i}.png`, imgData, { base64: true });
    }

    const content = await zip.generateAsync({ type: 'blob', streamFiles: true });
    downloadBlob(content, `${getBaseName(fileName)}-images.zip`);
}

async function convertToText(
    pdfjsLib: PdfJsModule,
    pdfData: ArrayBuffer,
    fileName: string,
    onProgress: (value: number) => void
) {
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    let fullText = '';
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
        onProgress(Math.round((i / totalPages) * 100));
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item: any) => (typeof item?.str === 'string' ? item.str : ''))
            .join(' ');
        fullText += `--- Page ${i} ---\n\n${pageText}\n\n`;
    }

    const blob = new Blob([fullText], { type: 'text/plain' });
    downloadBlob(blob, `${getBaseName(fileName)}.txt`);
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function getBaseName(fileName: string) {
    return fileName?.replace(/\.pdf$/i, '') || 'document';
}
