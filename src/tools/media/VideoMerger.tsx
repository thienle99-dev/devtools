import React, { useState, useEffect, useRef } from 'react';
import { 
    Loader2, 
    Play,
    Clock,
    Download,
    Volume2,
    MonitorPlay,
    Video,
    Film,
    Layers
} from 'lucide-react';
import { cn } from '@utils/cn';
import { CapCutTimeline } from './components/CapCutTimeline';
import type { VideoMergeOptions, VideoMergeProgress, VideoInfo, ExtendedVideoInfo } from '../../types/video-merger';
import { useTimelineHistory } from './hooks/useTimelineHistory';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AssetLoadingModal } from './components/AssetLoadingModal';
import { ExportResultModal } from './components/ExportResultModal';
import { TrimmingModal } from './components/TrimmingModal';

const FORMATS = ['mp4', 'mkv', 'avi', 'mov', 'webm'];


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
    
    // History Hook
    const { addToHistory, undo, redo } = useTimelineHistory([]);

    const snapInterval = 1; // Snap to 1 second intervals
    const magneticSnapThreshold = 0.5; // 0.5 seconds snap threshold

    const timelineRef = useRef<HTMLDivElement>(null);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);

    // Calculate total duration from files
    const totalDuration = files.length > 0
        ? Math.max(...files.map(f => f.timelineStart + (f.endTime - f.startTime)))
        : 0;

    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Refs for accessing state in event handlers without dependency
    const isPlayingRef = useRef(isPlaying);
    const playbackSpeedRef = useRef(playbackSpeed);
    
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { playbackSpeedRef.current = playbackSpeed; }, [playbackSpeed]);
    
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts if user is typing in an input
            if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

            if ((e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) || (e.code === 'KeyK' && (e.ctrlKey || e.metaKey))) {
                // S or Ctrl+K / Cmd+K to split
                e.preventDefault();
                splitAtPlayhead();
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
                e.preventDefault();
                if (e.shiftKey) {
                    const nextState = redo();
                    if (nextState) setFiles(nextState);
                } else {
                    const prevState = undo();
                    if (prevState) setFiles(prevState);
                }
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') { // Standard Redo for Windows
                e.preventDefault();
                const nextState = redo();
                if (nextState) setFiles(nextState);
            } else if (e.code === 'Delete' || e.code === 'Backspace') {
                e.preventDefault();
                if (previewIndex !== -1 && files[previewIndex]) {
                    handleRemoveFile(files[previewIndex].path);
                }
            } else if (e.code === 'Space') {
                e.preventDefault();
                // Toggle play/pause - reset speed to 1x if starting
                if (!isPlayingRef.current) {
                    setPlaybackSpeed(1);
                    setIsPlaying(true);
                } else {
                    setIsPlaying(false);
                }
            } else if (e.code === 'KeyJ') {
                e.preventDefault();
                if (!isPlayingRef.current) {
                    setIsPlaying(true);
                    setPlaybackSpeed(-1);
                } else {
                    // If already playing backwards, double speed (max -8x)
                    // If playing forwards, switch to backwards -1x
                    const currentSpeed = playbackSpeedRef.current;
                    setPlaybackSpeed(currentSpeed > 0 ? -1 : Math.max(currentSpeed * 2, -8));
                }
            } else if (e.code === 'KeyK' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setIsPlaying(false);
                setPlaybackSpeed(1);
            } else if (e.code === 'KeyL') {
                e.preventDefault();
                if (!isPlayingRef.current) {
                    setIsPlaying(true);
                    setPlaybackSpeed(1);
                } else {
                    // If already playing forwards, double speed (max 8x)
                    // If playing backwards, switch to forwards 1x
                    const currentSpeed = playbackSpeedRef.current;
                    setPlaybackSpeed(currentSpeed < 0 ? 1 : Math.min(currentSpeed * 2, 8));
                }
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
                    
                    // Update: Extracting waveform
                    setLoadingDetail({ 
                        fileName, 
                        stage: 'Analyzing audio waveform...', 
                        current: i + 1, 
                        total: paths.length 
                    });
                    const waveform = await (window as any).videoMergerAPI?.extractWaveform(p);
                    console.log('Waveform data points:', waveform ? waveform.length : 'FAILED');
                    
                    newInfos.push({
                        ...info,
                        startTime: 0,
                        endTime: info.duration,
                        timelineStart: newInfos.length > 0 ? newInfos[newInfos.length-1].timelineStart + (newInfos[newInfos.length-1].endTime - newInfos[newInfos.length-1].startTime) : 0,
                        trackIndex: 0,
                        thumbnail: thumb,
                        filmstrip: filmstrip,
                        waveform: waveform
                    });
                    
                    setAssetLoadingProgress(Math.round(((i + 1) / paths.length) * 100));
                }
                
                // Remove listener
                removeFilmstripListener();
                
                console.log('All files processed:', newInfos);
                setIsLoadingAssets(false);
                setLoadingDetail({ fileName: '', stage: '', current: 0, total: 0 });

                setFiles(prev => {
                    const updated = [...prev, ...newInfos];
                    addToHistory(updated);
                    return updated;
                });
            }
        } catch (error) {
            console.error('Failed to add files:', error);
            setIsLoadingAssets(false);
            setLoadingDetail({ fileName: '', stage: '', current: 0, total: 0 });
        }
    };

    const handleRemoveFile = (path: string) => {
        setFiles(prev => {
            const next = prev.filter(f => f.path !== path);
            addToHistory(next);
            return next;
        });
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
            let lastTimestamp = performance.now();
            const animate = () => {
                const now = performance.now();
                const delta = (now - lastTimestamp) / 1000;
                lastTimestamp = now;

                const speed = playbackSpeedRef.current;

                setCurrentTime(prevTime => {
                    const next = prevTime + (delta * speed);

                    if (next >= totalDuration && speed > 0) {
                        setIsPlaying(false);
                        setPlaybackSpeed(1);
                        return totalDuration;
                    } else if (next <= 0 && speed < 0) {
                        setIsPlaying(false);
                        setPlaybackSpeed(1);
                        return 0;
                    }

                    return Math.max(0, Math.min(totalDuration, next));
                });
                
                playbackRef.current = requestAnimationFrame(animate);
            };
            playbackRef.current = requestAnimationFrame(animate);
        } else if (playbackRef.current) {
            cancelAnimationFrame(playbackRef.current);
        }
        return () => {
            if (playbackRef.current) cancelAnimationFrame(playbackRef.current);
        };
    }, [isPlaying, totalDuration]); // Removed currentTime from dependency to avoid loop reset, but need initial start time handled carefully. Actually, if we use functional update on setCurrentTime it might be safer, but here we use a ref-like approach by capturing currentTime in the closure if we didn't re-create the loop. 
    // Wait, if I don't listen to currentTime, 'currentTime' in 'nextTime' calculation will be stale.
    // Correct approach for loop: use a ref for currentTime or functional update.
    
    // Better implementation:
     /*
    useEffect(() => {
        if (isPlaying) {
             let lastTime = performance.now();
             const animate = () => {
                 const now = performance.now();
                 const dt = (now - lastTime) / 1000;
                 lastTime = now;
                 
                 setCurrentTime(prev => {
                     const next = prev + dt * playbackSpeed;
                     if (next >= totalDuration && playbackSpeed > 0) {
                         setIsPlaying(false);
                         return totalDuration;
                     }
                     if (next <= 0 && playbackSpeed < 0) {
                         setIsPlaying(false);
                         return 0;
                     }
                     return Math.max(0, Math.min(totalDuration, next));
                 });
                 playbackRef.current = requestAnimationFrame(animate);
             };
             playbackRef.current = requestAnimationFrame(animate);
        }
        // ...
    */
    // Applying the better implementation logic:

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


    const toggleSelection = (idx: number, isMulti: boolean) => {
        if (isMulti) {
            setSelectedClips(prev => 
                prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
            );
        } else {
            // If already selecting this one and only this one, do nothing.
            // If clicking a different one, select only that one.
            if (!selectedClips.includes(idx) || selectedClips.length > 1) {
                setSelectedClips([idx]);
            }
        }
        setPreviewIndex(idx);
    };

    const clearSelection = () => {
        setSelectedClips([]);
        setPreviewIndex(-1);
    };

    const handleClipMove = (idx: number, deltaX: number, deltaY: number) => {
        setFiles(prev => {
            const next = [...prev];
            const clipsToMove = selectedClips.includes(idx) ? selectedClips : [idx];
            
            // 1. Calculate unsnapped target position for the PRIMARY dragged clip
            const primaryClip = prev[idx];
            let targetStart = primaryClip.timelineStart + deltaX;
            let snapDelta = 0;

            // 2. Magnetic Snapping (Horizontal only)
            if (magneticSnap) {
                const snapPoints = [0, currentTime]; // Always snap to start and playhead
                
                // Add start/end of ALL UNSELECTED clips as snap points
                prev.forEach((f, i) => {
                    if (!clipsToMove.includes(i)) {
                        snapPoints.push(f.timelineStart);
                        snapPoints.push(f.timelineStart + (f.endTime - f.startTime));
                    }
                });

                // Find closest snap point
                let minDist = Infinity;
                let closestPoint = null;

                // Check snapping for the PRIMARY clip's start and end
                const primaryDuration = primaryClip.endTime - primaryClip.startTime;
                
                for (const point of snapPoints) {
                    // Check Start
                    const distStart = Math.abs(targetStart - point);
                    if (distStart < magneticSnapThreshold && distStart < minDist) {
                        minDist = distStart;
                        closestPoint = point;
                        snapDelta = point - targetStart; // Adjustment needed
                    }

                    // Check End
                    const targetEnd = targetStart + primaryDuration;
                    const distEnd = Math.abs(targetEnd - point);
                    if (distEnd < magneticSnapThreshold && distEnd < minDist) {
                        minDist = distEnd;
                        closestPoint = point - primaryDuration; // Adjust start to align end
                        snapDelta = (point - primaryDuration) - targetStart;
                    }
                }
            }

            // 3. Grid Snapping (if magnetic didn't trigger or is closer)
            if (snapToGrid && snapDelta === 0) {
                 const gridSnapStart = Math.round(targetStart / snapInterval) * snapInterval;
                 if (Math.abs(gridSnapStart - targetStart) < magneticSnapThreshold) {
                     snapDelta = gridSnapStart - targetStart;
                 }
            }

            // 4. Apply movements
            const finalDeltaX = deltaX + snapDelta;

            clipsToMove.forEach(clipIdx => {
                const clip = prev[clipIdx];
                const newStart = Math.max(0, clip.timelineStart + finalDeltaX);
                const newTrack = Math.max(0, Math.min(5, clip.trackIndex + (deltaY || 0)));
                
                next[clipIdx] = {
                    ...clip,
                    timelineStart: newStart,
                    trackIndex: newTrack
                };
            });
            
            addToHistory(next);
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

    const finalizeTrim = () => {
        addToHistory(files);
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
            addToHistory(next);
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
                selectedClips={selectedClips}
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
                onToggleSelection={toggleSelection}
                onClearSelection={clearSelection}
                onSplitClip={splitClip}
                onSetTrimmingIdx={setTrimmingIdx}
                onRemoveFile={handleRemoveFile}
                onUpdateTrim={updateTrim}
                onClipMove={handleClipMove}
                formatDuration={formatDuration}
            />

            {/* Trimming Modal */}
            <TrimmingModal 
                file={trimmingIdx !== null ? files[trimmingIdx] : null}
                trimmingIdx={trimmingIdx}
                onClose={() => setTrimmingIdx(null)}
                onUpdateTrim={updateTrim}
                onFinalizeTrim={finalizeTrim}
                formatDuration={formatDuration}
            />

            {/* Export Progress Progress */}
            <ExportResultModal 
                progress={progress}
                outputPath={outputPath}
                onDismiss={() => setProgress(null)}
                onPlay={() => (window as any).videoMergerAPI?.openFile(outputPath!)}
            />

            {/* Keyboard Shortcuts Guide */}
            <ShortcutsModal 
                isOpen={showShortcuts}
                onClose={() => setShowShortcuts(false)}
            />

            {/* Loading Assets Modal - Centered */}
            <AssetLoadingModal 
                isOpen={isProcessing || isLoadingAssets}
                isLoadingAssets={isLoadingAssets}
                assetLoadingProgress={assetLoadingProgress}
                progress={progress}
                loadingDetail={loadingDetail}
            />
        </div>
    );
};

export default VideoMerger;
