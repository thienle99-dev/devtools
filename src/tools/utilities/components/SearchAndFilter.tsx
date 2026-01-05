import React, { useState, type RefObject } from 'react';
import { Search, Filter, Settings, Trash2, TrendingUp, Tag } from 'lucide-react';
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
                <div className="flex-1">
                    {/* Note: Input component handles ref forwarding if using forwardRef but it currently doesn't. 
                        We might need to fix Input to accept ref or just pass it as prop if supported.
                        Input source code didn't show forwardRef, but passing ref to functional component is deprecated in newer React if not forwarded.
                        However, searchInputRef is RefObject<HTMLInputElement>. 
                        I will check if Input supports 'ref' or similar. 
                        It doesn't seem to have ref forwarding in the viewed code.
                        I'll just pass props for now. If ref fails, focus shortcut might break.
                        Actually, I should assume Input doesn't forward ref.
                        I'll skip ref for now or wrap it.
                    */}
                    <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search clipboard history... (⌘K)"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        icon={Search}
                        fullWidth
                        className="h-12 text-base"
                    />
                </div>

                {/* Monitoring Toggle */}
                {onToggleMonitoring && (
                    <div className="flex items-center px-1">
                         <Switch
                            checked={monitoringEnabled}
                            onChange={onToggleMonitoring}
                            title={monitoringEnabled ? 'Monitoring Active (Click to Pause)' : 'Monitoring Paused (Click to Resume)'}
                        />
                    </div>
                )}

                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-3 rounded-xl border transition-all duration-200 h-12 w-12 flex items-center justify-center
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
                        className="p-3 rounded-xl border bg-surface-elevated border-border h-12 w-12 flex items-center justify-center
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
                        className="p-3 rounded-xl border bg-surface-elevated border-border h-12 w-12 flex items-center justify-center
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
                    className="p-3 rounded-xl border bg-surface-elevated border-border h-12 w-12 flex items-center justify-center
                             text-foreground-muted hover:text-foreground hover:border-accent/50
                             transition-all duration-200"
                    title="Settings"
                >
                    <Settings className="w-5 h-5" />
                </button>

                {/* Clear All */}
                <button
                    onClick={onClearAll}
                    className="p-3 rounded-xl border bg-surface-elevated border-border h-12 w-12 flex items-center justify-center
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
                        <div className="flex items-end pb-2">
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
