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

    const [mediaInfo, setMediaInfo] = useState<UniversalMediaInfo | null>(null);
    const [fetchingInfo, setFetchingInfo] = useState(false);
    const [detectedPlatform, setDetectedPlatform] = useState<SupportedPlatform>('other');

    const [activeDownloads, setActiveDownloads] = useState<Map<string, UniversalDownloadProgress>>(new Map());
    const [history, setHistory] = useState<UniversalHistoryItem[]>([]);
    const [downloadPath, setDownloadPath] = useState('');
    const [settings, setSettings] = useState({
        downloadPath: '',
        defaultFormat: 'video' as 'video' | 'audio',
        defaultQuality: '1080p'
    });

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

        return cleanup;
    }, []);

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
                state: 'processing',
                filename: 'Waiting for metadata...',
                platform: detectedPlatform
            });
            return newMap;
        });

        setView('downloads');

        try {
            const downloadOptions: any = {
                url,
                format,
                quality: overrideQuality || quality,
                outputPath: downloadPath || undefined,
                id: downloadId
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
                            <UniversalVideoInfo info={mediaInfo} />
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
                                    downloadPath={downloadPath}
                                    onDownload={handleDownload}
                                    onChooseFolder={handleChooseFolder}
                                    availableQualities={mediaInfo?.availableQualities}
                                    duration={mediaInfo?.duration}
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

        return (
            <div className="max-w-5xl mx-auto w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Active Downloads Section */}
                {activeList.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground-primary flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                            Active Downloads ({activeList.length})
                        </h3>

                        <div className="grid gap-3">
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
                        </div>
                    </div>
                )}

                {/* History Section */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-foreground-primary">History</h3>
                        {history.length > 0 && (
                            <Button
                                onClick={handleClearHistory}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7"
                            >
                                Clear All
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {history.length === 0 ? (
                            <div className="text-center py-12 bg-glass-panel rounded-xl border border-border-glass">
                                <Clock className="w-8 h-8 mx-auto mb-3 text-foreground-muted opacity-50" />
                                <p className="text-foreground-tertiary">No downloads yet</p>
                            </div>
                        ) : (
                            history.map((item: any) => (
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
