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
    Music,
    Video,
    Box,
    Cpu,
    FileCode
} from 'lucide-react';
import { cn } from '@utils/cn';
import { formatBytes, formatTime } from '@utils/format';
import { Button } from '@components/ui/Button';
import type { DownloadTask, DownloadSegment } from '@/types/network/download';

interface DownloadItemProps {
    task: DownloadTask;
    onStart: (id: string) => void;
    onPause: (id: string) => void;
    onCancel: (id: string) => void;
    onOpenFolder: (path: string) => void;
}

export const DownloadItem: React.FC<DownloadItemProps> = ({
    task,
    onStart,
    onPause,
    onCancel,
    onOpenFolder
}) => {
    const isDownloading = task.status === 'downloading';
    const isPaused = task.status === 'paused';
    const isCompleted = task.status === 'completed';
    const isFailed = task.status === 'failed';
    const isQueued = task.status === 'queued';

    const progress = (task.downloadedSize / task.totalSize) * 100 || 0;

    const getCategoryIcon = () => {
        switch (task.category) {
            case 'music': return Music;
            case 'video': return Video;
            case 'document': return FileText;
            case 'program': return Cpu;
            case 'compressed': return Box;
            default: return FileCode;
        }
    };

    const CategoryIcon = getCategoryIcon();

    return (
        <div className={cn(
            "group relative bg-bg-glass-panel dark:bg-bg-glass-panel backdrop-blur-xl border rounded-2xl p-4 transition-all duration-500",
            isDownloading
                ? "border-blue-500/40 ring-1 ring-blue-500/10 shadow-[0_0_25px_rgba(59,130,246,0.15)]"
                : "border-border-glass hover:border-foreground-primary/20 hover:bg-foreground-primary/5 active:scale-[0.99]"
        )}>
            {/* Background Accent */}
            <div className={cn(
                "absolute inset-0 rounded-2xl opacity-0 truncate group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
                "bg-gradient-to-br from-blue-500/5 via-transparent to-transparent"
            )} />

            <div className="relative flex items-center gap-5">
                {/* File Icon with Status Ring */}
                <div className="relative shrink-0">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 shadow-inner",
                        isCompleted ? "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 group-hover:bg-emerald-500/20 shadow-emerald-500/5" :
                            isFailed ? "bg-rose-500/10 text-rose-500 dark:text-rose-400 group-hover:bg-rose-500/20 shadow-rose-500/5" :
                                isDownloading ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500/20 shadow-blue-500/5" :
                                    "bg-foreground-primary/10 text-foreground-tertiary group-hover:bg-foreground-primary/20 shadow-white/5"
                    )}>
                        <CategoryIcon className="w-6 h-6" />
                    </div>

                    {/* Status Dot */}
                    {isDownloading && (
                        <div className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-[#161b22]"></span>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="min-w-0">
                            <h4 className="text-[14px] font-bold text-foreground-primary truncate pr-4 leading-tight mb-0.5" title={task.filename}>
                                {task.filename}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-foreground-tertiary font-medium">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                                <span>•</span>
                                <span className="uppercase tracking-wider opacity-80">{task.category}</span>
                            </div>
                        </div>

                        {/* Controls - macOS Style Rounded Pill */}
                        <div className="flex items-center bg-foreground-muted/5 rounded-full p-0.5 border border-border-glass hidden group-hover:flex transition-all">
                            {isDownloading ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 rounded-full text-foreground-secondary hover:bg-foreground-primary/10"
                                    onClick={() => onPause(task.id)}
                                >
                                    <Pause className="w-3.5 h-3.5" />
                                </Button>
                            ) : (isPaused || isQueued || isFailed) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 rounded-full text-blue-400 hover:bg-blue-400/10"
                                    onClick={() => onStart(task.id)}
                                >
                                    <Play className="w-3.5 h-3.5 ml-0.5" />
                                </Button>
                            )}

                            {isCompleted ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 rounded-full text-foreground-secondary hover:bg-foreground-primary/10"
                                    onClick={() => onOpenFolder(task.filepath)}
                                >
                                    <Folder className="w-3.5 h-3.5" />
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 rounded-full text-foreground-secondary hover:text-rose-400 hover:bg-rose-400/10"
                                    onClick={() => onCancel(task.id)}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            )}
                        </div>

                        {/* Status Label (Visible when not hoving) */}
                        <div className="group-hover:hidden flex items-center shrink-0">
                            {isCompleted && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">Done</span>}
                            {isFailed && <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">Error</span>}
                            {isPaused && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold border border-amber-500/20">Pause</span>}
                            {isQueued && <span className="px-2 py-0.5 rounded-full bg-foreground-tertiary/10 text-foreground-tertiary text-[10px] font-bold border border-border-glass">Queue</span>}
                            {isDownloading && <span className="text-blue-400 text-[10px] font-bold tabular-nums tracking-tight">{progress.toFixed(1)}%</span>}
                        </div>
                    </div>

                    {/* Meta Stats Row */}
                    <div className="flex items-center gap-3 text-[11px] mb-3">
                        <span className="font-bold text-foreground-secondary">{formatBytes(task.downloadedSize)} / {formatBytes(task.totalSize)}</span>

                        {isDownloading && (
                            <div className="flex items-center gap-3 ml-auto animate-in fade-in slide-in-from-right-2">
                                <span className="flex items-center gap-1 text-blue-400 font-bold">
                                    <Zap className="w-3 h-3" />
                                    {formatBytes(task.speed || 0)}/s
                                </span>
                                <span className="text-foreground-tertiary font-medium">{formatTime(task.eta || 0)} left</span>
                            </div>
                        )}
                    </div>

                    {/* Modern Progress Bar */}
                    {!isCompleted && !isFailed && (
                        <div className="relative w-full h-1.5 bg-foreground-primary/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "absolute top-0 left-0 h-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                                    isDownloading ? "bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-foreground-muted"
                                )}
                                style={{ width: `${progress}%` }}
                            />
                            {/* Glass overlay on progress */}
                            <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>

            {/* Futuristic Segments Visualization */}
            {isDownloading && task.segments && task.segments.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border-glass">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground-tertiary">Segment Grid</span>
                        <div className="flex gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-blue-500/50" />
                            <span className="w-1 h-1 rounded-full bg-blue-500/30" />
                        </div>
                    </div>
                    <div className="flex gap-1 h-1.5">
                        {task.segments.map((segment: DownloadSegment, i: number) => {
                            const segProgress = (segment.downloaded / (segment.end - segment.start)) * 100 || 0;
                            return (
                                <div key={i} className="flex-1 bg-foreground-primary/5 dark:bg-white/[0.03] rounded-sm overflow-hidden border border-border-glass">
                                    <div
                                        className={cn(
                                            "h-full transition-all duration-1000 ease-out",
                                            segment.status === 'completed' ? "bg-emerald-500/40" : "bg-gradient-to-r from-blue-500 to-blue-300 shadow-[0_0_5px_rgba(59,130,246,0.4)]"
                                        )}
                                        style={{ width: `${segProgress}%` }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Hover URL Peek */}
            <div className="mt-2 flex items-center gap-1.5 text-[9px] text-foreground-tertiary truncate opacity-0 group-hover:opacity-40 transition-all duration-500 delay-150">
                <ExternalLink className="w-2.5 h-2.5" />
                <span className="truncate tracking-wide">{task.url}</span>
            </div>
        </div>
    );
};
