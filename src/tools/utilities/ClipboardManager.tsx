import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { useClipboardStore, type ClipboardItem, type FilterOptions } from '@store/clipboardStore';
import { useClipboardMonitor } from './hooks/useClipboardMonitor';
import { QuickCopySection } from './components/QuickCopySection';
import { SearchAndFilter } from './components/SearchAndFilter';
import { ClipboardList } from './components/ClipboardList';
import { ViewFullModal } from './components/ViewFullModal';
import { ClipboardSettings } from './components/ClipboardSettings';
import { ClipboardStatistics } from './components/ClipboardStatistics';
import { CategoryManager } from './components/CategoryManager';
import { useToolStore } from '@store/toolStore';
import { useClipboard } from './hooks/useClipboard';
import { Loader2, Sparkles } from 'lucide-react';

const TOOL_ID = 'clipboard-manager';

export const ClipboardManager: React.FC = () => {
    const addToHistory = useToolStore((state) => state.addToHistory);

    // Clipboard store
    const items = useClipboardStore((state) => state.items);
    const settings = useClipboardStore((state) => state.settings);
    const updateSettings = useClipboardStore((state) => state.updateSettings);
    const isLoading = useClipboardStore((state) => state.isLoading);
    const pinItem = useClipboardStore((state) => state.pinItem);
    const unpinItem = useClipboardStore((state) => state.unpinItem);
    const removeItem = useClipboardStore((state) => state.removeItem);
    const clearAll = useClipboardStore((state) => state.clearAll);

    // Local state
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<FilterOptions>({
        type: 'all',
        dateRange: 'all',
        pinnedOnly: false,
        searchMode: 'contains',
    });
    const [selectedItem, setSelectedItem] = useState<ClipboardItem | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showStatistics, setShowStatistics] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [categoryItemId, setCategoryItemId] = useState<string | undefined>(undefined);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Enable clipboard monitoring if setting is enabled
    useClipboardMonitor(settings.enableMonitoring, settings.ignoredApps);

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    // Sync monitoring state with tray
    useEffect(() => {
        if ((window as any).ipcRenderer?.tray?.syncMonitoring) {
            (window as any).ipcRenderer.tray.syncMonitoring(settings.enableMonitoring);
        }
    }, [settings.enableMonitoring]);

    // Listen for tray toggle events
    useEffect(() => {
        const handleTrayToggle = (_event: any, enabled: boolean) => {
            updateSettings({ enableMonitoring: enabled });
        };

        if ((window as any).ipcRenderer?.on) {
            (window as any).ipcRenderer.on('toggle-clipboard-monitoring', handleTrayToggle);

            return () => {
                if ((window as any).ipcRenderer?.removeAllListeners) {
                    (window as any).ipcRenderer.removeAllListeners('toggle-clipboard-monitoring');
                }
            };
        }
    }, [updateSettings]);

    // Toggle monitoring
    const handleToggleMonitoring = () => {
        updateSettings({ enableMonitoring: !settings.enableMonitoring });
    };

    // Filter and search items with enhanced search
    const filteredItems = useMemo(() => {
        let result = [...items];

        // Apply type filter
        if (filters.type !== 'all') {
            result = result.filter(item => item.type === filters.type);
        }

        // Apply date range filter
        if (filters.dateRange !== 'all') {
            const now = Date.now();
            const ranges = {
                today: 24 * 60 * 60 * 1000,
                week: 7 * 24 * 60 * 60 * 1000,
                month: 30 * 24 * 60 * 60 * 1000,
            };
            const range = ranges[filters.dateRange];
            result = result.filter(item => now - item.timestamp < range);
        }

        // Apply pinned filter
        if (filters.pinnedOnly) {
            result = result.filter(item => item.pinned);
        }

        // Apply enhanced search with mode
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const searchMode = filters.searchMode || 'contains';

            result = result.filter(item => {
                const content = item.content.toLowerCase();

                switch (searchMode) {
                    case 'exact':
                        return content === query;
                    case 'startsWith':
                        return content.startsWith(query);
                    case 'fuzzy':
                        let queryIndex = 0;
                        for (let i = 0; i < content.length && queryIndex < query.length; i++) {
                            if (content[i] === query[queryIndex]) {
                                queryIndex++;
                            }
                        }
                        return queryIndex === query.length;
                    case 'contains':
                    default:
                        return content.includes(query);
                }
            });
        }

        // Sort: pinned first, then by timestamp
        return result.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.timestamp - a.timestamp;
        });
    }, [items, filters, searchQuery]);

    // Reset selected index when filtered items change
    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredItems.length, searchQuery]);

    const { copyToClipboard } = useClipboard();
    const listContainerRef = useRef<HTMLDivElement>(null);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K to focus search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
                return;
            }

            // Only handle keyboard navigation when not typing in input
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
                setTimeout(() => {
                    const selectedElement = listContainerRef.current?.querySelector(`[data-item-index="${selectedIndex + 1}"]`);
                    selectedElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 0);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                setTimeout(() => {
                    const selectedElement = listContainerRef.current?.querySelector(`[data-item-index="${selectedIndex - 1}"]`);
                    selectedElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 0);
            } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
                e.preventDefault();
                const item = filteredItems[selectedIndex];
                copyToClipboard(item.content);
                if ((window as any).ipcRenderer) {
                    (window as any).ipcRenderer.send('hide-window');
                }
            } else if (e.key === ' ' && filteredItems[selectedIndex]) {
                // Space bar: Toggle selection
                e.preventDefault();
                const item = filteredItems[selectedIndex];
                setSelectedItems(prev => {
                    const next = new Set(prev);
                    if (next.has(item.id)) {
                        next.delete(item.id);
                    } else {
                        next.add(item.id);
                        setIsSelectionMode(true);
                    }
                    if (next.size === 0) {
                        setIsSelectionMode(false);
                    }
                    return next;
                });
            } else if (e.key === 'Escape') {
                if (showSettings) {
                    setShowSettings(false);
                } else if (selectedItem) {
                    setSelectedItem(null);
                } else if (isSelectionMode) {
                    // Clear selection mode
                    setSelectedItems(new Set());
                    setIsSelectionMode(false);
                } else {
                    searchInputRef.current?.blur();
                }
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'a' && isSelectionMode) {
                // Cmd+A: Select all visible items
                e.preventDefault();
                setSelectedItems(new Set(filteredItems.map(item => item.id)));
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'd' && selectedItems.size > 0) {
                // Cmd+D: Bulk delete selected items
                e.preventDefault();
                selectedItems.forEach(id => removeItem(id));
                setSelectedItems(new Set());
                setIsSelectionMode(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredItems, selectedIndex, showSettings, selectedItem, copyToClipboard, isSelectionMode, selectedItems, removeItem]);

    const handleClearAll = () => {
        if (showClearConfirm) {
            clearAll();
            setShowClearConfirm(false);
            setSelectedItems(new Set());
            setIsSelectionMode(false);
        } else {
            setShowClearConfirm(true);
            setTimeout(() => setShowClearConfirm(false), 3000);
        }
    };

    // Bulk actions
    const handleBulkDelete = () => {
        selectedItems.forEach(id => removeItem(id));
        setSelectedItems(new Set());
        setIsSelectionMode(false);
    };

    const handleBulkPin = () => {
        selectedItems.forEach(id => pinItem(id));
        setSelectedItems(new Set());
        setIsSelectionMode(false);
    };

    const handleBulkUnpin = () => {
        selectedItems.forEach(id => unpinItem(id));
        setSelectedItems(new Set());
        setIsSelectionMode(false);
    };

    const handleSelectAll = () => {
        setSelectedItems(new Set(filteredItems.map(item => item.id)));
        setIsSelectionMode(true);
    };

    const handleDeselectAll = () => {
        setSelectedItems(new Set());
        setIsSelectionMode(false);
    };

    return (
        <>
            <ToolPane
                title="Clipboard Manager"
                description="Manage and browse clipboard history with search and organization"
            >
                <div className="flex flex-col h-full gap-4">
                    {/* Quick Copy Section */}
                    <QuickCopySection />

                    {/* Search and Filter */}
                    <div className="flex-shrink-0">
                        <SearchAndFilter
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            filters={filters}
                            onFilterChange={setFilters}
                            onClearAll={handleClearAll}
                            onOpenSettings={() => setShowSettings(true)}
                            onOpenStatistics={() => setShowStatistics(true)}
                            onOpenCategories={() => setShowCategoryManager(true)}
                            monitoringEnabled={settings.enableMonitoring}
                            onToggleMonitoring={handleToggleMonitoring}
                            searchInputRef={searchInputRef}
                        />
                    </div>

                    {/* Bulk Actions Bar */}
                    {isSelectionMode && selectedItems.size > 0 && (
                        <div className="flex-shrink-0 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-indigo-400">
                                        {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                                    </span>
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-xs text-foreground-muted hover:text-foreground transition-colors"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        onClick={handleDeselectAll}
                                        className="text-xs text-foreground-muted hover:text-foreground transition-colors"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleBulkPin}
                                        className="px-2 py-1 text-xs bg-surface-elevated border border-border rounded hover:bg-accent/10 hover:border-accent/50 transition-colors"
                                    >
                                        Pin
                                    </button>
                                    <button
                                        onClick={handleBulkUnpin}
                                        className="px-2 py-1 text-xs bg-surface-elevated border border-border rounded hover:bg-accent/10 hover:border-accent/50 transition-colors"
                                    >
                                        Unpin
                                    </button>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="px-2 py-1 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                                    >
                                        Delete ({selectedItems.size})
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Clear Confirmation */}
                    {showClearConfirm && (
                        <div className="flex-shrink-0 p-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                Click "Clear All" again to confirm deletion
                            </p>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center gap-2 p-4 glass-panel rounded-lg">
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                            <span className="text-xs text-foreground-muted font-medium">Loading...</span>
                        </div>
                    )}

                    {/* Clipboard List */}
                    <div
                        ref={listContainerRef}
                        className="flex-1 min-h-0 overflow-y-auto custom-scrollbar"
                    >
                        <ClipboardList
                            items={filteredItems}
                            selectedIndex={selectedIndex}
                            selectedItems={selectedItems}
                            isSelectionMode={isSelectionMode}
                            onPin={pinItem}
                            onUnpin={unpinItem}
                            onDelete={removeItem}
                            onViewFull={setSelectedItem}
                            onSelect={(index) => setSelectedIndex(index)}
                            onToggleSelect={(id) => {
                                setSelectedItems(prev => {
                                    const next = new Set(prev);
                                    if (next.has(id)) {
                                        next.delete(id);
                                    } else {
                                        next.add(id);
                                        setIsSelectionMode(true);
                                    }
                                    if (next.size === 0) {
                                        setIsSelectionMode(false);
                                    }
                                    return next;
                                });
                            }}
                        />
                    </div>

                    {/* Stats Footer */}
                    {items.length > 0 && (
                        <div className="flex-shrink-0 pt-3 border-t border-[var(--color-glass-border)]">
                            <p className="text-[10px] text-foreground-muted text-center font-medium">
                                {filteredItems.length} of {items.length} items
                                {filters.pinnedOnly || filters.type !== 'all' || filters.dateRange !== 'all' || searchQuery
                                    ? ' (filtered)'
                                    : ''}
                            </p>
                        </div>
                    )}
                </div>
            </ToolPane>

            {/* Modals */}
            {selectedItem && (
                <ViewFullModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}

            {showSettings && (
                <ClipboardSettings onClose={() => setShowSettings(false)} />
            )}

            {showStatistics && (
                <ClipboardStatistics onClose={() => setShowStatistics(false)} />
            )}

            {showCategoryManager && (
                <CategoryManager
                    itemId={categoryItemId}
                    onClose={() => {
                        setShowCategoryManager(false);
                        setCategoryItemId(undefined);
                    }}
                />
            )}
        </>
    );
};
