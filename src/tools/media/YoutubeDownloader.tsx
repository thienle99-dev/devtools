import React, { useState, useEffect, useRef } from 'react';
import { Download, Youtube, Video, Music, Film, Loader2, CheckCircle2, AlertCircle, Info, FileVideo, FolderOpen, ExternalLink, RotateCcw, Clock, HardDrive, Settings } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { VideoInfo } from './components/VideoInfo';
import { FormatsList } from './components/FormatsList';
import { PlaylistView } from './components/PlaylistView';
import { ToastContainer, useToast } from '../../components/ui/Toast';

interface DownloadStatus {
    status: 'idle' | 'downloading' | 'success' | 'error';
    message?: string;
    progress?: number;
    filename?: string;
    detailedLogs?: string[];
}

interface AppSettings {
    downloadPath?: string;
    defaultVideoQuality: string;
    defaultAudioQuality: string;
    maxConcurrentDownloads: number;
    maxSpeedLimit?: string;
    ffmpegPath?: string;
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

const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const YoutubeDownloader: React.FC = () => {
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<'video' | 'audio' | 'best'>('video');
    const [quality, setQuality] = useState<string>('720p');
    const [container, setContainer] = useState<string>('mp4');
    const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({ status: 'idle' });
    const [videoInfo, setVideoInfo] = useState<VideoInfoData | null>(null);
    const [fetchingInfo, setFetchingInfo] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [downloadFolder, setDownloadFolder] = useState<string | null>(null);
    const [playlistInfo, setPlaylistInfo] = useState<any | null>(null);
    const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
    const [isPlaylist, setIsPlaylist] = useState(false);
    const [view, setView] = useState<'download' | 'history' | 'settings'>('download');
    const [history, setHistory] = useState<any[]>([]);
    const [settings, setSettings] = useState<AppSettings>({
        defaultVideoQuality: '1080p',
        defaultAudioQuality: '0',
        maxConcurrentDownloads: 3,
        maxSpeedLimit: ''
    });
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const isCancelledRef = useRef(false);
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
                quality,
                container,
                maxSpeed: settings.maxSpeedLimit || undefined
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

    const handleToggleVideo = (videoId: string) => {
        setSelectedVideos(prev => {
            const newSet = new Set(prev);
            if (newSet.has(videoId)) {
                newSet.delete(videoId);
            } else {
                newSet.add(videoId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (!playlistInfo) return;
        const allIds = new Set<string>(playlistInfo.videos.map((v: any) => v.id));
        setSelectedVideos(allIds);
    };

    const handleDeselectAll = () => {
        setSelectedVideos(new Set());
    };

    const handleDownloadPlaylist = async () => {
        const selected = Array.from(selectedVideos);
        if (selected.length === 0) return;

        isCancelledRef.current = false;
        let successCount = 0;
        let failCount = 0;

        info('Starting Batch Download', `Queued ${selected.length} videos`);

        // Set up progress listener for batch download
        const unsubscribe = (window as any).youtubeAPI.onProgress((progress: any) => {
            setDownloadStatus(prev => ({
                ...prev, // Keep existing message structure if needed, or overwrite
                status: 'downloading',
                // Update message to show current video progress but keep the "Downloading X/Y" context if possible, 
                // but since we don't have easy access to 'i' here without closure issues, 
                // we might need to rely on the loop updating the 'message' header and this updating the 'progress' details.
                // Actually, let's just update the progress parts and keep the message generic or updated by the loop.
                // Better approach: The loop sets the title "Downloading 1/5: Title", 
                // and here we append percent? Or we just update progress/speed/eta fields.
                progress: progress.percent,
                speed: progress.speed,
                eta: progress.eta,
                downloaded: progress.downloaded,
                total: progress.total,
                detailedLogs: prev.status === 'downloading' ? prev.detailedLogs : undefined
            }));
        });

        for (let i = 0; i < selected.length; i++) {
            if (isCancelledRef.current) break;

            const videoId = selected[i];
            const video = playlistInfo.videos.find((v: any) => v.id === videoId);
            if (!video) continue;

            // Reset progress for new video
            setDownloadStatus({
                status: 'downloading',
                message: `Downloading ${i + 1}/${selected.length}: ${video.title}`,
                progress: 0
            });

            try {
                const downloadOptions: any = {
                    url: video.url,
                    format,
                    quality,
                    container,
                    maxSpeed: settings.maxSpeedLimit || undefined
                };

                if (downloadFolder) {
                    downloadOptions.outputPath = downloadFolder;
                }

                const result = await (window as any).youtubeAPI.download(downloadOptions);
                
                if (result.success) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (err) {
                 failCount++;
            }
        }
        
        // Cleanup listener
        unsubscribe();

        if (isCancelledRef.current) {
             setDownloadStatus({ status: 'error', message: 'Download Cancelled' });
        } else {
             setDownloadStatus({
                status: successCount > 0 ? 'success' : 'error',
                message: `Playlist Download Complete. Success: ${successCount}, Failed: ${failCount}`,
             });
             
             if (successCount > 0) {
                success('Batch Download Complete', `Successfully downloaded ${successCount} videos.`);
             } else {
                error('Batch Download Failed', 'No videos were downloaded successfully.');
             }
        }
    };

    const handleCancel = async () => {
        isCancelledRef.current = true;
        await (window as any).youtubeAPI.cancel();
        setDownloadStatus({ status: 'error', message: 'Download Cancelled' });
    };

    const loadHistory = async () => {
        try {
            const data = await (window as any).youtubeAPI.getHistory();
            setHistory(data);
        } catch (err) {
            console.error('Failed to load history', err);
        }
    };

    const loadSettings = async () => {
        try {
            const data = await (window as any).youtubeAPI.getSettings();
            if (data) {
                setSettings(data);
                // Apply defaults if not set in state?
                // Also update individual states if they match defaults?
                // For now just store in settings object.
                if (data.downloadPath) setDownloadFolder(data.downloadPath);
                
                // Only set default qualities if user hasn't touched them? 
                // Hard to know. Let's just update settings state.
                if (data.defaultVideoQuality && !url) setQuality(data.defaultVideoQuality);
            }
        } catch (err) {
            console.error('Failed to load settings', err);
        }
    };

    const handleSaveSettings = async (newSettings: AppSettings) => {
        setSettings(newSettings);
        await (window as any).youtubeAPI.saveSettings(newSettings);
        success('Settings Saved', 'Preferences updated successfully');
    };

    useEffect(() => {
        if (view === 'settings') {
            loadSettings();
        }
    }, [view]);

    // Initial load
    useEffect(() => {
        loadSettings();
    }, []);



    useEffect(() => {
        if (view === 'history') {
            loadHistory();
        }
    }, [view]);

    const renderHistory = () => (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground-primary">Download History</h3>
                <Button 
                    onClick={async () => {
                        if (confirm('Clear all history?')) {
                            await (window as any).youtubeAPI.clearHistory();
                            loadHistory();
                        }
                    }} 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                    Clear All
                </Button>
            </div>
            
            <div className="space-y-2">
                {history.length === 0 ? (
                    <div className="text-center py-10 text-foreground-tertiary">
                        <p>No downloads yet.</p>
                    </div>
                ) : (
                    history.map((item: any) => (
                        <div key={item.id} className="bg-glass-panel border border-border-glass rounded-xl p-3 flex gap-4 transition-all hover:bg-white/5">
                            {/* Thumbnail */}
                            <div className="relative w-32 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-black/50 border border-border-glass">
                                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-mono">
                                    {formatTime(item.duration)}
                                </span>
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <div>
                                    <h4 className="font-medium text-sm text-foreground-primary truncate pr-4" title={item.title}>
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1.5 text-xs text-foreground-tertiary font-mono">
                                        <span className="uppercase bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-[10px]">{item.format}</span>
                                        <span className="opacity-50">|</span>
                                        <span>{item.quality}</span>
                                        <span className="opacity-50">|</span>
                                        <span>{formatBytes(item.size)}</span>
                                        <span className="opacity-50">|</span>
                                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 justify-end">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-7 text-xs bg-white/5 border-white/10 hover:bg-white/10" 
                                        onClick={() => (window as any).youtubeAPI.openFile(item.path)}
                                    >
                                        Open
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-7 text-xs text-foreground-secondary hover:text-foreground" 
                                        onClick={() => (window as any).youtubeAPI.showInFolder(item.path)}
                                    >
                                        <HardDrive className="w-3 h-3 mr-1" />
                                        Folder
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid gap-6">
                <Card className="p-4 bg-glass-panel border-border-glass">
                    <h3 className="text-sm font-medium text-foreground-primary mb-3 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-blue-400" />
                        Default Download Location
                    </h3>
                    <div className="flex gap-2">
                        <Input 
                            value={settings.downloadPath || downloadFolder || 'Downloads'} 
                            readOnly 
                            className="bg-background/50 border-input font-mono text-xs" 
                        />
                        <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={async () => {
                                const path = await (window as any).youtubeAPI.chooseFolder();
                                if (path) {
                                    setDownloadFolder(path);
                                    handleSaveSettings({ ...settings, downloadPath: path });
                                }
                            }}
                        >
                            Change
                        </Button>
                    </div>
                </Card>

                <Card className="p-4 bg-glass-panel border-border-glass">
                    <h3 className="text-sm font-medium text-foreground-primary mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-purple-400" />
                        Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs text-foreground-secondary">Default Video Quality</label>
                            <select 
                                className="w-full bg-background/50 border-input rounded-md p-2 text-sm text-foreground-primary focus:ring-2 focus:ring-primary/50 outline-none border"
                                value={settings.defaultVideoQuality}
                                onChange={(e) => handleSaveSettings({ ...settings, defaultVideoQuality: e.target.value })}
                            >
                                <option value="2160p">4K (2160p)</option>
                                <option value="1440p">2K (1440p)</option>
                                <option value="1080p">1080p</option>
                                <option value="720p">720p</option>
                                <option value="480p">480p</option>
                                <option value="360p">360p</option>
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs text-foreground-secondary">Max Concurrent Downloads</label>
                            <Input 
                                type="number" 
                                min={1} 
                                max={5}
                                value={settings.maxConcurrentDownloads}
                                onChange={(e) => handleSaveSettings({ ...settings, maxConcurrentDownloads: parseInt(e.target.value) || 1 })}
                                className="bg-background/50"
                            />
                            <p className="text-[10px] text-foreground-tertiary">Recommended: 1-3</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-foreground-secondary">Speed Limit</label>
                            <Input 
                                placeholder="e.g. 5M, 500K"
                                value={settings.maxSpeedLimit || ''}
                                onChange={(e) => setSettings({ ...settings, maxSpeedLimit: e.target.value })}
                                onBlur={() => handleSaveSettings(settings)}
                                className="bg-background/50"
                            />
                            <p className="text-[10px] text-foreground-tertiary">Leave empty for unlimited</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );

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
                
                // Auto-select best available quality or user preference
                if (info.availableQualities && info.availableQualities.length > 0) {
                    if (settings.defaultVideoQuality && info.availableQualities.includes(settings.defaultVideoQuality)) {
                        setQuality(settings.defaultVideoQuality);
                    } else {
                        setQuality(info.availableQualities[0]); // Select highest quality
                    }
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
            <div className="px-4 py-3 border-b border-border-glass bg-glass-background/30 backdrop-blur-sm flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 text-red-400">
                        <Youtube className="w-4 h-4" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-gradient-to-r from-red-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
                            YouTube Video Downloader
                        </h1>
                        <p className="text-xs text-foreground-secondary hidden sm:block">
                            Download videos and audio from YouTube in various formats and qualities
                        </p>
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex bg-glass-panel rounded-lg p-1 border border-border-glass">
                    <button
                        onClick={() => setView('download')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                            view === 'download' ? 'bg-background-secondary text-foreground shadow-sm' : 'text-foreground-secondary hover:text-foreground'
                        }`}
                    >
                        <Download className="w-3.5 h-3.5" />
                        Download
                    </button>
                    <button
                        onClick={() => setView('history')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                            view === 'history' ? 'bg-background-secondary text-foreground shadow-sm' : 'text-foreground-secondary hover:text-foreground'
                        }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        History
                    </button>
                    <button
                        onClick={() => setView('settings')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${
                            view === 'settings' ? 'bg-background-secondary text-foreground shadow-sm' : 'text-foreground-secondary hover:text-foreground'
                        }`}
                    >
                        <Settings className="w-3.5 h-3.5" />
                        Settings
                    </button>
                </div>
            </div>


            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    {view === 'history' ? (
                        renderHistory()
                    ) : view === 'settings' ? (
                        renderSettings()
                    ) : (
                    <>
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
                    <Card className="p-6 w-full">
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
                    {/* Content Switcher: Playlist vs Single Video */}
                    {isPlaylist && playlistInfo ? (
                        <PlaylistView
                            playlistInfo={playlistInfo}
                            selectedVideos={selectedVideos}
                            onToggleVideo={handleToggleVideo}
                            onSelectAll={handleSelectAll}
                            onDeselectAll={handleDeselectAll}
                            onDownloadSelected={handleDownloadPlaylist}
                        />
                    ) : videoInfo ? (
                        <>
                            <VideoInfo {...videoInfo} />
                            
                            {/* Download Estimates Removed as they are now per item */}

                            {/* Available Formats */}
                            <FormatsList formats={videoInfo.formats} />
                        </>
                    ) : null}

                    {/* Download Options */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground-primary">Download Options</h3>
                            <div className="flex bg-glass-panel rounded-lg p-1 border border-border-glass">
                                <button
                                    onClick={() => {
                                        setFormat('video');
                                        setQuality(videoInfo?.availableQualities?.[0] || '1080p');
                                        setContainer('mp4');
                                    }}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                        format === 'video' ? 'bg-red-500/20 text-red-400' : 'text-foreground-secondary hover:text-foreground'
                                    }`}
                                >
                                    Video + Audio
                                </button>
                                <button
                                    onClick={() => {
                                        setFormat('audio');
                                        setQuality('0');
                                        setContainer('mp3');
                                    }}
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

                        {/* Format Selection */}
                        <div className="mb-4">
                            <label className="text-sm font-medium text-foreground-primary block mb-2 flex items-center gap-2">
                                <FileVideo className="w-4 h-4 text-blue-400" />
                                Output Format
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {(format === 'video' ? ['mp4', 'mkv', 'webm'] : ['mp3', 'm4a', 'wav', 'flac', 'opus']).map(fmt => (
                                    <button
                                        key={fmt}
                                        onClick={() => setContainer(fmt)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                                            container === fmt 
                                                ? format === 'video' 
                                                    ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                                                    : 'bg-pink-500/20 text-pink-400 border-pink-500/50'
                                                : 'bg-glass-panel text-foreground-secondary border-border-glass hover:bg-white/5 hover:text-foreground-primary'
                                        }`}
                                    >
                                        {fmt.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground-primary flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-purple-400" />
                                    {format === 'video' ? 'Select Video Quality' : 'Select Audio Quality'}
                                </label>
                                {format === 'video' && (
                                    <span className="text-[10px] text-foreground-tertiary bg-background-tertiary px-2 py-1 rounded-full font-mono">
                                        {container ? container.toUpperCase() : 'MP4'} (H.264)
                                    </span>
                                )}
                            </div>

                            {format === 'video' ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {(videoInfo?.availableQualities && videoInfo.availableQualities.length > 0
                                        ? videoInfo.availableQualities 
                                        : ['1080p', '720p', '480p', '360p']
                                    ).map((q) => {
                                        const labels: Record<string, string> = {
                                            '4320p': '8K Ultra HD',
                                            '2160p': '4K Ultra HD',
                                            '1440p': '2K QHD',
                                            '1080p': 'Full HD',
                                            '720p': 'HD',
                                            '480p': 'SD',
                                            '360p': 'Low',
                                            '240p': 'Very Low',
                                            '144p': 'Potato'
                                        };
                                        
                                        // Estimate size
                                        const lengthMB = (videoInfo?.lengthSeconds || 0) / 60;
                                        const bitrateMap: Record<string, number> = {
                                            '4320p': 150, '2160p': 60, '1440p': 30,
                                            '1080p': 15, '720p': 7.5, '480p': 4,
                                            '360p': 2.5, '240p': 1.5, '144p': 1
                                        };
                                        const sizeEst = lengthMB * (bitrateMap[q] || 5);
                                        const sizeStr = sizeEst < 1024 ? `${sizeEst.toFixed(0)} MB` : `${(sizeEst / 1024).toFixed(1)} GB`;

                                        return (
                                            <button
                                                key={q}
                                                onClick={() => setQuality(q)}
                                                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                                                    quality === q 
                                                        ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_4px_20px_-12px_var(--red-500)]' 
                                                        : 'bg-glass-panel border-transparent hover:bg-background-secondary hover:border-border-glass text-foreground-secondary hover:text-foreground-primary'
                                                }`}
                                            >
                                                {quality === q && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-red-500 shadow-[0_-2px_8px_var(--red-500)]" />}
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-sm">{q}</span>
                                                    {quality === q && <CheckCircle2 className="w-4 h-4 text-red-500" />}
                                                </div>
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] opacity-70">{labels[q] || 'Video'}</span>
                                                    <span className="text-[10px] font-mono opacity-50">~{sizeStr}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: '0', label: 'Best Quality', detail: '320kbps', size: 2.5 },
                                        { id: '5', label: 'High Quality', detail: '192kbps', size: 1.5 },
                                        { id: '9', label: 'Standard', detail: '128kbps', size: 1.0 }
                                    ].map((opt) => {
                                        const lengthMB = (videoInfo?.lengthSeconds || 0) / 60;
                                        const sizeEst = lengthMB * opt.size;
                                        const sizeStr = `${sizeEst.toFixed(1)} MB`;

                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => setQuality(opt.id)}
                                                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                                                    quality === opt.id 
                                                        ? 'bg-pink-500/10 border-pink-500 text-pink-400 shadow-[0_4px_20px_-12px_var(--pink-500)]' 
                                                        : 'bg-glass-panel border-transparent hover:bg-background-secondary hover:border-border-glass text-foreground-secondary hover:text-foreground-primary'
                                                }`}
                                            >
                                                {quality === opt.id && <div className="absolute inset-x-0 bottom-0 h-0.5 bg-pink-500 shadow-[0_-2px_8px_var(--pink-500)]" />}
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-sm px-2 py-0.5 rounded-full bg-background/30 border border-white/5">{opt.label}</span>
                                                    {quality === opt.id && <CheckCircle2 className="w-4 h-4 text-pink-500" />}
                                                </div>
                                                <div className="flex justify-between items-end mt-2 px-1">
                                                    <span className="text-[10px] font-mono opacity-60">{(container || 'MP3').toUpperCase()} • {opt.detail}</span>
                                                    <span className="text-[10px] font-mono opacity-50">~{sizeStr}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Download Button */}
                    {/* Download Button - Single Video Only */}
                    {!isPlaylist && (
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
                    )}

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
                                    
                                    {downloadStatus.status === 'downloading' && isPlaylist && (
                                        <Button 
                                            onClick={handleCancel}
                                            variant="ghost" 
                                            size="sm" 
                                            className="mt-1 h-6 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                        >
                                            Cancel
                                        </Button>
                                    )}

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
                    </>
                )}
                </div>
            </div>
        </div>
    );
};

export default YoutubeDownloader;

