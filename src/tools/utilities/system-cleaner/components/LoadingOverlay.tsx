import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    progress: number;
    status?: string;
    title?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ progress, status, title }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 dark:bg-black/50 bg-white/60 backdrop-blur-md z-50 flex flex-col items-center justify-center"
    >
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-white/10 dark:from-white/10 to-white/5 dark:to-white/5 backdrop-blur-xl border border-white/20 dark:border-white/20 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
        >
            <div className="flex flex-col items-center space-y-6">
                {/* Spinner */}
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                    <div className="relative p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 backdrop-blur-sm">
                        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
                    </div>
                </div>
                
                {/* Title and Status */}
                <div className="text-center space-y-3 w-full">
                    {title && (
                        <h3 className="text-xl font-bold text-foreground">{title}</h3>
                    )}
                    {status && (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                            <p className="text-sm text-indigo-400 font-medium">{status}</p>
                        </div>
                    )}
                </div>
                
                {/* Progress bar */}
                <div className="w-full space-y-3">
                    <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden border border-border-glass">
                        <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 relative overflow-hidden"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                        </motion.div>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 backdrop-blur-sm">
                            <span className="text-lg font-bold text-indigo-400">{Math.round(progress)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    </motion.div>
);

