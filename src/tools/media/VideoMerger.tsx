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
    Layers,
    AlertCircle
} from 'lucide-react';
import { cn } from '@utils/cn';
import { CapCutTimeline } from './components/CapCutTimeline';
import type { VideoMergeOptions, VideoMergeProgress, ExtendedVideoInfo } from '../../types/video-merger';
import { useTimelineHistory } from './hooks/useTimelineHistory';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AssetLoadingModal } from './components/AssetLoadingModal';
import { ExportResultModal } from './components/ExportResultModal';
import { TrimmingModal } from './components/TrimmingModal';
import { useTask } from '../../hooks/useTask';

const FORMATS = ['mp4', 'mkv', 'avi', 'mov', 'webm'];


export const VideoMerger: React.FC = () => {
    const [files, setFiles] = useState<ExtendedVideoInfo[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<VideoMergeProgress | null>(null);
    const [outputPath, setOutputPath] = useState<string | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'mkv' | 'avi' | 'mov' | 'webm'>('mp4');
    const [previewIndex, setPreviewIndex] = useState<number>(0);
    const [zoomLevel, setZoomLevel] = useState(1.5); // Reduced default zoom
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
    const [showLabels, setShowLabels] = useState(true);

    // History Hook
    const { addToHistory, undo, redo } = useTimelineHistory([]);

    const snapInterval = 1; // Snap to 1 second intervals
    const magneticSnapThreshold = 0.5; // 0.5 seconds snap threshold

    const timelineRef = useRef<HTMLDivElement>(null!);
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
                let currentFileIdx = 0;
                const fileWeight = 100 / paths.length;

                const removeFilmstripListener = (window as any).videoMergerAPI?.onFilmstripProgress((data: { current: number; total: number; timestamp: string }) => {
                    const timeText = data.timestamp === 'Processing...' ? '' : ` at ${data.timestamp}s`;

                    // Filmstrip is 70% of the file's progress (from 10% to 80%)
                    const stageProgress = 0.10 + (data.current / data.total) * 0.70;
                    const totalProgress = (currentFileIdx / paths.length) * 100 + (stageProgress * fileWeight);

                    setAssetLoadingProgress(Math.round(totalProgress));
                    setLoadingDetail(prev => ({
                        ...prev,
                        stage: `Extracting frame ${data.current}/${data.total}${timeText}...`
                    }));
                });

                for (let i = 0; i < paths.length; i++) {
                    currentFileIdx = i;
                    const p = paths[i];
                    const fileName = p.split(/[\\/]/).pop() || 'Unknown';
                    const baseFileProgress = (i / paths.length) * 100;

                    console.log(`Processing file ${i + 1}/${paths.length}:`, p);

                    // Stage 1: Info (0-5%)
                    setAssetLoadingProgress(Math.round(baseFileProgress + 0.02 * fileWeight));
                    setLoadingDetail({
                        fileName,
                        stage: 'Reading video info...',
                        current: i + 1,
                        total: paths.length
                    });
                    const info = await (window as any).videoMergerAPI?.getVideoInfo(p);

                    // Stage 2: Thumbnail (5-10%)
                    setAssetLoadingProgress(Math.round(baseFileProgress + 0.05 * fileWeight));
                    setLoadingDetail({
                        fileName,
                        stage: 'Generating thumbnail...',
                        current: i + 1,
                        total: paths.length
                    });
                    const thumb = await (window as any).videoMergerAPI?.generateThumbnail(p, 1);

                    // Stage 3: Filmstrip (10-80%) - Updated by listener
                    const frameCount = Math.min(100, Math.max(15, Math.floor(info.duration / 2)));
                    setLoadingDetail({
                        fileName,
                        stage: `Preparing to extract ${frameCount} frames...`,
                        current: i + 1,
                        total: paths.length
                    });
                    const filmstrip = await (window as any).videoMergerAPI?.generateFilmstrip(p, info.duration, frameCount);

                    // Stage 4: Waveform (80-100%)
                    setAssetLoadingProgress(Math.round(baseFileProgress + 0.85 * fileWeight));
                    setLoadingDetail({
                        fileName,
                        stage: 'Analyzing audio waveform...',
                        current: i + 1,
                        total: paths.length
                    });
                    const waveform = await (window as any).videoMergerAPI?.extractWaveform(p);

                    newInfos.push({
                        ...info,
                        startTime: 0,
                        endTime: info.duration,
                        timelineStart: newInfos.length > 0 ? newInfos[newInfos.length - 1].timelineStart + (newInfos[newInfos.length - 1].endTime - newInfos[newInfos.length - 1].startTime) : 0,
                        trackIndex: 0,
                        thumbnail: thumb,
                        filmstrip: filmstrip,
                        waveform: waveform
                    });

                    // File complete
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

    const { runTask } = useTask('video-merger');

    const handleMerge = async () => {
        if (files.length < 2) return;
        setOutputPath(null);

        await runTask('Exporting Video Project', async (updateProgress, checkCancelled) => {
            setIsProcessing(true);
            setProgress({ id: 'merging', percent: 0, state: 'analyzing' });

            // Create a promise wrapper to handle the event-based API
            return new Promise<void>((resolve, reject) => {
                let cleanup: (() => void) | undefined;

                const onProgress = (p: VideoMergeProgress) => {
                    if (checkCancelled()) {
                        cleanup?.();
                        reject(new Error('Cancelled'));
                        return;
                    }

                    setProgress(p);
                    updateProgress(p.percent, p.state === 'complete' ? 'Export complete' : p.state);

                    if (p.state === 'complete') {
                        setOutputPath(p.outputPath || null);
                        setIsProcessing(false);
                        cleanup?.();
                        resolve();
                    } else if (p.state === 'error') {
                        setIsProcessing(false);
                        cleanup?.();
                        reject(new Error(p.error || 'Unknown error'));
                    }
                };

                cleanup = (window as any).videoMergerAPI?.onProgress(onProgress);

                const options: VideoMergeOptions = {
                    clips: files.map(f => ({
                        path: f.path,
                        startTime: f.startTime,
                        endTime: f.endTime
                    })),
                    format: selectedFormat
                };

                (window as any).videoMergerAPI?.merge(options).catch((e: any) => {
                    cleanup?.();
                    setIsProcessing(false);
                    reject(e);
                });
            });
        }, { cancelable: true }).catch(e => {
            console.error('Task failed or cancelled:', e);
            setIsProcessing(false);
        });
    };

    const playbackRef = useRef<number | null>(null);
    const [activeClipSrc, setActiveClipSrc] = useState<string | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

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

    // Unified Video Preview Sync Manager
    useEffect(() => {
        // Prioritize higher trackIndex for preview (top-most layer visible)
        const activeClip = [...files]
            .sort((a, b) => b.trackIndex - a.trackIndex)
            .find(f => currentTime >= f.timelineStart && currentTime < (f.timelineStart + (f.endTime - f.startTime)));

        if (activeClip) {
            const normalizedPath = activeClip.path.replace(/\\/g, '/');
            // Encode the path to handle spaces and special characters
            const encodedPath = encodeURI(normalizedPath).replace(/#/g, '%23').replace(/\?/g, '%3F');
            const localSrc = `local-media://${encodedPath}`;

            // 1. Source Switching - Remove key to prevent flickering
            if (activeClipSrc !== localSrc) {
                console.log('📹 Switching video source:', localSrc);
                setActiveClipSrc(localSrc);
                setPreviewError(null); // Reset error on new source

                // Also update preview index for properties if nothing is explicitly selected
                if (selectedClips.length === 0) {
                    const idx = files.findIndex(f => f.path === activeClip.path && f.timelineStart === activeClip.timelineStart);
                    if (idx !== -1 && idx !== previewIndex) setPreviewIndex(idx);
                }
                return;
            }

            // 2. Intra-clip Seeking
            if (videoPreviewRef.current) {
                const clipLocalTime = (currentTime - activeClip.timelineStart) + activeClip.startTime;

                // If the video is still loading or has no metadata, it might not respect currentTime yet
                // But we set it anyway, and onLoadedMetadata handles the final sync
                if (videoPreviewRef.current.readyState >= 1) { // HAVE_METADATA or higher
                    const videoTime = videoPreviewRef.current.currentTime;
                    const diff = Math.abs(videoTime - clipLocalTime);

                    if (!isPlaying || diff > 0.3) { // Lowered threshold for better responsiveness
                        if (diff > 0.02) {
                            videoPreviewRef.current.currentTime = clipLocalTime;
                        }
                    }
                }
            }
        } else {
            if (activeClipSrc !== null) setActiveClipSrc(null);
            if (previewIndex !== -1 && selectedClips.length === 0) setPreviewIndex(-1);
        }
    }, [currentTime, files, activeClipSrc, isPlaying]);

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
        const pxPerSecond = 40 * zoomLevel; // New scale
        const clickedTime = x / pxPerSecond;

        setCurrentTime(Math.max(0, Math.min(clickedTime, totalDuration + 10)));
    };

    const handleTimelineMouseMove = (e: React.MouseEvent) => {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
        const pxPerSecond = 40 * zoomLevel;
        const time = x / pxPerSecond;
        setMouseTimelineTime(Math.max(0, time));
    };


    const [snapLineCtx, setSnapLineCtx] = React.useState<{ x: number } | null>(null);

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
            let newSnapLine: { x: number } | null = null;

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

                // Check snapping for the PRIMARY clip's start and end
                const primaryDuration = primaryClip.endTime - primaryClip.startTime;

                for (const point of snapPoints) {
                    // Check Start
                    const distStart = Math.abs(targetStart - point);
                    if (distStart < magneticSnapThreshold && distStart < minDist) {
                        minDist = distStart;
                        snapDelta = point - targetStart;
                        newSnapLine = { x: point };
                    }

                    // Check End
                    const targetEnd = targetStart + primaryDuration;
                    const distEnd = Math.abs(targetEnd - point);
                    if (distEnd < magneticSnapThreshold && distEnd < minDist) {
                        minDist = distEnd;
                        snapDelta = (point - primaryDuration) - targetStart;
                        newSnapLine = { x: point };
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

            setSnapLineCtx(newSnapLine);

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

    const handleDragEnd = () => {
        setSnapLineCtx(null);
    };

    const handleRippleDelete = () => {
        if (selectedClips.length === 0) return;

        setFiles(prev => {
            const next = [...prev];

            // Group deletions by track to handle ripple per track
            const deletionsByTrack: { [track: number]: { start: number, duration: number }[] } = {};

            selectedClips.forEach(idx => {
                const clip = prev[idx];
                if (!deletionsByTrack[clip.trackIndex]) deletionsByTrack[clip.trackIndex] = [];
                deletionsByTrack[clip.trackIndex].push({
                    start: clip.timelineStart,
                    duration: clip.endTime - clip.startTime
                });
            });

            // Filter out deleted clips
            const remainingFiles = next.filter((_, i) => !selectedClips.includes(i));

            // Apply ripple shift for each track
            const shiftedFiles = remainingFiles.map(clip => {
                if (!deletionsByTrack[clip.trackIndex]) return clip;

                const gaps = deletionsByTrack[clip.trackIndex];
                let shiftAmount = 0;

                // For every gap that is strictly BEFORE this clip, add to shift amount
                for (const gap of gaps) {
                    if (gap.start < clip.timelineStart) {
                        shiftAmount += gap.duration;
                    }
                }

                return { ...clip, timelineStart: Math.max(0, clip.timelineStart - shiftAmount) };
            });

            addToHistory(shiftedFiles);
            setSelectedClips([]);
            setPreviewIndex(-1);
            return shiftedFiles;
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if ((e.code === 'KeyS' && !e.ctrlKey && !e.metaKey) || (e.code === 'KeyK' && (e.ctrlKey || e.metaKey))) {
                e.preventDefault();
                splitAtPlayhead();
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
                if (e.shiftKey) {
                    e.preventDefault();
                    const nextState = redo();
                    if (nextState) setFiles(nextState);
                } else {
                    e.preventDefault();
                    const prevState = undo();
                    if (prevState) setFiles(prevState);
                }
            } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') { // Standard Redo for Windows
                e.preventDefault();
                const nextState = redo();
                if (nextState) setFiles(nextState);
            } else if (e.code === 'KeyG' && !e.ctrlKey) {
                e.preventDefault();
                setSnapToGrid(prev => !prev);
            } else if ((e.code === 'Delete' || e.code === 'Backspace') && !e.ctrlKey) {
                if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
                e.preventDefault();

                if (e.shiftKey) {
                    handleRippleDelete();
                } else {
                    // Standard Delete: remove selected clips
                    if (selectedClips.length > 0) {
                        setFiles(prev => {
                            const next = prev.filter((_, i) => !selectedClips.includes(i));
                            addToHistory(next);
                            return next;
                        });
                        setSelectedClips([]);
                        setPreviewIndex(-1);
                    }
                }
            } else if (e.code === 'KeyT' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setShowLabels(prev => !prev);
            } else if (e.code === 'Slash' && e.shiftKey) { // "?" key
                e.preventDefault();
                setShowShortcuts(prev => !prev);
            } else if (e.code === 'Space') {
                e.preventDefault();
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
                    const currentSpeed = playbackSpeedRef.current;
                    setPlaybackSpeed(currentSpeed < 0 ? 1 : Math.min(currentSpeed * 2, 8));
                }
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
            } else if (e.code === 'KeyR' && !e.ctrlKey) {
                e.preventDefault();
                setIsRazorMode(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentTime, previewIndex, files, totalDuration, selectedClips, handleRippleDelete]);

    return (
        <div className="flex flex-col h-full glass-panel text-foreground overflow-hidden rounded-xl border border-border-glass font-sans relative">
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
                                : "bg-foreground/[0.05] text-foreground-muted cursor-not-allowed"
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
                    {/* Video Player Area */}
                    <div className="flex-1 bg-foreground/[0.02] rounded-2xl overflow-hidden shadow-2xl border border-border-glass flex flex-col relative group">
                        {/* Video Container - Always dark for the video itself */}
                        <div className="flex-1 relative flex items-center justify-center bg-black/95">
                            {activeClipSrc ? (
                                <>
                                    <video
                                        key={activeClipSrc}
                                        ref={videoPreviewRef}
                                        src={activeClipSrc}
                                        className="w-full h-full object-contain"
                                        preload="auto"
                                        muted
                                        playsInline
                                        crossOrigin="anonymous"
                                        onLoadedData={(e) => {
                                            setPreviewError(null);
                                            const video = e.currentTarget;
                                            // Ensure we show the frame immediately
                                            const active = [...files]
                                                .sort((a, b) => b.trackIndex - a.trackIndex)
                                                .find(f => currentTime >= f.timelineStart && currentTime < (f.timelineStart + (f.endTime - f.startTime)));

                                            if (active) {
                                                const clipLocalTime = (currentTime - active.timelineStart) + active.startTime;
                                                video.currentTime = clipLocalTime;
                                            }
                                        }}
                                        onError={() => {
                                            const videoError = videoPreviewRef.current?.error;
                                            console.error('Merger Video Error:', videoError);
                                            setPreviewError(`Failed to load video: ${videoError?.message || 'Unknown error'}`);
                                        }}
                                    />

                                    {previewError && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-50 p-6 text-center">
                                            <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 mb-4">
                                                <AlertCircle size={32} />
                                            </div>
                                            <h3 className="text-white font-black mb-2">Preview Failed</h3>
                                            <p className="text-gray-400 text-xs mb-6 max-w-xs">{previewError}</p>
                                            <button
                                                onClick={() => {
                                                    const current = activeClipSrc;
                                                    setActiveClipSrc(null);
                                                    setTimeout(() => setActiveClipSrc(current), 50);
                                                }}
                                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                            >
                                                Retry Load
                                            </button>
                                        </div>
                                    )}

                                    {/* Top Gradient Overlay */}
                                    <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

                                    {/* Timecode Display */}
                                    <div className="absolute top-4 left-4 flex items-center gap-3">
                                        <div className="bg-background/80 backdrop-blur-md px-4 py-2 rounded-xl border border-border-glass">
                                            <div className="text-2xl font-mono font-black text-foreground tabular-nums">
                                                {formatDuration(currentTime)}
                                            </div>
                                            <div className="text-[10px] font-mono text-foreground-secondary text-center">
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
                                    <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-md px-4 py-2 rounded-xl border border-border-glass max-w-xs">
                                        <div className="text-xs font-bold text-foreground-secondary mb-1">Current Clip</div>
                                        <div className="text-sm font-black text-foreground truncate">
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
                                            <MonitorPlay size={64} className="text-foreground/10" />
                                            <span className="text-sm font-bold text-foreground/30">No video selected</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Professional Controls Bar */}
                        <div className="bg-gradient-to-t from-background via-background/95 to-transparent p-4">
                            {/* Waveform Visualization Placeholder */}
                            <div className="h-12 mb-3 bg-foreground/[0.05] rounded-lg overflow-hidden relative">
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
                                        <div className="flex gap-1.5">
                                            <div className="w-1 h-5 bg-white rounded-full shadow-sm" />
                                            <div className="w-1 h-5 bg-white rounded-full shadow-sm" />
                                        </div>
                                    ) : (
                                        <Play size={20} fill="white" className="ml-1" />
                                    )}
                                </button>

                                {/* Skip Buttons */}
                                <button
                                    onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}
                                    className="w-9 h-9 bg-foreground/[0.05] hover:bg-foreground/[0.1] rounded-lg flex items-center justify-center text-foreground transition-all"
                                    title="Back 5s"
                                >
                                    <span className="text-xs font-black">-5s</span>
                                </button>
                                <button
                                    onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 5))}
                                    className="w-9 h-9 bg-foreground/[0.05] hover:bg-foreground/[0.1] rounded-lg flex items-center justify-center text-foreground transition-all"
                                    title="Forward 5s"
                                >
                                    <span className="text-xs font-black">+5s</span>
                                </button>

                                {/* Volume Control */}
                                <div className="flex items-center gap-2 ml-auto">
                                    <Volume2 size={18} className="text-foreground-secondary" />
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        defaultValue="100"
                                        className="w-24 h-1 bg-foreground/[0.1] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500"
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
                    <div className="bg-foreground/[0.03] backdrop-blur-xl rounded-2xl border border-border-glass p-4 space-y-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
                                <Video size={16} className="text-indigo-400" />
                            </div>
                            <h3 className="text-sm font-black text-foreground">Video Properties</h3>
                        </div>

                        {files.length > 0 && files[previewIndex] && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-foreground-secondary font-medium">Resolution</span>
                                    <span className="text-xs font-black text-foreground">{files[previewIndex].width}x{files[previewIndex].height}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-foreground-secondary font-medium">Frame Rate</span>
                                    <span className="text-xs font-black text-foreground">{files[previewIndex].fps.toFixed(2)} FPS</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-foreground-secondary font-medium">Codec</span>
                                    <span className="text-xs font-black text-foreground uppercase">{files[previewIndex].codec}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-foreground-secondary font-medium">Duration</span>
                                    <span className="text-xs font-black text-foreground">{formatDuration(files[previewIndex].duration)}</span>
                                </div>
                            </div>
                        )}

                        {files.length === 0 && (
                            <div className="text-center py-8">
                                <Film size={32} className="text-foreground/10 mx-auto mb-2" />
                                <p className="text-xs text-foreground-muted font-medium">No clips loaded</p>
                            </div>
                        )}
                    </div>

                    {/* Project Stats */}
                    <div className="bg-foreground/[0.03] backdrop-blur-xl rounded-2xl border border-border-glass p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                <Layers size={16} className="text-purple-400" />
                            </div>
                            <h3 className="text-sm font-black text-foreground">Project Stats</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-foreground-secondary font-medium">Total Clips</span>
                                <span className="text-xs font-black text-foreground">{files.length}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-foreground-secondary font-medium">Total Duration</span>
                                <span className="text-xs font-black text-foreground">{formatDuration(totalDuration)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-foreground-secondary font-medium">Export Format</span>
                                <span className="text-xs font-black text-indigo-500 uppercase">{selectedFormat}</span>
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
                magneticSnap={magneticSnap}
                zoomLevel={zoomLevel}
                previewIndex={previewIndex}
                mouseTimelineTime={mouseTimelineTime}
                snapLineCtx={snapLineCtx}
                timelineRef={timelineRef}
                onDragEnd={handleDragEnd}
                onAddFiles={handleAddFiles}
                onShowShortcuts={() => setShowShortcuts(true)}
                onToggleSnap={() => setSnapToGrid(!snapToGrid)}
                onToggleMagnetic={() => setMagneticSnap(prev => !prev)}
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
                showLabels={showLabels}
                onToggleLabels={() => setShowLabels(prev => !prev)}
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
