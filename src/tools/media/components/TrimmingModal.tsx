import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Check } from 'lucide-react';
import type { ExtendedVideoInfo } from '../../../types/video-merger';

interface TrimmingModalProps {
    file: ExtendedVideoInfo | null;
    trimmingIdx: number | null;
    onClose: () => void;
    onUpdateTrim: (idx: number, start: number, end: number) => void;
    onFinalizeTrim: () => void;
    formatDuration: (seconds: number) => string;
}

export const TrimmingModal: React.FC<TrimmingModalProps> = ({
    file,
    trimmingIdx,
    onClose,
    onUpdateTrim,
    onFinalizeTrim,
    formatDuration
}) => {
    return (
        <AnimatePresence>
            {trimmingIdx !== null && file && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md"
                >
                    <div className="w-full max-w-2xl bg-glass-background rounded-3xl border border-border-glass p-8 shadow-2xl relative">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                            <Scissors className="text-indigo-500" /> Trim Clip: <span className="text-foreground-secondary">{file.path.split(/[\\/]/).pop()}</span>
                        </h3>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between text-xs font-bold text-foreground-secondary">
                                    <span>Start: {formatDuration(file.startTime)}</span>
                                    <span className="text-indigo-400">Selected: {formatDuration(file.endTime - file.startTime)}</span>
                                    <span>End: {formatDuration(file.endTime)}</span>
                                </div>
                                
                                <div className="relative h-12 bg-white/5 rounded-xl border border-white/10 overflow-hidden flex items-center px-4">
                                    <input 
                                        type="range" min={0} max={file.duration} step={0.1}
                                        value={file.startTime}
                                        onChange={(e) => onUpdateTrim(trimmingIdx, Number(e.target.value), Math.max(Number(e.target.value) + 0.1, file.endTime))}
                                        onMouseUp={onFinalizeTrim}
                                        onTouchEnd={onFinalizeTrim}
                                        className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                    />
                                    <input 
                                        type="range" min={0} max={file.duration} step={0.1}
                                        value={file.endTime}
                                        onChange={(e) => onUpdateTrim(trimmingIdx, Math.min(Number(e.target.value) - 0.1, file.startTime), Number(e.target.value))}
                                        onMouseUp={onFinalizeTrim}
                                        onTouchEnd={onFinalizeTrim}
                                        className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                                    />
                                    
                                    <div className="h-8 bg-indigo-500/20 border-x-2 border-indigo-500 absolute" 
                                        style={{ 
                                            left: `${(file.startTime / file.duration) * 100}%`,
                                            right: `${100 - (file.endTime / file.duration) * 100}%`
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-foreground-secondary text-center">Drag the sliders to select the portion of video you want to keep.</p>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={onClose}
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
    );
};
