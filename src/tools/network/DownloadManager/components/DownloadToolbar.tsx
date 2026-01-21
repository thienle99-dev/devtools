import React from 'react';
import { Search, ArrowUpDown, LayoutList, LayoutGrid } from 'lucide-react';
import { cn } from '@utils/cn';
import type { DownloadViewMode, SortBy } from '../types';

interface DownloadToolbarProps {
    searchQuery: string;
    onSearchChange: (value: string) => void;
    sortBy: SortBy;
    onSortByChange: (value: SortBy) => void;
    sortOrder: 'asc' | 'desc';
    onToggleSortOrder: () => void;
    viewMode: DownloadViewMode;
    onViewModeChange: (mode: DownloadViewMode) => void;
}

export const DownloadToolbar: React.FC<DownloadToolbarProps> = ({
    searchQuery,
    onSearchChange,
    sortBy,
    onSortByChange,
    sortOrder,
    onToggleSortOrder,
    viewMode,
    onViewModeChange,
}) => (
    <header className="flex items-center justify-between bg-bg-glass-panel border border-border-glass rounded-2xl p-1.5 shadow-xl backdrop-blur-xl">
        <div className="relative group flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-tertiary group-focus-within:text-blue-500 transition-colors" />
            <input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-transparent border-none py-2 pl-9 pr-4 text-xs font-bold text-foreground-primary focus:ring-0 placeholder:text-foreground-tertiary/40 transition-all"
            />
        </div>

        <div className="flex items-center gap-1.5 pr-1.5">
            <button
                onClick={onToggleSortOrder}
                className="p-2 rounded-lg text-foreground-tertiary hover:text-white hover:bg-white/5 transition-all"
                title="Toggle Sort Order"
            >
                <ArrowUpDown className={cn("w-3.5 h-3.5 transition-transform duration-500", sortOrder === 'asc' ? "rotate-180" : "")} />
            </button>

            <div className="flex items-center gap-0.5 bg-foreground-primary/5 rounded-xl p-0.5 border border-border-glass">
                {(['date', 'name'] as SortBy[]).map(s => (
                    <button
                        key={s}
                        onClick={() => onSortByChange(s)}
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
                    onClick={() => onViewModeChange('list')}
                    className={cn(
                        "p-1.5 rounded-lg transition-all",
                        viewMode === 'list' ? "bg-foreground-primary/10 text-foreground-primary" : "text-foreground-tertiary hover:text-foreground-secondary"
                    )}
                >
                    <LayoutList className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onViewModeChange('grid')}
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
);

DownloadToolbar.displayName = 'DownloadToolbar';
