import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { VideoMergeProgress } from '../../../types/video-merger';

interface ExportResultModalProps {
    progress: VideoMergeProgress | null;
    outputPath: string | null;
    onDismiss: () => void;
    onPlay: () => void;
}

export const ExportResultModal: React.FC<ExportResultModalProps> = ({
    progress,
    outputPath,
    onDismiss,
    onPlay
}) => {
    return (
        <AnimatePresence>
            {progress && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm">
                    <div className="w-full max-w-sm glass-panel backdrop-blur-xl rounded-3xl border border-border-glass p-8 shadow-2xl relative">
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
                                    <button onClick={onPlay} className="w-full bg-foreground text-background py-4 rounded-xl text-xs font-black">PLAY RESULT</button>
                                )}
                                <button onClick={onDismiss} className="w-full bg-foreground/[0.05] py-4 rounded-xl text-xs font-black">DISMISS</button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
