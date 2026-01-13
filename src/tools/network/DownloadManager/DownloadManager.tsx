import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Settings,
    Trash2,
    Plus,
    Search,
    ArrowUpDown,
    CheckCircle2,
    Clock,
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
    const [speedHistory, setSpeedHistory] = useState<number[]>(new Array(20).fill(0));

    const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
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
            description="Ultra-fast multi-threaded download engine with AI-ready file management."
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
                {/* Sidebar Navigation - Compact Analytics Hub */}
                <aside className="w-full lg:w-60 shrink-0 flex flex-col gap-6">
                    {/* Performance Dashboard Card - Compact */}
                    <div className="relative group rounded-[24px] bg-bg-glass-panel border border-border-glass p-5 shadow-2xl transition-all duration-700 hover:border-blue-500/30">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
                                <div className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                    <span className="w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                    Live
                                </div>
                            </div>
                            
                            <div className="flex items-end justify-between gap-4">
                                <div className="space-y-1 shrink-0">
                                    <div className="text-2xl font-black text-foreground tabular-nums tracking-tighter">
                                        {formatBytes(totalSpeed)}<span className="text-xs font-bold text-foreground-tertiary ml-1">/s</span>
                                    </div>
                                    <div className="text-[9px] text-foreground-tertiary font-bold uppercase tracking-wider opacity-80">
                                        Overall Speed
                                    </div>
                                </div>

                                {/* Mini Speed Sparkline */}
                                <div className="flex-1 h-10 flex items-end gap-[1px] pt-2">
                                    {speedHistory.map((speed, i) => {
                                        const maxSpeed = Math.max(...speedHistory, 1024 * 1024); // Min 1MB for scale
                                        const height = (speed / maxSpeed) * 100;
                                        return (
                                            <div 
                                                key={i}
                                                className="flex-1 bg-blue-500/20 rounded-full relative group/bar transition-all duration-300"
                                                style={{ height: `${Math.max(height, 4)}%` }}
                                            >
                                                <div 
                                                    className="absolute inset-0 bg-blue-500 rounded-full opacity-40 group-hover/bar:opacity-100 transition-opacity"
                                                    style={{ height: '100%' }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-border-glass grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm font-black text-foreground">{stats.downloading}</div>
                                    <div className="text-[8px] uppercase font-bold text-foreground-tertiary tracking-widest opacity-80">Active</div>
                                </div>
                                <div>
                                    <div className="text-sm font-black text-foreground">{stats.completed}</div>
                                    <div className="text-[8px] uppercase font-bold text-foreground-tertiary tracking-widest opacity-80">Done</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <nav className="space-y-6 flex-1">
                        <section>
                            <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground-muted mb-2 px-3 opacity-40">
                                Filters
                            </h4>
                            <div className="space-y-0.5">
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
                        </section>

                        <section>
                            <div className="space-y-0.5">
                                <SidebarItem
                                    icon={Clock}
                                    label="Downloading"
                                    active={statusFilter === 'downloading'}
                                    onClick={() => setStatusFilter('downloading')}
                                    color="text-blue-500"
                                    count={stats.downloading}
                                />
                                <SidebarItem
                                    icon={CheckCircle2}
                                    label="Finished"
                                    active={statusFilter === 'completed'}
                                    onClick={() => setStatusFilter('completed')}
                                    color="text-emerald-500"
                                    count={stats.completed}
                                />
                            </div>
                        </section>
                    </nav>

                    <div className="pt-6 mt-auto border-t border-border-glass scale-95 origin-bottom">
                         <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="w-full group flex items-center justify-between px-5 py-4 rounded-[20px] bg-bg-glass-panel border border-border-glass hover:bg-bg-glass-hover transition-all duration-300 shadow-xl shadow-black/20"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-foreground-primary/5 text-foreground-tertiary group-hover:text-foreground-primary transition-colors">
                                    <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-foreground-tertiary group-hover:text-foreground-primary transition-colors">Settings</span>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                        </button>
                    </div>
                </aside>

                {/* Main Content Area - Compact Density */}
                <main className="flex-1 min-w-0 flex flex-col gap-4">
                    {/* Compact Toolbar */}
                    <header className="flex items-center justify-between bg-bg-glass-panel border border-border-glass rounded-2xl p-1.5 shadow-xl backdrop-blur-xl">
                        <div className="relative group flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-tertiary group-focus-within:text-blue-500 transition-colors" />
                            <input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none py-2 pl-9 pr-4 text-xs font-bold text-foreground-primary focus:ring-0 placeholder:text-foreground-tertiary/40 transition-all"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 pr-1.5">
                            <button
                                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                className="p-2 rounded-lg text-foreground-tertiary hover:text-white hover:bg-white/5 transition-all"
                                title="Toggle Sort Order"
                            >
                                <ArrowUpDown className={cn("w-3.5 h-3.5 transition-transform duration-500", sortOrder === 'asc' ? "rotate-180" : "")} />
                            </button>

                            <div className="flex items-center gap-0.5 bg-foreground-primary/5 rounded-xl p-0.5 border border-border-glass">
                                {(['date', 'name'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSortBy(s)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                            sortBy === s 
                                                ? "bg-blue-600 text-white" 
                                                : "text-foreground-tertiary hover:text-foreground-primary"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-0.5 bg-foreground-primary/5 rounded-xl p-0.5 border border-border-glass">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-all",
                                        viewMode === 'list' ? "bg-foreground-primary/10 text-foreground-primary" : "text-foreground-tertiary hover:text-foreground-secondary"
                                    )}
                                >
                                    <LayoutList className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-all",
                                        viewMode === 'grid' ? "bg-foreground-primary/10 text-foreground-primary" : "text-foreground-tertiary hover:text-foreground-secondary"
                                    )}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </header>

                    {/* Scrollable Feed - High Density */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
                        {filteredTasks.length > 0 ? (
                            <div className={cn(
                                "grid transition-all duration-700",
                                viewMode === 'list' ? "grid-cols-1 gap-1.5" : "grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2"
                            )}>
                            {filteredTasks.map(task => (
                                <DownloadItem
                                    key={task.id}
                                    task={task}
                                    onStart={handleStart}
                                    onPause={handlePause}
                                    onCancel={handleCancel}
                                    onOpenFolder={openFolder}
                                    viewMode={viewMode}
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
                </div>
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
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black transition-all duration-500 group relative overflow-hidden",
                active
                    ? "bg-blue-600/10 dark:bg-blue-500/10 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)] border border-blue-500/20"
                    : "text-foreground-tertiary hover:bg-white/5 hover:text-foreground-secondary border border-transparent"
            )}
        >
            {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-blue-500 rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
            )}
            <Icon className={cn(
                "w-4 h-4 transition-all duration-500",
                active ? (color || "text-blue-500") : "text-foreground-tertiary group-hover:scale-110",
                active && "scale-125 rotate-[5deg]"
            )} />
            <span className="uppercase tracking-widest">{label}</span>
            {count !== undefined && (
                <span className={cn(
                    "ml-auto px-2 py-0.5 rounded-lg text-[9px] font-black tabular-nums transition-all border",
                    active 
                        ? "bg-blue-500 text-white shadow-lg border-blue-400/50" 
                        : "bg-white/5 text-foreground-tertiary border-border-glass opacity-40 group-hover:opacity-100"
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
