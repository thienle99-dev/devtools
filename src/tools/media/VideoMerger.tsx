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
    Check,
    Volume2,
    Video,
    Film,
    Layers
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
    const [loadingDetail, setLoadingDetail] = useState({ fileName: '', stage: '', current: 0, total: 0 });
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
                
                // Listen for filmstrip progress
                const removeFilmstripListener = (window as any).videoMergerAPI?.onFilmstripProgress((data: { current: number; total: number; timestamp: string }) => {
                    setLoadingDetail(prev => ({
                        ...prev,
                        stage: `Extracting frame ${data.current}/${data.total} at ${data.timestamp}s...`
                    }));
                });
                
                for (let i = 0; i < paths.length; i++) {
                    const p = paths[i];
                    const fileName = p.split(/[\\/]/).pop() || 'Unknown';
                    
                    console.log(`Processing file ${i + 1}/${paths.length}:`, p);
                    
                    // Update: Getting video info
                    setLoadingDetail({ 
                        fileName, 
                        stage: 'Reading video info...', 
                        current: i + 1, 
                        total: paths.length 
                    });
                    const info = await (window as any).videoMergerAPI?.getVideoInfo(p);
                    console.log('Video info:', info);
                    
                    // Update: Generating thumbnail
                    setLoadingDetail({ 
                        fileName, 
                        stage: 'Generating thumbnail...', 
                        current: i + 1, 
                        total: paths.length 
                    });
                    const thumb = await (window as any).videoMergerAPI?.generateThumbnail(p, 1);
                    console.log('Thumbnail generated:', thumb ? `${thumb.substring(0, 50)}...` : 'FAILED');
                    
                    // Update: Generating filmstrip
                    setLoadingDetail({ 
                        fileName, 
                        stage: 'Extracting 15 frames for filmstrip...', 
                        current: i + 1, 
                        total: paths.length 
                    });
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
                
                // Remove listener
                if (removeFilmstripListener) removeFilmstripListener();
                
                console.log('All files processed:', newInfos);
                setFiles(prev => [...prev, ...newInfos]);
                setIsLoadingAssets(false);
                setLoadingDetail({ fileName: '', stage: '', current: 0, total: 0 });
            }
        } catch (error) {
            console.error('Failed to add files:', error);
            setIsLoadingAssets(false);
            setLoadingDetail({ fileName: '', stage: '', current: 0, total: 0 });
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
        
        console.log('🎬 Video Preview Sync:', {
            currentTime,
            totalClips: files.length,
            activeClip: activeClip ? {
                path: activeClip.path.split(/[\\/]/).pop(),
                timelineStart: activeClip.timelineStart,
                timelineEnd: activeClip.timelineStart + (activeClip.endTime - activeClip.startTime),
                startTime: activeClip.startTime,
                endTime: activeClip.endTime
            } : 'NONE'
        });
        
        if (activeClip) {
            // Normalize path to ensure it works cross-platform and with the protocol handler
            const normalizedPath = activeClip.path.replace(/\\/g, '/');
            // Use 3 slashes to denote absolute path with empty authority (prevents C: being treated as host)
            const localSrc = `local-media:///${normalizedPath}`;
            
            if (activeClipSrc !== localSrc) {
                console.log('📹 Changing video source to:', localSrc);
                setActiveClipSrc(localSrc);
            }
            if (videoPreviewRef.current) {
                const clipLocalTime = (currentTime - activeClip.timelineStart) + activeClip.startTime;
                console.log('⏱️ Seeking video to:', {
                    clipLocalTime: clipLocalTime.toFixed(2),
                    calculation: `(${currentTime.toFixed(2)} - ${activeClip.timelineStart.toFixed(2)}) + ${activeClip.startTime.toFixed(2)}`,
                    currentVideoTime: videoPreviewRef.current.currentTime.toFixed(2),
                    diff: Math.abs(videoPreviewRef.current.currentTime - clipLocalTime).toFixed(2)
                });
                
                if (Math.abs(videoPreviewRef.current.currentTime - clipLocalTime) > 0.15) {
                    videoPreviewRef.current.currentTime = clipLocalTime;
                }
            }
        } else {
            console.log('❌ No active clip found at currentTime:', currentTime);
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
        const pxPerSecond = 80 * zoomLevel; // Same calculation as in CapCutTimeline
        const clickedTime = x / pxPerSecond; // No offset needed - timelineRef is the canvas area
        
        setCurrentTime(Math.max(0, Math.min(clickedTime, totalDuration + 10)));
    };

    const handleTimelineMouseMove = (e: React.MouseEvent) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
        const pxPerSecond = 80 * zoomLevel;
        const time = x / pxPerSecond; // No offset needed
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
            <div className="flex-1 flex overflow-hidden gap-4 p-4">
                {/* Center Panel: Video Preview */}
                <div className="flex-1 flex flex-col gap-4">
                    {/* Video Player */}
                    <div className="flex-1 bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 flex flex-col relative group">
                        {/* Video Container */}
                        <div className="flex-1 relative flex items-center justify-center bg-black">
                            {activeClipSrc ? (
                                <>
                                    <video 
                                        key={activeClipSrc}
                                        ref={videoPreviewRef}
                                        src={activeClipSrc}
                                        className="w-full h-full object-contain"
                                        preload="auto"
                                        onLoadedMetadata={(e) => {
                                            const video = e.currentTarget;
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
                                    
                                    {/* Top Gradient Overlay */}
                                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
                                    
                                    {/* Timecode Display */}
                                    <div className="absolute top-4 left-4 flex items-center gap-3">
                                        <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                                            <div className="text-2xl font-mono font-black text-white tabular-nums">
                                                {formatDuration(currentTime)}
                                            </div>
                                            <div className="text-[10px] font-mono text-gray-400 text-center">
                                                / {formatDuration(totalDuration)}
                                            </div>
                                        </div>
                                        
                                        {/* Live Indicator */}
                                        {isPlaying && (
                                            <div className="flex items-center gap-2 bg-red-500/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-red-500/30">
                                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                                <span className="text-xs font-black text-red-400 uppercase">Live</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Current Clip Info */}
                                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 max-w-xs">
                                        <div className="text-xs font-bold text-gray-400 mb-1">Current Clip</div>
                                        <div className="text-sm font-black text-white truncate">
                                            {files.find(f => currentTime >= f.timelineStart && currentTime < (f.timelineStart + (f.endTime - f.startTime)))?.path.split(/[\\/]/).pop() || 'No clip'}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-4">
                                    {files.length > 0 && currentTime < totalDuration ? (
                                        <>
                                            <Loader2 className="animate-spin text-indigo-500" size={48} />
                                            <span className="text-sm font-black uppercase text-indigo-500/50 tracking-wider">Loading Frame...</span>
                                        </>
                                    ) : (
                                        <>
                                            <MonitorPlay size={64} className="text-white/10" />
                                            <span className="text-sm font-bold text-white/30">No video selected</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Professional Controls Bar */}
                        <div className="bg-gradient-to-t from-black via-black/95 to-transparent p-4">
                            {/* Waveform Visualization Placeholder */}
                            <div className="h-12 mb-3 bg-white/5 rounded-lg overflow-hidden relative">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex items-end gap-0.5 h-full py-2">
                                        {Array.from({ length: 100 }).map((_, i) => (
                                            <div 
                                                key={i} 
                                                className="flex-1 bg-gradient-to-t from-indigo-500/30 to-indigo-400/50 rounded-sm"
                                                style={{ 
                                                    height: `${20 + Math.random() * 80}%`,
                                                    opacity: i / 100 < (currentTime / totalDuration) ? 1 : 0.3
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Playback Controls */}
                            <div className="flex items-center gap-4">
                                {/* Play/Pause Button */}
                                <button 
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white hover:scale-110 transition-all active:scale-95 shadow-lg shadow-indigo-500/30"
                                >
                                    {isPlaying ? (
                                        <div className="flex gap-1">
                                            <div className="w-1 h-4 bg-white rounded-full" />
                                            <div className="w-1 h-4 bg-white rounded-full" />
                                        </div>
                                    ) : (
                                        <Play size={20} fill="currentColor" className="ml-0.5" />
                                    )}
                                </button>
                                
                                {/* Skip Buttons */}
                                <button 
                                    onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}
                                    className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-all"
                                    title="Back 5s"
                                >
                                    <span className="text-xs font-black">-5s</span>
                                </button>
                                <button 
                                    onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 5))}
                                    className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white transition-all"
                                    title="Forward 5s"
                                >
                                    <span className="text-xs font-black">+5s</span>
                                </button>
                                
                                {/* Volume Control */}
                                <div className="flex items-center gap-2 ml-auto">
                                    <Volume2 size={18} className="text-gray-400" />
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        defaultValue="100"
                                        className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                                        onChange={(e) => {
                                            if (videoPreviewRef.current) {
                                                videoPreviewRef.current.volume = parseInt(e.target.value) / 100;
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Right Panel: Metadata & Info */}
                <div className="w-80 flex flex-col gap-4">
                    {/* Video Info Card */}
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-2xl border border-white/5 p-4 space-y-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                <Video size={16} className="text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-black text-white">Video Properties</h3>
                        </div>
                        
                        {files.length > 0 && files[previewIndex] && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-medium">Resolution</span>
                                    <span className="text-xs font-black text-white">{files[previewIndex].width}x{files[previewIndex].height}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-medium">Frame Rate</span>
                                    <span className="text-xs font-black text-white">{files[previewIndex].fps.toFixed(2)} FPS</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-medium">Codec</span>
                                    <span className="text-xs font-black text-white uppercase">{files[previewIndex].codec}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400 font-medium">Duration</span>
                                    <span className="text-xs font-black text-white">{formatDuration(files[previewIndex].duration)}</span>
                                </div>
                            </div>
                        )}
                        
                        {files.length === 0 && (
                            <div className="text-center py-8">
                                <Film size={32} className="text-white/10 mx-auto mb-2" />
                                <p className="text-xs text-gray-500 font-medium">No clips loaded</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Project Stats */}
                    <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-2xl border border-white/5 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <Layers size={16} className="text-purple-400" />
                            </div>
                            <h3 className="text-sm font-black text-white">Project Stats</h3>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-medium">Total Clips</span>
                                <span className="text-xs font-black text-white">{files.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-medium">Total Duration</span>
                                <span className="text-xs font-black text-white">{formatDuration(totalDuration)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-400 font-medium">Export Format</span>
                                <span className="text-xs font-black text-indigo-400 uppercase">{selectedFormat}</span>
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

            {/* Loading Assets Modal - Centered */}
            <AnimatePresence>
                {(isProcessing || isLoadingAssets) && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-glass-background/95 backdrop-blur-xl rounded-3xl border border-border-glass p-10 shadow-2xl max-w-lg w-full mx-4"
                        >
                            <div className="flex flex-col items-center gap-6">
                                {/* Circular Progress */}
                                <div className="relative w-32 h-32">
                                    {/* Background Circle */}
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-white/10"
                                        />
                                        {/* Progress Circle */}
                                        <motion.circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeLinecap="round"
                                            className="text-indigo-500"
                                            initial={{ strokeDasharray: "0 352" }}
                                            animate={{ 
                                                strokeDasharray: `${(isLoadingAssets ? assetLoadingProgress : progress?.percent || 0) * 3.52} 352` 
                                            }}
                                            transition={{ duration: 0.3, ease: "easeOut" }}
                                        />
                                    </svg>
                                    
                                    {/* Center Icon & Percentage */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <Loader2 className="text-indigo-500 animate-spin mb-2" size={32} />
                                        <span className="text-2xl font-black text-white">
                                            {Math.round(isLoadingAssets ? assetLoadingProgress : progress?.percent || 0)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Status Text */}
                                <div className="text-center space-y-2 w-full">
                                    <h3 className="text-xl font-black text-white">
                                        {isLoadingAssets ? 'Loading Assets' : 'Exporting Project'}
                                    </h3>
                                    
                                    {/* Detailed Loading Info */}
                                    {isLoadingAssets && loadingDetail.fileName && (
                                        <div className="space-y-2 mt-4">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-gray-400 font-medium">File:</span>
                                                <span className="text-indigo-400 font-bold">
                                                    {loadingDetail.current}/{loadingDetail.total}
                                                </span>
                                            </div>
                                            <p className="text-sm text-white font-bold truncate px-4" title={loadingDetail.fileName}>
                                                {loadingDetail.fileName}
                                            </p>
                                            <p className="text-xs text-gray-400 font-medium">
                                                {loadingDetail.stage}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {!isLoadingAssets && (
                                        <p className="text-sm text-gray-400 font-medium">
                                            Please wait while we process your video...
                                        </p>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                    <motion.div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/50"
                                        initial={{ width: "0%" }}
                                        animate={{ 
                                            width: `${isLoadingAssets ? assetLoadingProgress : progress?.percent || 0}%` 
                                        }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VideoMerger;
