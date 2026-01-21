import React, { useState, useRef } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToolState } from '@store/toolStore';
import { Button } from '@components/ui/Button';
import { Select } from '@components/ui/Select';
import { Slider } from '@components/ui/Slider';
import { FileImage, Download, Trash2, RefreshCcw, FileType, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { toast } from 'sonner';
import { formatBytes } from '@utils/format';

const TOOL_ID = 'image-converter';

interface ImageJob {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'complete' | 'error';
    progress: number;
    originalSize: number;
    compressedSize?: number;
    preview?: string;
    resultBlob?: Blob;
    error?: string;
}

export const ImageConverter: React.FC = () => {
    const { data: toolData, setToolData, clearToolData } = useToolState(TOOL_ID);
    const [jobs, setJobs] = useState<ImageJob[]>([]);
    const [globalIsProcessing, setGlobalIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const data = toolData || {
        options: {
            format: 'image/webp',
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            initialQuality: 0.8
        }
    };

    const { options } = data;

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        addFiles(files);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const addFiles = (files: File[]) => {
        const newJobs: ImageJob[] = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file,
            status: 'pending',
            progress: 0,
            originalSize: file.size,
            preview: URL.createObjectURL(file)
        }));
        setJobs((prev: ImageJob[]) => [...prev, ...newJobs]);
    };

    const removeJob = (id: string) => {
        setJobs((prev: ImageJob[]) => {
            const job = prev.find((j: ImageJob) => j.id === id);
            if (job?.preview) URL.revokeObjectURL(job.preview);
            return prev.filter((j: ImageJob) => j.id !== id);
        });
    };



    const processAll = async () => {
        setGlobalIsProcessing(true);

        for (const job of jobs) {
            if (job.status === 'complete') continue;

            try {
                setJobs((prev: ImageJob[]) => prev.map((j: ImageJob) => j.id === job.id ? { ...j, status: 'processing', progress: 10 } : j));

                const compressionOptions = {
                    maxSizeMB: options.maxSizeMB,
                    maxWidthOrHeight: options.maxWidthOrHeight,
                    useWebWorker: options.useWebWorker,
                    fileType: options.format as any,
                    initialQuality: options.initialQuality,
                    onProgress: (p: number) => {
                        setJobs((prev: ImageJob[]) => prev.map((j: ImageJob) => j.id === job.id ? { ...j, progress: p } : j));
                    }
                };

                const compressedFile = await imageCompression(job.file, compressionOptions);

                setJobs((prev: ImageJob[]) => prev.map((j: ImageJob) => j.id === job.id ? {
                    ...j,
                    status: 'complete',
                    progress: 100,
                    compressedSize: compressedFile.size,
                    resultBlob: compressedFile
                } : j));

            } catch (error) {
                console.error(error);
                setJobs((prev: ImageJob[]) => prev.map((j: ImageJob) => j.id === job.id ? { ...j, status: 'error', error: (error as Error).message } : j));
            }
        }

        setGlobalIsProcessing(false);
        toast.success('Finished processing all images!');
    };

    const downloadJob = (job: ImageJob) => {
        if (!job.resultBlob) return;
        const url = URL.createObjectURL(job.resultBlob);
        const a = document.createElement('a');
        const ext = options.format.split('/')[1];
        a.href = url;
        const nameParts = job.file.name.split('.');
        nameParts.pop();
        a.download = `${nameParts.join('.')}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClearAll = () => {
        jobs.forEach((job: ImageJob) => {
            if (job.preview) URL.revokeObjectURL(job.preview);
        });
        setJobs([]);
        clearToolData(TOOL_ID);
    };

    return (
        <ToolPane
            toolId={TOOL_ID}
            title="Image Converter & Compressor"
            description="Professional batch image processing with glassmorphism preview"
            onClear={handleClearAll}
        >
            <div className="flex flex-col h-full space-y-6">
                {/* Options Header */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 glass-panel rounded-3xl border border-border-glass">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-foreground-muted uppercase tracking-widest pl-1">
                            <FileType size={12} className="text-primary" /> Target Format
                        </div>
                        <Select
                            value={options.format}
                            onChange={(e) => setToolData(TOOL_ID, { options: { ...options, format: e.target.value } })}
                            options={[
                                { label: 'WebP (Optimal)', value: 'image/webp' },
                                { label: 'JPEG (Standard)', value: 'image/jpeg' },
                                { label: 'PNG (Lossless)', value: 'image/png' },
                            ]}
                        />
                    </div>
                    <div className="space-y-3">
                        <Slider
                            label="Max Dimension"
                            value={options.maxWidthOrHeight}
                            unit="px"
                            min={200}
                            max={4000}
                            step={100}
                            onChange={(v) => setToolData(TOOL_ID, { options: { ...options, maxWidthOrHeight: v } })}
                        />
                    </div>
                    <div className="space-y-3">
                        <Slider
                            label="Max Size"
                            value={options.maxSizeMB}
                            unit=" MB"
                            min={0.1}
                            max={20}
                            step={0.1}
                            onChange={(v) => setToolData(TOOL_ID, { options: { ...options, maxSizeMB: v } })}
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            variant="primary"
                            className="w-full h-11 font-black"
                            onClick={processAll}
                            loading={globalIsProcessing}
                            disabled={jobs.length === 0}
                            icon={RefreshCcw}
                        >
                            PROCESS ALL
                        </Button>
                    </div>
                </div>

                {/* Main Area */}
                <div className="flex-1 min-h-0 flex flex-col gap-6">
                    {jobs.length === 0 ? (
                        <div
                            className="flex-1 border-2 border-dashed border-border-glass rounded-3xl flex flex-col items-center justify-center p-12 hover:bg-foreground/[0.02] transition-all cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={onFileChange} multiple accept="image/*" className="hidden" />
                            <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-primary/10">
                                <FileImage size={40} />
                            </div>
                            <h3 className="mt-8 text-2xl font-black tracking-tight">Drop images to convert</h3>
                            <p className="mt-2 text-foreground-secondary text-sm">PNG, JPG, WebP, GIF supported for batch conversion</p>
                            <Button variant="secondary" className="mt-8 rounded-full px-8">SELECT FILES</Button>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                            <div className="flex items-center justify-between mb-2 px-1">
                                <span className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.2em]">{jobs.length} Files Queued</span>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                                >
                                    + ADD MORE FILES
                                </button>
                                <input type="file" ref={fileInputRef} onChange={onFileChange} multiple accept="image/*" className="hidden" />
                            </div>
                            {jobs.map(job => (
                                <div key={job.id} className="glass-panel p-4 rounded-3xl border border-border-glass flex items-center gap-5 group hover:border-primary/30 transition-all duration-300">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black/5 flex-shrink-0 relative">
                                        <img src={job.preview} className="w-full h-full object-cover" alt="preview" />
                                        {job.status === 'processing' && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <Loader2 className="animate-spin text-white" size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-bold truncate text-sm">{job.file.name}</p>
                                            {job.status === 'complete' && <CheckCircle2 size={14} className="text-emerald-500" />}
                                            {job.status === 'error' && <AlertCircle size={14} className="text-red-500" />}
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                                            <span>{formatBytes(job.originalSize)}</span>
                                            {job.status === 'complete' && job.compressedSize && (
                                                <>
                                                    <span className="text-foreground">→</span>
                                                    <span className="text-emerald-500">{formatBytes(job.compressedSize)}</span>
                                                    <span className="bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full">
                                                        -{Math.round((1 - job.compressedSize / job.originalSize) * 100)}%
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        {job.status === 'processing' && (
                                            <div className="w-full bg-foreground/[0.05] h-1 rounded-full mt-3 overflow-hidden">
                                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${job.progress}%` }} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {job.status === 'complete' && (
                                            <button
                                                onClick={() => downloadJob(job)}
                                                className="p-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-2xl transition-all"
                                                title="Download Result"
                                            >
                                                <Download size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => removeJob(job.id)}
                                            className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-2xl transition-all"
                                            title="Remove File"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ToolPane>
    );
};
