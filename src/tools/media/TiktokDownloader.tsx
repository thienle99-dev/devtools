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
    Film,
    Search,
    FolderOpen,
    Play
} from 'lucide-react';
import { isValidTikTokUrl, formatFileSize, formatDuration } from './utils/tiktok-helpers';
import { TikTokVideoInfo } from './components/TikTokVideoInfo';
import { TikTokFormatSelector } from './components/TikTokFormatSelector';
import { DownloadProgress } from './components/DownloadProgress';
import { cn } from '@utils/cn';
import type { TikTokVideoInfo as TikTokVideoInfoType, TikTokDownloadProgress, TikTokHistoryItem } from '@/types/tiktok';

export default function TiktokDownloader() {
    // State
    const [view, setView] = useState<'new' | 'downloads' | 'settings'>('new');
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<'video' | 'audio'>('video');
    const [quality, setQuality] = useState<'best' | 'medium' | 'low'>('best');
    const [videoInfo, setVideoInfo] = useState<TikTokVideoInfoType | null>(null);
    const [fetchingInfo, setFetchingInfo] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeDownloads, setActiveDownloads] = useState<Map<string, TikTokDownloadProgress>>(new Map());
    const [history, setHistory] = useState<TikTokHistoryItem[]>([]);
    const [downloadPath, setDownloadPath] = useState('');
    const [removeWatermark, setRemoveWatermark] = useState(false);

    const { toasts, removeToast, success, error } = useToast();

    // Initialize
    useEffect(() => {
        loadHistory();
        loadSettings();

        // Listen for progress
        const cleanup = window.tiktokAPI.onProgress((progress: TikTokDownloadProgress) => {
            setActiveDownloads(prev => {
                const newMap = new Map(prev);
                newMap.set(progress.id || 'unknown', progress);
                return newMap;
            });
            
            if (progress.state === 'complete') {
                loadHistory(); // Refresh history
                setLoading(false);
                success('Download completed!');
            } else if (progress.state === 'error') {
                setLoading(false);
                error('Download failed');
            }
        });

        return cleanup;
    }, []);

    const loadHistory = async () => {
        const hist = await window.tiktokAPI.getHistory();
        setHistory(hist);
    };

    const loadSettings = async () => {
        const settings = await window.tiktokAPI.getSettings();
        if (settings) {
            setDownloadPath(settings.downloadPath || '');
            setFormat(settings.defaultFormat || 'video');
            setQuality(settings.defaultQuality || 'best');
            setRemoveWatermark(!!settings.removeWatermark);
        }
    };

    // Auto-fetch info when URL changes
    useEffect(() => {
        const fetchInfo = async () => {
            if (!url) {
                setVideoInfo(null);
                return;
            }

            if (!isValidTikTokUrl(url)) return;

            setFetchingInfo(true);
            try {
                const info = await window.tiktokAPI.getInfo(url);
                setVideoInfo(info);
            } catch (err) {
                console.error(err);
                // Don't show error toast immediately as user might be typing
            } finally {
                setFetchingInfo(false);
            }
        };

        const timeout = setTimeout(fetchInfo, 500);
        return () => clearTimeout(timeout);
    }, [url]);

    const handleDownload = async () => {
        if (!url || !isValidTikTokUrl(url)) {
            error('Please enter a valid TikTok URL');
            return;
        }

        setLoading(true);
        try {
            // Optimistic active download entry
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

            // Switch to downloads view
            setView('downloads');

            await window.tiktokAPI.download({
                id,
                url,
                format,
                quality,
                outputPath: downloadPath || undefined,
                watermark: removeWatermark
            });
        } catch (err) {
            console.error(err);
            error('Failed to start download');
            setLoading(false);
        }
    };

    const handleChooseFolder = async () => {
        const path = await window.tiktokAPI.chooseFolder();
        if (path) {
            setDownloadPath(path);
            window.tiktokAPI.saveSettings({ downloadPath: path });
        }
    };

    const handleClearHistory = async () => {
        await window.tiktokAPI.clearHistory();
        loadHistory();
        success('History cleared');
    };

    const handleRemoveFromHistory = async (id: string) => {
        await window.tiktokAPI.removeFromHistory(id);
        loadHistory();
    };

    const handleOpenFile = async (path: string) => {
        await window.tiktokAPI.openFile(path);
    };

    const handleShowInFolder = async (path: string) => {
        await window.tiktokAPI.showInFolder(path);
    };

    // --- Render View ---

    const renderNewDownload = () => (
        <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
            {/* Input Section */}
            <div className="bg-bg-glass p-6 rounded-xl border border-border-glass shadow-lg">
                 <div className="flex gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Paste TikTok video link here..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            icon={Link}
                            fullWidth
                            className="h-12 text-lg font-medium"
                            autoFocus
                        />
                    </div>
                </div>
                
                <div className="mt-2 flex items-center justify-between text-xs text-foreground-muted px-1">
                    <p>Supports: tiktok.com, vm.tiktok.com, m.tiktok.com</p>
                    {fetchingInfo && <span className="text-primary animate-pulse">Fetching video info...</span>}
                </div>
            </div>

            {/* Content Grid */}
            {(videoInfo || url) && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Left: Video Info */}
                    <div className="md:col-span-3 space-y-6">
                        {videoInfo ? (
                             <TikTokVideoInfo info={videoInfo} />
                        ) : (
                            // Skeleton / Placeholder
                            <div className="h-64 rounded-xl bg-bg-glass border border-border-glass flex items-center justify-center text-foreground-muted">
                                {fetchingInfo ? 'Loading preview...' : 'Enter a valid URL to see preview'}
                            </div>
                        )}
                    </div>

                    {/* Right: Options */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-bg-glass p-6 rounded-xl border border-border-glass h-full">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Settings className="w-4 h-4" />
                                Download Options
                            </h3>
                            
                            <TikTokFormatSelector
                                format={format}
                                onFormatChange={setFormat}
                                quality={quality}
                                onQualityChange={setQuality}
                                removeWatermark={removeWatermark}
                                downloadPath={downloadPath}
                                onDownload={handleDownload}
                                onChooseFolder={handleChooseFolder}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            )}

            {!url && !videoInfo && (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-pink-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-pink-500/20">
                        <Film className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">TikTok Downloader</h2>
                    <p className="text-foreground-secondary max-w-md">
                        Download videos without watermark, save music, and organize your favorite content.
                    </p>
                </div>
            )}
        </div>
    );

    const renderDownloads = () => {
        const activeList = Array.from(activeDownloads.values()).filter(d => d.state === 'downloading' || d.state === 'processing');
        
        return (
            <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
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
                                    filename: progress.filename,
                                    title: progress.filename
                                }}
                                onCancel={() => window.tiktokAPI.cancel(progress.id)}
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
                                <div key={item.id} className="group bg-bg-glass hover:bg-white/5 border border-border-glass rounded-lg p-3 flex gap-4 transition-all">
                                    {/* Thumb */}
                                    <div className="relative w-24 h-16 bg-black/50 rounded flex-shrink-0 overflow-hidden">
                                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[9px] font-mono text-white">
                                            {formatDuration(item.duration)}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h4 className="font-medium text-sm truncate pr-4">{item.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-foreground-muted">
                                            <span className="text-foreground-secondary">{item.authorUsername}</span>
                                            <span>•</span>
                                            <span className="uppercase">{item.format}</span>
                                            <span>•</span>
                                            <span>{formatFileSize(item.size)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-2" onClick={() => handleShowInFolder(item.path)} title="Show in Folder">
                                            <FolderOpen className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-2" onClick={() => handleOpenFile(item.path)} title="Play">
                                            <Play className="w-4 h-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => handleRemoveFromHistory(item.id)} title="Remove">
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
            title="TikTok Downloader"
            description="Download videos and music from TikTok"
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
                            <Search className="w-4 h-4" />
                            Search & Download
                        </button>
                        <button
                            onClick={() => setView('downloads')}
                            className={cn(
                                "py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                                view === 'downloads' ? "border-primary text-primary" : "border-transparent text-foreground-muted hover:text-foreground"
                            )}
                        >
                            <Download className="w-4 h-4" />
                            Downloads
                            {activeDownloads.size > 0 && (
                                <span className="bg-primary text-primary-foreground text-[10px] px-1.5 rounded-full font-bold">
                                    {Array.from(activeDownloads.values()).filter(d => d.state === 'downloading').length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto p-6 md:p-8">
                    {view === 'new' && renderNewDownload()}
                    {view === 'downloads' && renderDownloads()}
                </div>
            </div>
        </ToolPane>
    );
}
