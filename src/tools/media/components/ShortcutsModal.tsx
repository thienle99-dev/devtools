import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md"
                    onClick={onClose}
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
                                onClick={onClose}
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
                                <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">S / Ctrl+K</kbd>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                <span className="text-sm text-foreground-secondary">Rewind / Slow</span>
                                <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">J</kbd>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                <span className="text-sm text-foreground-secondary">Stop / Pause</span>
                                <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">K</kbd>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                <span className="text-sm text-foreground-secondary">Forward / Fast</span>
                                <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">L</kbd>
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
                                <span className="text-sm text-foreground-secondary">Undo Action</span>
                                <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">Ctrl + Z</kbd>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                <span className="text-sm text-foreground-secondary">Redo Action</span>
                                <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">Ctrl + Y</kbd>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border-glass">
                                <span className="text-sm text-foreground-secondary">Show Shortcuts</span>
                                <kbd className="px-3 py-1 bg-foreground/[0.08] rounded-lg text-xs font-mono font-bold border border-border-glass">?</kbd>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                            <p className="text-xs text-indigo-500 font-bold">
                                💡 <span className="font-black">Pro Tip:</span> Use Shift for frame-by-frame precision, Ctrl for second-by-second jumps, and regular arrow keys for quick navigation!
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
