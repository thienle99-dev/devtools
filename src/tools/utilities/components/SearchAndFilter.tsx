import React, { useState } from 'react';
import { Search, Filter, Settings, Trash2 } from 'lucide-react';
import { FilterOptions } from '../../../store/clipboardStore';

interface SearchAndFilterProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    filters: FilterOptions;
    onFilterChange: (filters: FilterOptions) => void;
    onClearAll: () => void;
    onOpenSettings: () => void;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
    searchQuery,
    onSearchChange,
    filters,
    onFilterChange,
    onClearAll,
    onOpenSettings,
}) => {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="space-y-3">
            <div className="flex gap-3 items-center">
                {/* Search Bar */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated border border-border rounded-lg 
                                 text-foreground placeholder-foreground-muted text-sm
                                 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
                                 transition-all duration-200"
                        placeholder="Search clipboard history..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2.5 rounded-lg border transition-all duration-200
                              ${showFilters
                            ? 'bg-accent/10 border-accent text-accent'
                            : 'bg-surface-elevated border-border text-foreground-muted hover:text-foreground hover:border-accent/50'
                        }`}
                    title="Filter"
                >
                    <Filter className="w-4 h-4" />
                </button>

                {/* Settings */}
                <button
                    onClick={onOpenSettings}
                    className="p-2.5 rounded-lg border bg-surface-elevated border-border 
                             text-foreground-muted hover:text-foreground hover:border-accent/50
                             transition-all duration-200"
                    title="Settings"
                >
                    <Settings className="w-4 h-4" />
                </button>

                {/* Clear All */}
                <button
                    onClick={onClearAll}
                    className="p-2.5 rounded-lg border bg-surface-elevated border-border 
                             text-foreground-muted hover:text-red-500 hover:border-red-500/50
                             transition-all duration-200"
                    title="Clear All"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
                <div className="p-4 bg-surface-elevated border border-border rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
