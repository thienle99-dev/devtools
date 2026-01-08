import { useState, useEffect } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useToast, ToastContainer } from '@components/ui/Toast';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { 
    Download, 
    Settings, 
    Link, 
    RotateCcw, 
    Trash2, 
    Globe,
    FolderOpen,
    Play,
    Globe2
} from 'lucide-react';
import { UniversalVideoInfo } from './components/UniversalVideoInfo';
import { UniversalFormatSelector } from './components/UniversalFormatSelector';
import { DownloadProgress } from './components/DownloadProgress';
import { detectPlatform, getPlatformName, getPlatformColor } from './utils/platform-detector';
import { cn } from '@utils/cn';
import type { UniversalMediaInfo, UniversalDownloadProgress, UniversalHistoryItem, SupportedPlatform } from '@/types/universal-media';
import { formatBytes } from '@utils/format';

// Helper for duration (move to utils if used widely)
const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function UniversalDownloader() {
    // State
    const [view, setView] = useState<'new' | 'downloads' | 'settings'>('new');
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<'video' | 'audio'>('video');
    const [quality, setQuality] = useState<'best' | 'medium' | 'low'>('best');
    
    const [mediaInfo, setMediaInfo] = useState<UniversalMediaInfo | null>(null);
    const [fetchingInfo, setFetchingInfo] = useState(false);
    const [loading, setLoading] = useState(false);
    const [detectedPlatform, setDetectedPlatform] = useState<SupportedPlatform>('other');
    
    const [activeDownloads, setActiveDownloads] = useState<Map<string, UniversalDownloadProgress>>(new Map());
    const [history, setHistory] = useState<UniversalHistoryItem[]>([]);
    const [downloadPath, setDownloadPath] = useState('');

    const { toasts, removeToast, success, error } = useToast();

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
                setLoading(false);
                success('Download completed!', progress.filename);
            } else if (progress.state === 'error') {
                setLoading(false);
                error('Download failed', 'Check URL or connection');
            }
        });

        return cleanup;
    }, []);

    const loadHistory = async () => {
        const hist = await window.universalAPI.getHistory();
        setHistory(hist);
    };

    const loadSettings = async () => {
        const settings = await window.universalAPI.getSettings();
        if (settings) {
            setDownloadPath(settings.downloadPath || '');
            setFormat(settings.defaultFormat || 'video');
            setQuality(settings.defaultQuality || 'best');
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
                const info = await window.universalAPI.getInfo(url);
                setMediaInfo(info);
                
                // Update detected platform from backend info if 'other'
                if (platform === 'other' && info.platform) {
                    setDetectedPlatform(info.platform);
                }
            } catch (err) {
                console.error(err);
                // Don't toast error on strict type effect, wait for user action or just show incomplete state
            } finally {
                setFetchingInfo(false);
            }
        };

        const timeout = setTimeout(fetchInfo, 800); // Debounce
        return () => clearTimeout(timeout);
    }, [url]);

    const handleDownload = async () => {
        if (!url || !url.startsWith('http')) {
            error('Please enter a valid URL');
            return;
        }

        setLoading(true);
        try {
            const id = crypto.randomUUID();
            setActiveDownloads(prev => {
                const newMap = new Map(prev);
                newMap.set(id, {
                    id,
                    percent: 0,
                    downloaded: 0,
                    total: 0,
                    speed: 0,
                    eta: 0,
                    state: 'downloading',
                    filename: 'Starting...'
                });
                return newMap;
            });

            setView('downloads');

            await window.universalAPI.download({
                id,
                url,
                format,
                quality,
                outputPath: downloadPath || undefined
            });
        } catch (err) {
            console.error(err);
            error('Failed to start download');
            setLoading(false);
        }
    };

    const handleChooseFolder = async () => {
        const path = await window.universalAPI.chooseFolder();
        if (path) {
            setDownloadPath(path);
            window.universalAPI.saveSettings({ downloadPath: path });
        }
    };

    const handleClearHistory = async () => {
        if (confirm('Are you sure you want to clear all history?')) {
            await window.universalAPI.clearHistory();
            loadHistory();
            success('History cleared');
        }
    };

    const handleRemoveFromHistory = async (id: string) => {
        await window.universalAPI.removeFromHistory(id);
        loadHistory();
    };

    const handleOpenFile = async (path: string) => {
        await window.universalAPI.openFile(path);
    };

    const handleShowInFolder = async (path: string) => {
        await window.universalAPI.showInFolder(path);
    };

    // --- Render ---

    const renderNewDownload = () => (
        <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in pb-10">
            {/* Input Section */}
            <div className="bg-bg-glass p-6 rounded-xl border border-border-glass shadow-lg">
                 <div className="flex flex-col gap-4">
                    <Input
                        placeholder="Paste URL from YouTube, Instagram, Facebook, TikTok, etc..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        icon={Globe}
                        fullWidth
                        className="h-14 text-lg font-medium"
                        autoFocus
                    />
                    
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-xs">
                             {detectedPlatform !== 'other' && (
                                <span className={cn("font-bold uppercase tracking-wide flex items-center gap-1.5", getPlatformColor(detectedPlatform))}>
                                    <Globe2 className="w-3 h-3" />
                                    {getPlatformName(detectedPlatform)} Detected
                                </span>
                             )}
                        </div>
                        {fetchingInfo && <span className="text-primary text-xs animate-pulse flex items-center gap-1">Fetching metadata...</span>}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            {(mediaInfo || url) && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Left: Info */}
                    <div className="md:col-span-3 space-y-6">
                        {mediaInfo ? (
                             <UniversalVideoInfo info={mediaInfo} />
                        ) : (
                            // Placeholder
                            <div className="h-64 rounded-xl bg-bg-glass border border-border-glass flex flex-col items-center justify-center text-foreground-muted gap-4">
                                {fetchingInfo ? (
                                    <>
                                        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                        <p className="text-sm">Analyzing Link...</p>
                                    </>
                                ) : (
                                    <>
                                        <Link className="w-12 h-12 opacity-20" />
                                        <p className="text-sm opacity-50">Preview will appear here</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Options */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-bg-glass p-6 rounded-xl border border-border-glass h-full">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Options
                            </h3>
                            
                            <UniversalFormatSelector
                                format={format}
                                onFormatChange={setFormat}
                                quality={quality}
                                onQualityChange={setQuality}
                                downloadPath={downloadPath}
                                onDownload={handleDownload}
                                onChooseFolder={handleChooseFolder}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            )}

            {!url && !mediaInfo && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-70">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20">
                        <Globe2 className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Universal Media Downloader</h2>
                    <div className="flex flex-wrap justify-center gap-2 max-w-lg mt-4 text-xs text-foreground-secondary opacity-80">
                         {['YouTube', 'TikTok', 'Instagram', 'Facebook', 'Twitter', 'Twitch', 'Reddit', 'Vimeo', 'Pinterest'].map(p => (
                            <span key={p} className="bg-white/5 px-2 py-1 rounded border border-white/5">{p}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderDownloads = () => {
        const activeList = Array.from(activeDownloads.values()).filter(d => d.state === 'downloading' || d.state === 'processing');
        
        return (
            <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in pb-10">
                 {/* Header */}
                 <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Download className="w-5 h-5 text-primary" />
                        Downloads
                    </h2>
                    <div className="flex gap-2">
                         {history.length > 0 && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleClearHistory}
                                className="text-red-400 hover:text-red-300 border-red-500/20 hover:border-red-500/40"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Clear History
                            </Button>
                        )}
                    </div>
                </div>

                {/* Active Downloads */}
                {activeList.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-muted">Active</h3>
                        {activeList.map(progress => (
                            <DownloadProgress 
                                key={progress.id} 
                                status={{
                                    status: progress.state === 'complete' ? 'success' : progress.state === 'error' ? 'error' : 'downloading',
                                    progress: progress.percent,
                                    downloaded: progress.downloaded,
                                    total: progress.total,
                                    speed: progress.speed,
                                    eta: progress.eta,
                                    filename: progress.filename || 'Downloading...',
                                    title: progress.filename,
                                    platform: progress.platform
                                }}
                                onCancel={() => window.universalAPI.cancel(progress.id)}
                            />
                        ))}
                    </div>
                )}

                {/* History */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground-muted">History</h3>
                    
                    {history.length === 0 ? (
                        <div className="text-center py-12 bg-bg-glass rounded-xl border border-border-glass text-foreground-muted">
                            <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No download history yet</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {history.map(item => (
                                <div key={item.id} className="group bg-bg-glass hover:bg-white/5 border border-border-glass rounded-lg p-3 flex gap-4 transition-all overflow-hidden relative">
                                    {/* Platform Indicator Strip */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${getPlatformColor(item.platform).replace('text-', 'bg-')}`} />

                                    {/* Thumb */}
                                    <div className="relative w-28 h-16 bg-black/50 rounded flex-shrink-0 overflow-hidden ml-2">
                                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                                        {item.duration && (
                                            <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[9px] font-mono text-white">
                                                {formatDuration(item.duration)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-medium text-sm truncate pr-4 text-foreground-primary mb-1">{item.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-foreground-muted">
                                            <span className={cn("uppercase font-bold text-[10px]", getPlatformColor(item.platform))}>
                                                {getPlatformName(item.platform)}
                                            </span>
                                            <span>•</span>
                                            <span className="uppercase">{item.format}</span>
                                            <span>•</span>
                                            <span>{formatBytes(item.size)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-2" onClick={() => handleShowInFolder(item.path)} title="Show in Folder">
                                            <FolderOpen className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-2" onClick={() => handleOpenFile(item.path)} title="Play">
                                            <Play className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleRemoveFromHistory(item.id)} title="Remove">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <ToolPane
            title="Universal Downloader"
            description="One tool to download from everywhere - YouTube, Instagram, Facebook, and more."
        >
            <div className="h-full flex flex-col">
                <ToastContainer toasts={toasts} onClose={removeToast} />
                {/* Navbar */}
                <div className="px-6 border-b border-border-glass bg-bg-glass/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto flex items-center gap-1">
                        <button
                            onClick={() => setView('new')}
                            className={cn(
                                "py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                view === 'new' ? "border-primary text-primary" : "border-transparent text-foreground-muted hover:text-foreground"
                            )}
                        >
                            <Globe className="w-4 h-4" />
                            Download
                        </button>
                        <button
                            onClick={() => setView('downloads')}
                            className={cn(
                                "py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                view === 'downloads' ? "border-primary text-primary" : "border-transparent text-foreground-muted hover:text-foreground"
                            )}
                        >
                            <Download className="w-4 h-4" />
                            History
                            {activeDownloads.size > 0 && (
                                <span className="bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full font-bold ml-1">
                                    {Array.from(activeDownloads.values()).filter(d => d.state === 'downloading').length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    {view === 'new' && renderNewDownload()}
                    {view === 'downloads' && renderDownloads()}
                </div>
            </div>
        </ToolPane>
    );
}
