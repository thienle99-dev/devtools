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
import type { VideoMergeOptions, VideoMergeProgress, VideoInfo } from '../../types/video-merger';

const FORMATS = ['mp4', 'mkv', 'avi', 'mov', 'webm'];

interface ExtendedVideoInfo extends VideoInfo {
    startTime: number;
    endTime: number;
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
    const [zoomLevel, setZoomLevel] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [trimmingIdx, setTrimmingIdx] = useState<number | null>(null);
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const [assetLoadingProgress, setAssetLoadingProgress] = useState(0);

    const timelineRef = useRef<HTMLDivElement>(null);

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
                    const info = await (window as any).videoMergerAPI?.getVideoInfo(p);
                    const thumb = await (window as any).videoMergerAPI?.generateThumbnail(p, 1);
                    const filmstrip = await (window as any).videoMergerAPI?.generateFilmstrip(p, info.duration, 15);
                    
                    newInfos.push({
                        ...info,
                        startTime: 0,
                        endTime: info.duration,
                        thumbnail: thumb,
                        filmstrip: filmstrip
                    });
                    
                    setAssetLoadingProgress(Math.round(((i + 1) / paths.length) * 100));
                }
                
                setFiles(prev => [...prev, ...newInfos]);
                setIsLoadingAssets(false);
            }
        } catch (error) {
            console.error('Failed to add files:', error);
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

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const totalDuration = files.reduce((acc, f) => acc + (f.endTime - f.startTime), 0);

    const clipsWithOffsets = files.reduce((acc, file) => {
        const start = acc.length > 0 ? acc[acc.length - 1].end : 0;
        const clipDuration = file.endTime - file.startTime;
        acc.push({ ...file, start, end: start + clipDuration });
        return acc;
    }, [] as (ExtendedVideoInfo & { start: number; end: number })[]);

    const pxPerSecond = 20 * zoomLevel;

    const handleTimelineClick = (e: React.MouseEvent) => {
        if (!timelineRef.current || trimmingIdx !== null) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
        const clickedTime = x / pxPerSecond;
        setCurrentTime(Math.min(clickedTime, totalDuration));
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
        const clipOffset = clipsWithOffsets[idx];
        const localTimeInClip = currentTime - clipOffset.start + file.startTime;

        if (localTimeInClip <= file.startTime || localTimeInClip >= file.endTime) return;

        setFiles(prev => {
            const next = [...prev];
            const clip1 = { ...file, endTime: localTimeInClip };
            const clip2 = { ...file, startTime: localTimeInClip };
            next.splice(idx, 1, clip1, clip2);
            return next;
        });
    };

    const splitAtPlayhead = () => {
        const foundIdx = clipsWithOffsets.findIndex(c => currentTime >= c.start && currentTime < c.end);
        if (foundIdx !== -1) {
            splitClip(foundIdx);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-hidden rounded-2xl border border-border-glass font-sans relative">
            {/* Top Toolbar */}
            <div className="h-14 flex items-center justify-between px-6 bg-foreground/[0.02] border-b border-border-glass z-20">
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
                <div className="flex-1 bg-background-tertiary/20 flex flex-col items-center justify-center relative p-8 group">
                    <div className="aspect-video w-full max-w-2xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-border-glass flex flex-col relative group">
                        <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
                            <MonitorPlay size={64} className="text-white/20" />
                        </div>
                        
                        <div className="mt-auto p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 transition-all">
                            <div className="flex items-center gap-4">
                                <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform"><Play size={20} fill="currentColor" /></button>
                                <div className="text-sm font-mono font-bold text-white">{formatDuration(currentTime)} / {formatDuration(totalDuration)}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase text-white backdrop-blur-md">{files[previewIndex]?.width}x{files[previewIndex]?.height}</div>
                            </div>
                        </div>

                        {files.length > 0 && (
                            <div className="absolute top-6 left-6 bg-indigo-600/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 text-xs font-bold text-white shadow-xl">
                                Clip #{previewIndex + 1}: {files[previewIndex].path.split(/[\\/]/).pop()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline Area */}
            <div className="h-80 bg-foreground/[0.02] border-t border-border-glass flex flex-col relative">
                <div className="h-10 flex items-center justify-between px-6 border-b border-border-glass bg-foreground/[0.03]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-foreground-secondary uppercase tracking-widest mr-4">
                            <Scissors size={12} className="text-indigo-500" />
                            <span>Multi-track Editor</span>
                        </div>
                        <button 
                            onClick={handleAddFiles}
                            className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase transition-all"
                        >
                            <Plus size={12} />
                            <span>Import Clips</span>
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={splitAtPlayhead}
                            disabled={files.length === 0}
                            className="flex items-center gap-2 px-3 py-1 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all border border-indigo-500/20 disabled:opacity-30"
                        >
                            <Scissors size={12} />
                            <span>Split</span>
                        </button>
                        <div className="flex items-center gap-1.5 p-1 bg-background rounded-lg border border-border-glass shadow-sm">
                            <button onClick={() => setZoomLevel(prev => Math.max(0.2, prev - 0.2))} className="p-1 hover:bg-foreground/[0.05] rounded text-foreground-secondary transition-colors"><ZoomOut size={14} /></button>
                            <div className="w-16 h-1 bg-indigo-500/10 rounded-full overflow-hidden">
                                <motion.div className="h-full bg-indigo-500" animate={{ width: `${zoomLevel * 20}%` }} />
                            </div>
                            <button onClick={() => setZoomLevel(prev => Math.min(5, prev + 0.2))} className="p-1 hover:bg-foreground/[0.05] rounded text-foreground-secondary transition-colors"><ZoomIn size={14} /></button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Track Labels */}
                    <div className="w-12 border-r border-border-glass flex flex-col bg-foreground/[0.02] pt-6 gap-6 items-center shrink-0">
                        {files.map((_, i) => (
                            <div key={i} className="h-14 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 text-[10px] font-bold">V{i+1}</div>
                        ))}
                    </div>

                    {/* Timeline Tracks */}
                    <div 
                        ref={timelineRef}
                        className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative select-none"
                        onClick={handleTimelineClick}
                    >
                        {/* Time Ruler */}
                        <div className="h-6 bg-foreground/[0.03] border-b border-border-glass sticky top-0 z-10 flex items-end min-w-max">
                            {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className="border-l border-border-glass h-2 shrink-0 relative"
                                    style={{ width: `${pxPerSecond}px` }}
                                >
                                    {(i % 5 === 0) && (
                                        <span className="absolute left-1 bottom-1.5 text-[8px] font-bold text-foreground-secondary/40 whitespace-nowrap">
                                            {formatDuration(i)}
                                        </span>
                                    )}
                                    {(i % 5 === 0) && <div className="absolute left-0 bottom-0 h-3 border-l-2 border-border-glass" />}
                                </div>
                            ))}
                        </div>

                        {/* Playhead */}
                        <motion.div 
                            className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-30 pointer-events-none"
                            style={{ left: `${currentTime * pxPerSecond}px` }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                        >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-4 bg-red-500 rounded-b-sm shadow-lg shadow-red-500/50" />
                        </motion.div>

                        {/* Tracks Vertical Layout */}
                        <div className="p-4 pt-2 space-y-4 min-w-max">
                            {files.length === 0 ? (
                                <div className="h-32 w-full flex items-center justify-center border-2 border-dashed border-border-glass rounded-3xl opacity-10 italic text-xs font-bold">
                                    Drop your clips into the multi-track timeline
                                </div>
                            ) : (
                                files.map((file, idx) => (
                                    <div 
                                        key={`${file.path}-${idx}`}
                                        className="h-14 flex items-center relative"
                                    >
                                        {/* Row Background (Ghost Track) */}
                                        <div 
                                            className="absolute h-12 bg-foreground/[0.03] border border-border-glass rounded-xl opacity-30 flex overflow-hidden"
                                            style={{ 
                                                left: `${clipsWithOffsets[idx].start * pxPerSecond}px`,
                                                width: `${file.duration * pxPerSecond}px` 
                                            }}
                                        >
                                            {/* Thumbnail Background Repeated */}
                                            {file.thumbnail && Array.from({ length: Math.ceil(file.duration / 5) }).map((_, i) => (
                                                <img key={i} src={file.thumbnail} className="h-full w-20 object-cover opacity-20 grayscale" alt="" />
                                            ))}
                                        </div>

                                        {/* Active Trim Portion */}
                                        <motion.div
                                            className={cn(
                                                "h-12 rounded-xl overflow-hidden border-2 flex items-center group cursor-pointer shadow-lg transition-all z-10",
                                                previewIndex === idx ? "border-indigo-500 bg-indigo-900/40 shadow-indigo-500/20" : "border-indigo-500/30 bg-zinc-900"
                                            )}
                                            style={{ 
                                                marginLeft: `${(clipsWithOffsets[idx].start + (file.startTime > 0 ? 0 : 0)) * pxPerSecond}px`,
                                                width: `${(file.endTime - file.startTime) * pxPerSecond}px`
                                            }}
                                            onPointerDown={(e) => {
                                                e.stopPropagation();
                                                setPreviewIndex(idx);
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                const clickX = e.clientX - rect.left;
                                                setCurrentTime(clipsWithOffsets[idx].start + (clickX / pxPerSecond));
                                            }}
                                        >
                                            {/* Filmstrip in Active Part */}
                                            <div className="absolute inset-0 flex pointer-events-none opacity-60">
                                                {file.filmstrip?.map((thumb, i) => (
                                                    <img 
                                                        key={i} 
                                                        src={thumb} 
                                                        className="h-full object-cover flex-1" 
                                                        style={{ 
                                                            minWidth: '80px',
                                                            filter: 'contrast(1.1) brightness(0.9)'
                                                        }} 
                                                        alt="" 
                                                    />
                                                ))}
                                            </div>

                                            {/* Left Handle */}
                                            <div 
                                                className="absolute left-0 top-0 bottom-0 w-3 bg-indigo-500/60 hover:bg-indigo-400 cursor-ew-resize flex items-center justify-center z-20"
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    const startX = e.clientX;
                                                    const initialStart = file.startTime;
                                                    const move = (me: MouseEvent) => {
                                                        const delta = (me.clientX - startX) / pxPerSecond;
                                                        updateTrim(idx, initialStart + delta, file.endTime);
                                                    };
                                                    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                                                    window.addEventListener('mousemove', move);
                                                    window.addEventListener('mouseup', up);
                                                }}
                                            >
                                                <div className="w-[1.5px] h-4 bg-white/40" />
                                            </div>

                                            {/* Clip Info */}
                                            <div className="flex-1 px-4 z-10">
                                                <p className="text-[10px] font-black text-white truncate drop-shadow-md">{file.path.split(/[\\/]/).pop()}</p>
                                                <p className="text-[8px] text-indigo-200/80 font-bold">{formatDuration(file.endTime - file.startTime)}</p>
                                            </div>

                                            {/* Right Handle */}
                                            <div 
                                                className="absolute right-0 top-0 bottom-0 w-3 bg-indigo-500/60 hover:bg-indigo-400 cursor-ew-resize flex items-center justify-center z-20"
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    const startX = e.clientX;
                                                    const initialEnd = file.endTime;
                                                    const move = (me: MouseEvent) => {
                                                        const delta = (me.clientX - startX) / pxPerSecond;
                                                        updateTrim(idx, file.startTime, initialEnd + delta);
                                                    };
                                                    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
                                                    window.addEventListener('mousemove', move);
                                                    window.addEventListener('mouseup', up);
                                                }}
                                            >
                                                <div className="w-[1.5px] h-4 bg-white/40" />
                                            </div>

                                            {/* Actions Group Overlay */}
                                            <div className="absolute right-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                                <button onClick={(e) => { e.stopPropagation(); splitClip(idx); }} className="p-1 px-2 bg-indigo-600 text-[8px] font-black uppercase rounded shadow-lg border border-white/10 hover:bg-indigo-500 transition-all">Split</button>
                                                <button onClick={(e) => { e.stopPropagation(); setTrimmingIdx(idx); }} className="p-1 px-2 bg-white/10 text-[8px] font-black uppercase rounded backdrop-blur-md border border-white/5 hover:bg-white/20 transition-all">Precision</button>
                                                <button onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.path); }} className="p-1.5 bg-rose-500/20 text-rose-500 rounded hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={10} /></button>
                                            </div>
                                        </motion.div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
                                {isLoadingAssets ? 'Loading Assets...' : 'Exporting Project...'}
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
