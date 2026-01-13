import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Settings,
    History,
    Trash2,
    Plus,
    Search,
    ArrowUpDown,
    CheckCircle2,
    Clock,
    AlertCircle,
    LayoutGrid,
    LayoutList,
    DownloadCloud,
    Music,
    Video,
    FileText,
    Cpu,
    Box,
    Layers,
    Zap
} from 'lucide-react';
import { ToolPane } from '@components/layout/ToolPane';
import { Button } from '@components/ui/Button';
import { useToast, ToastContainer } from '@components/ui/Toast';
import { cn } from '@utils/cn';
import { DownloadItem } from './components/DownloadItem';
import { AddDownloadDialog } from './components/AddDownloadDialog';
import { DownloadSettingsDialog } from './components/SettingsDialog';
import type { DownloadTask, DownloadProgress, DownloadSettings, DownloadSegment } from '@/types/network/download';

type FilterStatus = 'all' | 'downloading' | 'completed' | 'paused' | 'failed';
type CategoryFilter = DownloadTask['category'] | 'all';

export default function DownloadManager() {
    const [history, setHistory] = useState<DownloadTask[]>([]);
    const [settings, setSettings] = useState<DownloadSettings | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

    const totalSpeed = useMemo(() => {
        return history
            .filter(t => t.status === 'downloading')
            .reduce((sum, t) => sum + (t.speed || 0), 0);
    }, [history]);

    const handleCreateDownload = async (url: string, filename?: string) => {
        try {
            const task = await window.downloadAPI.create({ url, filename });
            success('Download Queued', `Created task for ${task.filename}`);
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

    const categories = useMemo(() => [
        { id: 'all', label: 'All Files', icon: Layers },
        { id: 'music', label: 'Music', icon: Music },
        { id: 'video', label: 'Video', icon: Video },
        { id: 'document', label: 'Documents', icon: FileText },
        { id: 'program', label: 'Programs', icon: Cpu },
        { id: 'compressed', label: 'Compressed', icon: Box },
    ], []);

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

    const stats = useMemo(() => {
        return {
            total: history.length,
            downloading: history.filter(t => t.status === 'downloading').length,
            completed: history.filter(t => t.status === 'completed').length,
            paused: history.filter(t => t.status === 'paused').length,
            failed: history.filter(t => t.status === 'failed').length
        };
    }, [history]);

    return (
        <ToolPane
            title="Download Manager"
            description="High-performance multi-threaded download engine with real-time analytics."
            actions={
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearHistory}
                        className="text-foreground-tertiary hover:text-rose-400"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear History
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-[0_8px_25px_rgba(59,130,246,0.3)] border-t border-white/20 px-4 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Task
                    </Button>
                </div>
            }
        >
            <div className="flex gap-8 min-h-[600px]">
                {/* Sidebar Navigation */}
                <aside className="w-56 shrink-0 flex flex-col gap-6">
                    {/* Network Status Monitor */}
                    <div className="bg-gradient-to-br from-blue-600/15 via-blue-900/5 to-transparent border border-blue-500/20 rounded-2xl p-4 overflow-hidden relative group shadow-lg shadow-blue-500/5 backdrop-blur-md">
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-3 text-[10px] uppercase tracking-widest font-black text-blue-400">
                                <span className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                    Network Status
                                </span>
                                <div className="flex gap-1 opacity-50">
                                    <div className="w-1 h-1 rounded-full bg-blue-500" />
                                    <div className="w-1 h-1 rounded-full bg-blue-500/40" />
                                    <div className="w-1 h-1 rounded-full bg-blue-500/20" />
                                </div>
                            </div>
                            <div className="text-2xl font-black text-foreground-primary tabular-nums tracking-tighter mb-1 bg-clip-text text-transparent bg-gradient-to-r from-foreground-primary to-foreground-primary/70">
                                {formatBytes(totalSpeed)}/s
                            </div>
                            <div className="text-[10px] text-foreground-muted font-bold flex items-center gap-1.5 uppercase tracking-wide">
                                <Zap className="w-3 h-3 text-blue-500" />
                                Live Throughput
                            </div>
                        </div>

                        {/* Background Decorative Glow */}
                        <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl" />
                    </div>

                    <nav className="space-y-6">
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground-tertiary mb-4 px-2">
                                Library
                            </div>
                            <div className="space-y-1">
                                {categories.map(cat => (
                                    <SidebarItem
                                        key={cat.id}
                                        icon={cat.icon}
                                        label={cat.label}
                                        active={categoryFilter === cat.id}
                                        onClick={() => setCategoryFilter(cat.id as CategoryFilter)}
                                        count={cat.id === 'all' ? history.length : history.filter(t => t.category === cat.id).length}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground-tertiary mb-4 px-2">
                                Activity
                            </div>
                            <div className="space-y-1">
                                <SidebarItem
                                    icon={Clock}
                                    label="Downloading"
                                    active={statusFilter === 'downloading'}
                                    onClick={() => setStatusFilter('downloading')}
                                    color="text-blue-400"
                                    count={stats.downloading}
                                />
                                <SidebarItem
                                    icon={CheckCircle2}
                                    label="Finished"
                                    active={statusFilter === 'completed'}
                                    onClick={() => setStatusFilter('completed')}
                                    color="text-emerald-400"
                                    count={stats.completed}
                                />
                                <SidebarItem
                                    icon={History}
                                    label="Paused"
                                    active={statusFilter === 'paused'}
                                    onClick={() => setStatusFilter('paused')}
                                    color="text-amber-400"
                                    count={stats.paused}
                                />
                                <SidebarItem
                                    icon={AlertCircle}
                                    label="Failed"
                                    active={statusFilter === 'failed'}
                                    onClick={() => setStatusFilter('failed')}
                                    color="text-rose-400"
                                    count={stats.failed}
                                />
                            </div>
                        </div>
                    </nav>

                    <div className="mt-auto">
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-foreground-tertiary hover:bg-foreground-primary/5 hover:text-foreground transition-all border border-transparent hover:border-border-glass group"
                        >
                            <Settings className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                            Engine Settings
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    {/* Integrated Toolbar */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 bg-foreground-primary/[0.03] dark:bg-foreground-primary/[0.02] border border-border-glass rounded-2xl p-2 pr-4 backdrop-blur-md shadow-sm">
                        <div className="relative w-full md:w-80 group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-tertiary group-focus-within:text-blue-400 transition-colors" />
                            <input
                                placeholder="Search library..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none h-11 pl-11 pr-4 text-sm font-medium text-foreground-primary focus:ring-0 placeholder:text-foreground-tertiary"
                            />
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Sort Controls */}
                            <div className="flex items-center gap-1.5 p-1 bg-foreground-primary/5 dark:bg-black/20 rounded-xl border border-border-glass">
                                <button
                                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                    className="p-2 rounded-lg text-foreground-tertiary hover:text-foreground hover:bg-foreground-primary/10 transition-all"
                                >
                                    <ArrowUpDown className={cn("w-3.5 h-3.5 transition-transform duration-500", sortOrder === 'asc' ? "rotate-180" : "")} />
                                </button>
                                <div className="h-4 w-[1px] bg-border-glass mx-1" />
                                {(['date', 'name', 'size'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSortBy(s)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                                            sortBy === s ? "bg-foreground-primary/10 dark:bg-white/5 text-foreground shadow-sm" : "text-foreground-tertiary hover:text-foreground-secondary"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex p-1 bg-foreground-primary/5 dark:bg-black/20 rounded-xl border border-border-glass">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "p-2 rounded-lg transition-all",
                                        viewMode === 'list' ? "bg-foreground-primary/10 dark:bg-white/5 text-foreground shadow-sm" : "text-foreground-tertiary hover:text-foreground"
                                    )}
                                >
                                    <LayoutList className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "p-2 rounded-lg transition-all",
                                        viewMode === 'grid' ? "bg-foreground-primary/10 dark:bg-white/5 text-foreground shadow-sm" : "text-foreground-tertiary hover:text-foreground"
                                    )}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Feed */}
                    {filteredTasks.length > 0 ? (
                        <div className={cn(
                            "grid gap-5 transition-all duration-500",
                            viewMode === 'list' ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                        )}>
                            {filteredTasks.map(task => (
                                <DownloadItem
                                    key={task.id}
                                    task={task}
                                    onStart={handleStart}
                                    onPause={handlePause}
                                    onCancel={handleCancel}
                                    onOpenFolder={openFolder}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="group relative flex flex-col items-center justify-center py-32 text-center bg-glass-panel border-2 border-dashed border-border-glass rounded-[40px] animate-in fade-in zoom-in duration-1000 overflow-hidden">
                            {/* Animated Background Glow */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-blue-500/30 blur-[60px] rounded-full animate-pulse-slow" />
                                <div className="relative w-28 h-28 rounded-[32px] bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/30 flex items-center justify-center shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                                    <DownloadCloud className="w-14 h-14 text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                </div>
                            </div>
                            
                            <h3 className="relative z-10 text-3xl font-black text-foreground-primary mb-3 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground-primary to-foreground-primary/60">
                                No Downloads Found
                            </h3>
                            <p className="relative z-10 text-foreground-tertiary max-w-[320px] mx-auto text-base font-medium leading-relaxed opacity-80">
                                {searchQuery ? 
                                    "We couldn't find any tasks matching your search criteria. Try a different keyword." : 
                                    "Ready to go? Simply paste a URL here or use the Add Task button to start downloading."}
                            </p>

                            {/* Decorative Elements */}
                            <div className="absolute top-10 right-10 w-24 h-24 bg-purple-500/5 rounded-full blur-3xl" />
                            <div className="absolute bottom-10 left-10 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl" />
                        </div>
                    )}
                </main>
            </div>

            <AddDownloadDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onAdd={handleCreateDownload}
                defaultDownloadPath={settings?.downloadPath}
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

interface SidebarItemProps {
    icon: any;
    label: string;
    active: boolean;
    onClick: () => void;
    count?: number;
    color?: string;
}

function SidebarItem({ icon: Icon, label, active, onClick, count, color }: SidebarItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 group relative overflow-hidden",
                active
                    ? "bg-foreground-primary/10 dark:bg-white/10 text-foreground shadow-lg shadow-black/5"
                    : "text-foreground-tertiary hover:bg-foreground-primary/5 dark:hover:bg-white/5 hover:text-foreground-secondary"
            )}
        >
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            )}
            <Icon className={cn(
                "w-4 h-4 transition-all duration-300",
                active ? (color || "text-blue-500") : "text-foreground-tertiary group-hover:scale-110",
                active && "scale-110"
            )} />
            {label}
            {count !== undefined && (
                <span className={cn(
                    "ml-auto px-1.5 py-0.5 rounded-md text-[9px] font-black tabular-nums transition-all",
                    active ? "bg-foreground-primary/10 dark:bg-white/10 text-foreground" : "text-foreground-tertiary opacity-40 group-hover:opacity-100"
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
