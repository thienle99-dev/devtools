import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import type { VideoMergeProgress } from '../../../types/video-merger';

interface AssetLoadingModalProps {
    isOpen: boolean;
    isLoadingAssets: boolean;
    assetLoadingProgress: number;
    progress: VideoMergeProgress | null;
    loadingDetail: {
        fileName: string;
        stage: string;
        current: number;
        total: number;
    };
}

export const AssetLoadingModal: React.FC<AssetLoadingModalProps> = ({
    isOpen,
    isLoadingAssets,
    assetLoadingProgress,
    progress,
    loadingDetail
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="glass-panel backdrop-blur-xl rounded-3xl border border-border-glass p-10 shadow-2xl max-w-lg w-full mx-4"
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
                                        className="text-foreground/10"
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
                                    <span className="text-2xl font-black text-foreground">
                                        {Math.round(isLoadingAssets ? assetLoadingProgress : (progress?.percent || 0))}%
                                    </span>
                                </div>
                            </div>

                            {/* Status Text */}
                            <div className="text-center space-y-2 w-full">
                                <h3 className="text-xl font-black text-foreground">
                                    {isLoadingAssets ? 'Loading Assets' : 'Exporting Project'}
                                </h3>

                                {/* Detailed Loading Info */}
                                {isLoadingAssets && loadingDetail.fileName && (
                                    <div className="space-y-2 mt-4">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-foreground-secondary font-medium">File:</span>
                                            <span className="text-indigo-500 font-bold">
                                                {loadingDetail.current}/{loadingDetail.total}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground font-bold truncate px-4" title={loadingDetail.fileName}>
                                            {loadingDetail.fileName}
                                        </p>
                                        <p className="text-xs text-foreground-secondary font-medium">
                                            {loadingDetail.stage}
                                        </p>
                                    </div>
                                )}

                                {!isLoadingAssets && (
                                    <p className="text-sm text-foreground-secondary font-medium">
                                        Please wait while we process your video...
                                    </p>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-foreground/[0.05] h-2 rounded-full overflow-hidden">
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
    );
};
