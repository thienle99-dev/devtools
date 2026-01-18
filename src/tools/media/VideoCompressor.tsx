import React, { useState, useEffect } from 'react';
import {
    Video,
    Upload,
    Settings2,
    Download,
    Play,
    Folder,
    Loader2,
    AlertCircle,
    CheckCircle2,
    X,
    Maximize,
    Scaling,
    Zap,
    Scale,
    Volume2,
    VolumeX
} from 'lucide-react';
import { cn } from '@utils/cn';
import { formatDuration, formatBytes, formatETA } from '@utils/format';
import { useTask } from '../../hooks/useTask';
import type { VideoMetadata, VideoCompressOptions, VideoCompressProgress } from '../../types/video-compressor';

const FORMATS = ['mp4', 'webm', 'mkv', 'avi', 'mov'];
const PRESETS = ['ultrafast', 'superfast', 'veryfast', 'faster', 'fast', 'medium', 'slow', 'slower', 'veryslow'];
const RESOLUTIONS = [
    { label: '4K', width: 3840, height: 2160 },
    { label: '2K', width: 2560, height: 1440 },
    { label: '1080p', width: 1920, height: 1080 },
    { label: '720p', width: 1280, height: 720 },
    { label: '480p', width: 854, height: 480 },
    { label: '360p', width: 640, height: 360 },
];

export const VideoCompressor: React.FC = () => {
    const [file, setFile] = useState<VideoMetadata | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<VideoCompressProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [outputPath, setOutputPath] = useState<string | null>(null);
    const [previewError, setPreviewError] = useState(false);
    const [thumbnail, setThumbnail] = useState<string | null>(null);

    // Settings
    const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'webm' | 'mkv' | 'avi' | 'mov'>('mp4');
    const [targetResolution, setTargetResolution] = useState<{ width: number; height: number } | null>(null);
    const [scaleMode, setScaleMode] = useState<'fit' | 'fill' | 'stretch'>('fit');
    const [crf, setCrf] = useState(23);
    const [preset, setPreset] = useState('medium');
    const [keepAudio, setKeepAudio] = useState(true);
    const [useHardwareAcceleration, setUseHardwareAcceleration] = useState(true);
    const [compressionMode, setCompressionMode] = useState<'quality' | 'target'>('quality');
    const [targetSizeMB, setTargetSizeMB] = useState(25);

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

                // Set default target resolution to original if not yet set
                if (!targetResolution) {
                    // But maybe we want a preset? Let's just keep it null (Original) by default
                }
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
                // The actual compression is handled by the event listener, 
                // but we use runTask for UI consistency and cancellation if needed.
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
                        {/* Left: Metadata & Preview (4 cols) */}
                        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
                            <div className="glass-panel p-1 rounded-3xl bg-gradient-to-b from-foreground/10 to-transparent border border-foreground/5">
                                <div className="bg-foreground/5 dark:bg-black/40 rounded-[1.3rem] p-6 backdrop-blur-md">
                                    <h4 className="text-xs font-black text-foreground/50 uppercase tracking-widest flex items-center gap-2 mb-6">
                                        <div className="flex items-center gap-2">
                                            <Zap size={14} className="text-indigo-400" />
                                            Source Media
                                        </div>
                                        <div className="ml-auto px-2 py-1 rounded-md bg-foreground/5 text-[10px] font-mono text-foreground/70 border border-foreground/5">
                                            RAW INPUT
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
                                                controlsList="nodownload"
                                                poster={thumbnail || undefined}
                                                onError={(e) => {
                                                    console.error('Video playback error:', e.currentTarget.error, e);
                                                    setPreviewError(true);
                                                }}
                                            />
                                        ) : (
                                            thumbnail ? (
                                                <div className="relative w-full h-full">
                                                    <img src={thumbnail} alt="Preview" className="w-full h-full object-contain opacity-50" />
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                                                        <div className="mb-2 p-3 rounded-full bg-white/10 border border-white/20">
                                                            <Video size={24} className="text-white" />
                                                        </div>
                                                        <p className="text-sm font-bold text-white">Preview Unavailable</p>
                                                        <p className="text-xs text-white/70 mt-1 max-w-[200px] text-center">
                                                            Format ({file.codec}) not supported for playback, but ready to compress.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-foreground/40 bg-foreground/5 p-6 text-center">
                                                    <div className="mb-2 p-3 rounded-full bg-foreground/5">
                                                        <Video size={24} className="opacity-50" />
                                                    </div>
                                                    <p className="text-xs font-mono font-bold">Preview Unavailable</p>
                                                    <p className="text-[10px] mt-1 opacity-60">
                                                        This format ({file.codec}) may not be supported for playback, but can still be compressed.
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div className="group">
                                            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 group-hover:text-indigo-300 transition-colors">Filename</div>
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

                                        <div className="grid grid-cols-2 gap-6 pt-2 border-t border-foreground/5">
                                            <div>
                                                <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1">Duration</div>
                                                <div className="text-sm font-bold text-foreground/80 font-mono">
                                                    {formatDuration(file.duration)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1">Codec</div>
                                                <div className="text-sm font-bold text-foreground/80 font-mono uppercase">
                                                    {file.codec}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Processing Status Card */}
                            {isProcessing && (
                                <div className="glass-panel p-6 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/20">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
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
                                                {Math.round(progress?.percent || 0)}<span className="text-lg text-foreground/40">%</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1">Estimated Time</div>
                                            <div className="text-lg font-bold text-foreground font-mono">
                                                {progress?.eta ? formatETA(progress.eta) : '--:--'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-foreground/5 dark:bg-black/20 rounded-xl p-3 flex items-center justify-between border border-foreground/5 mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-foreground/40 uppercase font-bold">Processed</span>
                                            <span className="text-xs font-mono font-bold text-foreground">{progress?.currentSize ? formatBytes(progress.currentSize) : '0MB'}</span>
                                        </div>
                                        <div className="h-6 w-px bg-foreground/10" />
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-foreground/40 uppercase font-bold">Speed</span>
                                            <span className="text-xs font-mono font-bold text-emerald-400">{progress?.speed ? `${progress.speed.toFixed(1)}x` : '-'}</span>
                                        </div>
                                        <div className="h-6 w-px bg-foreground/10" />
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-foreground/40 uppercase font-bold">Ratio</span>
                                            <span className="text-xs font-mono font-bold text-indigo-400">
                                                -{progress?.currentSize ? Math.round((1 - (progress.currentSize / (file.size * ((progress.percent || 1) / 100)))) * 100) : 0}%
                                            </span>
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

                            {error && (
                                <div className="glass-panel p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 flex items-start gap-4 animate-in slide-in-from-bottom-2">
                                    <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                                        <AlertCircle className="text-rose-400" size={16} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-widest text-rose-400 mb-1">Encoding Failed</h4>
                                        <p className="text-xs font-medium text-foreground/70 leading-relaxed">{error}</p>
                                    </div>
                                </div>
                            )}

                            {outputPath && (
                                <div className="glass-panel p-1 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/10 border border-emerald-500/20 animate-in slide-in-from-bottom-5">
                                    <div className="bg-foreground/5 dark:bg-black/40 rounded-[1.3rem] p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Success</h4>
                                                    <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Task Completed</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                            <button
                                                onClick={() => (window as any).videoCompressorAPI?.openFile(outputPath)}
                                                className="flex flex-col items-center justify-center gap-1 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                                            >
                                                <Play size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Open</span>
                                            </button>
                                            <button
                                                onClick={() => (window as any).videoCompressorAPI?.showInFolder(outputPath)}
                                                className="flex flex-col items-center justify-center gap-1 py-3 bg-foreground/5 text-foreground rounded-xl hover:bg-foreground/10 transition-all border border-foreground/5 active:scale-95"
                                            >
                                                <Folder size={16} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Folder</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Settings (8 cols) */}
                        <div className="lg:col-span-7 space-y-8">
                            <div>
                                <h3 className="text-xl font-black text-foreground tracking-tight mb-6 flex items-center gap-2">
                                    <div className="w-1 h-6 bg-indigo-500 rounded-full" />
                                    Configuration
                                </h3>

                                <div className="space-y-6">
                                    {/* Format Selection - Refined */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-foreground/50 uppercase tracking-widest pl-1">Output Format</label>
                                        <div className="grid grid-cols-5 gap-3">
                                            {FORMATS.map(fmt => (
                                                <button
                                                    key={fmt}
                                                    onClick={() => setSelectedFormat(fmt as any)}
                                                    className={cn(
                                                        "group relative py-3 rounded-xl text-xs font-black transition-all border uppercase overflow-hidden",
                                                        selectedFormat === fmt
                                                            ? "bg-foreground text-background border-foreground shadow-lg shadow-foreground/10 scale-105 z-10"
                                                            : "bg-foreground/5 border-foreground/5 text-foreground/60 hover:bg-foreground/10 hover:border-foreground/10"
                                                    )}
                                                >
                                                    <span className="relative z-10">{fmt}</span>
                                                    {selectedFormat === fmt && (
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/0 to-indigo-500/10" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Resolution Selection - Grid with icons */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-foreground/50 uppercase tracking-widest pl-1">Resolution Strategy</label>
                                        <div className="grid grid-cols-4 gap-3">
                                            <button
                                                onClick={() => setTargetResolution(null)}
                                                className={cn(
                                                    "py-3 rounded-2xl text-[10px] font-black transition-all border flex flex-col items-center gap-2 uppercase relative overflow-hidden",
                                                    targetResolution === null
                                                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                                                        : "bg-foreground/5 border-foreground/5 text-foreground/60 hover:bg-foreground/10"
                                                )}
                                            >
                                                <span className="z-10 mt-1">Original</span>
                                                <span className="text-[10px] opacity-60 font-mono z-10">{file.width}p</span>
                                                {targetResolution === null && <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />}
                                            </button>
                                            {RESOLUTIONS.map(res => (
                                                <button
                                                    key={res.label}
                                                    onClick={() => setTargetResolution({ width: res.width, height: res.height })}
                                                    className={cn(
                                                        "py-3 rounded-2xl text-[10px] font-black transition-all border flex flex-col items-center gap-2 uppercase relative overflow-hidden",
                                                        targetResolution?.width === res.width
                                                            ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                                                            : "bg-foreground/5 border-foreground/5 text-foreground/60 hover:bg-foreground/10"
                                                    )}
                                                >
                                                    <span className="z-10 mt-1">{res.label}</span>
                                                    <span className="text-[10px] opacity-60 font-mono z-10">{res.height}p</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Scale Mode - Optional display if resolution changes */}
                                    {targetResolution && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <label className="text-[10px] font-black text-foreground/50 uppercase tracking-widest pl-1">Scaling Strategy</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {(['fit', 'fill', 'stretch'] as const).map(mode => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => setScaleMode(mode)}
                                                        className={cn(
                                                            "py-2.5 rounded-xl text-[10px] font-black transition-all border flex items-center justify-center gap-2 uppercase",
                                                            scaleMode === mode
                                                                ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/10"
                                                                : "bg-foreground/5 border-foreground/5 text-foreground/60 hover:bg-foreground/10"
                                                        )}
                                                    >
                                                        {mode === 'fit' && <Scale size={12} />}
                                                        {mode === 'fill' && <Maximize size={12} />}
                                                        {mode === 'stretch' && <Scaling size={12} />}
                                                        {mode}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Advanced Settings Container */}
                                    <div className="glass-panel p-6 rounded-3xl border border-foreground/5 bg-foreground/[0.02]">
                                        <div className="grid grid-cols-2 gap-8 mb-8">
                                            {/* Compression Mode */}
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-foreground/50 uppercase tracking-widest">Compression Mode</label>
                                                <div className="flex p-1.5 bg-foreground/5 dark:bg-black/20 border border-foreground/5 rounded-2xl">
                                                    <button
                                                        onClick={() => setCompressionMode('quality')}
                                                        className={cn(
                                                            "flex-1 py-2.5 text-[10px] font-black rounded-xl uppercase transition-all",
                                                            compressionMode === 'quality'
                                                                ? "bg-foreground/10 text-foreground shadow-sm border border-foreground/5"
                                                                : "text-foreground/40 hover:text-foreground/60"
                                                        )}
                                                    >
                                                        Quality (CRF)
                                                    </button>
                                                    <button
                                                        onClick={() => setCompressionMode('target')}
                                                        className={cn(
                                                            "flex-1 py-2.5 text-[10px] font-black rounded-xl uppercase transition-all",
                                                            compressionMode === 'target'
                                                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-500/20"
                                                                : "text-foreground/40 hover:text-foreground/60"
                                                        )}
                                                    >
                                                        Target Size
                                                    </button>
                                                </div>

                                                {compressionMode === 'quality' ? (
                                                    <div className="space-y-4 pt-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-foreground/70">CRF Value</span>
                                                            <div className="px-3 py-1 bg-foreground/5 rounded-lg border border-foreground/5 text-xs font-mono font-bold text-indigo-400">{crf}</div>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min="18"
                                                            max="51"
                                                            step="1"
                                                            value={crf}
                                                            onChange={(e) => setCrf(parseInt(e.target.value))}
                                                            className="w-full h-2 bg-foreground/10 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
                                                        />
                                                        <div className="flex justify-between text-[10px] font-bold text-foreground/30 uppercase tracking-tight">
                                                            <span>High Quality</span>
                                                            <span>Balanced</span>
                                                            <span>Low Size</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2 pt-2">
                                                        <div className="relative group">
                                                            <input
                                                                type="number"
                                                                value={targetSizeMB}
                                                                onChange={(e) => setTargetSizeMB(Math.max(1, parseInt(e.target.value) || 0))}
                                                                className="w-full bg-foreground/5 dark:bg-black/20 border border-foreground/10 rounded-xl px-4 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono pl-4 pr-12"
                                                                placeholder="Size..."
                                                            />
                                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-foreground/30">MB</div>
                                                        </div>
                                                        <p className="text-[10px] text-foreground/40 pl-1">
                                                            Calculated bitrate: <span className="text-foreground/60 font-mono">{(targetSizeMB * 8192 / file.duration).toFixed(0)} kbps</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Preset Selection - Cleaner look */}
                                            <div className="space-y-2 pt-2">
                                                <div className="flex items-center justify-between">
                                                    <label className="text-[10px] font-black text-foreground/50 uppercase tracking-widest">Encoding Speed (Preset)</label>
                                                    <span className="text-[10px] font-black text-indigo-400 uppercase">{preset}</span>
                                                </div>
                                                <div className="relative">
                                                    <select
                                                        value={preset}
                                                        onChange={(e) => setPreset(e.target.value)}
                                                        className="w-full bg-foreground/5 dark:bg-black/20 border border-foreground/10 rounded-xl px-4 py-3 text-xs font-black text-foreground focus:outline-none focus:border-indigo-500/50 appearance-none uppercase"
                                                    >
                                                        {PRESETS.map(p => (
                                                            <option key={p} value={p} className="bg-background text-foreground">{p.toUpperCase()}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                        <Settings2 size={14} />
                                                    </div>
                                                </div>
                                                <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-tight">
                                                    {preset === 'ultrafast' || preset === 'superfast' ? 'Fast but larger file size' :
                                                        preset === 'veryslow' || preset === 'slower' ? 'Slow but best compression' : 'Balanced speed and size'}
                                                </p>
                                            </div>

                                            {/* Hardware & Audio */}
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-foreground/50 uppercase tracking-widest">Hardware</label>

                                                <div
                                                    onClick={() => setUseHardwareAcceleration(!useHardwareAcceleration)}
                                                    className={cn(
                                                        "group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden",
                                                        useHardwareAcceleration
                                                            ? "bg-indigo-500/10 border-indigo-500/30"
                                                            : "bg-foreground/5 border-foreground/5 hover:bg-foreground/10"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                            useHardwareAcceleration ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-foreground/10 text-foreground/40"
                                                        )}>
                                                            <Zap size={18} className={useHardwareAcceleration ? "fill-white" : ""} />
                                                        </div>
                                                        <div>
                                                            <div className={cn("text-xs font-black uppercase tracking-wide", useHardwareAcceleration ? "text-foreground" : "text-foreground/60")}>
                                                                GPU Acceleration
                                                            </div>
                                                            <div className="text-[10px] font-medium text-foreground/40 mt-0.5">High Performance</div>
                                                        </div>
                                                    </div>
                                                    {useHardwareAcceleration && (
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent skew-x-12 opacity-50" />
                                                    )}
                                                </div>

                                                <label className="text-[10px] font-black text-foreground/50 uppercase tracking-widest mt-6 block">Audio</label>
                                                <div
                                                    onClick={() => setKeepAudio(!keepAudio)}
                                                    className={cn(
                                                        "group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                                                        keepAudio
                                                            ? "bg-foreground/10 border-foreground/20"
                                                            : "bg-foreground/5 border-foreground/5 hover:bg-foreground/10"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                                            keepAudio ? "bg-foreground text-background" : "bg-foreground/10 text-foreground/40"
                                                        )}>
                                                            {keepAudio ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                                        </div>
                                                        <div>
                                                            <div className={cn("text-xs font-black uppercase tracking-wide", keepAudio ? "text-foreground" : "text-foreground/60")}>
                                                                Audio Track
                                                            </div>
                                                            <div className="text-[10px] font-medium text-foreground/40 mt-0.5">{keepAudio ? "Preserve Original" : "Remove Audio"}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCompress}
                                            disabled={isProcessing}
                                            className={cn(
                                                "w-full py-5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest relative overflow-hidden group",
                                                isProcessing
                                                    ? "bg-foreground/5 text-foreground/40 cursor-not-allowed border border-foreground/5"
                                                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 active:scale-[0.99] border border-indigo-500/50"
                                            )}
                                        >
                                            {!isProcessing && (
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                            )}
                                            {isProcessing ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={20} />
                                                    Processing Media...
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
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default VideoCompressor;
