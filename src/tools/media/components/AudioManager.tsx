import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Trash2,
    Video as VideoIcon,
    Music,
    Volume2,
    VolumeX,
    Play,
    Pause,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Download,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@utils/cn';
import type { AudioLayer, AudioManagerOptions, AudioProgress } from '../../../types/audio-manager';

export const AudioManager: React.FC = () => {
    const [videoPath, setVideoPath] = useState<string | null>(null);
    const [videoInfo, setVideoInfo] = useState<any>(null);
    const [audioLayers, setAudioLayers] = useState<AudioLayer[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<AudioProgress | null>(null);
    const [currentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [keepOriginalAudio, setKeepOriginalAudio] = useState(true);
    const [originalVolume, setOriginalVolume] = useState(1);

    const timelineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cleanup = (window as any).audioManagerAPI?.onProgress((p: AudioProgress) => {
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
        }
    };

    const handleAddAudioLayer = async () => {
        const paths = await (window as any).audioManagerAPI?.chooseInputFiles();
        if (paths && paths.length > 0) {
            const newLayers = await Promise.all(paths.map(async (p: string) => {
                const info = await (window as any).audioManagerAPI?.getAudioInfo(p);
                return {
                    id: Math.random().toString(36).substr(2, 9),
                    path: p,
                    name: p.split(/[\\/]/).pop() || 'Audio Track',
                    volume: 1,
                    startTime: 0,
                    clipStart: 0,
                    clipEnd: info.duration,
                    duration: info.duration,
                    isMuted: false
                };
            }));
            setAudioLayers(prev => [...prev, ...newLayers]);
        }
    };

    const handleRemoveLayer = (id: string) => {
        setAudioLayers(prev => prev.filter(l => l.id !== id));
    };

    const updateLayer = (id: string, updates: Partial<AudioLayer>) => {
        setAudioLayers(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    };

    const handleExport = async () => {
        if (!videoPath) return;
        setIsProcessing(true);
        const options: AudioManagerOptions = {
            videoPath,
            audioLayers: audioLayers.filter(l => !l.isMuted),
            outputFormat: 'mp4',
            keepOriginalAudio,
            originalAudioVolume: originalVolume
        };
        try {
            await (window as any).audioManagerAPI?.apply(options);
        } catch (e) {
            console.error('Export failed:', e);
            setIsProcessing(false);
        }
    };

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const totalDuration = videoInfo?.duration || 0;
    const pxPerSecond = 20;

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-hidden font-sans">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-border-glass bg-glass-background/20 backdrop-blur-md z-20">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-600/10 rounded-full border border-indigo-500/20">
                        <Music size={14} className="text-indigo-500" />
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Audio Manager</span>
                    </div>
                    {videoInfo && (
                        <div className="text-[10px] font-bold text-foreground-secondary uppercase tracking-widest">
                            Video Duration: <span className="text-foreground">{formatDuration(totalDuration)}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExport}
                        disabled={!videoPath || isProcessing}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black transition-all shadow-lg",
                            videoPath && !isProcessing 
                                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20" 
                                : "bg-white/5 text-gray-500 cursor-not-allowed"
                        )}
                    >
                        {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        <span>{isProcessing ? 'Processing...' : 'Merge & Export'}</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Assets */}
                <div className="w-72 border-r border-border-glass bg-foreground/[0.01] flex flex-col">
                    <div className="p-4 space-y-4">
                        <button 
                            onClick={handleSelectVideo}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-foreground/[0.05] hover:bg-foreground/[0.08] border border-dashed border-border-glass rounded-2xl text-xs font-bold transition-all"
                        >
                            <VideoIcon size={16} className="text-indigo-500" />
                            <span>{videoPath ? 'Change Video' : 'Select Video'}</span>
                        </button>

                        <button 
                            onClick={handleAddAudioLayer}
                            disabled={!videoPath}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-2xl text-xs font-black transition-all disabled:opacity-30"
                        >
                            <Plus size={16} />
                            <span>Add BG Music</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 custom-scrollbar pb-6">
                        <div className="text-[10px] font-black text-foreground-secondary uppercase tracking-widest mb-4">Audio Layers</div>
                        <div className="space-y-3">
                            {/* Original Audio Control */}
                            {videoPath && (
                                <div className="p-3 bg-foreground/[0.03] border border-border-glass rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500"><VideoIcon size={14} /></div>
                                            <span className="text-[10px] font-bold truncate max-w-[120px]">Original Video Audio</span>
                                        </div>
                                        <button onClick={() => setKeepOriginalAudio(!keepOriginalAudio)} className="text-foreground-secondary hover:text-indigo-400 transition-colors">
                                            {keepOriginalAudio ? <Volume2 size={14} /> : <VolumeX size={14} className="text-rose-500" />}
                                        </button>
                                    </div>
                                    {keepOriginalAudio && (
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="range" min="0" max="2" step="0.1" value={originalVolume}
                                                onChange={(e) => setOriginalVolume(Number(e.target.value))}
                                                className="flex-1 h-1 bg-foreground/[0.1] rounded-full accent-indigo-500"
                                            />
                                            <span className="text-[8px] font-black w-8 text-indigo-400">{Math.round(originalVolume * 100)}%</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Added Layers */}
                            {audioLayers.map((layer) => (
                                <div key={layer.id} className="p-3 bg-foreground/[0.03] border border-border-glass rounded-2xl space-y-3 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500"><Music size={14} /></div>
                                            <span className="text-[10px] font-bold truncate">{layer.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => updateLayer(layer.id, { isMuted: !layer.isMuted })} className="p-1 text-foreground-secondary hover:text-indigo-400">
                                                {layer.isMuted ? <VolumeX size={14} className="text-rose-500" /> : <Volume2 size={14} />}
                                            </button>
                                            <button onClick={() => handleRemoveLayer(layer.id)} className="p-1 text-foreground-secondary hover:text-rose-500">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="range" min="0" max="2" step="0.1" value={layer.volume}
                                            onChange={(e) => updateLayer(layer.id, { volume: Number(e.target.value) })}
                                            className="flex-1 h-1 bg-foreground/[0.1] rounded-full accent-emerald-500"
                                        />
                                        <span className="text-[8px] font-black w-8 text-emerald-400">{Math.round(layer.volume * 100)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Workspace - Timeline */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 bg-background-tertiary/20 flex flex-col items-center justify-center p-8">
                        {/* Mock Video Preview */}
                        <div className="aspect-video w-full max-w-2xl bg-black rounded-3xl border border-border-glass shadow-2xl flex items-center justify-center relative group">
                            {videoPath ? (
                                <VideoIcon size={64} className="text-foreground/10" />
                            ) : (
                                <div className="text-center space-y-4 opacity-30">
                                    <VideoIcon size={48} className="mx-auto" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No Video Selected</p>
                                </div>
                            )}
                            
                            {videoPath && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => setIsPlaying(!isPlaying)}
                                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 transition-transform"
                                    >
                                        {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Timeline Area */}
                    <div className="h-64 bg-foreground/[0.02] border-t border-border-glass flex flex-col relative">
                        <div className="h-10 border-b border-border-glass flex items-center px-6 justify-between bg-foreground/[0.03]">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground-secondary">
                                <Clock size={12} />
                                <span>Audio Timeline</span>
                            </div>
                            <div className="text-[10px] font-mono font-bold text-indigo-400">{formatDuration(currentTime)}</div>
                        </div>

                        <div 
                            ref={timelineRef}
                            className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar-h relative select-none"
                        >
                            {/* Ruler */}
                            <div className="h-6 bg-foreground/[0.03] border-b border-border-glass sticky top-0 z-10 flex">
                                {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
                                    <div key={i} className="border-l border-border-glass h-full shrink-0 relative" style={{ width: pxPerSecond }}>
                                        {i % 5 === 0 && (
                                            <span className="absolute left-1 top-0 text-[8px] font-bold text-foreground-secondary/40">{i}s</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Tracks */}
                            <div className="p-4 space-y-4 min-w-max">
                                {/* Video Audio Track */}
                                {videoPath && (
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-500 shrink-0"><VideoIcon size={16} /></div>
                                        <div className="h-10 bg-indigo-500/20 rounded-xl border border-indigo-500/30 relative" style={{ width: totalDuration * pxPerSecond }}>
                                            <div className="absolute inset-0 flex items-center opacity-10 gap-0.5 px-2">
                                                {Array.from({ length: 40 }).map((_, i) => <div key={i} className="flex-1 bg-white h-full max-h-[12px] rounded-full" />)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Audio Layers */}
                                {audioLayers.map((layer) => (
                                    <div key={layer.id} className="flex items-center gap-4">
                                        <div className="w-12 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 shrink-0"><Music size={16} /></div>
                                        <div 
                                            className="h-10 bg-emerald-500/20 rounded-xl border border-emerald-500/30 relative cursor-grab active:cursor-grabbing hover:bg-emerald-500/30 transition-colors"
                                            style={{ 
                                                width: (layer.clipEnd - layer.clipStart) * pxPerSecond,
                                                marginLeft: layer.startTime * pxPerSecond
                                            }}
                                            onMouseDown={(e) => {
                                                const startX = e.clientX;
                                                const startStart = layer.startTime;
                                                const onMouseMove = (moveE: MouseEvent) => {
                                                    const delta = (moveE.clientX - startX) / pxPerSecond;
                                                    const newStart = Math.max(0, startStart + delta);
                                                    updateLayer(layer.id, { startTime: newStart });
                                                };
                                                const onMouseUp = () => {
                                                    window.removeEventListener('mousemove', onMouseMove);
                                                    window.removeEventListener('mouseup', onMouseUp);
                                                };
                                                window.addEventListener('mousemove', onMouseMove);
                                                window.addEventListener('mouseup', onMouseUp);
                                            }}
                                        >
                                            <div className="absolute inset-0 flex items-center gap-0.5 px-2 pointer-events-none">
                                                {Array.from({ length: 40 }).map((_, i) => (
                                                    <div key={i} className="flex-1 bg-emerald-500/40 rounded-full" style={{ height: `${20 + Math.random() * 60}%` }} />
                                                ))}
                                            </div>
                                            <div className="absolute top-1 left-2 text-[8px] font-black uppercase text-emerald-400 opacity-50 truncate">{layer.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Playhead */}
                            <motion.div 
                                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none"
                                style={{ left: currentTime * pxPerSecond + 48 }}
                                transition={{ type: 'spring', bounce: 0, duration: 0.1 }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Progress Progress */}
            <AnimatePresence>
                {progress && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <div className="w-full max-w-sm bg-glass-background/90 backdrop-blur-xl rounded-3xl border border-border-glass p-8 shadow-2xl relative">
                            <div className="text-center space-y-6">
                                <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 flex items-center justify-center mx-auto text-indigo-400">
                                    {progress.state === 'complete' ? <CheckCircle2 size={32} /> : progress.state === 'error' ? <AlertCircle size={32} /> : <Loader2 size={32} className="animate-spin" />}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-black tracking-tight">{progress.state === 'processing' ? 'Processing Mix' : progress.state === 'complete' ? 'Export Success' : 'Initializing'}</h3>
                                    <p className="text-[10px] font-bold text-foreground-secondary uppercase tracking-widest">{Math.round(progress.percent)}% Complete</p>
                                </div>
                                <div className="w-full bg-foreground/[0.05] h-1.5 rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]" animate={{ width: `${progress.percent}%` }} />
                                </div>
                                <div className="flex flex-col gap-2 pt-4">
                                    {progress.state === 'complete' && progress.outputPath && (
                                        <button onClick={() => (window as any).videoMergerAPI?.openFile(progress.outputPath)} className="w-full bg-indigo-600 py-3 rounded-xl text-xs font-black">PLAY RESULT</button>
                                    )}
                                    <button onClick={() => setProgress(null)} className="w-full bg-foreground/[0.05] py-3 rounded-xl text-xs font-black">DISMISS</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AudioManager;
