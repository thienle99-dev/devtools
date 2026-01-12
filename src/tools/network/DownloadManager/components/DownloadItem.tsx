import React from 'react';
import {
    Play,
    Pause,
    X,
    Folder,
    Clock,
    Zap,
    CheckCircle2,
    AlertCircle,
    FileText,
    ExternalLink
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

    return (
        <div className={cn(
            "group relative bg-glass-panel border rounded-xl p-4 transition-all duration-300",
            isDownloading ? "border-blue-500/30 bg-blue-500/5" : "border-border-glass hover:border-white/20"
        )}>
            <div className="flex items-start gap-4">
                {/* File Icon */}
                <div className={cn(
                    "p-3 rounded-lg flex items-center justify-center",
                    isCompleted ? "bg-green-500/10 text-green-400" :
                        isFailed ? "bg-red-500/10 text-red-400" :
                            isDownloading ? "bg-blue-500/10 text-blue-400" :
                                "bg-white/5 text-foreground-muted"
                )}>
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> :
                        isFailed ? <AlertCircle className="w-6 h-6" /> :
                            <FileText className="w-6 h-6" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-foreground-primary truncate pr-4" title={task.filename}>
                            {task.filename}
                        </h4>
                        <div className="flex items-center gap-1 shrink-0">
                            {isDownloading && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-foreground-secondary hover:text-foreground"
                                    onClick={() => onPause(task.id)}
                                >
                                    <Pause className="w-4 h-4" />
                                </Button>
                            )}
                            {(isPaused || isQueued || isFailed) && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300"
                                    onClick={() => onStart(task.id)}
                                >
                                    <Play className="w-4 h-4 ml-0.5" />
                                </Button>
                            )}
                            {isCompleted ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-foreground-secondary hover:text-foreground"
                                    onClick={() => onOpenFolder(task.filepath)}
                                >
                                    <Folder className="w-4 h-4" />
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-foreground-secondary hover:text-red-400"
                                    onClick={() => onCancel(task.id)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-foreground-muted mb-3">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>{formatBytes(task.totalSize)}</span>
                        {isDownloading && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-blue-400">
                                    <Zap className="w-3.5 h-3.5" />
                                    {formatBytes(task.speed || 0)}/s
                                </span>
                                <span>•</span>
                                <span>{formatTime(task.eta || 0)} left</span>
                            </>
                        )}
                        {isCompleted && (
                            <>
                                <span>•</span>
                                <span className="text-green-500 font-medium">Completed</span>
                            </>
                        )}
                        {isFailed && (
                            <>
                                <span>•</span>
                                <span className="text-red-500 font-medium">Failed</span>
                            </>
                        )}
                        {isPaused && (
                            <>
                                <span>•</span>
                                <span className="text-yellow-500 font-medium">Paused</span>
                            </>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {!isCompleted && !isFailed && (
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                            <div
                                className={cn(
                                    "h-full transition-all duration-300 ease-out",
                                    isDownloading ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-foreground-muted"
                                )}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}

                    {/* URL */}
                    <div className="flex items-center gap-1.5 text-[10px] text-foreground-tertiary truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate">{task.url}</span>
                    </div>
                </div>
            </div>

            {/* Segments Visualization (Subtle) */}
            {isDownloading && task.segments && task.segments.length > 0 && (
                <div className="mt-3 flex gap-0.5 h-1 px-1">
                    {task.segments.map((segment: DownloadSegment, i: number) => {
                        const segProgress = (segment.downloaded / (segment.end - segment.start)) * 100 || 0;
                        return (
                            <div key={i} className="flex-1 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-400 opacity-60"
                                    style={{ width: `${segProgress}%` }}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
