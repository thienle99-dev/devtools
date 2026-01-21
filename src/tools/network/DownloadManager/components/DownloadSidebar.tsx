import React from 'react';
import {
    Settings,
    Music,
    Video,
    FileText,
    Cpu,
    Box,
    Layers,
    CheckCircle2,
    Clock,
    Zap,
} from 'lucide-react';
import type { DownloadTask } from '@/types/network/download';
import type { FilterStatus } from '../types';
import { SidebarItem } from './SidebarItem';
import { formatBytes } from '../utils';

interface Category {
    id: DownloadTask['category'] | 'all';
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

interface DownloadSidebarProps {
    history: DownloadTask[];
    stats: {
        downloading: number;
        completed: number;
    };
    categoryFilter: Category['id'];
    onCategoryChange: (category: Category['id']) => void;
    statusFilter: FilterStatus;
    onStatusChange: (status: FilterStatus) => void;
    totalSpeed: number;
    speedHistory: number[];
    onOpenSettings: () => void;
}

const categories: Category[] = [
    { id: 'all', label: 'All Files', icon: Layers },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'document', label: 'Documents', icon: FileText },
    { id: 'program', label: 'Programs', icon: Cpu },
    { id: 'compressed', label: 'Compressed', icon: Box },
];

export const DownloadSidebar: React.FC<DownloadSidebarProps> = ({
    history,
    stats,
    categoryFilter,
    onCategoryChange,
    statusFilter,
    onStatusChange,
    totalSpeed,
    speedHistory,
    onOpenSettings,
}) => (
    <aside className="w-full lg:w-60 shrink-0 flex flex-col gap-6">
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

                    <div className="flex-1 h-10 flex items-end gap-[1px] pt-2">
                        {speedHistory.map((speed, i) => {
                            const maxSpeed = Math.max(...speedHistory, 1024 * 1024);
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
                            onClick={() => onCategoryChange(cat.id)}
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
                        onClick={() => onStatusChange('downloading')}
                        color="text-blue-500"
                        count={stats.downloading}
                    />
                    <SidebarItem
                        icon={CheckCircle2}
                        label="Finished"
                        active={statusFilter === 'completed'}
                        onClick={() => onStatusChange('completed')}
                        color="text-emerald-500"
                        count={stats.completed}
                    />
                </div>
            </section>
        </nav>

        <div className="pt-6 mt-auto border-t border-border-glass scale-95 origin-bottom">
            <button
                onClick={onOpenSettings}
                className="w-full group flex items-center justify-between px-5 py-4 rounded-[20px] bg-bg-glass-panel border border-border-glass hover:bg-bg-glass-hover transition-all duration-300 shadow-xl shadow-black/20"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-foreground-primary/5 text-foreground-tertiary group-hover:text-foreground-primary transition-colors">
                        <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground-tertiary group-hover:text-foreground-primary transition-colors">
                        Settings
                    </span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
            </button>
        </div>
    </aside>
);

DownloadSidebar.displayName = 'DownloadSidebar';
