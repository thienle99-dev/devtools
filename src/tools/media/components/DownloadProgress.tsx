import React from 'react';
import { Button } from '@components/ui/Button';
import { Download, Clock, HardDrive, XCircle, ExternalLink, FolderOpen, CheckCircle2, Copy } from 'lucide-react';
import { formatSpeed, formatBytes as formatFileSize, formatDuration } from '@utils/format';

interface DownloadStatus {
    status: 'idle' | 'downloading' | 'success' | 'error';
    progress?: number;
    speed?: number;
    eta?: number;
    downloaded?: number;
    total?: number;
    message?: string;
    filename?: string;
    title?: string;
    url?: string;
    detailedLogs?: string[];
    platform?: string; // e.g. 'youtube', 'tiktok'
}

interface DownloadProgressProps {
    status: DownloadStatus;
    onCancel: () => void;
    isPlaylist?: boolean;
    currentItem?: number;
    totalItems?: number;
    onOpenFile?: () => void;
    onShowFolder?: () => void;
}

export const DownloadProgress: React.FC<DownloadProgressProps> = ({
    status,
    onCancel,
    onOpenFile,
    onShowFolder
}) => {
    // Determine progress bar style
    const progressBarStyle = status.status === 'success' 
        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
        : status.status === 'error'
            ? 'bg-red-500'
            : 'bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 animate-gradient-x';

    return (
        <div className="group relative bg-background-tertiary/30 border border-white/5 rounded-lg p-3 hover:bg-background-tertiary/50 transition-all">
            <div className="flex items-center gap-4">
                {/* Icon / Status */}
                <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        status.status === 'downloading' ? 'bg-blue-500/10 text-blue-400' :
                        status.status === 'success' ? 'bg-green-500/10 text-green-400' :
                        'bg-red-500/10 text-red-400'
                    }`}>
                        {status.status === 'downloading' ? <Download className="w-5 h-5 animate-pulse" /> :
                         status.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                         <XCircle className="w-5 h-5" />}
                    </div>
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0 grid gap-1">
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <h4 className="text-sm font-medium text-foreground-primary truncate pr-4 select-text cursor-text" title={status.title || status.filename || status.message}>
                            {status.title || status.filename || 'Downloading...'}
                        </h4>
                        {/* URL / Channel / Status Detail */}
                        {status.url && (
                             <div className="flex items-center gap-2 group/url">
                                <div className="text-[10px] text-foreground-secondary truncate font-mono opacity-60 max-w-[80%] select-text cursor-text" title={status.url}>
                                    {status.url}
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(status.url || '');
                                    }}
                                    className="opacity-0 group-hover/url:opacity-100 transition-opacity p-0.5 hover:bg-white/10 rounded"
                                    title="Copy URL"
                                >
                                    <Copy className="w-3 h-3 text-foreground-secondary" />
                                </button>
                             </div>
                        )}
                        <div className="flex justify-between items-center text-xs font-mono text-foreground-secondary mt-1">
                            <span>
                                {status.status === 'success' ? 'Completed' : 
                                status.status === 'error' ? 'Failed' : 
                                `${Math.round(status.progress || 0)}%`}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 bg-background/50 rounded-full overflow-hidden w-full">
                        <div 
                            className={`h-full rounded-full transition-all duration-300 ${progressBarStyle}`}
                            style={{ width: `${status.progress || 0}%` }}
                        />
                    </div>

                    {/* Meta Data */}
                    <div className="flex items-center gap-4 text-[10px] text-foreground-secondary font-mono mt-0.5">
                        {status.status === 'downloading' && (
                            <>
                                <span className="flex items-center gap-1">
                                    <Download className="w-3 h-3" />
                                    {formatSpeed(status.speed || 0)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <HardDrive className="w-3 h-3" />
                                    {formatFileSize(status.downloaded || 0)} / {formatFileSize(status.total || 0)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(status.eta || 0)}
                                </span>
                            </>
                        )}
                        {status.status === 'success' && (
                            <span className="flex items-center gap-1 text-green-400/80">
                                <HardDrive className="w-3 h-3" />
                                {formatFileSize(status.total || 0)}
                            </span>
                        )}
                        {status.status === 'error' && (
                            <span className="text-red-400/80 truncate max-w-[300px]">
                                {status.message || 'Unknown error'}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {status.status === 'downloading' && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={onCancel}
                            className="h-8 w-8 hover:bg-red-500/10 text-foreground-secondary hover:text-red-400 rounded-full"
                            title="Cancel Download"
                        >
                            <XCircle className="w-4 h-4" />
                        </Button>
                    )}
                    {status.status === 'success' && (
                        <>
                            <Button
                                onClick={onOpenFile}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 hover:bg-white/5 text-foreground-secondary hover:text-foreground-primary rounded-full"
                                title="Open File"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={onShowFolder}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 hover:bg-white/5 text-foreground-secondary hover:text-foreground-primary rounded-full"
                                title="Show in Folder"
                            >
                                <FolderOpen className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
