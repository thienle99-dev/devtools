import { useState, useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToast, ToastContainer } from '@components/ui/Toast';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Card } from '@components/ui/Card';
import {
    Download,
    Settings,
    Link,
    Trash2,
    Globe,
    FolderOpen,
    Globe2,
    Loader2,
    Clock,
    HardDrive,
    Info,
    Music,
    Video,
    Film
} from 'lucide-react';
import { UniversalVideoInfo } from './components/UniversalVideoInfo';
import { UniversalFormatSelector } from './components/UniversalFormatSelector';
import { DownloadProgress } from './components/DownloadProgress';
import { detectPlatform, getPlatformName, getPlatformColor } from './utils/platform-detector';
import { cn } from '@utils/cn';
import type { UniversalMediaInfo, UniversalDownloadProgress, UniversalHistoryItem, SupportedPlatform } from '@/types/universal-media';
import { formatBytes, formatTime } from '@utils/format';

export default function UniversalDownloader() {
    // State
    const [view, setView] = useState<'new' | 'downloads' | 'settings'>('new');
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<'video' | 'audio'>('video');
    const [quality, setQuality] = useState<string>('1080p');
    const [audioFormat, setAudioFormat] = useState<'mp3' | 'm4a' | 'wav' | 'flac'>('mp3');

    // Batch Mode State
    const [inputMode, setInputMode] = useState<'single' | 'batch'>('single');
    const [batchUrls, setBatchUrls] = useState('');

    const [mediaInfo, setMediaInfo] = useState<UniversalMediaInfo | null>(null);
    const [fetchingInfo, setFetchingInfo] = useState(false);
    const [detectedPlatform, setDetectedPlatform] = useState<SupportedPlatform>('other');

    const [embedSubs, setEmbedSubs] = useState(false);
    const [downloadEntirePlaylist, setDownloadEntirePlaylist] = useState(false);
    const [selectedPlaylistItems, setSelectedPlaylistItems] = useState<Set<number>>(new Set());
    const [diskSpace, setDiskSpace] = useState<{ available: number; total: number; warning: boolean } | null>(null);
    const [queuedDownloads, setQueuedDownloads] = useState<any[]>([]);

    const [activeDownloads, setActiveDownloads] = useState<Map<string, UniversalDownloadProgress>>(new Map());
    const [history, setHistory] = useState<UniversalHistoryItem[]>([]);
    const [downloadPath, setDownloadPath] = useState('');
    const [settings, setSettings] = useState({
        downloadPath: '',
        defaultFormat: 'video' as 'video' | 'audio',
        defaultQuality: '1080p',
        maxConcurrentDownloads: 3,
        useBrowserCookies: null as 'chrome' | 'firefox' | 'edge' | 'safari' | 'brave' | null
    });
    const [historySearch, setHistorySearch] = useState('');
    const [historyFilter, setHistoryFilter] = useState<SupportedPlatform | 'all'>('all');
    const [historySort, setHistorySort] = useState<'newest' | 'oldest' | 'size' | 'platform'>('newest');

    const { toasts, removeToast, success, error, info } = useToast();

    // Keyboard shortcut: Ctrl+V to paste URL
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && document.activeElement?.tagName !== 'INPUT') {
                try {
                    const text = await navigator.clipboard.readText();
                    if (text && text.startsWith('http')) {
                        setUrl(text);
                        info('URL Pasted', 'Press Enter to fetch media info');
                    }
                } catch (err) {
                    // Clipboard permission denied
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Initialize
    useEffect(() => {
        loadHistory();
        loadSettings();
        checkDiskSpace();

        // Listen for progress
        const cleanup = window.universalAPI.onProgress((progress: UniversalDownloadProgress) => {
            setActiveDownloads(prev => {
                const newMap = new Map(prev);
                newMap.set(progress.id || 'unknown', progress);
                return newMap;
            });

            if (progress.state === 'complete') {
                loadHistory();
                success('Download Complete', progress.filename || 'File downloaded successfully');
            } else if (progress.state === 'error') {
                error('Download Failed', 'Check URL or connection');
            }
        });

        // Periodic queue and disk check
        const interval = setInterval(() => {
            loadQueue();
            checkDiskSpace();
        }, 5000);

        return () => {
            cleanup();
            clearInterval(interval);
        }
    }, []);

    const loadQueue = async () => {
        const queue = await window.universalAPI.getQueue();
        setQueuedDownloads(queue);
    };

    const checkDiskSpace = async () => {
        const space = await window.universalAPI.checkDiskSpace(downloadPath);
        setDiskSpace(space);
    };

    const loadHistory = async () => {
        const hist = await window.universalAPI.getHistory();
        setHistory(hist);
    };

    const loadSettings = async () => {
        const settingsData = await window.universalAPI.getSettings();
        if (settingsData) {
            setSettings(settingsData);
            setDownloadPath(settingsData.downloadPath || '');
            setFormat(settingsData.defaultFormat || 'video');
            setQuality(settingsData.defaultQuality || 'best');
        }
    };

    // Auto-detect platform and fetch info
    useEffect(() => {
        const platform = detectPlatform(url);
        setDetectedPlatform(platform);

        const fetchInfo = async () => {
            if (!url) {
                setMediaInfo(null);
                setDownloadEntirePlaylist(false);
                setSelectedPlaylistItems(new Set());
                return;
            }

            // Simple validation: must have http/https
            if (!url.startsWith('http')) return;

            setFetchingInfo(true);
            try {
                const infoData = await window.universalAPI.getInfo(url);
                console.log('📦 MediaInfo received:', infoData);
                console.log('🎯 Available Qualities:', infoData.availableQualities);
                setMediaInfo(infoData);

                // If it's a playlist, default TO playlist mode if requested or just keep it false
                if (infoData.isPlaylist) {
                    setDownloadEntirePlaylist(true);
                    // Select all by default
                    if (infoData.playlistVideos) {
                        setSelectedPlaylistItems(new Set(infoData.playlistVideos.map((_: any, i: number) => i + 1)));
                    }
                }

                // Update detected platform from backend info if 'other'
                if (platform === 'other' && infoData.platform) {
                    setDetectedPlatform(infoData.platform);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setFetchingInfo(false);
            }
        };

        const timeout = setTimeout(fetchInfo, 800); // Debounce
        return () => clearTimeout(timeout);
    }, [url]);

    const handleDownload = async (overrideQuality?: string) => {
        if (!url || !url.startsWith('http')) {
            error('Invalid URL', 'Please enter a valid URL');
            return;
        }

        setView('downloads');
        info('Added to Queue', 'Download started in background');
        await queueDownloadInput(url, overrideQuality);
    };

    const handleImportFile = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.csv,.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                if (text) {
                    // Extract URLs
                    const urls = text.match(/https?:\/\/[^\s"',]+/g);
                    if (urls && urls.length > 0) {
                        const newUrls = urls.join('\n');
                        setBatchUrls(prev => prev ? prev + '\n' + newUrls : newUrls);
                        success('Imported', `Found ${urls.length} URLs in file`);
                    } else {
                        error('No URLs found', 'Could not find any valid URLs in the file');
                    }
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    const handleBatchDownload = async () => {
        const lines = batchUrls.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
        if (lines.length === 0) {
            error('No URLs', 'Please paste at least one valid URL');
            return;
        }

        info('Batch Started', `Queueing ${lines.length} downloads...`);
        setView('downloads');

        for (const line of lines) {
            await queueDownloadInput(line);
            // Small delay to prevent UI freezing if many items
            await new Promise(r => setTimeout(r, 100));
        }
    };

    const queueDownloadInput = async (downloadUrl: string, overrideQuality?: string) => {
        // Check disk space before starting
        const space = await window.universalAPI.checkDiskSpace(downloadPath);
        if (space.available < 500 * 1024 * 1024) { // Less than 500MB
            error('Low Disk Space', 'You need at least 500MB of free space to start a download.');
            return;
        }

        const downloadId = crypto.randomUUID();

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
                state: 'processing',
                filename: 'Waiting for metadata...',
                platform: detectPlatform(downloadUrl)
            });
            return newMap;
        });

        // Use 'batch' view is only set in the batch handler, or let the user decide?
        // For single download, we might want to stay or switch.
        // Let's rely on the caller to switch active view if needed.

        try {
            const downloadOptions: any = {
                url: downloadUrl,
                format,
                quality: overrideQuality || quality,
                outputPath: downloadPath || undefined,
                id: downloadId,
                embedSubs: embedSubs,
                audioFormat: format === 'audio' ? audioFormat : undefined,
                isPlaylist: downloadEntirePlaylist, // Only relevant for single URL usually, but can apply to batch if they are playlists
                playlistItems: downloadEntirePlaylist ? Array.from(selectedPlaylistItems).join(',') : undefined
            };

            // Fire and forget
            window.universalAPI.download(downloadOptions)
                .then((result: any) => {
                    if (result.success) {
                        success('Download Complete', `Download has been completed.`);
                        loadHistory();
                    } else {
                        error('Download Failed', result.error || 'Unknown error');
                    }
                })
                .catch((err: any) => {
                    error('Download Error', err.message);
                });

        } catch (err: any) {
            error('Download Failed', err.message);
        }
    };

    const handleChooseFolder = async () => {
        const result = await window.universalAPI.chooseFolder();
        if (result) {
            setDownloadPath(result);
            const newSettings = { ...settings, downloadPath: result };
            setSettings(newSettings);
            window.universalAPI.saveSettings(newSettings);
            success('Folder Updated', 'Download location changed');
        }
    };

    const handleClearHistory = async () => {
        if (confirm('Are you sure you want to clear all history?')) {
            await window.universalAPI.clearHistory();
            loadHistory();
            success('History Cleared', 'All download history has been removed');
        }
    };

    const handleRemoveFromHistory = async (id: string, title: string) => {
        if (confirm(`Remove "${title}" from history?`)) {
            await window.universalAPI.removeFromHistory(id);
            loadHistory();
        }
    };

    const handleSaveSettings = async (newSettings: typeof settings) => {
        setSettings(newSettings);
        await window.universalAPI.saveSettings(newSettings);
        success('Settings Saved', 'Preferences updated successfully');
    };

    const exportHistory = (format: 'json' | 'csv') => {
        if (history.length === 0) return;

        let content = '';
        let fileName = `download-history.${format}`;

        if (format === 'json') {
            content = JSON.stringify(history, null, 2);
        } else {
            const headers = ['Title', 'URL', 'Platform', 'Size', 'Date', 'Path'];
            const rows = history.map(item => [
                `"${item.title.replace(/"/g, '""')}"`,
                item.url,
                item.platform,
                item.size,
                new Date(item.timestamp).toISOString(),
                item.path
            ]);
            content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        }

        const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        success('History Exported', `Exported ${history.length} items to ${format.toUpperCase()}`);
    };

    const filteredHistory = history
        .filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
                item.url.toLowerCase().includes(historySearch.toLowerCase());
            const matchesFilter = historyFilter === 'all' || item.platform === historyFilter;
            return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
            if (historySort === 'newest') return b.timestamp - a.timestamp;
            if (historySort === 'oldest') return a.timestamp - b.timestamp;
            if (historySort === 'size') return (b.size || 0) - (a.size || 0);
            if (historySort === 'platform') return a.platform.localeCompare(b.platform);
            return 0;
        });

    // --- Render ---

    const renderNewDownload = () => (
        <div className="mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* URL Input Card */}
            <Card className="p-6 bg-glass-panel border-border-glass">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                            <Globe2 className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground-primary">Universal Media Downloader</h3>
                            <p className="text-xs text-foreground-secondary">Supports 1000+ websites including YouTube, Instagram, TikTok, Facebook, and more</p>
                        </div>
                    </div>

                    {/* Input Mode Toggle */}
                    <div className="flex items-center gap-2 p-1 bg-white/5 w-fit rounded-lg border border-white/10">
                        <button
                            onClick={() => setInputMode('single')}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                inputMode === 'single' ? "bg-indigo-500/20 text-indigo-300 shadow-sm" : "text-foreground-secondary hover:text-foreground"
                            )}
                        >
                            Single URL
                        </button>
                        <button
                            onClick={() => setInputMode('batch')}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                                inputMode === 'batch' ? "bg-indigo-500/20 text-indigo-300 shadow-sm" : "text-foreground-secondary hover:text-foreground"
                            )}
                        >
                            Batch Mode
                        </button>
                    </div>

                    {inputMode === 'single' ? (
                        <Input
                            placeholder="Paste any video or audio URL here..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            icon={Link}
                            fullWidth
                            className="h-12 text-base bg-background/50 border-input"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && url) {
                                    handleDownload();
                                }
                            }}
                        />
                    ) : (
                        <div className="space-y-2">
                            <textarea
                                placeholder={`Paste multiple URLs here (one per line)...\nhttps://youtube.com/watch?v=...\nhttps://tiktok.com/@user/video/...`}
                                value={batchUrls}
                                onChange={(e) => setBatchUrls(e.target.value)}
                                className="w-full min-h-[150px] p-4 rounded-xl bg-background/50 border border-input focus:ring-2 focus:ring-primary/50 outline-none font-mono text-sm resize-y"
                            />
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-foreground-secondary">
                                    {batchUrls.split('\n').filter(u => u.trim().startsWith('http')).length} valid URLs found
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleImportFile}
                                        className="border-white/10 hover:bg-white/5"
                                    >
                                        <FolderOpen className="w-4 h-4 mr-2" />
                                        Import
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleBatchDownload}
                                        disabled={!batchUrls.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Download All
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-xs">
                            {detectedPlatform !== 'other' && (
                                <span className={cn("font-bold uppercase tracking-wide flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10", getPlatformColor(detectedPlatform))}>
                                    <Globe className="w-3 h-3" />
                                    {getPlatformName(detectedPlatform)}
                                </span>
                            )}
                        </div>
                        {fetchingInfo && (
                            <span className="text-primary text-xs animate-pulse flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Analyzing...
                            </span>
                        )}
                    </div>
                </div>
            </Card>

            {/* Content Grid */}
            {(mediaInfo || url) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Media Info (2 columns) */}
                    <div className="lg:col-span-2 space-y-6">
                        {mediaInfo ? (
                            <UniversalVideoInfo
                                info={mediaInfo}
                                selectedItems={selectedPlaylistItems}
                                onSelectItem={(index) => {
                                    setSelectedPlaylistItems(prev => {
                                        const next = new Set(prev);
                                        if (next.has(index)) next.delete(index);
                                        else next.add(index);
                                        return next;
                                    });
                                }}
                                onSelectAll={(selected) => {
                                    if (selected && mediaInfo.playlistVideos) {
                                        setSelectedPlaylistItems(new Set(mediaInfo.playlistVideos.map((_, i) => i + 1)));
                                    } else {
                                        setSelectedPlaylistItems(new Set());
                                    }
                                }}
                            />
                        ) : (
                            <Card className="p-8 bg-glass-panel border-border-glass min-h-[300px] flex flex-col items-center justify-center">
                                {fetchingInfo ? (
                                    <>
                                        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                        <p className="text-sm text-foreground-secondary">Fetching media information...</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                                            <Film className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <p className="text-sm text-foreground-muted">Preview will appear here</p>
                                    </>
                                )}
                            </Card>
                        )}
                    </div>

                    {/* Right: Download Options (1 column) */}
                    <div className="space-y-6">
                        {mediaInfo ? (
                            <Card className="p-5 bg-glass-panel border-border-glass">
                                <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-foreground-primary">
                                    <Settings className="w-4 h-4 text-purple-400" />
                                    Download Options
                                </h3>

                                <UniversalFormatSelector
                                    format={format}
                                    onFormatChange={setFormat}
                                    audioFormat={audioFormat}
                                    onAudioFormatChange={setAudioFormat}
                                    downloadPath={downloadPath}
                                    onDownload={handleDownload}
                                    onChooseFolder={handleChooseFolder}
                                    availableQualities={mediaInfo?.availableQualities}
                                    duration={mediaInfo?.duration}
                                    platform={detectedPlatform}
                                    isPlaylist={mediaInfo?.isPlaylist}
                                    embedSubs={embedSubs}
                                    setEmbedSubs={setEmbedSubs}
                                    downloadEntirePlaylist={downloadEntirePlaylist}
                                    setDownloadEntirePlaylist={setDownloadEntirePlaylist}
                                    selectedItemsCount={selectedPlaylistItems.size}
                                    totalItemsCount={mediaInfo?.playlistVideos?.length || 0}
                                    playlistVideos={mediaInfo?.playlistVideos}
                                    selectedItems={selectedPlaylistItems}
                                    onSelectItem={(index) => {
                                        setSelectedPlaylistItems(prev => {
                                            const next = new Set(prev);
                                            if (next.has(index)) next.delete(index);
                                            else next.add(index);
                                            return next;
                                        });
                                    }}
                                />
                            </Card>
                        ) : (
                            <Card className="p-8 bg-glass-panel border-border-glass min-h-[300px] flex flex-col items-center justify-center">
                                {fetchingInfo ? (
                                    <>
                                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                                        <p className="text-sm text-foreground-secondary">Analyzing URL...</p>
                                        <p className="text-xs text-foreground-tertiary mt-2">Fetching available formats</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                                            <Settings className="w-8 h-8 text-purple-400" />
                                        </div>
                                        <p className="text-sm text-foreground-muted">Options will appear here</p>
                                        <p className="text-xs text-foreground-tertiary mt-2">Enter a URL to see available formats</p>
                                    </>
                                )}
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!url && !mediaInfo && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/30">
                        <Globe2 className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-foreground-primary">Download from Anywhere</h2>
                    <p className="text-foreground-secondary mb-6 max-w-md">
                        Paste a URL from any supported platform and download videos or audio in high quality
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 max-w-2xl text-xs">
                        {['YouTube', 'TikTok', 'Instagram', 'Facebook', 'Twitter', 'Twitch', 'Reddit', 'Vimeo', 'Pinterest', 'Dailymotion', 'Soundcloud'].map(p => (
                            <span key={p} className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-foreground-secondary hover:bg-white/10 transition-colors">
                                {p}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderDownloads = () => {
        const activeList = Array.from(activeDownloads.values()).filter(d => d.state === 'downloading' || d.state === 'processing');
        const queuedList = queuedDownloads.filter(q => q.state === 'queued');

        return (
            <div className="max-w-5xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Disk Space Info */}
                {diskSpace && (
                    <div className={cn(
                        "p-3 rounded-xl border flex items-center justify-between text-xs",
                        diskSpace.warning ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-white/5 border-white/10 text-foreground-secondary"
                    )}>
                        <div className="flex items-center gap-2">
                            <HardDrive className="w-4 h-4" />
                            <span>
                                <strong className="text-foreground-primary">{formatBytes(diskSpace.available)}</strong> available of {formatBytes(diskSpace.total)}
                            </span>
                        </div>
                        {diskSpace.warning && (
                            <span className="font-bold flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Low disk space
                            </span>
                        )}
                    </div>
                )}

                {/* Active & Queued Downloads Section */}
                {(activeList.length > 0 || queuedList.length > 0) && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground-primary flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                            Queue & Active Downloads ({activeList.length + queuedList.length})
                        </h3>

                        <div className="grid gap-3">
                            {/* Active */}
                            {activeList.map(progress => (
                                <DownloadProgress
                                    key={progress.id}
                                    status={{
                                        status: 'downloading',
                                        message: progress.state === 'processing' ? 'Processing...' : `Downloading... ${progress.percent?.toFixed(1) || 0}%`,
                                        progress: progress.percent,
                                        speed: progress.speed,
                                        eta: progress.eta,
                                        total: progress.total,
                                        downloaded: progress.downloaded,
                                        title: progress.filename,
                                        filename: progress.filename,
                                        platform: progress.platform
                                    }}
                                    onCancel={() => window.universalAPI.cancel(progress.id)}
                                    isPlaylist={false}
                                />
                            ))}

                            {/* Queued */}
                            {queuedList.map(item => (
                                <div key={item.id} className="bg-glass-panel border border-border-glass rounded-xl p-4 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                                            <Clock className="w-4 h-4 text-foreground-muted" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-foreground-primary truncate max-w-md">{item.url}</h4>
                                            <p className="text-[10px] text-foreground-muted uppercase tracking-wider font-bold mt-0.5">In Queue</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                            onClick={() => window.universalAPI.cancel(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* History Section */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground-primary">History</h3>
                            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-foreground-tertiary">
                                {filteredHistory.length} items
                            </span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 sm:w-48">
                                <Input
                                    placeholder="Search history..."
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    className="h-8 text-xs bg-white/5 border-white/10"
                                />
                            </div>

                            {/* Filters */}
                            <select
                                className="h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-[11px] text-foreground-secondary outline-none"
                                value={historyFilter}
                                onChange={(e) => setHistoryFilter(e.target.value as any)}
                            >
                                <option value="all">All Platforms</option>
                                <option value="youtube">YouTube</option>
                                <option value="tiktok">TikTok</option>
                                <option value="instagram">Instagram</option>
                                <option value="facebook">Facebook</option>
                                <option value="twitter">Twitter/X</option>
                                <option value="reddit">Reddit</option>
                            </select>

                            {/* Sort */}
                            <select
                                className="h-8 bg-white/5 border border-white/10 rounded-lg px-2 text-[11px] text-foreground-secondary outline-none"
                                value={historySort}
                                onChange={(e) => setHistorySort(e.target.value as any)}
                            >
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                                <option value="size">Largest Size</option>
                                <option value="platform">By Platform</option>
                            </select>

                            <div className="flex gap-1">
                                <Button
                                    onClick={() => exportHistory('csv')}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-[10px] text-foreground-secondary"
                                    title="Export to CSV"
                                >
                                    CSV
                                </Button>
                                <Button
                                    onClick={() => exportHistory('json')}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-[10px] text-foreground-secondary"
                                    title="Export to JSON"
                                >
                                    JSON
                                </Button>
                            </div>

                            {history.length > 0 && (
                                <Button
                                    onClick={handleClearHistory}
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-8"
                                >
                                    <Trash2 className="w-3 h-3 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        {filteredHistory.length === 0 ? (
                            <div className="text-center py-12 bg-glass-panel rounded-xl border border-border-glass">
                                <Clock className="w-8 h-8 mx-auto mb-3 text-foreground-muted opacity-50" />
                                <p className="text-foreground-tertiary">
                                    {historySearch || historyFilter !== 'all' ? 'No matching downloads found' : 'No downloads yet'}
                                </p>
                                {(historySearch || historyFilter !== 'all') && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="mt-2 text-primary"
                                        onClick={() => {
                                            setHistorySearch('');
                                            setHistoryFilter('all');
                                        }}
                                    >
                                        Clear search & filters
                                    </Button>
                                )}
                            </div>
                        ) : (
                            filteredHistory.map((item: any) => (
                                <div key={item.id} className="bg-glass-panel border border-border-glass rounded-xl p-3 flex gap-4 transition-all hover:bg-white/5 group">
                                    {/* Thumbnail */}
                                    <div className="relative w-32 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-black/50 border border-border-glass">
                                        {item.thumbnailUrl ? (
                                            <>
                                                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover opacity-80" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {item.format === 'audio' ? (
                                                    <Music className="w-8 h-8 text-foreground-muted opacity-30" />
                                                ) : (
                                                    <Video className="w-8 h-8 text-foreground-muted opacity-30" />
                                                )}
                                            </div>
                                        )}
                                        {item.duration && (
                                            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded font-mono">
                                                {formatTime(item.duration)}
                                            </span>
                                        )}
                                        {/* Platform Badge */}
                                        <span className={cn(
                                            "absolute top-1 left-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded backdrop-blur-sm",
                                            getPlatformColor(item.platform),
                                            "bg-black/60 border border-white/20"
                                        )}>
                                            {getPlatformName(item.platform)}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                        <div>
                                            <h4 className="font-medium text-sm text-foreground-primary truncate pr-4" title={item.title}>
                                                {item.title}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1.5 text-xs text-foreground-tertiary font-mono">
                                                <span className="uppercase bg-white/5 px-1.5 py-0.5 rounded border border-white/5 text-[10px]">
                                                    {item.format}
                                                </span>
                                                <span className="opacity-50">|</span>
                                                <span>{formatBytes(item.size)}</span>
                                                <span className="opacity-50">|</span>
                                                <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs bg-white/5 border-white/10 hover:bg-white/10"
                                                onClick={() => window.universalAPI.openFile(item.path)}
                                            >
                                                Open
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 text-xs text-foreground-secondary hover:text-foreground"
                                                onClick={() => window.universalAPI.showInFolder(item.path)}
                                            >
                                                <HardDrive className="w-3 h-3 mr-1" />
                                                Folder
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                onClick={() => handleRemoveFromHistory(item.id, item.title)}
                                                title="Remove from history"
                                            >
                                                <Trash2 className="w-3 h-3" />
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
    };

    const renderSettings = () => (
        <div className="max-w-4xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-5 bg-glass-panel border-border-glass">
                <h3 className="text-base font-semibold text-foreground-primary mb-4 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-blue-400" />
                    Download Location
                </h3>
                <div className="flex gap-3">
                    <Input
                        value={downloadPath || 'Default Downloads Folder'}
                        readOnly
                        className="bg-background/50 border-input font-mono text-sm flex-1"
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleChooseFolder}
                        className="px-4"
                    >
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Change
                    </Button>
                </div>
            </Card>

            <Card className="p-5 bg-glass-panel border-border-glass">
                <h3 className="text-base font-semibold text-foreground-primary mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" />
                    Default Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground-secondary">Default Format</label>
                        <select
                            className="w-full bg-background/50 border-input rounded-lg p-2.5 text-sm text-foreground-primary focus:ring-2 focus:ring-primary/50 outline-none border"
                            value={settings.defaultFormat}
                            onChange={(e) => handleSaveSettings({ ...settings, defaultFormat: e.target.value as 'video' | 'audio' })}
                        >
                            <option value="video">Video</option>
                            <option value="audio">Audio Only</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground-secondary">Default Quality</label>
                        <select
                            className="w-full bg-background/50 border-input rounded-lg p-2.5 text-sm text-foreground-primary focus:ring-2 focus:ring-primary/50 outline-none border"
                            value={settings.defaultQuality}
                            onChange={(e) => handleSaveSettings({ ...settings, defaultQuality: e.target.value as 'best' | 'medium' | 'low' })}
                        >
                            <option value="best">Best Quality</option>
                            <option value="medium">Medium Quality</option>
                            <option value="low">Low Quality</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground-secondary">
                            Browser Cookies Source
                            <span className="block text-[10px] text-foreground-muted font-normal mt-0.5">Use if downloads fail (e.g. valid premium account)</span>
                        </label>
                        <select
                            className="w-full bg-background/50 border-input rounded-lg p-2.5 text-sm text-foreground-primary focus:ring-2 focus:ring-primary/50 outline-none border"
                            value={settings.useBrowserCookies || ''}
                            onChange={(e) => handleSaveSettings({ ...settings, useBrowserCookies: e.target.value as any || null })}
                        >
                            <option value="">None (Public Access)</option>
                            <option value="chrome">Google Chrome</option>
                            <option value="firefox">Mozilla Firefox</option>
                            <option value="edge">Microsoft Edge</option>
                            <option value="safari">Safari</option>
                            <option value="brave">Brave</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-medium text-foreground-secondary">
                            Max Concurrent Downloads
                        </label>
                        <select
                            className="w-full bg-background/50 border-input rounded-lg p-2.5 text-sm text-foreground-primary focus:ring-2 focus:ring-primary/50 outline-none border"
                            value={settings.maxConcurrentDownloads || 3}
                            onChange={(e) => handleSaveSettings({ ...settings, maxConcurrentDownloads: parseInt(e.target.value) })}
                        >
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3 (Default)</option>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                        </select>
                    </div>
                </div>
            </Card>

            <Card className="p-5 bg-glass-panel border-border-glass">
                <h3 className="text-base font-semibold text-foreground-primary mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5 text-emerald-400" />
                    About
                </h3>
                <div className="space-y-2 text-sm text-foreground-secondary">
                    <p>Universal Downloader supports downloading from 1000+ websites including:</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {['YouTube', 'Instagram', 'Facebook', 'TikTok', 'Twitter', 'Twitch', 'Reddit', 'Vimeo', 'Dailymotion', 'Soundcloud'].map(platform => (
                            <span key={platform} className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
                                {platform}
                            </span>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );

    return (
        <ToolPane
            title="Universal Downloader"
            description="Download videos and audio from 1000+ websites with ease"
        >
            <div className="h-full flex flex-col">
                <ToastContainer toasts={toasts} onClose={removeToast} />

                {/* Navigation Tabs */}
                <div className="px-6 border-b border-border-glass bg-glass-panel/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="max-w-5xl mx-auto flex items-center gap-1">
                        <button
                            onClick={() => setView('new')}
                            className={cn(
                                "py-3.5 px-5 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
                                view === 'new'
                                    ? "border-primary text-primary bg-primary/5"
                                    : "border-transparent text-foreground-muted hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                        <button
                            onClick={() => setView('downloads')}
                            className={cn(
                                "py-3.5 px-5 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
                                view === 'downloads'
                                    ? "border-primary text-primary bg-primary/5"
                                    : "border-transparent text-foreground-muted hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            <Clock className="w-4 h-4" />
                            History
                            {activeDownloads.size > 0 && (
                                <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                    {Array.from(activeDownloads.values()).filter(d => d.state === 'downloading').length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setView('settings')}
                            className={cn(
                                "py-3.5 px-5 text-sm font-medium border-b-2 transition-all flex items-center gap-2",
                                view === 'settings'
                                    ? "border-primary text-primary bg-primary/5"
                                    : "border-transparent text-foreground-muted hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            <Settings className="w-4 h-4" />
                            Settings
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto p-6">
                    {view === 'new' && renderNewDownload()}
                    {view === 'downloads' && renderDownloads()}
                    {view === 'settings' && renderSettings()}
                </div>
            </div>
        </ToolPane>
    );
}
