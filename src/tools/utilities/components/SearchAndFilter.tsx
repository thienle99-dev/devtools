import React, { useState, RefObject } from 'react';
import { Search, Filter, Settings, Trash2, TrendingUp, Tag, Play, Pause } from 'lucide-react';
import type { FilterOptions, SearchMode } from '../../../store/clipboardStore';

interface SearchAndFilterProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filters: FilterOptions;
    onFilterChange: (filters: FilterOptions) => void;
    onClearAll: () => void;
    onOpenSettings: () => void;
    onOpenStatistics?: () => void;
    onOpenCategories?: () => void;
    monitoringEnabled?: boolean;
    onToggleMonitoring?: () => void;
    searchInputRef?: RefObject<HTMLInputElement | null>;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
    searchQuery,
    onSearchChange,
    filters,
    onFilterChange,
    onClearAll,
    onOpenSettings,
    onOpenStatistics,
    onOpenCategories,
    monitoringEnabled = false,
    onToggleMonitoring,
    searchInputRef,
}) => {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="space-y-4">
            <div className="flex gap-4 items-center">
                {/* Search Bar */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="w-full pl-12 pr-5 py-3 bg-surface-elevated border border-border rounded-xl 
                                 text-foreground placeholder-foreground-muted text-sm
                                 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
                                 transition-all duration-200"
                        placeholder="Search clipboard history... (⌘K)"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                {/* Monitoring Toggle */}
                {onToggleMonitoring && (
                    <button
                        onClick={onToggleMonitoring}
                        className={`p-3 rounded-xl border transition-all duration-200 ${monitoringEnabled
                                ? 'bg-green-500/10 border-green-500 text-green-500'
                                : 'bg-surface-elevated border-border text-foreground-muted hover:text-foreground hover:border-accent/50'
                            }`}
                        title={monitoringEnabled ? 'Monitoring Active (Click to Pause)' : 'Monitoring Paused (Click to Resume)'}
                    >
                        {monitoringEnabled ? (
                            <Play className="w-5 h-5" />
                        ) : (
                            <Pause className="w-5 h-5" />
                        )}
                    </button>
                )}

                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-3 rounded-xl border transition-all duration-200
                              ${showFilters
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'bg-surface-elevated border-border text-foreground-muted hover:text-foreground hover:border-accent/50'
                        }`}
                    title="Filter"
                >
                    <Filter className="w-5 h-5" />
                </button>

                {/* Statistics */}
                {onOpenStatistics && (
                    <button
                        onClick={onOpenStatistics}
                        className="p-3 rounded-xl border bg-surface-elevated border-border 
                                 text-foreground-muted hover:text-foreground hover:border-accent/50
                                 transition-all duration-200"
                        title="Statistics"
                    >
                        <TrendingUp className="w-5 h-5" />
                    </button>
                )}

                {/* Categories */}
                {onOpenCategories && (
                    <button
                        onClick={onOpenCategories}
                        className="p-3 rounded-xl border bg-surface-elevated border-border 
                                 text-foreground-muted hover:text-foreground hover:border-accent/50
                                 transition-all duration-200"
                        title="Categories"
                    >
                        <Tag className="w-5 h-5" />
                    </button>
                )}

                {/* Settings */}
                <button
                    onClick={onOpenSettings}
                    className="p-3 rounded-xl border bg-surface-elevated border-border 
                             text-foreground-muted hover:text-foreground hover:border-accent/50
                             transition-all duration-200"
                    title="Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>

                {/* Clear All */}
                <button
                    onClick={onClearAll}
                    className="p-3 rounded-xl border bg-surface-elevated border-border 
                             text-foreground-muted hover:text-red-500 hover:border-red-500/50
                             transition-all duration-200"
                    title="Clear All"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
                <div className="p-5 bg-surface-elevated border border-border rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                        {/* Search Mode */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">
                                Search Mode
                            </label>
                            <select
                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg 
                                         text-foreground text-sm focus:outline-none focus:ring-2 
                                         focus:ring-accent/50 focus:border-accent transition-all"
                                value={filters.searchMode || 'contains'}
                                onChange={(e) => onFilterChange({ ...filters, searchMode: e.target.value as SearchMode })}
                            >
                                <option value="contains">Contains</option>
                                <option value="exact">Exact Match</option>
                                <option value="startsWith">Starts With</option>
                                <option value="fuzzy">Fuzzy</option>
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">
                                Type
                            </label>
                            <select
                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg 
                                         text-foreground text-sm focus:outline-none focus:ring-2 
                                         focus:ring-accent/50 focus:border-accent transition-all"
                                value={filters.type}
                                onChange={(e) => onFilterChange({ ...filters, type: e.target.value as any })}
                            >
                                <option value="all">All Types</option>
                                <option value="text">Text Only</option>
                                <option value="image">Images Only</option>
                                <option value="link">Links Only</option>
                                <option value="file">Files Only</option>
                            </select>
                        </div>

                        {/* Date Range Filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">
                                Date Range
                            </label>
                            <select
                                className="w-full px-3 py-2 bg-surface border border-border rounded-lg 
                                         text-foreground text-sm focus:outline-none focus:ring-2 
                                         focus:ring-accent/50 focus:border-accent transition-all"
                                value={filters.dateRange}
                                onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value as any })}
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="week">This Week</option>
                                <option value="month">This Month</option>
                            </select>
                        </div>

                        {/* Pinned Filter */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em]">
                                Status
                            </label>
                            <label className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg cursor-pointer hover:border-accent/50 transition-all">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-border text-accent focus:ring-accent/50"
                                    checked={filters.pinnedOnly}
                                    onChange={(e) => onFilterChange({ ...filters, pinnedOnly: e.target.checked })}
                                />
                                <span className="text-sm text-foreground">Pinned Only</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
