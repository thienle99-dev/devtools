import React from 'react';
import {
    Play,
    Pause,
    X,
    Folder,
    Clock,
    Zap,
    FileText,
    ExternalLink,
    Archive,
    CheckCircle2,
    AlertCircle,
    FileCode,
    FileImage,
    FileAudio,
    FileVideo,
    Binary,
    Lock,
    Fingerprint,
    ShieldCheck,
    ShieldAlert
} from 'lucide-react';
import { cn } from '@utils/cn';
import { formatBytes, formatTime } from '@utils/format';
import { Button } from '@components/ui/Button';
import type { DownloadTask } from '@/types/network/download';

interface DownloadItemProps {
    task: DownloadTask;
    onStart: (id: string) => void;
    onPause: (id: string) => void;
    onCancel: (id: string) => void;
    onOpenFolder: (path: string) => void;
    onVerifyChecksum: (id: string) => void;
    viewMode?: 'list' | 'grid';
}

export const DownloadItem: React.FC<DownloadItemProps> = ({
    task,
    onStart,
    onPause,
    onCancel,
    onOpenFolder,
    onVerifyChecksum,
    viewMode = 'list'
}) => {
    const isDownloading = task.status === 'downloading';
    const isCompleted = task.status === 'completed';
    const isFailed = task.status === 'failed';

    const progress = (task.downloadedSize / task.totalSize) * 100 || 0;

    const getCategoryInfo = () => {
        switch (task.category) {
            case 'music': return { icon: FileAudio, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-500/10' };
            case 'video': return { icon: FileVideo, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' };
            case 'document': return { icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' };
            case 'image': return { icon: FileImage, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' };
            case 'program': return { icon: Binary, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' };
            case 'compressed': return { icon: Archive, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' };
            default: return { icon: FileCode, color: 'text-foreground-tertiary', bg: 'bg-foreground-primary/10' };
        }
    };

    const { icon: CategoryIcon, color: categoryColor, bg: categoryBg } = getCategoryInfo();

    return (
        <div className={cn(
            "group relative bg-bg-glass-panel border-border-glass border rounded-2xl p-3 transition-all duration-500 ease-out",
            isDownloading
                ? "border-blue-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.3)] scale-[1.005]"
                : "hover:border-glass-border-hover hover:bg-bg-glass-hover"
        )}>
            {/* Background Glow for Active Tasks */}
            {isDownloading && (
                <div className="absolute inset-0 bg-blue-500/[0.02] rounded-2xl pointer-events-none" />
            )}

            <div className="relative flex items-center gap-4">
                {/* 1. Compact Icon with Status Badge */}
                <div className="relative shrink-0">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 relative overflow-hidden ring-1",
                        isCompleted ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" :
                            isFailed ? "bg-rose-500/10 text-rose-400 ring-rose-500/20" :
                                isDownloading ? "bg-blue-600/15 text-blue-400 ring-blue-500/30" :
                                    `${categoryBg} ${categoryColor} ring-border-glass`
                    )}>
                        <CategoryIcon className={cn("w-5 h-5 relative z-10", isDownloading && "animate-pulse")} />
                    </div>

                    {/* Status Dot */}
                    <div className="absolute -bottom-0.5 -right-0.5">
                        {isDownloading ? (
                            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-bg-glass-panel animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        ) : isCompleted ? (
                            <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-bg-glass-panel" />
                        ) : isFailed ? (
                            <div className="w-3 h-3 rounded-full bg-rose-500 border-2 border-bg-glass-panel" />
                        ) : null}
                    </div>
                </div>

                {/* 2. Main Content Feed */}
                <div className={cn(
                    "flex-1 min-w-0 flex gap-3",
                    viewMode === 'list' ? "flex-col sm:flex-row sm:items-center sm:gap-6" : "flex-col"
                )}>
                    {/* Name & Metadata */}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-bold text-foreground truncate leading-tight mb-0.5 group-hover:text-blue-500 transition-colors" title={task.filename}>
                            {task.filename}
                        </h4>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-wider text-foreground-tertiary">
                            <span className={cn("opacity-80 transition-colors", categoryColor)}>{task.category}</span>
                            <span className="opacity-40">•</span>
                            <span className="tabular-nums">{formatBytes(task.downloadedSize)} / {formatBytes(task.totalSize)}</span>
                            {task.credentials && (
                                <>
                                    <span className="opacity-40">•</span>
                                    <Lock className="w-2.5 h-2.5 text-amber-500" />
                                </>
                            )}
                            {task.checksum && (
                                <>
                                    <span className="opacity-40">•</span>
                                    <Fingerprint className={cn("w-2.5 h-2.5", task.checksum.verified === true ? "text-emerald-500" : task.checksum.verified === false ? "text-rose-500" : "text-blue-500")} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stats & Progress */}
                    <div className={cn(
                        "flex flex-col gap-1.5 shrink-0",
                        viewMode === 'list' ? "sm:items-end sm:min-w-[140px]" : "w-full"
                    )}>
                        {task.error ? (
                            <div className="text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 max-w-full truncate mb-0.5" title={task.error}>
                                {task.error}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-3 w-full">
                                {isDownloading && (
                                    <span className="text-[10px] font-black text-blue-500 tabular-nums uppercase tracking-tighter flex items-center gap-1">
                                        <Zap className="w-2.5 h-2.5" />
                                        {formatBytes(task.speed)}/s
                                    </span>
                                )}
                                <span className={cn(
                                    "text-[11px] font-black tabular-nums transition-colors",
                                    isDownloading ? "text-blue-500" : "text-foreground-secondary"
                                )}>
                                    {progress.toFixed(1)}%
                                </span>
                            </div>
                        )}

                        {/* Ultra Thin Progress Bar */}
                        <div className="h-1 w-full bg-foreground-muted/10 rounded-full overflow-hidden border border-border-glass relative">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-700 ease-out",
                                    isCompleted ? "bg-emerald-500" :
                                        isFailed ? "bg-rose-500" :
                                            "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                                )}
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        {/* Smaller metadata for error case */}
                        {task.error && (
                            <span className="text-[9px] font-black tabular-nums text-foreground-tertiary">
                                {progress.toFixed(1)}%
                            </span>
                        )}
                    </div>

                    {/* Time (List mode only for spacing) */}
                    {viewMode === 'list' && isDownloading && task.eta > 0 && !task.error && (
                        <div className="hidden xl:flex items-center gap-1.5 text-[9px] font-black text-foreground-tertiary uppercase min-w-[70px] shrink-0 opacity-60">
                            <Clock className="w-3 h-3" />
                            {formatTime(task.eta)}
                        </div>
                    )}
                </div>

                {/* 3. Actions - Always visible, Compact Pills */}
                <div className="flex items-center gap-1 shrink-0">
                    {isCompleted && task.checksum && (
                        <button
                            onClick={() => onVerifyChecksum(task.id)}
                            title={task.checksum.verified === true ? "Verified" : task.checksum.verified === false ? "Verification Failed" : "Verify Integrity"}
                            className={cn(
                                "w-7 h-7 flex items-center justify-center rounded-lg transition-all border border-transparent",
                                task.checksum.verified === true ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" :
                                    task.checksum.verified === false ? "text-rose-500 bg-rose-500/10 border-rose-500/20" :
                                        "text-blue-400 hover:bg-blue-400/10 hover:border-blue-400/20"
                            )}
                        >
                            {task.checksum.verified === true ? <ShieldCheck className="w-4 h-4" /> :
                                task.checksum.verified === false ? <ShieldAlert className="w-4 h-4" /> :
                                    <Fingerprint className="w-3.5 h-3.5" />}
                        </button>
                    )}
                    {!isCompleted && !isFailed && (
                        <button
                            onClick={() => isDownloading ? onPause(task.id) : onStart(task.id)}
                            className={cn(
                                "w-7 h-7 flex items-center justify-center rounded-lg transition-all border border-transparent",
                                isDownloading ? "text-amber-400 hover:bg-amber-400/10 hover:border-amber-400/20" : "text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/20"
                            )}
                        >
                            {isDownloading ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                        </button>
                    )}
                    <button
                        onClick={() => isCompleted ? onOpenFolder(task.filepath) : onCancel(task.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground-tertiary hover:text-foreground-primary hover:bg-foreground-primary/10 border border-transparent hover:border-border-glass"
                    >
                        {isCompleted ? <Folder className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </button>

                    {/* Tiny URL Link */}
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg text-foreground-tertiary hover:text-blue-400 hover:bg-blue-400/10 border border-transparent hover:border-blue-400/20" title={task.url}>
                        <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

        </div>
    );
};
