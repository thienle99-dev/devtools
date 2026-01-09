import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Trash2, 
    GripVertical, 
    Video as VideoIcon, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    X,
    Play,
    MonitorPlay,
    Clock,
    Scissors,
    Download
} from 'lucide-react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { cn } from '@utils/cn';
import type { VideoMergeOptions, VideoMergeProgress, VideoInfo } from '../../types/video-merger';

const FORMATS = ['mp4', 'mkv', 'avi', 'mov', 'webm'];

export const VideoMerger: React.FC = () => {
    const [files, setFiles] = useState<VideoInfo[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<VideoMergeProgress | null>(null);
    const [outputPath, setOutputPath] = useState<string | null>(null);
    const [selectedFormat, setSelectedFormat] = useState<'mp4' | 'mkv' | 'avi' | 'mov' | 'webm'>('mp4');
    const [previewIndex, setPreviewIndex] = useState<number>(0);

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
                const newInfos = await Promise.all(
                    paths.map((p: string) => (window as any).videoMergerAPI?.getVideoInfo(p))
                );
                setFiles(prev => [...prev, ...newInfos]);
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
                inputPaths: files.map(f => f.path),
                format: selectedFormat
            };
            await (window as any).videoMergerAPI?.merge(options);
        } catch (error) {
            console.error('Merge failed:', error);
            setIsProcessing(false);
            setProgress(prev => prev ? { ...prev, state: 'error', error: 'Failed to merge videos' } : null);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const totalDuration = files.reduce((acc, f) => acc + f.duration, 0);

    return (
        <div className="flex flex-col h-full bg-background text-foreground overflow-hidden rounded-2xl border border-border-glass">
            {/* Top Toolbar - Metadata & Settings */}
            <div className="h-14 flex items-center justify-between px-6 bg-foreground/[0.02] border-b border-border-glass z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground-secondary">
                        <Clock size={14} className="text-indigo-500" />
                        <span>Total: <span className="text-foreground">{formatDuration(totalDuration)}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground-secondary">
                        <VideoIcon size={14} className="text-indigo-500" />
                        <span>Clips: <span className="text-foreground">{files.length}</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-black tracking-widest text-foreground-secondary">Output Format</span>
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
                    </div>
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
                        <span>{isProcessing ? 'Merging...' : 'Export Video'}</span>
                    </button>
                </div>
            </div>

            {/* Workspace Area: Preview + Assets */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Asset Library */}
                <div className="w-64 bg-foreground/[0.02] border-r border-border-glass flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-border-glass">
                        <button 
                            onClick={handleAddFiles}
                            disabled={isProcessing}
                            className="w-full flex items-center justify-center gap-2 bg-foreground/[0.05] hover:bg-foreground/[0.1] py-3 rounded-xl border border-dashed border-border-glass text-xs font-bold transition-all group"
                        >
                            <Plus size={16} className="text-indigo-500 group-hover:scale-125 transition-transform" />
                            <span>Import Clips</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        <div className="text-[10px] font-black text-foreground-secondary uppercase tracking-widest px-1 mb-2">Media Library</div>
                        {files.length === 0 ? (
                            <div className="text-center py-10 opacity-20">
                                <VideoIcon size={32} className="mx-auto mb-2" />
                                <p className="text-[10px] font-bold">No assets</p>
                            </div>
                        ) : (
                            files.map((file, idx) => (
                                <div 
                                    key={file.path} 
                                    onClick={() => setPreviewIndex(idx)}
                                    className={cn(
                                        "p-2 rounded-lg border border-transparent hover:bg-foreground/[0.05] cursor-pointer transition-all group",
                                        previewIndex === idx && "bg-indigo-600/10 border-indigo-500/30"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded bg-black/40 flex items-center justify-center text-indigo-500 group-hover:text-white transition-colors overflow-hidden">
                                            {/* Local video thumbnail could go here if we had one */}
                                            <VideoIcon size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold truncate tracking-tight">{file.path.split(/[\\/]/).pop()}</p>
                                            <p className="text-[8px] text-foreground-secondary font-bold uppercase">{formatDuration(file.duration)} • {formatSize(file.size)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Panel: Preview Monitor */}
                <div className="flex-1 bg-background-tertiary/20 flex flex-col items-center justify-center relative p-8 group">
                    <div className="aspect-video w-full max-w-2xl bg-black rounded-xl overflow-hidden shadow-2xl border border-border-glass flex flex-col relative group">
                        <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
                            <MonitorPlay size={64} className="text-white/20" />
                        </div>
                        
                        {/* Mock Player Controls overlay */}
                        <div className="mt-auto p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-4">
                                <button className="p-2 hover:bg-white/10 rounded-full"><Play size={20} fill="currentColor" /></button>
                                <div className="text-xs font-mono font-bold">00:00:00 / {formatDuration(totalDuration)}</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-[10px] font-black uppercase text-foreground-secondary">Preview: <span className="text-foreground">{files[previewIndex]?.width}x{files[previewIndex]?.height}</span></div>
                            </div>
                        </div>

                        {files.length > 0 && (
                            <div className="absolute top-4 left-4 bg-background/60 backdrop-blur-md px-3 py-1 rounded-full border border-border-glass text-[10px] font-bold">
                                Clip #{previewIndex + 1}: {files[previewIndex].path.split(/[\\/]/).pop()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline Area - Horizontal Reorder */}
            <div className="h-44 bg-foreground/[0.02] border-t border-border-glass flex flex-col relative">
                <div className="h-10 flex items-center justify-between px-6 border-b border-border-glass bg-foreground/[0.03]">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-[10px] font-black text-foreground-secondary uppercase tracking-widest">
                            <Scissors size={12} className="text-indigo-500" />
                            <span>Timeline</span>
                        </div>
                        <div className="h-4 w-[1px] bg-border-glass" />
                        <span className="text-[10px] font-bold text-foreground-secondary/60">Drag tracks to reorder</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                         <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-lg">
                             <button className="p-1 hover:bg-white/10 rounded"><Plus size={12} /></button>
                             <div className="w-24 h-1 bg-white/10 rounded-full" />
                             <button className="p-1 hover:bg-white/10 rounded"><Plus size={12} className="rotate-45" /></button>
                         </div>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar-h p-4">
                    {files.length === 0 ? (
                        <div className="h-full flex items-center justify-center border-2 border-dashed border-border-glass rounded-2xl opacity-20 italic text-xs font-bold text-foreground">
                            Import clips to assemble your timeline
                        </div>
                    ) : (
                        <Reorder.Group 
                            axis="x" 
                            values={files} 
                            onReorder={setFiles}
                            className="flex gap-2 h-full"
                        >
                            {files.map((file, idx) => (
                                <Reorder.Item
                                    key={file.path}
                                    value={file}
                                    className={cn(
                                        "h-full min-w-[180px] max-w-[240px] bg-foreground/[0.05] border border-border-glass rounded-xl overflow-hidden flex flex-col group cursor-grab active:cursor-grabbing hover:border-indigo-500/50 transition-colors",
                                        previewIndex === idx && "ring-2 ring-indigo-600 border-indigo-600 shadow-xl shadow-indigo-600/10"
                                    )}
                                    onPointerDown={() => setPreviewIndex(idx)}
                                >
                                    {/* Clip Ribbon */}
                                    <div className="h-1 bg-indigo-500" />
                                    
                                    <div className="flex-1 p-3 flex flex-col relative">
                                        <div className="flex-1 flex flex-col justify-center">
                                            <p className="text-[10px] font-bold truncate w-full text-indigo-400 mb-0.5">{file.path.split(/[\\/]/).pop()}</p>
                                            <p className="text-[9px] font-black text-foreground-secondary opacity-60">{formatDuration(file.duration)}</p>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                                <GripVertical size={12} />
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRemoveFile(file.path); }}
                                                className="p-1.5 text-foreground-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>

                                        {/* Mock Waves Background */}
                                        <div className="absolute right-0 bottom-0 left-0 h-8 opacity-[0.03] pointer-events-none overflow-hidden">
                                            <div className="flex items-end gap-[1px] h-full p-1">
                                                {Array.from({ length: 40 }).map((_, i) => (
                                                    <div key={i} className="flex-1 bg-white rounded-full" style={{ height: `${20 + Math.random() * 80}%` }} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Duration Indicator */}
                                    <div className="h-1 bg-white/5" />
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    )}
                </div>
            </div>

            {/* Progress Overlay */}
            <AnimatePresence>
                {progress && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                    >
                        <div className="w-full max-w-sm bg-glass-background/90 backdrop-blur-xl rounded-3xl border border-border-glass p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-indigo-600/5 pointer-events-none" />
                            
                            <div className="relative text-center space-y-6">
                                <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 flex items-center justify-center mx-auto text-indigo-400">
                                    {progress.state === 'complete' ? <CheckCircle2 size={32} /> : progress.state === 'error' ? <AlertCircle size={32} /> : <Loader2 size={32} className="animate-spin" />}
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-lg font-black tracking-tight">
                                        {progress.state === 'analyzing' && 'Analyzing Assets'}
                                        {progress.state === 'processing' && 'Exporting Video'}
                                        {progress.state === 'complete' && 'Success!'}
                                        {progress.state === 'error' && 'Execution Failed'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-foreground-secondary uppercase tracking-widest leading-relaxed">
                                        {progress.state === 'processing' ? `Encoding clip sequences... ${Math.round(progress.percent)}%` : 'Preparing media buffer...'}
                                    </p>
                                </div>

                                {(progress.state === 'processing' || progress.state === 'analyzing') && (
                                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                        <motion.div 
                                            className="h-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                                            animate={{ width: `${progress.percent}%` }}
                                        />
                                    </div>
                                )}

                                <div className="flex flex-col gap-2 pt-4">
                                    {progress.state === 'complete' && outputPath && (
                                        <>
                                            <button 
                                                onClick={() => (window as any).videoMergerAPI?.openFile(outputPath)}
                                                className="w-full bg-white text-black py-3 rounded-xl text-xs font-black hover:bg-gray-200 transition-all"
                                            >
                                                PLAY VIDEO
                                            </button>
                                            <button 
                                                onClick={() => (window as any).videoMergerAPI?.showInFolder(outputPath)}
                                                className="w-full bg-white/5 text-white py-3 rounded-xl text-xs font-black hover:bg-white/10 transition-all"
                                            >
                                                OPEN FOLDER
                                            </button>
                                        </>
                                    )}
                                    {(progress.state === 'processing' || progress.state === 'analyzing') && (
                                        <button 
                                            onClick={() => (window as any).videoMergerAPI?.cancel('merging')}
                                            className="w-full bg-red-500/10 text-red-500 py-3 rounded-xl text-xs font-black hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <X size={14} />
                                            <span>CANCEL EXPORT</span>
                                        </button>
                                    ) || progress.state === 'complete' || progress.state === 'error' ? (
                                        <button 
                                            onClick={() => setProgress(null)}
                                            className="w-full bg-white/5 text-white py-3 rounded-xl text-xs font-black hover:bg-white/10 transition-all"
                                        >
                                            DISMISS
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VideoMerger;
