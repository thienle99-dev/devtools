import React, { useState, type RefObject } from 'react';
import { Search, Filter, Settings, Trash2, TrendingUp, Tag, X } from 'lucide-react';
import type { FilterOptions, SearchMode } from '../../../store/clipboardStore';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import { Switch } from '../../../components/ui/Switch';

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
    searchInputRef?: React.Ref<HTMLInputElement>;
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

    const hasActiveFilters = filters.type !== 'all' ||
        filters.dateRange !== 'all' ||
        filters.pinnedOnly ||
        filters.searchMode !== 'contains';

    return (
        <div className="space-y-3">
            <div className="flex gap-2 items-center">
                {/* Search Bar */}
                <div className="flex-1">
                    <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search clipboard history... (⌘K)"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        icon={Search}
                        fullWidth
                        className="h-10 text-sm"
                    />
                </div>

                {/* Monitoring Toggle */}
                {onToggleMonitoring && (
                    <div className="flex items-center px-1">
                        <Switch
                            checked={monitoringEnabled}
                            onChange={onToggleMonitoring}
                            title={monitoringEnabled ? 'Monitoring Active' : 'Monitoring Paused'}
                        />
                    </div>
                )}

                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg border transition-all duration-200 h-10 w-10 flex items-center justify-center relative
                              ${showFilters || hasActiveFilters
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                            : 'glass-button border-[var(--color-glass-border)] text-foreground-muted hover:text-foreground hover:border-indigo-500/50'
                        }`}
                    title="Filter"
                >
                    <Filter className="w-4 h-4" />
                    {hasActiveFilters && !showFilters && (
                        <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                    )}
                </button>

                {/* Statistics */}
                {onOpenStatistics && (
                    <button
                        onClick={onOpenStatistics}
                        className="p-2 rounded-lg glass-button border border-[var(--color-glass-border)] h-10 w-10 flex items-center justify-center
                                 text-foreground-muted hover:text-foreground hover:border-indigo-500/50
                                 transition-all duration-200"
                        title="Statistics"
                    >
                        <TrendingUp className="w-4 h-4" />
                    </button>
                )}

                {/* Categories */}
                {onOpenCategories && (
                    <button
                        onClick={onOpenCategories}
                        className="p-2 rounded-lg glass-button border border-[var(--color-glass-border)] h-10 w-10 flex items-center justify-center
                                 text-foreground-muted hover:text-foreground hover:border-indigo-500/50
                                 transition-all duration-200"
                        title="Categories"
                    >
                        <Tag className="w-4 h-4" />
                    </button>
                )}

                {/* Settings */}
                <button
                    onClick={onOpenSettings}
                    className="p-2 rounded-lg glass-button border border-[var(--color-glass-border)] h-10 w-10 flex items-center justify-center
                             text-foreground-muted hover:text-foreground hover:border-indigo-500/50
                             transition-all duration-200"
                    title="Settings"
                >
                    <Settings className="w-4 h-4" />
                </button>

                {/* Clear All */}
                <button
                    onClick={onClearAll}
                    className="p-2 rounded-lg glass-button border border-[var(--color-glass-border)] h-10 w-10 flex items-center justify-center
                             text-foreground-muted hover:text-red-500 hover:border-red-500/50
                             transition-all duration-200"
                    title="Clear All"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Filter Options */}
            {showFilters && (
                <div className="glass-panel p-4 rounded-xl border border-[var(--color-glass-border)] space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5" />
                            Filters
                        </h3>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="p-1 rounded-lg hover:bg-glass-button-hover text-foreground-muted hover:text-foreground transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {/* Search Mode */}
                        <Select
                            label="Search Mode"
                            value={filters.searchMode || 'contains'}
                            onChange={(e) => onFilterChange({ ...filters, searchMode: e.target.value as SearchMode })}
                            options={[
                                { label: 'Contains', value: 'contains' },
                                { label: 'Exact Match', value: 'exact' },
                                { label: 'Starts With', value: 'startsWith' },
                                { label: 'Fuzzy', value: 'fuzzy' },
                            ]}
                            fullWidth
                        />

                        {/* Type Filter */}
                        <Select
                            label="Type"
                            value={filters.type}
                            onChange={(e) => onFilterChange({ ...filters, type: e.target.value as any })}
                            options={[
                                { label: 'All Types', value: 'all' },
                                { label: 'Text Only', value: 'text' },
                                { label: 'Images Only', value: 'image' },
                                { label: 'Links Only', value: 'link' },
                                { label: 'Files Only', value: 'file' },
                            ]}
                            fullWidth
                        />

                        {/* Date Range Filter */}
                        <Select
                            label="Date Range"
                            value={filters.dateRange}
                            onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value as any })}
                            options={[
                                { label: 'All Time', value: 'all' },
                                { label: 'Today', value: 'today' },
                                { label: 'This Week', value: 'week' },
                                { label: 'This Month', value: 'month' },
                            ]}
                            fullWidth
                        />

                        {/* Pinned Filter */}
                        <div className="flex items-end pb-1">
                            <Checkbox
                                label="Pinned Only"
                                checked={filters.pinnedOnly}
                                onChange={(e) => onFilterChange({ ...filters, pinnedOnly: e.target.checked })}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
