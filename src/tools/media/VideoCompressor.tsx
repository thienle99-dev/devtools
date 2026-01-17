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
import { formatDuration, formatBytes } from '@utils/format';
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

    // Settings
    const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'webm' | 'mkv' | 'avi' | 'mov'>('mp4');
    const [targetResolution, setTargetResolution] = useState<{ width: number; height: number } | null>(null);
    const [scaleMode, setScaleMode] = useState<'fit' | 'fill' | 'stretch'>('fit');
    const [crf, setCrf] = useState(23);
    const [preset, setPreset] = useState('medium');
    const [keepAudio, setKeepAudio] = useState(true);

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
            const paths = await (window as any).videoCompressorAPI?.chooseInputFile();
            if (paths && paths.length > 0) {
                const filePath = paths[0];
                setIsAnalyzing(true);
                setError(null);
                setOutputPath(null);
                setProgress(null);

                const info = await (window as any).videoCompressorAPI?.getInfo(filePath);
                setFile(info);
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
            crf,
            preset,
            keepAudio
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
    };

    return (
        <div className="flex flex-col h-full glass-panel text-foreground overflow-hidden rounded-xl border border-border-glass font-sans relative">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-6 bg-foreground/[0.02] border-b border-border-glass z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Video size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black tracking-tight uppercase">Video Compressor</h2>
                        <p className="text-[10px] text-foreground-secondary font-bold uppercase tracking-widest opacity-60">Resize, scale & optimize</p>
                    </div>
                </div>

                {file && (
                    <button
                        onClick={reset}
                        disabled={isProcessing}
                        className="p-2 hover:bg-foreground/[0.05] rounded-lg transition-colors text-foreground-secondary"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
                {!file ? (
                    <div className="h-full flex flex-col items-center justify-center">
                        <button
                            onClick={handleFileSelect}
                            disabled={isAnalyzing}
                            className="group relative flex flex-col items-center gap-4 p-12 rounded-3xl border-2 border-dashed border-border-glass hover:border-indigo-500/50 hover:bg-indigo-500/[0.02] transition-all cursor-pointer overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="w-20 h-20 rounded-2xl bg-foreground/[0.03] border border-border-glass flex items-center justify-center text-foreground-secondary group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-500">
                                {isAnalyzing ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
                            </div>

                            <div className="text-center relative">
                                <h3 className="text-lg font-black mb-1">Select Video File</h3>
                                <p className="text-xs text-foreground-secondary font-medium">MP4, WebM, MKV, AVI, MOV supported</p>
                            </div>

                            <div className="mt-4 px-6 py-2 bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                                BROWSE FILES
                            </div>
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                        {/* Left: Metadata & Preview */}
                        <div className="space-y-6">
                            <div className="glass-panel p-6 rounded-2xl border border-border-glass relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Scaling size={80} />
                                </div>

                                <h4 className="text-xs font-black text-foreground-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Zap size={14} className="text-indigo-400" />
                                    Source Information
                                </h4>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-2 border-b border-border-glass/50">
                                        <span className="text-xs font-bold text-foreground-secondary">Filenmame</span>
                                        <span className="text-xs font-black truncate max-w-[200px]">{file.path.split(/[\\/]/).pop()}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-border-glass/50">
                                        <span className="text-xs font-bold text-foreground-secondary">Resolution</span>
                                        <span className="text-xs font-black">{file.width} x {file.height}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-border-glass/50">
                                        <span className="text-xs font-bold text-foreground-secondary">Duration</span>
                                        <span className="text-xs font-black">{formatDuration(file.duration)}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-border-glass/50">
                                        <span className="text-xs font-bold text-foreground-secondary">Size</span>
                                        <span className="text-xs font-black">{formatBytes(file.size)}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-xs font-bold text-foreground-secondary">Codec / Bitrate</span>
                                        <span className="text-xs font-black uppercase">{file.codec} @ {file.bitrate ? `${file.bitrate} kb/s` : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Processing Progress */}
                            {isProcessing && (
                                <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="animate-spin text-indigo-400" size={18} />
                                            <span className="text-xs font-black uppercase tracking-widest text-indigo-400">Processing...</span>
                                        </div>
                                        <span className="text-lg font-black text-indigo-400">{Math.round(progress?.percent || 0)}%</span>
                                    </div>

                                    <div className="h-2 w-full bg-foreground/[0.05] rounded-full overflow-hidden mb-4">
                                        <div
                                            className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                            style={{ width: `${progress?.percent || 0}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between text-[10px] font-bold text-foreground-secondary uppercase tracking-widest">
                                        <span>Speed: {progress?.speed ? `${progress.speed.toFixed(2)}x` : '--'}</span>
                                        <button
                                            onClick={handleCancel}
                                            className="text-rose-400 hover:text-rose-300 transition-colors"
                                        >
                                            Cancel Process
                                        </button>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="glass-panel p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 flex items-start gap-3">
                                    <AlertCircle className="text-rose-400 shrink-0" size={18} />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1">Error Occurred</p>
                                        <p className="text-xs font-medium text-foreground-secondary">{error}</p>
                                    </div>
                                </div>
                            )}

                            {outputPath && (
                                <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="text-emerald-400" size={24} />
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Compression Complete!</h4>
                                            <p className="text-[10px] font-bold text-foreground-secondary uppercase truncate max-w-[250px]">{outputPath.split(/[\\/]/).pop()}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => (window as any).videoCompressorAPI?.openFile(outputPath)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white text-[10px] font-black rounded-xl hover:bg-emerald-400 transition-colors uppercase"
                                        >
                                            <Play size={14} /> Play Video
                                        </button>
                                        <button
                                            onClick={() => (window as any).videoCompressorAPI?.showInFolder(outputPath)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-foreground/[0.05] text-foreground text-[10px] font-black rounded-xl hover:bg-foreground/[0.1] transition-colors uppercase"
                                        >
                                            <Folder size={14} /> Open Folder
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right: Settings */}
                        <div className="space-y-6">
                            <div className="glass-panel p-6 rounded-2xl border border-border-glass">
                                <h4 className="text-xs font-black text-foreground-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Settings2 size={14} className="text-indigo-400" />
                                    Compression Settings
                                </h4>

                                <div className="space-y-6">
                                    {/* Format Selection */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-foreground-secondary uppercase tracking-widest">Output Format</label>
                                        <div className="grid grid-cols-5 gap-2">
                                            {FORMATS.map(fmt => (
                                                <button
                                                    key={fmt}
                                                    onClick={() => setSelectedFormat(fmt as any)}
                                                    className={cn(
                                                        "py-2 rounded-xl text-[10px] font-black transition-all border uppercase",
                                                        selectedFormat === fmt
                                                            ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                                            : "bg-foreground/[0.03] border-border-glass text-foreground-secondary hover:border-indigo-500/30"
                                                    )}
                                                >
                                                    {fmt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Resolution Selection */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-foreground-secondary uppercase tracking-widest">Target Resolution</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                onClick={() => setTargetResolution(null)}
                                                className={cn(
                                                    "py-3 rounded-xl text-[10px] font-black transition-all border flex flex-col items-center gap-1 uppercase",
                                                    targetResolution === null
                                                        ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                                        : "bg-foreground/[0.03] border-border-glass text-foreground-secondary hover:border-indigo-500/30"
                                                )}
                                            >
                                                <span>Original</span>
                                                <span className="opacity-60 font-bold">{file.width}x{file.height}</span>
                                            </button>
                                            {RESOLUTIONS.map(res => (
                                                <button
                                                    key={res.label}
                                                    onClick={() => setTargetResolution({ width: res.width, height: res.height })}
                                                    className={cn(
                                                        "py-3 rounded-xl text-[10px] font-black transition-all border flex flex-col items-center gap-1 uppercase",
                                                        targetResolution?.width === res.width
                                                            ? "bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                                            : "bg-foreground/[0.03] border-border-glass text-foreground-secondary hover:border-indigo-500/30"
                                                    )}
                                                >
                                                    <span>{res.label}</span>
                                                    <span className="opacity-60 font-bold">{res.width}x{res.height}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Scale Mode */}
                                    {targetResolution && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-foreground-secondary uppercase tracking-widest">Scaling Strategy</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {(['fit', 'fill', 'stretch'] as const).map(mode => (
                                                    <button
                                                        key={mode}
                                                        onClick={() => setScaleMode(mode)}
                                                        className={cn(
                                                            "py-2 rounded-xl text-[10px] font-black transition-all border flex items-center justify-center gap-2 uppercase",
                                                            scaleMode === mode
                                                                ? "bg-indigo-500/10 border-indigo-500/50 text-indigo-400"
                                                                : "bg-foreground/[0.03] border-border-glass text-foreground-secondary hover:border-indigo-500/30"
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

                                    {/* Quality / CRF Slider */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black text-foreground-secondary uppercase tracking-widest">Compression Quality (CRF)</label>
                                            <span className="text-xs font-black text-indigo-400">{crf}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="51"
                                            step="1"
                                            value={crf}
                                            onChange={(e) => setCrf(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-foreground/[0.05] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                        <div className="flex justify-between text-[8px] font-black text-foreground-secondary uppercase tracking-tighter opacity-50">
                                            <span>LOSSLESS (0)</span>
                                            <span>MEDIUM (23-28)</span>
                                            <span>LOWEST (51)</span>
                                        </div>
                                    </div>

                                    {/* Preset selection */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-foreground-secondary uppercase tracking-widest">Encoding Preset</label>
                                        <select
                                            value={preset}
                                            onChange={(e) => setPreset(e.target.value)}
                                            className="w-full bg-foreground/[0.03] border border-border-glass rounded-xl px-4 py-2.5 text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/50 uppercase"
                                        >
                                            {PRESETS.map(p => (
                                                <option key={p} value={p} className="bg-background">{p}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Keep Audio Toggle */}
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-foreground/[0.02] border border-border-glass">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                keepAudio ? "bg-indigo-500/10 text-indigo-400" : "bg-foreground/[0.05] text-foreground-secondary"
                                            )}>
                                                {keepAudio ? <Volume2 size={16} /> : <VolumeX size={16} />}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">Include Audio Track</span>
                                        </div>
                                        <button
                                            onClick={() => setKeepAudio(!keepAudio)}
                                            className={cn(
                                                "w-10 h-5 rounded-full transition-all relative p-1",
                                                keepAudio ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]" : "bg-foreground/[0.1]"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-3 h-3 bg-white rounded-full transition-all shadow-sm",
                                                keepAudio ? "translate-x-5" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        onClick={handleCompress}
                                        disabled={isProcessing}
                                        className={cn(
                                            "w-full py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 uppercase tracking-widest",
                                            isProcessing
                                                ? "bg-foreground/[0.05] text-foreground-secondary cursor-not-allowed"
                                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 active:scale-95"
                                        )}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Download size={18} />
                                                Start Compression
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoCompressor;
