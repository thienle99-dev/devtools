import React, { useState, useEffect, useRef } from 'react';
import { Download, Youtube, Video, Music, Film, Loader2, CheckCircle2, AlertCircle, Info, FileVideo, FolderOpen, ExternalLink, RotateCcw, Clock, HardDrive } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { VideoInfo } from './components/VideoInfo';
import { FormatsList } from './components/FormatsList';
import { ToastContainer, useToast } from '../../components/ui/Toast';

interface DownloadStatus {
    status: 'idle' | 'downloading' | 'success' | 'error';
    message?: string;
    progress?: number;
    filename?: string;
    detailedLogs?: string[];
}

interface VideoFormat {
    itag: number;
    quality: string;
    qualityLabel?: string;
    hasVideo: boolean;
    hasAudio: boolean;
    container: string;
    codecs?: string;
    bitrate?: number;
    audioBitrate?: number;
}

interface VideoInfoData {
    videoId: string;
    title: string;
    author: string;
    lengthSeconds: number;
    thumbnailUrl: string;
    description?: string;
    viewCount?: number;
    uploadDate?: string;
    formats: VideoFormat[];
    availableQualities: string[];
    hasVideo: boolean;
    hasAudio: boolean;
}

// Helper functions for formatting
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

const formatSpeed = (bytesPerSec: number): string => {
    if (bytesPerSec === 0) return '0 B/s';
    if (bytesPerSec > 1024 * 1024) {
        return `${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s`;
    }
    if (bytesPerSec > 1024) {
        return `${(bytesPerSec / 1024).toFixed(2)} KB/s`;
    }
    return `${bytesPerSec.toFixed(0)} B/s`;
};

const formatETA = (seconds: number): string => {
    if (seconds === 0 || !isFinite(seconds)) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
};

export const YoutubeDownloader: React.FC = () => {
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<'video' | 'audio' | 'best'>('video');
    const [quality, setQuality] = useState<string>('720p');
    const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({ status: 'idle' });
    const [videoInfo, setVideoInfo] = useState<VideoInfoData | null>(null);
    const [fetchingInfo, setFetchingInfo] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [downloadFolder, setDownloadFolder] = useState<string | null>(null);
    const [playlistInfo, setPlaylistInfo] = useState<any | null>(null);
    const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
    const [isPlaylist, setIsPlaylist] = useState(false);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const { toasts, removeToast, success, error, info } = useToast();

    const isValidYoutubeUrl = (url: string): boolean => {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
            /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
        ];
        return patterns.some(pattern => pattern.test(url));
    };

    const isPlaylistUrl = (url: string): boolean => {
        // Check for playlist patterns
        const playlistPatterns = [
            /[?&]list=([a-zA-Z0-9_-]+)/,  // ?list=PLxxx or &list=PLxxx
            /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,  // /playlist?list=PLxxx
        ];
        return playlistPatterns.some(pattern => pattern.test(url));
    };

    const handleDownload = async (isRetry = false) => {
        if (!url.trim()) {
            error('Invalid URL', 'Please enter a YouTube URL');
            setDownloadStatus({ status: 'error', message: 'Please enter a YouTube URL' });
            return;
        }

        if (!isValidYoutubeUrl(url)) {
            error('Invalid URL', 'Please enter a valid YouTube URL');
            setDownloadStatus({ status: 'error', message: 'Invalid YouTube URL' });
            return;
        }

        if (isRetry) {
            info('Retrying download', `Attempt ${retryCount + 1} of 3`);
        } else {
            info('Starting download', videoInfo?.title || 'Video');
            setRetryCount(0);
        }

        setDownloadStatus({ status: 'downloading', message: 'Preparing download...', progress: 0 });

        try {
            // Check if YouTube API is available
            if (!(window as any).youtubeAPI) {
                throw new Error('YouTube API not available');
            }

            // Set up progress listener
            const unsubscribe = (window as any).youtubeAPI.onProgress((progress: any) => {
                setDownloadStatus({
                    status: 'downloading',
                    message: `Downloading... ${progress.percent}%`,
                    progress: progress.percent
                });
            });

            // Start download
            const downloadOptions: any = {
                url,
                format,
                quality: format === 'audio' ? undefined : quality,
            };
            
            // Use custom folder if selected
            if (downloadFolder) {
                downloadOptions.outputPath = downloadFolder;
            }
            
            const result = await (window as any).youtubeAPI.download(downloadOptions);

            unsubscribe();

            if (result.success) {
                setDownloadStatus({
                    status: 'success',
                    message: 'Download completed successfully!',
                    filename: result.filepath
                });
                success('Download Complete!', videoInfo?.title || 'Video downloaded successfully');
                setRetryCount(0);
            } else {
                throw new Error(result.error || 'Download failed');
            }
        } catch (err: any) {
            const errorMessage = err instanceof Error ? err.message : 'Download failed';
            const logs = [
                `Time: ${new Date().toLocaleTimeString()}`,
                `Error: ${errorMessage}`,
                `Quality: ${quality}`,
                `Format: ${format}`,
                err.stack ? `Stack: ${err.stack.split('\n')[0]}` : '',
                err.statusCode ? `HTTP Status: ${err.statusCode}` : ''
            ].filter(Boolean);

            setDownloadStatus({
                status: 'error',
                message: errorMessage,
                detailedLogs: logs
            });
            
            // Auto-retry logic (max 3 attempts)
            if (!isRetry && retryCount < 2) {
                setRetryCount(retryCount + 1);
                error('Download Failed', `Will retry in 3 seconds... (Attempt ${retryCount + 1}/3)`);
                setTimeout(() => handleDownload(true), 3000);
            } else {
                error('Download Failed', errorMessage);
                if (retryCount >= 2) {
                    error('Max Retries Reached', 'Please try again later or check your internet connection');
                }
            }
        }
    };

    const handleFetchInfo = async () => {
        if (!url.trim()) {
            return;
        }

        if (!isValidYoutubeUrl(url)) {
            setDownloadStatus({ status: 'error', message: 'Invalid YouTube URL' });
            return;
        }

        setFetchingInfo(true);
        setVideoInfo(null);
        setPlaylistInfo(null);
        setDownloadStatus({ status: 'idle' });

        try {
            // Check if YouTube API is available
            if (!(window as any).youtubeAPI) {
                throw new Error('YouTube API not available');
            }

            // Check if it's a playlist URL
            if (isPlaylistUrl(url)) {
                setIsPlaylist(true);
                const playlist = await (window as any).youtubeAPI.getPlaylistInfo(url);
                setPlaylistInfo(playlist);
                
                // Auto-select all videos by default
                const allVideoIds = new Set<string>(playlist.videos.map((v: any) => v.id as string));
                setSelectedVideos(allVideoIds);
                
                success('Playlist Loaded', `${playlist.title} (${playlist.videoCount} videos)`);
            } else {
                setIsPlaylist(false);
                const info = await (window as any).youtubeAPI.getInfo(url);
                setVideoInfo(info);
                
                // Auto-select best available quality
                if (info.availableQualities && info.availableQualities.length > 0) {
                    setQuality(info.availableQualities[0]); // Select highest quality
                }
                
                success('Video Info Loaded', info.title);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch video info';
            setDownloadStatus({
                status: 'error',
                message: errorMessage
            });
            error('Failed to Load', errorMessage);
        } finally {
            setFetchingInfo(false);
        }
    };

    const handleOpenFile = async () => {
        if (downloadStatus.filename) {
            try {
                await (window as any).youtubeAPI.openFile(downloadStatus.filename);
                info('Opening File', 'Launching with default application...');
            } catch (err) {
                error('Failed to Open', 'Could not open the file');
            }
        }
    };

    const handleShowInFolder = async () => {
        if (downloadStatus.filename) {
            try {
                await (window as any).youtubeAPI.showInFolder(downloadStatus.filename);
                info('Showing File', 'Opening in file manager...');
            } catch (err) {
                error('Failed to Show', 'Could not open folder');
            }
        }
    };

    const handleRetry = () => {
        setRetryCount(0);
        handleDownload(false);
    };

    const handleClear = () => {
        setUrl('');
        setVideoInfo(null);
        setDownloadStatus({ status: 'idle' });
        setQuality('720p');
        setFormat('video');
    };

    const handleChooseFolder = async () => {
        try {
            const result = await (window as any).youtubeAPI.chooseFolder();
            if (!result.canceled && result.path) {
                setDownloadFolder(result.path);
                success('Folder Selected', `Downloads will be saved to: ${result.path}`);
            }
        } catch (err) {
            error('Failed to Choose Folder', 'Could not open folder picker');
        }
    };

    // Auto-fetch video info when URL changes
    useEffect(() => {
        // Clear previous timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Check if URL is valid
        if (url.trim() && isValidYoutubeUrl(url)) {
            // Debounce: wait 1 second after user stops typing
            debounceTimer.current = setTimeout(() => {
                handleFetchInfo();
            }, 1000);
        } else {
            // Clear video info if URL is invalid
            setVideoInfo(null);
        }

        // Cleanup
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [url]);


    return (
        <div className="h-full flex flex-col bg-background/50">
            <ToastContainer toasts={toasts} onClose={removeToast} />
            
            {/* Header */}
            <div className="px-4 py-3 border-b border-border-glass bg-glass-background/30 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-400">
                        <Youtube className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-red-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                            YouTube Video Downloader
                        </h1>
                        <p className="text-xs text-foreground-secondary">
                            Download videos and audio from YouTube in various formats and qualities
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Info Card */}
                    <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                        <div className="flex gap-3">
                            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-foreground-secondary">
                                <p className="font-medium text-blue-400 mb-1">Supported URLs:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>youtube.com/watch?v=VIDEO_ID</li>
                                    <li>youtu.be/VIDEO_ID</li>
                                    <li>youtube.com/shorts/VIDEO_ID</li>
                                </ul>
                            </div>
                        </div>
                    </Card>

                    {/* URL Input */}
                    <Card className="p-6">
                        <label className="block text-sm font-medium text-foreground-primary mb-2 flex items-center gap-2">
                            YouTube URL
                            {fetchingInfo && (
                                <span className="flex items-center gap-1.5 text-xs text-blue-400">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Fetching info...
                                </span>
                            )}
                        </label>
                        <div className="flex gap-2">
                            <Input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=... (auto-fetch on paste)"
                                className="flex-1"
                                disabled={downloadStatus.status === 'downloading'}
                            />
                            <Button
                                onClick={handleClear}
                                variant="outline"
                                disabled={!url || downloadStatus.status === 'downloading'}
                            >
                                Clear
                            </Button>
                        </div>
                    </Card>

                    {/* Video Info Preview */}
                    {videoInfo && (
                        <>
                            <VideoInfo {...videoInfo} />
                            
                            {/* Download Estimates Removed as they are now per item */}

                            {/* Available Formats */}
                            <FormatsList formats={videoInfo.formats} />
                        </>
                    )}

                    {/* Download Options */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground-primary">Download Options</h3>
                            <div className="flex bg-glass-panel rounded-lg p-1 border border-border-glass">
                                <button
                                    onClick={() => setFormat('video')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                        format === 'video' ? 'bg-red-500/20 text-red-400' : 'text-foreground-secondary hover:text-foreground'
                                    }`}
                                >
                                    Video + Audio
                                </button>
                                <button
                                    onClick={() => setFormat('audio')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                        format === 'audio' ? 'bg-pink-500/20 text-pink-400' : 'text-foreground-secondary hover:text-foreground'
                                    }`}
                                >
                                    Audio Only
                                </button>
                            </div>
                        </div>

                        {/* Download Location */}
                        <div className="mb-4 p-4 bg-background-secondary/50 rounded-lg border border-border-glass">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-foreground-primary flex items-center gap-2">
                                    <FolderOpen className="w-4 h-4 text-blue-400" />
                                    Download Location
                                </label>
                                <Button
                                    onClick={handleChooseFolder}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                >
                                    Choose Folder
                                </Button>
                            </div>
                            <p className="text-xs text-foreground-secondary font-mono truncate">
                                {downloadFolder || 'Default: System Downloads folder'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            {/* Quality Checklist */}
                            {format === 'video' ? (
                                (videoInfo?.availableQualities && videoInfo.availableQualities.length > 0
                                    ? videoInfo.availableQualities 
                                    : ['720p', '480p', '360p']
                                ).map((q) => {
                                    const labels: Record<string, string> = {
                                        '2160p': '4K Ultra HD',
                                        '1440p': '2K Quad HD',
                                        '1080p': 'Full HD',
                                        '720p': 'High Definition',
                                        '480p': 'Standard Definition',
                                        '360p': 'Medium Quality',
                                        '240p': 'Low Quality',
                                        '144p': 'Very Low Quality'
                                    };
                                    
                                    // Check if this quality is available as a combined format
                                    const isCombined = videoInfo?.formats?.some(f => 
                                        f.qualityLabel && f.qualityLabel.includes(q) && f.hasVideo && f.hasAudio
                                    );
                                    
                                    const lengthMB = (videoInfo?.lengthSeconds || 0) / 60;
                                    const qualityMultiplier = {
                                        '144p': 2, '240p': 4, '360p': 8, '480p': 15,
                                        '720p': 25, '1080p': 50, '1440p': 100, '2160p': 200, 'best': 50
                                    };
                                    const sizeEstimate = lengthMB * (qualityMultiplier[q as keyof typeof qualityMultiplier] || 25);
                                    const sizeStr = sizeEstimate < 1024 ? `${sizeEstimate.toFixed(0)} MB` : `${(sizeEstimate / 1024).toFixed(1)} GB`;

                                    return (
                                        <div 
                                            key={q}
                                            onClick={() => setQuality(q)}
                                            className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${
                                                quality === q 
                                                ? 'bg-red-500/10 border-red-500/50' 
                                                : 'bg-glass-panel border-border-glass hover:border-red-500/30'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                    quality === q ? 'border-red-500 bg-red-500' : 'border-border-glass'
                                                }`}>
                                                    {quality === q && <div className="w-2 h-2 rounded-full bg-white" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className={`text-sm font-semibold ${quality === q ? 'text-foreground-primary' : 'text-foreground-secondary'}`}>
                                                            {q} - {labels[q] || q}
                                                        </p>
                                                        {!isCombined && (
                                                            <span className="text-[8px] bg-yellow-500/20 text-yellow-400 px-1 rounded border border-yellow-500/30">
                                                                DASH (No Sound)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-foreground-tertiary">MP4 • {isCombined ? 'Video + Audio' : 'Video Only'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-bold ${quality === q ? 'text-red-400' : 'text-foreground-secondary'}`}>
                                                    {sizeStr}
                                                </p>
                                                <p className="text-[10px] text-foreground-tertiary">Size approx.</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div 
                                    onClick={() => setQuality('best')}
                                    className="flex items-center justify-between p-4 rounded-xl border bg-pink-500/10 border-pink-500/50 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <Music className="w-5 h-5 text-pink-400" />
                                        <div>
                                            <p className="text-sm font-semibold text-foreground-primary">High Quality Audio</p>
                                            <p className="text-[10px] text-foreground-tertiary">MP3 • 320kbps</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-pink-400">
                                            {(() => {
                                                const lengthMB = (videoInfo?.lengthSeconds || 0) / 60;
                                                const sizeEstimate = lengthMB * 1.5;
                                                return sizeEstimate < 1024 ? `${sizeEstimate.toFixed(0)} MB` : `${(sizeEstimate / 1024).toFixed(1)} GB`;
                                            })()}
                                        </p>
                                        <p className="text-[10px] text-foreground-tertiary">Size approx.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Download Button */}
                    <div className="flex justify-center gap-3">
                        <Button
                            onClick={() => handleDownload(false)}
                            disabled={!url || downloadStatus.status === 'downloading'}
                            className="min-w-[200px]"
                            size="lg"
                        >
                            {downloadStatus.status === 'downloading' ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Video
                                </>
                            )}
                        </Button>
                        
                        {downloadStatus.status === 'error' && (
                            <Button
                                onClick={handleRetry}
                                variant="outline"
                                size="lg"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Retry
                            </Button>
                        )}
                    </div>

                    {/* Status Display */}
                    {downloadStatus.status !== 'idle' && (
                        <Card className={`p-6 ${
                            downloadStatus.status === 'success' ? 'bg-green-500/5 border-green-500/20' :
                            downloadStatus.status === 'error' ? 'bg-red-500/5 border-red-500/20' :
                            'bg-blue-500/5 border-blue-500/20'
                        }`}>
                            <div className="flex items-start gap-3">
                                {downloadStatus.status === 'downloading' && (
                                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0 mt-0.5" />
                                )}
                                {downloadStatus.status === 'success' && (
                                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                )}
                                {downloadStatus.status === 'error' && (
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className={`font-medium ${
                                        downloadStatus.status === 'success' ? 'text-green-400' :
                                        downloadStatus.status === 'error' ? 'text-red-400' :
                                        'text-blue-400'
                                    }`}>
                                        {downloadStatus.message}
                                    </p>

                                    {downloadStatus.status === 'error' && downloadStatus.detailedLogs && (
                                        <div className="mt-3 p-3 bg-black/40 rounded-lg border border-red-500/20 font-mono text-[10px] text-red-300">
                                            <p className="font-bold mb-1 uppercase text-[9px] opacity-70">Error Diagnostic Logs:</p>
                                            {downloadStatus.detailedLogs.map((log, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <span className="opacity-40">[{i+1}]</span>
                                                    <span>{log}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {downloadStatus.status === 'downloading' && downloadStatus.progress !== undefined && (
                                        <div className="mt-4 space-y-3">
                                            {/* Progress Bar */}
                                            <div>
                                                <div className="flex justify-between text-sm text-foreground-secondary mb-2">
                                                    <span className="font-medium">Downloading...</span>
                                                    <span className="font-mono font-semibold text-blue-400">{downloadStatus.progress}%</span>
                                                </div>
                                                <div className="w-full h-3 bg-background-tertiary rounded-full overflow-hidden relative">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300 relative"
                                                        style={{ width: `${downloadStatus.progress}%` }}
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Download Stats Grid */}
                                            <div className="grid grid-cols-2 gap-3 pt-2">
                                                {/* Speed */}
                                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                                        <span className="text-xs text-foreground-secondary uppercase tracking-wide">Speed</span>
                                                    </div>
                                                    <p className="text-lg font-bold text-blue-400 font-mono">
                                                        {formatSpeed((downloadStatus as any).speed || 0)}
                                                    </p>
                                                </div>

                                                {/* ETA */}
                                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Clock className="w-3 h-3 text-purple-400" />
                                                        <span className="text-xs text-foreground-secondary uppercase tracking-wide">ETA</span>
                                                    </div>
                                                    <p className="text-lg font-bold text-purple-400 font-mono">
                                                        {formatETA((downloadStatus as any).eta || 0)}
                                                    </p>
                                                </div>

                                                {/* Downloaded */}
                                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Download className="w-3 h-3 text-green-400" />
                                                        <span className="text-xs text-foreground-secondary uppercase tracking-wide">Downloaded</span>
                                                    </div>
                                                    <p className="text-lg font-bold text-green-400 font-mono">
                                                        {formatBytes((downloadStatus as any).downloaded || 0)}
                                                    </p>
                                                </div>

                                                {/* Total Size */}
                                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <HardDrive className="w-3 h-3 text-orange-400" />
                                                        <span className="text-xs text-foreground-secondary uppercase tracking-wide">Total</span>
                                                    </div>
                                                    <p className="text-lg font-bold text-orange-400 font-mono">
                                                        {formatBytes((downloadStatus as any).total || 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {downloadStatus.status === 'success' && downloadStatus.filename && (
                                        <>
                                            <p className="text-sm text-foreground-secondary mt-2">
                                                File: {downloadStatus.filename.split(/[/\\]/).pop()}
                                            </p>
                                            <div className="flex gap-2 mt-4">
                                                <Button
                                                    onClick={handleOpenFile}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                                    Open File
                                                </Button>
                                                <Button
                                                    onClick={handleShowInFolder}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                >
                                                    <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                                                    Show in Folder
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Features Info */}
                    <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
                        <h3 className="text-lg font-semibold text-foreground-primary mb-4 flex items-center gap-2">
                            <FileVideo className="w-5 h-5 text-purple-400" />
                            Features
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground-secondary">
                            <div className="flex items-start gap-2">
                                <Video className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground-primary">Multiple Formats</p>
                                    <p>Video (MP4) and Audio (MP3) downloads</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Film className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground-primary">Quality Selection</p>
                                    <p>Choose from 144p to 1080p quality</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Download className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground-primary">Fast Downloads</p>
                                    <p>Optimized download with progress tracking</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <Music className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-foreground-primary">Audio Extract</p>
                                    <p>Extract audio as MP3 from any video</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default YoutubeDownloader;

