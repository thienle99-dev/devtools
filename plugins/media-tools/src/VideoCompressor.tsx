import React, { useState, useEffect } from 'react';
import {
    Video,
    Upload,
    Download,
    Loader2,
    X,
    Zap
} from 'lucide-react';
import { cn } from '@utils/cn';
import { formatBytes } from '@utils/format';
import { useTask } from '@hooks/useTask';
import type { VideoMetadata, VideoCompressOptions, VideoCompressProgress } from './types';

export const VideoCompressor: React.FC = () => {
    const [file, setFile] = useState<VideoMetadata | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<VideoCompressProgress | null>(null);
    const [_error, setError] = useState<string | null>(null);
    const [_outputPath, setOutputPath] = useState<string | null>(null);
    const [previewError, setPreviewError] = useState(false);
    const [thumbnail, setThumbnail] = useState<string | null>(null);

    // Settings
    const [selectedFormat, _setSelectedFormat] = useState<'mp4' | 'webm' | 'mkv' | 'avi' | 'mov'>('mp4');
    const [_selectedCodec, _setSelectedCodec] = useState<'h264' | 'hevc' | 'vp9' | 'av1'>('h264');
    const [targetResolution, _setTargetResolution] = useState<{ width: number; height: number } | null>(null);
    const [scaleMode, _setScaleMode] = useState<'fit' | 'fill' | 'stretch'>('fit');
    const [crf, _setCrf] = useState(23);
    const [preset, _setPreset] = useState('medium');
    const [keepAudio, _setKeepAudio] = useState(true);
    const [useHardwareAcceleration, _setUseHardwareAcceleration] = useState(true);
    const [compressionMode, _setCompressionMode] = useState<'quality' | 'target'>('quality');
    const [targetSizeMB, _setTargetSizeMB] = useState(25);

    const { runTask } = useTask('video-compressor');

    useEffect(() => {
        const cleanup = (window as any).videoCompressorAPI?.onProgress((p: VideoCompressProgress) => {
            setProgress(p);
            if (p.state === 'complete') {
                setIsProcessing(false);
                setOutputPath(p.outputPath || null);
            } else if (p.state === 'error') {
                setIsProcessing(false);
                setError(p.error || 'Compression failed');
            }
        });

        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    const handleFileSelect = async () => {
        try {
            const filePath = await (window as any).videoCompressorAPI?.chooseInputFile();
            if (filePath) {
                setIsAnalyzing(true);
                setError(null);
                setOutputPath(null);
                setProgress(null);
                setPreviewError(false);
                setThumbnail(null);

                const info = await (window as any).videoCompressorAPI?.getInfo(filePath);
                setFile(info);

                // Load thumbnail
                (window as any).videoCompressorAPI?.generateThumbnail(filePath).then((thumb: string | null) => {
                    setThumbnail(thumb);
                });
            }
        } catch (err) {
            console.error('Failed to get video info:', err);
            setError('Failed to load video information');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCompress = async () => {
        if (!file) return;

        setError(null);
        setOutputPath(null);
        setIsProcessing(true);

        const options: VideoCompressOptions = {
            inputPath: file.path,
            format: selectedFormat,
            resolution: targetResolution || undefined,
            scaleMode,
            crf: compressionMode === 'quality' ? crf : undefined,
            preset,
            keepAudio,
            useHardwareAcceleration,
            targetSize: compressionMode === 'target' ? targetSizeMB * 1024 * 1024 : undefined
        };

        try {
            await runTask('Compressing Video', async () => {
                return new Promise<void>(async (resolve, reject) => {
                    try {
                        const resultPath = await (window as any).videoCompressorAPI?.compress(options);
                        setOutputPath(resultPath);
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });
            }, { cancelable: true });
        } catch (err: any) {
            if (err.message !== 'Cancelled') {
                setError(err.message || 'Processing failed');
            }
            setIsProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (progress?.id) {
            await (window as any).videoCompressorAPI?.cancel(progress.id);
        }
        setIsProcessing(false);
        setProgress(null);
    };

    const reset = () => {
        setFile(null);
        setOutputPath(null);
        setProgress(null);
        setError(null);
        setPreviewError(false);
        setThumbnail(null);
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-br from-background via-background to-background/90 text-foreground overflow-hidden font-sans relative">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-8 border-b border-foreground/5 bg-foreground/5 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Video size={20} />
                    </div>
                    <div>
                        <h2 className="text-base font-black tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">Video Compressor Pro</h2>
                        <p className="text-[10px] text-foreground-secondary font-bold uppercase tracking-widest opacity-60">Professional Media Optimization</p>
                    </div>
                </div>

                {file && (
                    <button
                        onClick={reset}
                        disabled={isProcessing}
                        className="p-2 hover:bg-foreground/10 rounded-xl transition-all text-muted-foreground hover:text-foreground group"
                    >
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                {!file ? (
                    <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                        <button
                            onClick={handleFileSelect}
                            disabled={isAnalyzing}
                            className="group relative flex flex-col items-center gap-6 p-16 rounded-[2.5rem] border border-foreground/10 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-all cursor-pointer overflow-hidden w-full max-w-2xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
                            <div className="absolute inset-0 border-2 border-dashed border-indigo-500/30 rounded-[2.5rem] group-hover:border-indigo-500/60 group-hover:scale-[0.98] transition-all duration-300" />

                            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                {isAnalyzing ? (
                                    <Loader2 className="animate-spin text-white" size={40} />
                                ) : (
                                    <Upload size={40} className="text-white" />
                                )}
                            </div>

                            <div className="text-center relative space-y-2">
                                <h3 className="text-2xl font-black tracking-tight text-foreground">Drop Video Here</h3>
                                <p className="text-sm text-foreground-secondary font-medium tracking-wide">
                                    Support for MP4, WebM, MKV, AVI, MOV <span className="text-indigo-400">•</span> Up to 4K
                                </p>
                            </div>

                            <div className="mt-4 px-8 py-3 bg-foreground/10 text-foreground text-xs font-black rounded-xl border border-foreground/5 hover:bg-foreground/20 transition-all uppercase tracking-widest backdrop-blur-md">
                                or browse files
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto h-full items-start">
                        {/* Left: Metadata & Preview */}
                        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
                            <div className="glass-panel p-1 rounded-3xl bg-gradient-to-b from-foreground/10 to-transparent border border-foreground/5">
                                <div className="bg-foreground/5 dark:bg-black/40 rounded-[1.3rem] p-6 backdrop-blur-md">
                                    <h4 className="text-xs font-black text-foreground/50 uppercase tracking-widest flex items-center gap-2 mb-6">
                                        <div className="flex items-center gap-2">
                                            <Zap size={14} className="text-indigo-400" />
                                            Source Media
                                        </div>
                                    </h4>

                                    {/* Video Preview */}
                                    <div className="mb-6 rounded-2xl overflow-hidden bg-black/50 border border-foreground/10 shadow-2xl relative group aspect-video">
                                        {!previewError ? (
                                            <video
                                                src={`local-media:///${encodeURIComponent(file.path)}`}
                                                className="w-full h-full object-contain"
                                                controls
                                                playsInline
                                                poster={thumbnail || undefined}
                                                onError={() => setPreviewError(true)}
                                            />
                                        ) : (
                                            thumbnail ? (
                                                <div className="relative w-full h-full">
                                                    <img src={thumbnail} alt="Preview" className="w-full h-full object-contain opacity-50" />
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                                                        <Video size={24} className="text-white mb-2" />
                                                        <p className="text-sm font-bold text-white">Preview Unavailable</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-foreground/40 bg-foreground/5">
                                                    <Video size={24} className="opacity-50 mb-2" />
                                                    <p className="text-xs font-mono font-bold">Preview Unavailable</p>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div className="group">
                                            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Filename</div>
                                            <div className="text-lg font-bold text-foreground leading-tight break-all border-b border-foreground/5 pb-2">
                                                {file.path.split(/[\\/]/).pop()}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1">Dimensions</div>
                                                <div className="text-2xl font-black text-foreground font-mono tracking-tighter">
                                                    {file.width}<span className="text-foreground/20 mx-1">×</span>{file.height}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1">Size</div>
                                                <div className="text-2xl font-black text-foreground font-mono tracking-tighter">
                                                    {formatBytes(file.size)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {isProcessing && (
                                <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
                                            style={{ width: `${progress?.percent || 0}%` }}
                                        />
                                    </div>

                                    <div className="flex items-end justify-between mb-4 mt-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Loader2 className="animate-spin text-indigo-400" size={14} />
                                                <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Encoding</span>
                                            </div>
                                            <div className="text-3xl font-black text-foreground font-mono tracking-tighter">
                                                {Math.round(progress?.percent || 0)}%
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleCancel}
                                        className="w-full py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-black uppercase tracking-widest transition-colors border border-rose-500/20"
                                    >
                                        Cancel Operation
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Right: Settings */}
                        <div className="lg:col-span-7 space-y-8">
                            <div className="glass-panel p-6 rounded-3xl border border-foreground/5 bg-foreground/[0.02]">
                                <button
                                    onClick={handleCompress}
                                    disabled={isProcessing}
                                    className={cn(
                                        "w-full py-5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest relative overflow-hidden group",
                                        isProcessing
                                            ? "bg-foreground/5 text-foreground/40 cursor-not-allowed"
                                            : "bg-indigo-600 hover:bg-indigo-500 text-white"
                                    )}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={20} />
                                            Start Compression
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
