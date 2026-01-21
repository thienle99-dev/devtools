import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { ToolPane } from '@components/layout/ToolPane';
import { Button } from '@components/ui/Button';
import { useToast, ToastContainer } from '@components/ui/Toast';
import { DownloadItem } from './components/DownloadItem';
import { AddDownloadDialog } from './components/AddDownloadDialog';
import { DownloadSettingsDialog } from './components/SettingsDialog';
import type { DownloadTask, DownloadProgress, DownloadSettings, DownloadSegment } from '@/types/network/download';
import { DownloadSidebar } from './components/DownloadSidebar';
import { DownloadToolbar } from './components/DownloadToolbar';
import { DownloadEmptyState } from './components/DownloadEmptyState';
import type { CategoryFilter, FilterStatus, DownloadStats, DownloadViewMode, SortBy } from './types';
const TOOL_ID = 'download-manager';

export default function DownloadManager() {
    const [history, setHistory] = useState<DownloadTask[]>([]);
    const [settings, setSettings] = useState<DownloadSettings | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [viewMode, setViewMode] = useState<DownloadViewMode>('list');
    const [speedHistory, setSpeedHistory] = useState<number[]>(new Array(20).fill(0));
    const lastClipboardUrl = useRef<string>('');

    // Clipboard Monitoring
    useEffect(() => {
        if (!settings?.monitorClipboard) return;

        const interval = setInterval(async () => {
            try {
                const text = await (window as any).ipcRenderer.invoke('clipboard-read-text');
                if (!text || text === lastClipboardUrl.current) return;

                lastClipboardUrl.current = text;

                // Simple URL validation
                if (text.startsWith('http://') || text.startsWith('https://')) {
                    // Check if ends with common download extensions (optional but safer)
                    const isDownloadLink = /\.(zip|exe|dmg|pkg|mp4|mkv|iso|rar|7z|pdf|jpg|png|mp3)$/i.test(text);

                    if (isDownloadLink) {
                        success('Link Detected', 'Would you like to download the link from clipboard?', {
                            action: {
                                label: 'Download Now',
                                onClick: () => handleCreateDownload([text])
                            }
                        });
                    }
                }
            } catch (err) {
                // Silently fail clipboard errors
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [settings?.monitorClipboard]);

    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const totalSpeed = useMemo(() => {
        return history
            .filter(t => t.status === 'downloading')
            .reduce((sum, t) => sum + (t.speed || 0), 0);
    }, [history]);

    // Update Speed History for Sparkline
    useEffect(() => {
        setSpeedHistory(prev => {
            const next = [...prev.slice(1), totalSpeed];
            return next;
        });
    }, [totalSpeed]);

    const { toasts, removeToast, success, error } = useToast();

    // Load initial data
    const loadData = useCallback(async () => {
        try {
            const [hist, sett] = await Promise.all([
                window.downloadAPI.getHistory(),
                window.downloadAPI.getSettings()
            ]);
            setHistory(hist);
            setSettings(sett);
        } catch (err) {
            console.error('Failed to load download data:', err);
        }
    }, []);

    useEffect(() => {
        loadData();

        // Global progress listener
        const cleanup = window.downloadAPI.onAnyProgress((progress: DownloadProgress) => {
            setHistory(prev => prev.map(task => {
                if (task.id === progress.taskId) {
                    return {
                        ...task,
                        downloadedSize: progress.downloadedSize,
                        speed: progress.speed,
                        eta: progress.eta,
                        status: progress.status,
                        segments: (progress.segments || task.segments) as DownloadSegment[]
                    };
                }
                return task;
            }));
        });

        return cleanup;
    }, [loadData]);

    // Notification Sounds
    useEffect(() => {
        if (!settings?.enableSounds) return;

        const startSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        const completeSound = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');

        startSound.volume = 0.4;
        completeSound.volume = 0.5;

        const cleanupStarted = (window as any).downloadAPI.onStarted(() => {
            startSound.play().catch(() => { }); // Catch play() errors (browser policy)
        });

        const cleanupCompleted = (window as any).downloadAPI.onCompleted(() => {
            completeSound.play().catch(() => { });
        });

        return () => {
            cleanupStarted();
            cleanupCompleted();
        };
    }, [settings?.enableSounds]);


    const handleCreateDownload = async (urls: string[], options?: {
        filename?: string,
        checksum?: { algorithm: 'md5' | 'sha1' | 'sha256', value: string },
        credentials?: { username?: string, password?: string }
    }) => {
        try {
            for (const url of urls) {
                await (window as any).downloadAPI.create({
                    url,
                    filename: options?.filename,
                    checksum: options?.checksum,
                    credentials: options?.credentials
                });
            }
            success('Download Queued', `Created ${urls.length} task(s)`);
            loadData();
        } catch (err: any) {
            error('Failed to Create Download', err.message);
        }
    };

    const handleStart = async (id: string) => {
        try {
            await window.downloadAPI.start(id);
        } catch (err: any) {
            error('Failed to Start', err.message);
        }
    };

    const handlePause = async (id: string) => {
        try {
            await window.downloadAPI.pause(id);
            setHistory(prev => prev.map(t => t.id === id ? { ...t, status: 'paused' } : t));
        } catch (err: any) {
            error('Failed to Pause', err.message);
        }
    };

    const handleCancel = async (id: string) => {
        if (confirm('Are you sure you want to cancel and delete this download?')) {
            try {
                await window.downloadAPI.cancel(id);
                setHistory(prev => prev.filter(t => t.id !== id));
                success('Download Cancelled', 'Task removed');
            } catch (err: any) {
                error('Failed to Cancel', err.message);
            }
        }
    };

    const handleVerifyChecksum = async (id: string) => {
        try {
            const verified = await (window as any).downloadAPI.verifyChecksum(id);
            if (verified) {
                success('Verification Successful', 'The file integrity has been verified.');
            } else {
                error('Verification Failed', 'The file hash does not match the provided checksum.');
            }
            loadData();
        } catch (err: any) {
            error('Verification Error', err.message);
        }
    };

    const handleClearHistory = async () => {
        if (confirm('Clear all download history? Active downloads will be stopped.')) {
            try {
                await window.downloadAPI.clearHistory();
                setHistory([]);
                success('History Cleared', 'All tasks removed');
            } catch (err: any) {
                error('Failed to Clear History', err.message);
            }
        }
    };

    const openFolder = async (path: string) => {
        try {
            await window.downloadAPI.openFolder(path);
        } catch (err: any) {
            error('Failed to Open Folder', err.message);
        }
    };

    const handleSaveSettings = async (newSettings: Partial<DownloadSettings>) => {
        try {
            await window.downloadAPI.saveSettings(newSettings);
            setSettings(prev => prev ? { ...prev, ...newSettings } : null);
            success('Settings Saved', 'Download manager settings updated');
        } catch (err: any) {
            error('Failed to Save Settings', err.message);
        }
    };

    const filteredTasks = useMemo(() => {
        return history.filter(task => {
            const matchesSearch = task.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.url.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
            const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
            return matchesSearch && matchesStatus && matchesCategory;
        }).sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.filename.localeCompare(b.filename);
                    break;
                case 'size':
                    comparison = a.totalSize - b.totalSize;
                    break;
                case 'date':
                default:
                    comparison = a.createdAt - b.createdAt;
                    break;
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });
    }, [history, searchQuery, statusFilter, categoryFilter, sortBy, sortOrder]);

    const stats: DownloadStats = useMemo(
        () => ({
            total: history.length,
            downloading: history.filter(t => t.status === 'downloading').length,
            completed: history.filter(t => t.status === 'completed').length,
            paused: history.filter(t => t.status === 'paused').length,
            failed: history.filter(t => t.status === 'failed').length,
        }),
        [history]
    );

    return (
        <ToolPane
            title="Download Manager"
            description="Ultra-fast multi-threaded download engine with AI-ready file management."
            toolId={TOOL_ID}
            actions={
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearHistory}
                        className="text-foreground-tertiary hover:text-rose-400 hover:bg-rose-500/5 transition-all rounded-xl"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                    </Button>
                    <div className="w-[1px] h-6 bg-border-glass" />
                    <Button
                        size="sm"
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 border-t border-white/20 px-5 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Download
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col lg:flex-row gap-8 min-h-[700px]">
                <DownloadSidebar
                    history={history}
                    stats={{ downloading: stats.downloading, completed: stats.completed }}
                    categoryFilter={categoryFilter}
                    onCategoryChange={setCategoryFilter}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    totalSpeed={totalSpeed}
                    speedHistory={speedHistory}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                />

                {/* Main Content Area - Compact Density */}
                <main className="flex-1 min-w-0 flex flex-col gap-4">
                    <DownloadToolbar
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        sortBy={sortBy}
                        onSortByChange={setSortBy}
                        sortOrder={sortOrder}
                        onToggleSortOrder={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                    />

                    {/* Scrollable Feed - High Density */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                        {filteredTasks.length > 0 ? (
                            <Reorder.Group
                                axis="y"
                                values={filteredTasks}
                                onReorder={async (newOrder) => {
                                    // Local update for immediate feedback
                                    setHistory(prev => {
                                        const otherTasks = prev.filter(t => !filteredTasks.some(ft => ft.id === t.id));
                                        return [...newOrder, ...otherTasks];
                                    });

                                    // Find which item actually moved for the backend IPC
                                    // This is a bit complex with filtering, so we'll just send the new order to a new IPC or use start/end index
                                    // Actually, let's just implement a simple reorder in DownloadManager.tsx for now
                                    // and then sync the full history.

                                    // For simplicity, we'll sync the full history.
                                    await (window as any).downloadAPI.saveHistory(newOrder);
                                }}
                                className={`grid transition-all duration-700 ${viewMode === 'list' ? "grid-cols-1 gap-1.5" : "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2"}`}
                            >
                                {filteredTasks.map(task => (
                                    <Reorder.Item
                                        key={task.id}
                                        value={task}
                                        dragListener={viewMode === 'list'} // Only drag in list view for better UX
                                    >
                                        <DownloadItem
                                            task={task}
                                            onStart={handleStart}
                                            onPause={handlePause}
                                            onCancel={handleCancel}
                                            onOpenFolder={openFolder}
                                            onVerifyChecksum={handleVerifyChecksum}
                                            viewMode={viewMode}
                                        />
                                    </Reorder.Item>
                                ))}
                            </Reorder.Group>
                        ) : (
                            <DownloadEmptyState searchQuery={searchQuery} />
                        )}
                    </div>
                </main>
            </div>

            <AddDownloadDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onAdd={handleCreateDownload}
            />

            {settings && (
                <DownloadSettingsDialog
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    settings={settings}
                    onSave={handleSaveSettings}
                />
            )}

            <ToastContainer toasts={toasts} onClose={removeToast} />
        </ToolPane>
    );
}
