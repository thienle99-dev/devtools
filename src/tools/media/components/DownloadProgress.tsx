import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Download, Clock, HardDrive, Terminal, XCircle, ExternalLink, FolderOpen } from 'lucide-react';
import { formatSpeed, formatFileSize, formatDuration } from '../utils/youtube-helpers';

interface DownloadStatus {
    status: 'idle' | 'downloading' | 'success' | 'error';
    progress?: number;
    speed?: number;
    eta?: number;
    downloaded?: number;
    total?: number;
    message?: string;
    filename?: string;
    detailedLogs?: string[];
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
    isPlaylist,
    currentItem,
    totalItems,
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
        <Card className="p-6 bg-glass-panel border-border-glass relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-r from-red-500/5 via-pink-500/5 to-purple-500/5 animate-pulse transition-opacity duration-1000 ${
                status.status === 'downloading' ? 'opacity-100' : 'opacity-0'
            }`} />

            <div className="relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        {status.status === 'downloading' ? (
                            <>
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                {isPlaylist ? `Downloading Video ${currentItem}/${totalItems}...` : 'Downloading...'}
                            </>
                        ) : status.status === 'success' ? (
                            <span className="text-green-400 flex items-center gap-2">
                                <Download className="w-5 h-5" /> Download Complete
                            </span>
                        ) : status.status === 'error' ? (
                            <span className="text-red-400">Download Failed</span>
                        ) : 'Ready'}
                    </h3>
                    
                    {status.status === 'downloading' && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={onCancel}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel
                        </Button>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="h-4 bg-background/50 rounded-full overflow-hidden mb-6 border border-white/5 relative shadow-inner">
                    <div 
                        className={`h-full transition-all duration-300 ease-out shadow-[0_0_10px_2px_rgba(239,68,68,0.3)] ${progressBarStyle}`}
                        style={{ width: `${status.progress || 0}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tracking-wider text-white mix-blend-difference">
                        {Math.round(status.progress || 0)}%
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-background/40 rounded-lg p-3 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                            <Download className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase">Speed</span>
                        </div>
                        <p className="font-mono text-lg font-bold text-foreground-primary">
                            {formatSpeed(status.speed || 0)}
                        </p>
                    </div>

                    <div className="bg-background/40 rounded-lg p-3 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-purple-400 mb-1">
                            <HardDrive className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase">Size</span>
                        </div>
                        <p className="font-mono text-lg font-bold text-foreground-primary">
                            {formatFileSize(status.total || 0)}
                        </p>
                    </div>

                    <div className="bg-background/40 rounded-lg p-3 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-green-400 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase">ETA</span>
                        </div>
                        <p className="font-mono text-lg font-bold text-foreground-primary">
                            {formatDuration(status.eta || 0)}
                        </p>
                    </div>
                    
                    <div className="bg-background/40 rounded-lg p-3 border border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-orange-400 mb-1">
                            <Terminal className="w-4 h-4" />
                            <span className="text-xs font-medium uppercase">Downloaded</span>
                        </div>
                        <p className="font-mono text-lg font-bold text-foreground-primary">
                            {formatFileSize(status.downloaded || 0)}
                        </p>
                    </div>
                </div>
                
                {/* Filename / Message */}
                <div className="text-sm text-foreground-secondary font-mono bg-black/20 p-2 rounded border border-white/5 truncate">
                    {status.message || status.filename || 'Waiting for database...'}
                </div>

                {/* Success Actions */}
                {status.status === 'success' && (
                    <div className="flex gap-2 mt-4 animate-in fade-in slide-in-from-bottom-2">
                        <Button
                            onClick={onOpenFile}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-green-500/20 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                        >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Open File
                        </Button>
                        <Button
                            onClick={onShowFolder}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-blue-500/20 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                        >
                            <FolderOpen className="w-4 h-4 mr-2" />
                            Show in Folder
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
};
