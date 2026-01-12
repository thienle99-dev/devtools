import React, { useState, useEffect, useRef } from 'react';
import { Download, Youtube, Video, Music, Film, Loader2, Info, FileVideo, FolderOpen, Clock, HardDrive, Settings } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { VideoInfo } from './components/VideoInfo';
import { FormatsList } from './components/FormatsList';
import { PlaylistView } from './components/PlaylistView';
import { ToastContainer, useToast } from '@components/ui/Toast';
import { SearchBar } from './components/SearchBar';
import { FormatSelector } from './components/FormatSelector';
import { DownloadProgress as DownloadProgressComponent } from './components/DownloadProgress';
import { formatBytes, formatTime } from '@utils/format';
import { isValidYoutubeUrl, isPlaylistUrl, cleanYoutubeUrl } from '@utils/validation';

interface DownloadStatus {
    status: 'idle' | 'downloading' | 'success' | 'error';
    message?: string;
    progress?: number;
    filename?: string;
    detailedLogs?: string[];
}

interface ActiveDownload {
    id: string;
    percent: number;
    downloaded: number;
    total: number;
    speed: number;
    eta: number;
    state: 'downloading' | 'processing' | 'complete' | 'error';
    filename?: string;
    title?: string;
    thumbnail?: string;
    author?: string;
    url?: string;
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



export const YoutubeDownloader: React.FC = () => {
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<'video' | 'audio' | 'best'>('video');
    const [quality, setQuality] = useState<string>('720p');
    const [container, setContainer] = useState<string>('mp4');
    const [embedSubs, setEmbedSubs] = useState(false);
    const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>({ status: 'idle' });
    const [videoInfo, setVideoInfo] = useState<VideoInfoData | null>(null);
    const [fetchingInfo, setFetchingInfo] = useState(false);
    const [downloadFolder, setDownloadFolder] = useState<string | null>(null);
    const [playlistInfo, setPlaylistInfo] = useState<any | null>(null);
    const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
    const [isPlaylist, setIsPlaylist] = useState(false);
    const [view, setView] = useState<'new' | 'downloads' | 'settings'>('new');
    const [history, setHistory] = useState<any[]>([]);

    // Active Downloads State
    const [activeDownloads, setActiveDownloads] = useState<Map<string, ActiveDownload>>(new Map());

    const [settings, setSettings] = useState<AppSettings>({
        defaultVideoQuality: '1080p',
        defaultAudioQuality: '0',
        maxConcurrentDownloads: 3,
        maxSpeedLimit: ''
    });
    const [capabilities, setCapabilities] = useState<{ hasAria2c: boolean; hasFFmpeg: boolean } | null>(null);
    const [isInstallingAria2, setIsInstallingAria2] = useState(false);
    const [networkSpeed, setNetworkSpeed] = useState(10); // Mbps

    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const isCancelledRef = useRef(false);
    const progressMapRef = useRef<Map<string, any>>(new Map());
    const { toasts, removeToast, success, error, info } = useToast();

    // Keyboard shortcut: Ctrl+V to paste URL
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && document.activeElement?.tagName !== 'INPUT') {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text && isValidYoutubeUrl(text)) {
                        setUrl(text);
                        info('URL Pasted', 'Press Enter to fetch video info');
                    }
                } catch (err) {
                    // Clipboard permission denied
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Track network speed from active downloads
    useEffect(() => {
        const speeds: number[] = [];
        activeDownloads.forEach(download => {
            if (download.speed > 0) {
                const mbps = (download.speed * 8) / (1024 * 1024);
                speeds.push(mbps);
            }
        });

        if (speeds.length > 0) {
            const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
            setNetworkSpeed(avgSpeed);
        }
    }, [activeDownloads]);




    // Global Progress Listener
    useEffect(() => {
        if (!(window as any).youtubeAPI) return;

        const unsubscribe = (window as any).youtubeAPI.onProgress((progress: any) => {
            if (!progress.id) return;

            setActiveDownloads(prev => {
                const newMap = new Map(prev);
                const existing = newMap.get(progress.id);

                // Only update if changed significantly or status change
                // to avoid too many re-renders
                newMap.set(progress.id, {
                    ...progress,
                    title: existing?.title || progress.title || 'Downloading...',
                    thumbnail: existing?.thumbnail || progress.thumbnail
                });

                if (progress.state === 'complete' || progress.state === 'error') {
                    // Refresh history if complete
                    if (progress.state === 'complete') loadHistory();
                }

                return newMap;
            });
        });

        return () => unsubscribe();
    }, []);

    const handleDownload = async (overrideQuality?: string) => {
        if (!url.trim() || !isValidYoutubeUrl(url)) {
            error('Invalid URL', 'Please enter a valid YouTube URL');
            return;
        }

        // 1. Initial UI feedback
        const downloadTitle = videoInfo?.title || 'Video';
        const downloadId = crypto.randomUUID();

        info('Added to Queue', 'Download started in background');

        // Optimistically add to active downloads
        setActiveDownloads(prev => {
            const newMap = new Map(prev);
            newMap.set(downloadId, {
                id: downloadId,
                percent: 0,
                downloaded: 0,
                total: 0,
                speed: 0,
                eta: 0,
                state: 'processing', // 'processing' or 'queued'
                filename: 'Waiting for metadata...',
                title: downloadTitle,
                author: videoInfo?.author,
                url: url,
                thumbnail: videoInfo?.thumbnailUrl
            });
            return newMap;
        });

        try {
            const downloadOptions: any = {
                url,
                format,
                quality: overrideQuality || quality,
                container,
                embedSubs,
                maxSpeed: settings.maxSpeedLimit || undefined,
                id: downloadId
            };

            if (downloadFolder) {
                downloadOptions.outputPath = downloadFolder;
            }

            // Fire and forget (don't await result here to block UI)
            (window as any).youtubeAPI.download(downloadOptions)
                .then((result: any) => {
                    if (result.success) {
                        success('Download Complete', `${downloadTitle} has been downloaded.`);
                        loadHistory();
                    } else {
                        error('Download Failed', result.error || 'Unknown error');
                    }
                })
                .catch((err: any) => {
                    error('Download Error', err.message);
                });

            // Reset UI for next download
            setDownloadStatus({ status: 'idle' });
            // setUrl(''); // Optional: clear URL? Maybe keep it.

        } catch (err: any) {
            error('Failed to start', err.message);
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
        progressMapRef.current.clear();

        let successCount = 0;
        let failCount = 0;
        let completedCount = 0;
        const totalCount = selected.length;
        const limit = settings.maxConcurrentDownloads || 3;

        info('Starting Batch Download', `Queued ${totalCount} videos (Parallel: ${limit})`);

        // Set up progress listener for batch download
        const unsubscribe = (window as any).youtubeAPI.onProgress((progress: any) => {
            // Update the map with latest progress for this ID
            if (progress.id) {
                progressMapRef.current.set(progress.id, progress);
            }

            // Calculate aggregated stats
            let totalSpeed = 0;

            progressMapRef.current.forEach(p => {
                if (p.state === 'downloading') {
                    totalSpeed += p.speed || 0;
                }
            });

            // Calculate overall percentage based on COMPLETED videos
            const basePercent = (completedCount / totalCount) * 100;

            setDownloadStatus(prev => ({
                ...prev,
                status: 'downloading',
                message: `Downloading... (${completedCount}/${totalCount})`,
                progress: basePercent,
                speed: totalSpeed,
                eta: 0, // Hard to estimate global ETA
                downloaded: 0, // Not tracking global bytes
                detailedLogs: prev.status === 'downloading' ? prev.detailedLogs : undefined
            }));
        });

        // Concurrency Control Helper
        const queue = [...selected];
        const activePromises = new Set<Promise<void>>();

        try {
            while (queue.length > 0 || activePromises.size > 0) {
                if (isCancelledRef.current) break;

                // Fill the pool
                while (queue.length > 0 && activePromises.size < limit) {
                    if (isCancelledRef.current) break;

                    const videoId = queue.shift();
                    if (!videoId) continue;

                    const video = playlistInfo.videos.find((v: any) => v.id === videoId);
                    if (!video) {
                        failCount++;
                        completedCount++;
                        continue;
                    }

                    const promise = (async () => {
                        try {
                            const downloadOptions: any = {
                                url: video.url,
                                format,
                                quality,
                                container,
                                embedSubs,
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
                        } finally {
                            completedCount++;
                            // Trigger a progress update to refresh the count in UI
                            if (!isCancelledRef.current) {
                                setDownloadStatus(prev => ({
                                    ...prev,
                                    message: `Downloading... (${completedCount}/${totalCount})`,
                                    progress: (completedCount / totalCount) * 100
                                }));
                            }
                        }
                    })();

                    // Add to set and cleanup when done
                    const p = promise.then(() => {
                        activePromises.delete(p);
                    });
                    activePromises.add(p);
                }

                // Wait for at least one to finish before next iteration if full or queue empty
                if (activePromises.size > 0) {
                    await Promise.race(activePromises);
                }
            }
        } finally {
            unsubscribe();
            progressMapRef.current.clear();
        }

        if (isCancelledRef.current) {
            setDownloadStatus({ status: 'error', message: 'Download Cancelled' });
        } else {
            setDownloadStatus({
                status: successCount > 0 ? 'success' : 'error',
                message: `Playlist Download Complete. Success: ${successCount}, Failed: ${failCount}`,
                progress: 100
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
                if (data.downloadPath) setDownloadFolder(data.downloadPath);
                if (data.defaultVideoQuality && !url) setQuality(data.defaultVideoQuality);
            }

            // Load system capabilities (Aria2c, FFmpeg)
            const caps = await (window as any).youtubeAPI.getCapabilities();
            setCapabilities(caps);
        } catch (err) {
            console.error('Failed to load settings', err);
        }
    };

    const handleSaveSettings = async (newSettings: AppSettings) => {
        setSettings(newSettings);
        await (window as any).youtubeAPI.saveSettings(newSettings);
        success('Settings Saved', 'Preferences updated successfully');
    };

    const handleInstallAria2 = async () => {
        try {
            setIsInstallingAria2(true);
            const successResult = await (window as any).youtubeAPI.installAria2();
            if (successResult) {
                success('Success', 'Aria2c installed successfully!');
                loadSettings(); // Refresh
            } else {
                error('Failed', 'Could not install Aria2c automatically.');
            }
        } catch (err) {
            error('Error', 'Installation failed check logs.');
        } finally {
            setIsInstallingAria2(false);
        }
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
        if (view === 'downloads') {
            loadHistory();
        }
    }, [view]);

    const renderDownloads = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Active Downloads Section */}
            {activeDownloads.size > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground-primary flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                        Active Downloads ({activeDownloads.size})
                    </h3>

                    <div className="grid gap-3">
                        {Array.from(activeDownloads.values()).map(progress => (
                            progress.state !== 'complete' && progress.state !== 'error' && (
                                <DownloadProgressComponent
                                    key={progress.id}
                                    status={{
                                        status: 'downloading',
                                        message: progress.state === 'processing' ? 'Processing...' : `Downloading... ${progress.percent?.toFixed(1) || 0}%`,
                                        progress: progress.percent,
                                        speed: progress.speed,
                                        eta: progress.eta,
                                        total: progress.total,
                                        downloaded: progress.downloaded,
                                        title: progress.title,
                                        filename: progress.filename,
                                        url: progress.url
                                    }}
                                    onCancel={() => {
                                        handleCancel();
                                    }}
                                    isPlaylist={false}
                                />
                            )
                        ))}
                    </div>
                </div>
            )}

            {/* History Section */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-foreground-primary">History</h3>
                    <Button
                        onClick={async () => {
                            if (confirm('Clear all history?')) {
                                await (window as any).youtubeAPI.clearHistory();
                                loadHistory();
                            }
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7"
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
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            onClick={async () => {
                                                if (confirm(`Delete "${item.title}" from history?`)) {
                                                    await (window as any).youtubeAPI.removeFromHistory(item.id);
                                                    loadHistory();
                                                }
                                            }}
                                            title="Delete from history"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* System Health / Performance */}
            <Card className="p-4 bg-glass-panel border-border-glass">
                <h3 className="text-sm font-medium text-foreground-primary mb-3 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    System Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Aria2c Status */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded bg-blue-500/10 ${capabilities?.hasAria2c ? 'text-blue-400' : 'text-gray-400'}`}>
                                <Settings className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-foreground-primary">Aria2c Accelerator</div>
                                <div className="text-xs text-foreground-tertiary">
                                    {capabilities?.hasAria2c ? '16x Speed Active' : 'Not installed'}
                                </div>
                            </div>
                        </div>
                        {capabilities?.hasAria2c ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30 font-medium">Active</span>
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-400"
                                onClick={handleInstallAria2}
                                disabled={isInstallingAria2}
                            >
                                {isInstallingAria2 ? (
                                    <>
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        Installing...
                                    </>
                                ) : 'Install Now'}
                            </Button>
                        )}
                    </div>

                    {/* FFmpeg Status */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded bg-purple-500/10 ${capabilities?.hasFFmpeg ? 'text-purple-400' : 'text-gray-400'}`}>
                                <Film className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-foreground-primary">FFmpeg Engine</div>
                                <div className="text-xs text-foreground-tertiary">
                                    {capabilities?.hasFFmpeg ? 'High Quality Merge' : 'Post-processing disabled'}
                                </div>
                            </div>
                        </div>
                        {capabilities?.hasFFmpeg ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded border border-green-500/30 font-medium">Ready</span>
                        ) : (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/30">Missing</span>
                        )}
                    </div>
                </div>
                {!capabilities?.hasAria2c && (
                    <div className="mt-3 text-xs text-foreground-tertiary flex items-center gap-2 bg-blue-500/5 p-2 rounded">
                        <Info className="w-3 h-3 text-blue-400" />
                        <span>Tip: Install Aria2c via winget or brew for ultra-fast downloads.</span>
                    </div>
                )}
            </Card>

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
            // Clean the URL first (remove unnecessary params)
            const cleanedUrl = cleanYoutubeUrl(url);
            if (cleanedUrl !== url) {
                setUrl(cleanedUrl);
                return; // Will trigger again with cleaned URL
            }

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
                        onClick={() => setView('new')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${view === 'new' ? 'bg-background-secondary text-foreground shadow-sm' : 'text-foreground-secondary hover:text-foreground'
                            }`}
                    >
                        <Download className="w-3.5 h-3.5" />
                        New Download
                    </button>
                    <button
                        onClick={() => setView('downloads')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${view === 'downloads' ? 'bg-background-secondary text-foreground shadow-sm' : 'text-foreground-secondary hover:text-foreground'
                            }`}
                    >
                        <Clock className="w-3.5 h-3.5" />
                        Downloads
                        {activeDownloads.size > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{activeDownloads.size}</span>
                        )}
                    </button>
                    <button
                        onClick={() => setView('settings')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${view === 'settings' ? 'bg-background-secondary text-foreground shadow-sm' : 'text-foreground-secondary hover:text-foreground'
                            }`}
                    >
                        <Settings className="w-3.5 h-3.5" />
                        Settings
                    </button>
                </div>
            </div>


            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="w-full mx-auto space-y-6">
                    {view === 'downloads' ? (
                        renderDownloads()
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

                            {/* Search Input */}

                            <SearchBar
                                url={url}
                                onUrlChange={setUrl}
                                onClear={handleClear}
                                onFetch={handleFetchInfo}
                                isLoading={fetchingInfo}
                                disabled={downloadStatus.status === 'downloading'}
                            />

                            {/* Video Info Preview */}
                            {/* Media Showcase Section */}
                            {((isPlaylist && playlistInfo) || videoInfo) && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 animate-in fade-in slide-in-from-bottom-4">
                                    {/* Left Column: Preview */}
                                    <div className="lg:col-span-1">
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
                                            <div className="space-y-4">
                                                <VideoInfo {...videoInfo} />
                                                <FormatsList formats={videoInfo.formats} />
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* Right Column: Options & Actions */}
                                    <div className="lg:col-span-2 space-y-4">
                                        {/* Download Location */}
                                        <Card className="p-4 bg-background-secondary/50 rounded-lg border border-border-glass">
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
                                        </Card>

                                        {/* Format Selector */}
                                        <FormatSelector
                                            format={format}
                                            setFormat={setFormat}
                                            quality={quality}
                                            setQuality={setQuality}
                                            container={container}
                                            setContainer={setContainer}
                                            videoInfo={videoInfo}
                                            disabled={downloadStatus.status === 'downloading'}
                                            embedSubs={embedSubs}
                                            setEmbedSubs={setEmbedSubs}
                                            onDownload={(q) => handleDownload(q)}
                                            networkSpeed={networkSpeed}
                                        />


                                    </div>
                                </div>
                            )}

                            {/* Status Display - ONLY for legacy/global status, irrelevant now as we use activeDownloads */}
                            {/* But we keep it if playlist download uses old mechanism or generic errors */}
                            {downloadStatus.status === 'error' && (
                                <DownloadProgressComponent
                                    status={downloadStatus}
                                    onCancel={() => handleCancel()}
                                    isPlaylist={isPlaylist}
                                    onOpenFile={handleOpenFile}
                                    onShowFolder={handleShowInFolder}
                                />
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

