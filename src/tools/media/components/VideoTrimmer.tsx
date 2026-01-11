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

// macOS-style Timeline Component
interface MacOSStyleTimelineProps {
    totalDuration: number;
    ranges: TrimRange[];
    currentTime: number;
    onRangeChange: (rangeId: string, start: number, end: number) => void;
    onTimeChange: (time: number) => void;
    onPlayingChange: (playing: boolean) => void;
    formatTime: (seconds: number) => string;
}

const MacOSStyleTimeline: React.FC<MacOSStyleTimelineProps> = ({
    totalDuration,
    ranges,
    currentTime,
    onRangeChange,
    onTimeChange,
    onPlayingChange,
    formatTime
}) => {
    const timelineRef = useRef<HTMLDivElement>(null!);
    const [isDragging, setIsDragging] = useState<{ type: 'start' | 'end' | null; rangeId: string | null }>({ type: null, rangeId: null });
    const [hoverHandle, setHoverHandle] = useState<{ type: 'start' | 'end' | null; rangeId: string | null }>({ type: null, rangeId: null });
    const [dragTooltip, setDragTooltip] = useState<{ show: boolean; time: number; x: number } | null>(null);

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.type || !isDragging.rangeId || !timelineRef.current) return;

        // Use requestAnimationFrame for smooth 60fps updates
        requestAnimationFrame(() => {
            if (!timelineRef.current) return;

            const rect = timelineRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left - 24;
            const percent = Math.max(0, Math.min(x / (rect.width - 48), 1));
            const time = percent * totalDuration;

            const range = ranges.find(r => r.id === isDragging.rangeId);
            if (!range) return;

            if (isDragging.type === 'start') {
                const newStart = Math.max(0, Math.min(time, range.end - 0.5));
                onRangeChange(range.id, newStart, range.end);
                setDragTooltip({ show: true, time: newStart, x: e.clientX });
            } else {
                const newEnd = Math.max(range.start + 0.5, Math.min(time, totalDuration));
                onRangeChange(range.id, range.start, newEnd);
                setDragTooltip({ show: true, time: newEnd, x: e.clientX });
            }
        });
    };

    const handleMouseUp = () => {
        setIsDragging({ type: null, rangeId: null });
        setDragTooltip(null);
    };

    useEffect(() => {
        if (isDragging.type) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, ranges, totalDuration]);

    const handleTimelineClick = (e: React.MouseEvent) => {
        if (!timelineRef.current || isDragging.type) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - 24;
        const percent = Math.max(0, Math.min(x / (rect.width - 48), 1));
        const time = percent * totalDuration;
        onTimeChange(time);
        onPlayingChange(false);
    };

    return (
        <div
            ref={timelineRef}
            className={cn(
                "flex-1 relative overflow-hidden px-6 pt-6 transition-all",
                isDragging.type ? "cursor-ew-resize select-none" : "cursor-pointer"
            )}
            onClick={handleTimelineClick}
            style={{
                userSelect: isDragging.type ? 'none' : 'auto',
                WebkitUserSelect: isDragging.type ? 'none' : 'auto'
            }}
        >
            {/* Full Timeline Background with Frames */}
            <motion.div
                className="h-20 w-full bg-zinc-900 rounded-xl border-2 border-zinc-800 absolute left-6 right-6 overflow-hidden shadow-2xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex h-full">
                    {Array.from({ length: 40 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-gradient-to-b from-zinc-800 to-zinc-900 border-r border-zinc-800/50 transition-colors hover:from-zinc-750 hover:to-zinc-850"
                        />
                    ))}
                </div>
            </motion.div>

            {/* Trimmed Regions (Darkened/Disabled) - macOS Style */}
            {ranges.length > 0 && (
                <>
                    {/* Left trimmed region */}
                    {ranges[0].start > 0 && (
                        <div
                            className="absolute h-20 bg-black/70 backdrop-blur-sm z-10 border-r-2 border-amber-400/30 rounded-l-xl"
                            style={{
                                left: '24px',
                                right: `${100 - (ranges[0].start / totalDuration) * 100}%`,
                                top: '24px'
                            }}
                        >
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.3)_10px,rgba(0,0,0,0.3)_20px)] rounded-l-xl" />
                        </div>
                    )}

                    {/* Right trimmed region */}
                    {ranges[0].end < totalDuration && (
                        <div
                            className="absolute h-20 bg-black/70 backdrop-blur-sm z-10 border-l-2 border-amber-400/30 rounded-r-xl"
                            style={{
                                left: `${(ranges[0].end / totalDuration) * 100}%`,
                                right: '24px',
                                top: '24px'
                            }}
                        >
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.3)_10px,rgba(0,0,0,0.3)_20px)] rounded-r-xl" />
                        </div>
                    )}
                </>
            )}

            {/* Active Selection Region - Bright */}
            {ranges.map((range) => (
                <div
                    key={range.id}
                    className="absolute h-20 z-20 border-y-[3px] border-amber-400 pointer-events-none"
                    style={{
                        left: `${(range.start / totalDuration) * 100}%`,
                        right: `${((totalDuration - range.end) / totalDuration) * 100}%`,
                        top: '24px',
                        marginLeft: '24px',
                        marginRight: '24px'
                    }}
                >
                    {/* Selection highlight */}
                    <div className="absolute inset-0 bg-amber-400/5 pointer-events-none" />

                    {/* Left Handle - Golden macOS Style */}
                    <motion.div
                        className={cn(
                            "absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-amber-400 to-amber-500 cursor-ew-resize z-30 pointer-events-auto shadow-lg",
                            (hoverHandle.type === 'start' && hoverHandle.rangeId === range.id) || (isDragging.type === 'start' && isDragging.rangeId === range.id)
                                ? "w-4 from-amber-300 to-amber-400 shadow-amber-400/50 shadow-2xl"
                                : ""
                        )}
                        style={{ marginLeft: '-6px' }}
                        whileHover={{ scale: 1.1, x: -2 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsDragging({ type: 'start', rangeId: range.id });
                        }}
                        onMouseEnter={() => setHoverHandle({ type: 'start', rangeId: range.id })}
                        onMouseLeave={() => setHoverHandle({ type: null, rangeId: null })}
                    >
                        {/* Handle grip lines */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col gap-1">
                                <div className="w-[2px] h-2 bg-zinc-900 rounded-full" />
                                <div className="w-[2px] h-2 bg-zinc-900 rounded-full" />
                                <div className="w-[2px] h-2 bg-zinc-900 rounded-full" />
                            </div>
                        </div>

                        {/* Triangle pointer */}
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-3 bg-amber-400" style={{ clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
                    </motion.div>

                    {/* Right Handle - Golden macOS Style */}
                    <motion.div
                        className={cn(
                            "absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-amber-400 to-amber-500 cursor-ew-resize z-30 pointer-events-auto shadow-lg",
                            (hoverHandle.type === 'end' && hoverHandle.rangeId === range.id) || (isDragging.type === 'end' && isDragging.rangeId === range.id)
                                ? "w-4 from-amber-300 to-amber-400 shadow-amber-400/50 shadow-2xl"
                                : ""
                        )}
                        style={{ marginRight: '-6px' }}
                        whileHover={{ scale: 1.1, x: 2 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            setIsDragging({ type: 'end', rangeId: range.id });
                        }}
                        onMouseEnter={() => setHoverHandle({ type: 'end', rangeId: range.id })}
                        onMouseLeave={() => setHoverHandle({ type: null, rangeId: null })}
                    >
                        {/* Handle grip lines */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col gap-1">
                                <div className="w-[2px] h-2 bg-zinc-900 rounded-full" />
                                <div className="w-[2px] h-2 bg-zinc-900 rounded-full" />
                                <div className="w-[2px] h-2 bg-zinc-900 rounded-full" />
                            </div>
                        </div>

                        {/* Triangle pointer */}
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-3 bg-amber-400" style={{ clipPath: 'polygon(100% 0, 0 50%, 100% 100%)' }} />
                    </motion.div>

                    {/* Duration Label */}
                    <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-amber-400/90 backdrop-blur-sm rounded-full text-[10px] font-black text-zinc-900 shadow-lg pointer-events-none"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                    >
                        {formatTime(range.end - range.start)}
                    </motion.div>
                </div>
            ))}

            {/* Playhead - Red like macOS */}
            {totalDuration > 0 && (
                <motion.div
                    className="absolute top-[20px] w-[2px] h-24 bg-red-500 z-40 pointer-events-none shadow-lg shadow-red-500/50"
                    style={{
                        left: `${(currentTime / totalDuration) * 100}%`,
                        marginLeft: '24px'
                    }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                >
                    {/* Playhead top cap */}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg" />
                </motion.div>
            )}

            {/* Drag Tooltip */}
            <AnimatePresence>
                {dragTooltip?.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="fixed z-50 px-3 py-1.5 bg-zinc-900 text-amber-400 text-xs font-mono font-bold rounded-lg shadow-2xl border border-amber-400/30"
                        style={{
                            left: dragTooltip.x,
                            top: '50%',
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        {formatTime(dragTooltip.time)}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Time markers */}
            <div className="absolute bottom-2 left-6 right-6 flex justify-between px-1">
                {Array.from({ length: 11 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-px h-2 bg-zinc-600" />
                        <div className="text-[8px] font-mono text-zinc-500">{formatTime((totalDuration * i) / 10)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const VideoTrimmer: React.FC = () => {
    const [videoPath, setVideoPath] = useState<string | null>(null);
    const [videoInfo, setVideoInfo] = useState<any>(null);
    const [ranges, setRanges] = useState<TrimRange[]>([]);
    const [mode, setMode] = useState<'trim' | 'split' | 'cut'>('trim');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<VideoTrimmerProgress | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoSrc, setVideoSrc] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const playbackRef = useRef<number | null>(null);

    // Calculate total duration
    const totalDuration = videoInfo?.duration || 0;

    useEffect(() => {
        const cleanup = (window as any).videoTrimmerAPI?.onProgress((p: VideoTrimmerProgress) => {
            setProgress(p);
            if (p.state === 'complete' || p.state === 'error') {
                setIsProcessing(false);
            }
        });
        return () => cleanup?.();
    }, []);

    // Handle video playback
    useEffect(() => {
        if (isPlaying && videoRef.current) {
            const animate = () => {
                if (videoRef.current) {
                    const newTime = videoRef.current.currentTime;
                    setCurrentTime(newTime);

                    // Stop at end of active range if in trim mode
                    if (ranges.length > 0 && newTime >= ranges[0].end) {
                        setIsPlaying(false);
                        videoRef.current.pause();
                        videoRef.current.currentTime = ranges[0].start;
                        setCurrentTime(ranges[0].start);
                        return;
                    }
                }
                playbackRef.current = requestAnimationFrame(animate);
            };
            playbackRef.current = requestAnimationFrame(animate);
            videoRef.current.play().catch(console.error);
        } else if (videoRef.current) {
            videoRef.current.pause();
            if (playbackRef.current) {
                cancelAnimationFrame(playbackRef.current);
            }
        }

        return () => {
            if (playbackRef.current) {
                cancelAnimationFrame(playbackRef.current);
            }
        };
    }, [isPlaying, ranges]);

    // Sync video currentTime with state
    useEffect(() => {
        if (videoRef.current && !isPlaying) {
            videoRef.current.currentTime = currentTime;
        }
    }, [currentTime, isPlaying]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

            if (e.code === 'Space') {
                e.preventDefault();
                setIsPlaying(prev => !prev);
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                const step = e.shiftKey ? 0.04 : (e.ctrlKey ? 1 : 0.2);
                setCurrentTime(prev => Math.max(0, prev - step));
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                const step = e.shiftKey ? 0.04 : (e.ctrlKey ? 1 : 0.2);
                setCurrentTime(prev => Math.min(totalDuration, prev + step));
            } else if (e.code === 'Home') {
                e.preventDefault();
                setCurrentTime(0);
            } else if (e.code === 'End') {
                e.preventDefault();
                setCurrentTime(totalDuration);
            } else if (e.code === 'KeyI') {
                e.preventDefault();
                // Set in point (start of range)
                if (ranges.length > 0) {
                    updateRange(ranges[0].id, currentTime, Math.max(currentTime + 0.1, ranges[0].end));
                }
            } else if (e.code === 'KeyO') {
                e.preventDefault();
                // Set out point (end of range)
                if (ranges.length > 0) {
                    updateRange(ranges[0].id, Math.min(ranges[0].start, currentTime - 0.1), currentTime);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentTime, ranges, totalDuration]);

    const handleSelectVideo = async () => {
        const path = await (window as any).audioManagerAPI?.chooseInputFile();
        if (path) {
            const info = await (window as any).videoMergerAPI?.getVideoInfo(path);
            setVideoPath(path);
            setVideoInfo(info);
            // Default range: full video
            setRanges([{ id: Math.random().toString(36).substr(2, 9), start: 0, end: info.duration }]);

            // Set video source for preview
            const normalizedPath = path.replace(/\\/g, '/');
            setVideoSrc(`local-media://${normalizedPath}`);
            setCurrentTime(0);
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
                        {/* Video Preview with Actual Playback */}
                        <div className="aspect-video w-full max-w-3xl bg-black rounded-[2rem] border-8 border-white/5 shadow-2xl flex items-center justify-center relative overflow-hidden group">
                            {videoSrc ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        src={videoSrc}
                                        className="w-full h-full object-contain bg-black"
                                        preload="auto"
                                        onLoadedMetadata={(e) => {
                                            if (ranges.length > 0) {
                                                e.currentTarget.currentTime = ranges[0].start;
                                                setCurrentTime(ranges[0].start);
                                            }
                                        }}
                                        onError={(e) => {
                                            console.error('Video Error:', e.currentTarget.error);
                                        }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setIsPlaying(!isPlaying)}
                                            className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 transition-transform active:scale-95"
                                        >
                                            {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center space-y-4 opacity-20">
                                    <VideoIcon size={64} className="mx-auto" />
                                    <p className="text-sm font-black uppercase tracking-widest font-sans">Ready for Precision Trimming</p>
                                </div>
                            )}

                            {/* Timecode Display */}
                            <div className="absolute bottom-10 left-10 px-6 py-2 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 font-mono text-xl font-black text-white shadow-2xl">
                                {formatTime(currentTime)}
                            </div>

                            {/* Video Info Overlay */}
                            {videoInfo && (
                                <div className="absolute top-6 right-6 px-4 py-2 bg-black/80 backdrop-blur-xl rounded-xl border border-white/20 text-xs font-bold text-white/80 space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div>{videoInfo.width} × {videoInfo.height}</div>
                                    <div>{videoInfo.fps?.toFixed(2)} FPS</div>
                                    <div>{videoInfo.codec?.toUpperCase()}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline Area */}
                    <div className="h-48 bg-foreground/[0.02] border-t border-border-glass flex flex-col relative">
                        <div className="h-10 border-b border-border-glass flex items-center px-6 bg-foreground/[0.03] justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground-secondary">
                                    <Clock size={12} />
                                    <span>Master Timeline</span>
                                </div>
                                {ranges.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                updateRange(ranges[0].id, currentTime, Math.max(currentTime + 0.1, ranges[0].end));
                                            }}
                                            disabled={!videoPath}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all border border-emerald-500/30 disabled:opacity-30"
                                            title="Set In Point (I)"
                                        >
                                            <span>[</span>
                                            <span>In</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                updateRange(ranges[0].id, Math.min(ranges[0].start, currentTime - 0.1), currentTime);
                                            }}
                                            disabled={!videoPath}
                                            className="flex items-center gap-1.5 px-3 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all border border-rose-500/30 disabled:opacity-30"
                                            title="Set Out Point (O)"
                                        >
                                            <span>Out</span>
                                            <span>]</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="text-[10px] font-mono font-bold text-indigo-400">Total: {formatTime(totalDuration)}</div>
                        </div>

                        <MacOSStyleTimeline
                            totalDuration={totalDuration}
                            ranges={ranges}
                            currentTime={currentTime}
                            onRangeChange={(rangeId, start, end) => updateRange(rangeId, start, end)}
                            onTimeChange={setCurrentTime}
                            onPlayingChange={setIsPlaying}
                            formatTime={formatTime}
                        />
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
