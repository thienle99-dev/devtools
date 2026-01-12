import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Download,
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
    DownloadCloud
} from 'lucide-react';
import { ToolPane } from '@components/layout/ToolPane';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { useToast, ToastContainer } from '@components/ui/Toast';
import { cn } from '@utils/cn';
import { DownloadItem } from './components/DownloadItem';
import { AddDownloadDialog } from './components/AddDownloadDialog';
import type { DownloadTask, DownloadProgress, DownloadSettings, DownloadSegment } from '@/types/network/download';

type FilterStatus = 'all' | 'downloading' | 'completed' | 'paused' | 'failed';

export default function DownloadManager() {
    const [history, setHistory] = useState<DownloadTask[]>([]);
    const [settings, setSettings] = useState<DownloadSettings | null>(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

        // Global progress listener (for updates to existing tasks)
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
            // Task status will update via onAnyProgress
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

    const filteredTasks = useMemo(() => {
        return history.filter(task => {
            const matchesSearch = task.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.url.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [history, searchQuery, statusFilter]);

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
            description="Manage and accelerate your downloads with multi-threaded support."
            actions={
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearHistory}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear All
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsAddDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Download
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard
                        label="All"
                        value={stats.total}
                        icon={Download}
                        active={statusFilter === 'all'}
                        onClick={() => setStatusFilter('all')}
                        color="text-foreground-secondary"
                    />
                    <StatCard
                        label="Active"
                        value={stats.downloading}
                        icon={Clock}
                        active={statusFilter === 'downloading'}
                        onClick={() => setStatusFilter('downloading')}
                        color="text-blue-400"
                    />
                    <StatCard
                        label="Done"
                        value={stats.completed}
                        icon={CheckCircle2}
                        active={statusFilter === 'completed'}
                        onClick={() => setStatusFilter('completed')}
                        color="text-green-500"
                    />
                    <StatCard
                        label="Paused"
                        value={stats.paused}
                        icon={History}
                        active={statusFilter === 'paused'}
                        onClick={() => setStatusFilter('paused')}
                        color="text-yellow-500"
                    />
                    <StatCard
                        label="Failed"
                        value={stats.failed}
                        icon={AlertCircle}
                        active={statusFilter === 'failed'}
                        onClick={() => setStatusFilter('failed')}
                        color="text-red-500"
                    />
                </div>

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-glass-panel border border-border-glass rounded-xl p-3">
                    <div className="relative w-full md:w-96">
                        <Input
                            placeholder="Search downloads..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            icon={Search}
                            fullWidth
                            className="bg-white/5 border-none h-10"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="flex p-1 bg-white/5 rounded-lg border border-white/5">
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "p-1.5 rounded-md transition-all",
                                    viewMode === 'list' ? "bg-white/10 text-foreground" : "text-foreground-muted hover:text-foreground"
                                )}
                            >
                                <LayoutList className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "p-1.5 rounded-md transition-all",
                                    viewMode === 'grid' ? "bg-white/10 text-foreground" : "text-foreground-muted hover:text-foreground"
                                )}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>

                        <Button variant="ghost" size="sm" className="text-foreground-secondary">
                            <ArrowUpDown className="w-4 h-4 mr-2" />
                            Sort
                        </Button>
                        <Button variant="ghost" size="sm" className="text-foreground-secondary">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {filteredTasks.length > 0 ? (
                    <div className={cn(
                        "grid gap-4 transition-all duration-300",
                        viewMode === 'list' ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-glass-panel border-2 border-dashed border-border-glass rounded-3xl">
                        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                            <DownloadCloud className="w-10 h-10 text-blue-500/50" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground-primary mb-2">No Downloads Found</h3>
                        <p className="text-foreground-secondary max-w-sm mx-auto mb-8">
                            {searchQuery ? "Try a different search term or clear filters." : "Start by adding a new download URL to the manager."}
                        </p>
                        {!searchQuery && (
                            <Button
                                size="lg"
                                onClick={() => setIsAddDialogOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Your First Download
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <AddDownloadDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onAdd={handleCreateDownload}
                defaultDownloadPath={settings?.downloadPath}
            />

            <ToastContainer toasts={toasts} onClose={removeToast} />
        </ToolPane>
    );
}

interface StatCardProps {
    label: string;
    value: number;
    icon: any;
    active: boolean;
    onClick: () => void;
    color: string;
}

function StatCard({ label, value, icon: Icon, active, onClick, color }: StatCardProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative border rounded-2xl p-4 transition-all duration-300 text-left overflow-hidden",
                active
                    ? "bg-white/10 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    : "bg-glass-panel border-border-glass hover:bg-white/5 hover:border-white/10"
            )}
        >
            <div className="flex flex-col gap-2">
                <div className={cn("p-2 rounded-lg w-fit transition-colors", active ? "bg-white/10" : "bg-white/5 group-hover:bg-white/10")}>
                    <Icon className={cn("w-4 h-4", active ? color : "text-foreground-muted")} />
                </div>
                <div>
                    <div className="text-2xl font-black text-foreground-primary tabular-nums tracking-tight">
                        {value}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted group-hover:text-foreground-secondary transition-colors">
                        {label}
                    </div>
                </div>
            </div>

            {active && (
                <div className="absolute top-0 right-0 p-2 opacity-20">
                    <Icon className={cn("w-12 h-12 -mr-4 -mt-4", color)} />
                </div>
            )}
        </button>
    );
}
