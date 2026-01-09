import React, { useState, useEffect, useRef } from 'react';
import { 
    Plus, 
    Trash2, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    Play,
    MonitorPlay,
    Clock,
    Scissors,
    Download,
    ZoomIn,
    ZoomOut,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@utils/cn';
import { CapCutTimeline } from './components/CapCutTimeline';
import type { VideoMergeOptions, VideoMergeProgress, VideoInfo } from '../../types/video-merger';

const FORMATS = ['mp4', 'mkv', 'avi', 'mov', 'webm'];

interface ExtendedVideoInfo extends VideoInfo {
    startTime: number;
    endTime: number;
    timelineStart: number;
    trackIndex: number;
    thumbnail?: string;
    filmstrip?: string[];
}

export const VideoMerger: React.FC = () => {
    const [files, setFiles] = useState<ExtendedVideoInfo[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<VideoMergeProgress | null>(null);
    const [outputPath, setOutputPath] = useState<string | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'mkv' | 'avi' | 'mov' | 'webm'>('mp4');
    const [previewIndex, setPreviewIndex] = useState<number>(0);
    const [zoomLevel, setZoomLevel] = useState(2.5); // Increased default zoom for better visibility
    const [currentTime, setCurrentTime] = useState(0);
    const [trimmingIdx, setTrimmingIdx] = useState<number | null>(null);
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const [assetLoadingProgress, setAssetLoadingProgress] = useState(0);
    const [isRazorMode, setIsRazorMode] = useState(false);
    const [mouseTimelineTime, setMouseTimelineTime] = useState<number | null>(null);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const [selectedClips, setSelectedClips] = useState<number[]>([]);
    const [magneticSnap, setMagneticSnap] = useState(true);
    const [history, setHistory] = useState<ExtendedVideoInfo[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const snapInterval = 1; // Snap to 1 second intervals
    const magneticSnapThreshold = 0.5; // 0.5 seconds snap threshold

    const timelineRef = useRef<HTMLDivElement>(null);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);

    // Calculate total duration from files
    const totalDuration = files.length > 0
        ? Math.max(...files.map(f => f.timelineStart + (f.endTime - f.startTime)))
        : 0;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts if user is typing in an input
            if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

            if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                splitAtPlayhead();
            } else if (e.code === 'Delete' || e.code === 'Backspace') {
                e.preventDefault();
                if (previewIndex !== -1 && files[previewIndex]) {
                    handleRemoveFile(files[previewIndex].path);
                }
            } else if (e.code === 'Space') {
                e.preventDefault();
                setIsPlaying(prev => !prev);
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                const step = e.shiftKey ? 0.04 : (e.ctrlKey ? 1 : 0.2); // Frame / Second / 5 frames
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
            } else if (e.code === 'KeyR' && !e.ctrlKey) {
                e.preventDefault();
                setIsRazorMode(prev => !prev);
            } else if (e.code === 'KeyG' && !e.ctrlKey) {
                e.preventDefault();
                setSnapToGrid(prev => !prev);
            } else if (e.code === 'Slash' && e.shiftKey) { // "?" key
                e.preventDefault();
                setShowShortcuts(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentTime, previewIndex, files, totalDuration]);

    useEffect(() => {
        const cleanup = (window as any).videoMergerAPI?.onProgress((p: VideoMergeProgress) => {
            setProgress(p);
            if (p.state === 'complete') {
                setIsProcessing(false);
                setOutputPath(p.outputPath || null);
            } else if (p.state === 'error') {
                setIsProcessing(false);
            }
        });

        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    const handleAddFiles = async () => {
        try {
            const paths = await (window as any).videoMergerAPI?.chooseInputFiles();
            if (paths && paths.length > 0) {
                setIsLoadingAssets(true);
                setAssetLoadingProgress(0);
                const newInfos: ExtendedVideoInfo[] = [];
                
                for (let i = 0; i < paths.length; i++) {
                    const p = paths[i];
                    console.log(`Processing file ${i + 1}/${paths.length}:`, p);
                    
                    const info = await (window as any).videoMergerAPI?.getVideoInfo(p);
                    console.log('Video info:', info);
                    
                    const thumb = await (window as any).videoMergerAPI?.generateThumbnail(p, 1);
                    console.log('Thumbnail generated:', thumb ? `${thumb.substring(0, 50)}...` : 'FAILED');
                    
                    const filmstrip = await (window as any).videoMergerAPI?.generateFilmstrip(p, info.duration, 15);
                    console.log('Filmstrip generated:', filmstrip ? `${filmstrip.length} frames` : 'FAILED');
                    
                    newInfos.push({
                        ...info,
                        startTime: 0,
                        endTime: info.duration,
                        timelineStart: newInfos.length > 0 ? newInfos[newInfos.length-1].timelineStart + (newInfos[newInfos.length-1].endTime - newInfos[newInfos.length-1].startTime) : 0,
                        trackIndex: 0,
                        thumbnail: thumb,
                        filmstrip: filmstrip
                    });
                    
                    setAssetLoadingProgress(Math.round(((i + 1) / paths.length) * 100));
                }
                
                console.log('All files processed:', newInfos);
                setFiles(prev => [...prev, ...newInfos]);
                setIsLoadingAssets(false);
            }
        } catch (error) {
            console.error('Failed to add files:', error);
            setIsLoadingAssets(false);
        }
    };

    const handleRemoveFile = (path: string) => {
        setFiles(prev => prev.filter(f => f.path !== path));
    };

    const handleMerge = async () => {
        if (files.length < 2) return;
        setIsProcessing(true);
        setOutputPath(null);
        setProgress({ id: 'merging', percent: 0, state: 'analyzing' });

        try {
            const options: VideoMergeOptions = {
                clips: files.map(f => ({
                    path: f.path,
                    startTime: f.startTime,
                    endTime: f.endTime
                })),
                format: selectedFormat
            };
            await (window as any).videoMergerAPI?.merge(options);
        } catch (error) {
            console.error('Merge failed:', error);
            setIsProcessing(false);
            setProgress(prev => prev ? { ...prev, state: 'error', error: 'Failed to merge videos' } : null);
        }
    };

    const [isPlaying, setIsPlaying] = useState(false);
    const playbackRef = useRef<number | null>(null);
    const [activeClipSrc, setActiveClipSrc] = useState<string | null>(null);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const clipsWithOffsets = files.reduce((acc, file) => {
        const start = acc.length > 0 ? acc[acc.length - 1].end : 0;
        const clipDuration = file.endTime - file.startTime;
        acc.push({ ...file, start, end: start + clipDuration });
        return acc;
    }, [] as (ExtendedVideoInfo & { start: number; end: number })[]);

    const pxPerSecond = 40 * zoomLevel;

    useEffect(() => {
        if (isPlaying) {
            const startTimestamp = performance.now();
            const startTimelineTime = currentTime;

            const animate = () => {
                const now = performance.now();
                const elapsed = (now - startTimestamp) / 1000;
                const nextTime = startTimelineTime + elapsed;

                if (nextTime >= totalDuration) {
                    setCurrentTime(totalDuration);
                    setIsPlaying(false);
                    return;
                }

                setCurrentTime(nextTime);
                playbackRef.current = requestAnimationFrame(animate);
            };
            playbackRef.current = requestAnimationFrame(animate);
        } else if (playbackRef.current) {
            cancelAnimationFrame(playbackRef.current);
        }
        return () => {
            if (playbackRef.current) cancelAnimationFrame(playbackRef.current);
        };
    }, [isPlaying, totalDuration]);

    useEffect(() => {
        const activeClip = files.find(f => currentTime >= f.timelineStart && currentTime < (f.timelineStart + (f.endTime - f.startTime)));
        if (activeClip) {
            // Normalize path to ensure it works cross-platform and with the protocol handler
            const normalizedPath = activeClip.path.replace(/\\/g, '/');
            // Use 3 slashes to denote absolute path with empty authority (prevents C: being treated as host)
            const localSrc = `local-media:///${normalizedPath}`;
            
            if (activeClipSrc !== localSrc) {
                setActiveClipSrc(localSrc);
            }
            if (videoPreviewRef.current) {
                const clipLocalTime = (currentTime - activeClip.timelineStart) + activeClip.startTime;
                if (Math.abs(videoPreviewRef.current.currentTime - clipLocalTime) > 0.15) {
                    videoPreviewRef.current.currentTime = clipLocalTime;
                }
            }
        } else {
            setActiveClipSrc(null);
        }
    }, [currentTime, files, activeClipSrc]);

    useEffect(() => {
        if (videoPreviewRef.current) {
            if (isPlaying) {
                videoPreviewRef.current.play().catch(e => console.warn('Video play failed:', e));
            } else {
                videoPreviewRef.current.pause();
            }
        }
    }, [isPlaying, activeClipSrc]);


    const handleTimelineClick = (e: React.MouseEvent) => {
        if (!timelineRef.current || trimmingIdx !== null) return;

        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
        const clickedTime = (x - 40) / pxPerSecond;
        
        setCurrentTime(Math.max(0, Math.min(clickedTime, totalDuration + 10)));
    };

    const handleTimelineMouseMove = (e: React.MouseEvent) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
        const time = (x - 40) / pxPerSecond;
        setMouseTimelineTime(Math.max(0, time));
    };

    const updateClipPosition = (idx: number, timelineStart: number, trackIndex: number) => {
        setFiles(prev => {
            const next = [...prev];
            let newTimelineStart = Math.max(0, timelineStart);
            
            // Snap to grid if enabled
            if (snapToGrid) {
                newTimelineStart = Math.round(newTimelineStart / snapInterval) * snapInterval;
            }
            
            next[idx] = {
                ...next[idx],
                timelineStart: newTimelineStart,
                trackIndex: Math.max(0, Math.min(5, trackIndex)) // Max 6 tracks
            };
            return next;
        });
    };

    const updateTrim = (idx: number, start: number, end: number) => {
        setFiles(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], startTime: Math.max(0, start), endTime: Math.min(next[idx].duration, end) };
            return next;
        });
    };

    const splitClip = (idx: number) => {
        const file = files[idx];
        const localTimeInClip = currentTime - file.timelineStart + file.startTime;

        if (localTimeInClip <= file.startTime || localTimeInClip >= file.endTime) return;

        setFiles(prev => {
            const next = [...prev];
            const clip1 = { ...file, endTime: localTimeInClip };
            const clip2 = { ...file, startTime: localTimeInClip, timelineStart: currentTime };
            next.splice(idx, 1, clip1, clip2);
            return next;
        });
    };

    const splitAtPlayhead = () => {
        const foundIdx = files.findIndex(f => currentTime >= f.timelineStart && currentTime < (f.timelineStart + (f.endTime - f.startTime)));
        if (foundIdx !== -1) {
            splitClip(foundIdx);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-hidden rounded-xl border border-border-glass font-sans relative">
            {/* Top Toolbar */}
            <div className="h-10 flex items-center justify-between px-4 bg-foreground/[0.02] border-b border-border-glass z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground-secondary">
                        <Clock size={14} className="text-indigo-500" />
                        <span>Timeline Duration: <span className="text-foreground">{formatDuration(totalDuration)}</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <select
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value as any)}
                        disabled={isProcessing}
                        className="bg-foreground/[0.05] border border-border-glass rounded-lg px-3 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        {FORMATS.map(f => (
                            <option key={f} value={f} className="bg-background">{f.toUpperCase()}</option>
                        ))}
                    </select>
                    <button
                        onClick={handleMerge}
                        disabled={isProcessing || files.length < 2}
                        className={cn(
                            "flex items-center gap-2 px-5 py-1.5 rounded-lg text-xs font-black transition-all shadow-lg",
                            files.length >= 2 && !isProcessing
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
                                : "bg-white/5 text-gray-600 cursor-not-allowed"
                        )}
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                        <span>{isProcessing ? 'Merging...' : 'Export Project'}</span>
                    </button>
                </div>
            </div>

            {/* Workspace Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Center Panel: Preview */}
                <div className="flex-1 bg-background-tertiary/20 flex flex-col items-center justify-center relative p-4 group">
                    <div className="aspect-video w-full max-w-2xl bg-black rounded-xl overflow-hidden shadow-2xl border border-border-glass flex flex-col relative group">
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                            {activeClipSrc ? (
                                <video 
                                    key={activeClipSrc}
                                    ref={videoPreviewRef}
                                    src={activeClipSrc}
                                    className="w-full h-full object-contain bg-black"
                                    preload="auto"
                                    onLoadedMetadata={(e) => {
                                        const video = e.currentTarget;
                                        // Immediately sync time when metadata is loaded
                                        const activeClip = files.find(f => currentTime >= f.timelineStart && currentTime < (f.timelineStart + (f.endTime - f.startTime)));
                                        if (activeClip) {
                                            const clipLocalTime = (currentTime - activeClip.timelineStart) + activeClip.startTime;
                                            video.currentTime = clipLocalTime;
                                        }
                                        if (isPlaying) {
                                            video.play().catch(console.error);
                                        }
                                    }}
                                    onError={(e) => {
                                        console.error('Merger Video Error:', e.currentTarget.error);
                                    }}
                                />
                            ) : (
                                files.length > 0 && currentTime < totalDuration ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                                        <span className="text-[10px] font-black uppercase text-indigo-500/50">Loading Frame...</span>
                                    </div>
                                ) : (
                                    <MonitorPlay size={48} className="text-white/10" />
                                )
                            )}
                        </div>
                        
                        <div className="mt-auto p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 transition-all z-10">
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform active:scale-95"
                                >
                                    {isPlaying ? <span className="w-3 h-3 bg-black rounded-sm" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                                </button>
                                <div className="text-sm font-mono font-bold text-white drop-shadow-md">{formatDuration(currentTime)} / {formatDuration(totalDuration)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CapCut-Style Timeline */}
            <CapCutTimeline
                files={files}
                currentTime={currentTime}
                totalDuration={totalDuration}
                isPlaying={isPlaying}
                isRazorMode={isRazorMode}
                snapToGrid={snapToGrid}
                zoomLevel={zoomLevel}
                previewIndex={previewIndex}
                mouseTimelineTime={mouseTimelineTime}
                timelineRef={timelineRef}
                onAddFiles={handleAddFiles}
                onShowShortcuts={() => setShowShortcuts(true)}
                onToggleSnap={() => setSnapToGrid(!snapToGrid)}
                onToggleRazor={() => setIsRazorMode(!isRazorMode)}
                onSplitAtPlayhead={splitAtPlayhead}
                onZoomIn={() => setZoomLevel(prev => Math.min(5, prev + 0.2))}
                onZoomOut={() => setZoomLevel(prev => Math.max(0.2, prev - 0.2))}
                onTimelineClick={handleTimelineClick}
                onTimelineMouseMove={handleTimelineMouseMove}
                onMouseLeave={() => setMouseTimelineTime(null)}
                onSetPreviewIndex={setPreviewIndex}
                onSplitClip={splitClip}
                onSetTrimmingIdx={setTrimmingIdx}
                onRemoveFile={handleRemoveFile}
                onUpdateTrim={updateTrim}
                onUpdateClipPosition={updateClipPosition}
                formatDuration={formatDuration}
            />

            {/* Trimming Modal */}
            <AnimatePresence>
                {trimmingIdx !== null && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
                    >
                        <div className="w-full max-w-2xl bg-glass-background rounded-3xl border border-border-glass p-8 shadow-2xl relative">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                                <Scissors className="text-indigo-500" /> Trim Clip: <span className="text-foreground-secondary">{files[trimmingIdx].path.split(/[\\/]/).pop()}</span>
                            </h3>

                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-bold text-foreground-secondary">
                                        <span>Start: {formatDuration(files[trimmingIdx].startTime)}</span>
                                        <span className="text-indigo-400">Selected: {formatDuration(files[trimmingIdx].endTime - files[trimmingIdx].startTime)}</span>
                                        <span>End: {formatDuration(files[trimmingIdx].endTime)}</span>
                                    </div>
                                    
                                    <div className="relative h-12 bg-white/5 rounded-xl border border-white/10 overflow-hidden flex items-center px-4">
                                        <input 
                                            type="range" min={0} max={files[trimmingIdx].duration} step={0.1}
                                            value={files[trimmingIdx].startTime}
                                            onChange={(e) => updateTrim(trimmingIdx, Number(e.target.value), Math.max(Number(e.target.value) + 0.1, files[trimmingIdx].endTime))}
                                            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                        />
                                        <input 
                                            type="range" min={0} max={files[trimmingIdx].duration} step={0.1}
                                            value={files[trimmingIdx].endTime}
                                            onChange={(e) => updateTrim(trimmingIdx, Math.min(Number(e.target.value) - 0.1, files[trimmingIdx].startTime), Number(e.target.value))}
                                            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                        />
                                        
                                        <div className="h-8 bg-indigo-500/20 border-x-2 border-indigo-500 absolute" 
                                            style={{ 
                                                left: `${(files[trimmingIdx].startTime / files[trimmingIdx].duration) * 100}%`,
                                                right: `${100 - (files[trimmingIdx].endTime / files[trimmingIdx].duration) * 100}%`
                                            }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-foreground-secondary text-center">Drag the sliders to select the portion of video you want to keep.</p>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setTrimmingIdx(null)}
                                        className="flex-1 bg-white text-black py-4 rounded-2xl text-xs font-black hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check size={18} /> APPLY CUT
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Export Progress Progress */}
            <AnimatePresence>
                {progress && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <div className="w-full max-w-sm bg-glass-background/90 backdrop-blur-xl rounded-3xl border border-border-glass p-8 shadow-2xl relative">
                            <div className="text-center space-y-6">
                                <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 flex items-center justify-center mx-auto text-indigo-400">
                                    {progress.state === 'complete' ? <CheckCircle2 size={32} /> : progress.state === 'error' ? <AlertCircle size={32} /> : <Loader2 size={32} className="animate-spin" />}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black tracking-tight">{progress.state === 'processing' ? 'Exporting Project' : progress.state === 'complete' ? 'Export Success' : 'Initializing'}</h3>
                                    <p className="text-[10px] font-bold text-foreground-secondary uppercase tracking-widest">{Math.round(progress.percent)}% Complete</p>
                                </div>
                                {(progress.state === 'processing' || progress.state === 'analyzing') && (
                                    <div className="w-full bg-foreground/[0.05] h-1.5 rounded-full overflow-hidden">
                                        <motion.div className="h-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]" animate={{ width: `${progress.percent}%` }} />
                                    </div>
                                )}
                                <div className="flex flex-col gap-2 pt-4">
                                    {progress.state === 'complete' && outputPath && (
                                        <button onClick={() => (window as any).videoMergerAPI?.openFile(outputPath)} className="w-full bg-foreground text-background py-4 rounded-xl text-xs font-black">PLAY RESULT</button>
                                    )}
                                    <button onClick={() => setProgress(null)} className="w-full bg-foreground/[0.05] py-4 rounded-xl text-xs font-black">DISMISS</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keyboard Shortcuts Guide */}
            <AnimatePresence>
                {showShortcuts && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
                        onClick={() => setShowShortcuts(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-glass-background/95 backdrop-blur-xl rounded-3xl border border-border-glass p-8 shadow-2xl max-w-2xl w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black">⌨️ Keyboard Shortcuts</h3>
                                <button 
                                    onClick={() => setShowShortcuts(false)}
                                    className="w-8 h-8 rounded-full bg-foreground/[0.05] hover:bg-foreground/[0.1] flex items-center justify-center transition-all"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">Play/Pause</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">Space</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">Split at Playhead</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">S</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">Toggle Razor Tool</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">R</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">Toggle Snap to Grid</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">G</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">Frame Forward (5 frames)</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">→</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">Frame Backward (5 frames)</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">←</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">1 Second Forward</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">Ctrl + →</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">1 Second Backward</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">Ctrl + ←</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">Single Frame Forward</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">Shift + →</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">Single Frame Backward</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">Shift + ←</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">Go to Start</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">Home</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">Go to End</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">End</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">Delete Selected Clip</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">Del</kbd>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                    <span className="text-sm text-foreground-secondary">Show Shortcuts</span>
                                    <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">?</kbd>
                                </div>
                            </div>
                            
                            <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                                <p className="text-xs text-indigo-300 font-bold">
                                    💡 <span className="font-black">Pro Tip:</span> Use Shift for frame-by-frame precision, Ctrl for second-by-second jumps, and regular arrow keys for quick navigation!
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer Progress Bar */}
            <AnimatePresence>
                {(isProcessing || isLoadingAssets) && (
                    <motion.div 
                        initial={{ y: 100 }} 
                        animate={{ y: 0 }} 
                        exit={{ y: 100 }}
                        className="absolute bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-t border-border-glass p-2 px-6 flex items-center justify-between gap-6 overflow-hidden"
                    >
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-6 h-6 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                                <Loader2 size={12} className="animate-spin" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-foreground-secondary">
                                {isLoadingAssets ? `Loading Assets... (${Math.round(assetLoadingProgress)}%)` : 'Exporting Project...'}
                            </span>
                        </div>

                        <div className="flex-1 flex items-center gap-4">
                            <div className="flex-1 h-1.5 bg-foreground/[0.05] rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                                    animate={{ width: `${isLoadingAssets ? assetLoadingProgress : progress?.percent || 0}%` }}
                                />
                            </div>
                            <span className="text-[10px] font-mono font-black w-8 text-right">
                                {Math.round(isLoadingAssets ? assetLoadingProgress : progress?.percent || 0)}%
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VideoMerger;
