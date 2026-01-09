import React, { useState, useEffect, useRef } from 'react';
import { 
    Scissors, 
    Plus, 
    Trash2, 
    Play, 
    Pause, 
    Download, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    Video as VideoIcon,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@utils/cn';
import type { TrimRange, VideoTrimmerOptions, VideoTrimmerProgress } from '../../../types/video-trimmer';

export const VideoTrimmer: React.FC = () => {
    const [videoPath, setVideoPath] = useState<string | null>(null);
    const [videoInfo, setVideoInfo] = useState<any>(null);
    const [ranges, setRanges] = useState<TrimRange[]>([]);
    const [mode, setMode] = useState<'trim' | 'split' | 'cut'>('trim');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<VideoTrimmerProgress | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const timelineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cleanup = (window as any).videoTrimmerAPI?.onProgress((p: VideoTrimmerProgress) => {
            setProgress(p);
            if (p.state === 'complete' || p.state === 'error') {
                setIsProcessing(false);
            }
        });
        return () => cleanup?.();
    }, []);

    const handleSelectVideo = async () => {
        const path = await (window as any).audioManagerAPI?.chooseInputFile();
        if (path) {
            const info = await (window as any).videoMergerAPI?.getVideoInfo(path);
            setVideoPath(path);
            setVideoInfo(info);
            // Default range: full video
            setRanges([{ id: Math.random().toString(36).substr(2, 9), start: 0, end: info.duration }]);
        }
    };

    const addRange = () => {
        if (!videoInfo) return;
        const lastEnd = ranges.length > 0 ? ranges[ranges.length - 1].end : 0;
        if (lastEnd >= videoInfo.duration) return;
        
        setRanges(prev => [...prev, { 
            id: Math.random().toString(36).substr(2, 9), 
            start: lastEnd, 
            end: Math.min(lastEnd + 30, videoInfo.duration) 
        }]);
    };

    const removeRange = (id: string) => {
        setRanges(prev => prev.filter(r => r.id !== id));
    };

    const updateRange = (id: string, start: number, end: number) => {
        setRanges(prev => prev.map(r => r.id === id ? { ...r, start, end } : r));
    };

    const handleProcess = async () => {
        if (!videoPath || ranges.length === 0) return;
        setIsProcessing(true);
        const options: VideoTrimmerOptions = {
            inputPath: videoPath,
            ranges,
            mode,
            outputFormat: 'mp4'
        };
        try {
            await (window as any).videoTrimmerAPI?.process(options);
        } catch (e) {
            console.error('Process failed:', e);
            setIsProcessing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const totalDuration = videoInfo?.duration || 0;

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-hidden font-sans">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-border-glass bg-glass-background/20 backdrop-blur-md z-20">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-600/10 rounded-full border border-indigo-500/20">
                        <Scissors size={14} className="text-indigo-500" />
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Trimmer & Splitter</span>
                    </div>
                    <div className="flex bg-foreground/[0.05] p-1 rounded-xl border border-border-glass">
                        {(['trim', 'split', 'cut'] as const).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={cn(
                                    "px-4 py-1 rounded-lg text-[10px] font-black uppercase transition-all",
                                    mode === m ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20" : "text-foreground-secondary hover:text-foreground"
                                )}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleProcess}
                        disabled={!videoPath || isProcessing}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all shadow-lg",
                            videoPath && !isProcessing 
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20" 
                                : "bg-white/5 text-gray-500 cursor-not-allowed"
                        )}
                    >
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        <span>{isProcessing ? 'Processing...' : `Export ${mode.toUpperCase()}`}</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Ranges */}
                <div className="w-80 border-r border-border-glass bg-foreground/[0.01] flex flex-col">
                    <div className="p-4 space-y-4">
                        <button 
                            onClick={handleSelectVideo}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-foreground/[0.05] hover:bg-foreground/[0.08] border border-dashed border-border-glass rounded-2xl text-xs font-bold transition-all"
                        >
                            <VideoIcon size={16} className="text-indigo-500" />
                            <span>{videoPath ? 'Change Video' : 'Select Source Video'}</span>
                        </button>

                        <button 
                            onClick={addRange}
                            disabled={!videoPath}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-2xl text-xs font-black transition-all disabled:opacity-30"
                        >
                            <Plus size={16} />
                            <span>Add New Range</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 custom-scrollbar pb-6 space-y-3">
                        <div className="text-[10px] font-black text-foreground-secondary uppercase tracking-widest mb-4">Segments ({ranges.length})</div>
                        {ranges.map((range, idx) => (
                            <div key={range.id} className="p-4 bg-foreground/[0.03] border border-border-glass rounded-2xl space-y-4 group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-indigo-400">Range #{idx + 1}</span>
                                    <button onClick={() => removeRange(range.id)} className="p-1 text-foreground-secondary hover:text-rose-500 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase text-foreground-secondary">Start</p>
                                        <input 
                                            type="number" step="0.1" value={range.start}
                                            onChange={(e) => updateRange(range.id, Number(e.target.value), range.end)}
                                            className="w-full bg-background border border-border-glass rounded-lg px-2 py-1 text-[10px] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase text-foreground-secondary">End</p>
                                        <input 
                                            type="number" step="0.1" value={range.end}
                                            onChange={(e) => updateRange(range.id, range.start, Number(e.target.value))}
                                            className="w-full bg-background border border-border-glass rounded-lg px-2 py-1 text-[10px] font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div className="text-[9px] font-bold text-foreground-secondary/70">
                                    Duration: <span className="text-foreground">{formatTime(range.end - range.start)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Workspace */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 bg-background-tertiary/20 flex flex-col items-center justify-center p-8 relative">
                        {/* Video Mock/Preview */}
                        <div className="aspect-video w-full max-w-3xl bg-black rounded-[2rem] border-8 border-white/5 shadow-2xl flex items-center justify-center relative overflow-hidden group">
                            {videoPath ? (
                                <VideoIcon size={80} className="text-foreground/5" />
                            ) : (
                                <div className="text-center space-y-4 opacity-20">
                                    <VideoIcon size={64} className="mx-auto" />
                                    <p className="text-sm font-black uppercase tracking-widest font-sans">Ready for Precision Trimming</p>
                                </div>
                            )}

                            {videoPath && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 transition-transform"
                                    >
                                        {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
                                    </button>
                                </div>
                            )}

                            {/* Timecode absolute */}
                            <div className="absolute bottom-10 left-10 px-6 py-2 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 font-mono text-xl font-black text-white">
                                {formatTime(currentTime)}
                            </div>
                        </div>
                    </div>

                    {/* Timeline Area */}
                    <div className="h-48 bg-foreground/[0.02] border-t border-border-glass flex flex-col relative">
                        <div className="h-8 border-b border-border-glass flex items-center px-6 bg-foreground/[0.03] justify-between">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground-secondary">
                                <Clock size={12} />
                                <span>Master Timeline</span>
                            </div>
                            <div className="text-[10px] font-mono font-bold text-indigo-400">Total: {formatTime(totalDuration)}</div>
                        </div>

                        <div 
                            ref={timelineRef}
                            className="flex-1 relative overflow-hidden px-6 pt-6"
                            onClick={(e) => {
                                if (!timelineRef.current) return;
                                const rect = timelineRef.current.getBoundingClientRect();
                                const x = e.clientX - rect.left - 24; // padding
                                const time = (x / (rect.width - 48)) * totalDuration;
                                setCurrentTime(Math.max(0, Math.min(time, totalDuration)));
                            }}
                        >
                            {/* Track Background */}
                            <div className="h-16 w-full bg-foreground/[0.05] rounded-2xl border border-border-glass absolute left-6 right-6 overflow-hidden">
                                {/* Visual Mock Frames */}
                                <div className="flex h-full gap-1 opacity-10 p-1">
                                    {Array.from({ length: 20 }).map((_, i) => <div key={i} className="flex-1 bg-white h-full rounded-md" />)}
                                </div>
                            </div>

                            {/* Range Indicators */}
                            <div className="absolute left-6 right-6 h-16 pointer-events-none">
                                {ranges.map((range) => (
                                    <motion.div 
                                        key={range.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        className="absolute h-full bg-indigo-500/30 border-x-2 border-indigo-500 z-10 flex items-center justify-center"
                                        style={{ 
                                            left: `${(range.start / totalDuration) * 100}%`,
                                            width: `${((range.end - range.start) / totalDuration) * 100}%`
                                        }}
                                    >
                                        <div className="text-[8px] font-black text-white uppercase drop-shadow-md">Active</div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Playhead */}
                            {totalDuration > 0 && (
                                <motion.div 
                                    className="absolute top-0 bottom-6 w-0.5 bg-rose-500 z-20 pointer-events-none after:content-[''] after:absolute after:-top-1 after:left-1/2 after:-translate-x-1/2 after:w-3 after:h-3 after:bg-rose-500 after:rounded-full"
                                    style={{ left: `${(currentTime / totalDuration) * 100}%`, margin: '0 24px' }}
                                    transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                                />
                            )}

                            {/* Time markers */}
                            <div className="absolute bottom-2 left-6 right-6 flex justify-between px-1 opacity-20">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="text-[8px] font-black">{formatTime(totalDuration * (i / 5))}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Overlay */}
            <AnimatePresence>
                {progress && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <div className="w-full max-sm bg-glass-background/90 backdrop-blur-xl rounded-[2.5rem] border border-border-glass p-10 shadow-2xl relative">
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 rounded-[2rem] bg-indigo-600/20 flex items-center justify-center mx-auto text-indigo-400">
                                    {progress.state === 'complete' ? <CheckCircle2 size={40} /> : progress.state === 'error' ? <AlertCircle size={40} /> : <Loader2 size={40} className="animate-spin" />}
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black tracking-tight">{progress.state === 'processing' ? 'Encoding Project' : progress.state === 'complete' ? 'Export Ready' : 'Analyzing'}</h3>
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-48 h-1.5 bg-foreground/[0.05] rounded-full overflow-hidden">
                                            <motion.div className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.6)]" animate={{ width: `${progress.percent}%` }} />
                                        </div>
                                        <span className="text-xs font-black text-indigo-400">{Math.round(progress.percent)}%</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 pt-6">
                                    {progress.state === 'complete' && progress.outputPath && (
                                        <button onClick={() => (window as any).videoMergerAPI?.openFile(progress.outputPath)} className="w-full bg-indigo-600 py-4 rounded-2xl text-xs font-black text-white hover:scale-[1.02] active:scale-[0.98] transition-all">OPEN RESULT</button>
                                    )}
                                    <button onClick={() => setProgress(null)} className="w-full bg-foreground/[0.05] py-4 rounded-2xl text-xs font-black hover:bg-foreground/[0.1] transition-all">DISMISS</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VideoTrimmer;
