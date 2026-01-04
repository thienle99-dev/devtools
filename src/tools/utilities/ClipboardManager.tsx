import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useClipboardStore, type ClipboardItem, type FilterOptions } from '../../store/clipboardStore';
import { useClipboardMonitor } from './hooks/useClipboardMonitor';
import { QuickCopySection } from './components/QuickCopySection';
import { SearchAndFilter } from './components/SearchAndFilter';
import { ClipboardList } from './components/ClipboardList';
import { ViewFullModal } from './components/ViewFullModal';
import { ClipboardSettings } from './components/ClipboardSettings';
import { useToolStore } from '../../store/toolStore';
import { useClipboard } from './hooks/useClipboard';

const TOOL_ID = 'clipboard-manager';

export const ClipboardManager: React.FC = () => {
    const addToHistory = useToolStore((state) => state.addToHistory);

    // Clipboard store
    const items = useClipboardStore((state) => state.items);
    const settings = useClipboardStore((state) => state.settings);
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
        searchMode: 'contains', // Default search mode
    });
    const [selectedItem, setSelectedItem] = useState<ClipboardItem | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const searchInputRef = React.useRef<HTMLInputElement>(null);

    // Enable clipboard monitoring if setting is enabled
    useClipboardMonitor(settings.enableMonitoring, settings.ignoredApps);

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

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
                        // Fuzzy match: all characters in query must appear in order
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
                // Scroll into view
                setTimeout(() => {
                    const selectedElement = listContainerRef.current?.querySelector(`[data-item-index="${selectedIndex + 1}"]`);
                    selectedElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 0);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                // Scroll into view
                setTimeout(() => {
                    const selectedElement = listContainerRef.current?.querySelector(`[data-item-index="${selectedIndex - 1}"]`);
                    selectedElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 0);
            } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
                e.preventDefault();
                const item = filteredItems[selectedIndex];
                copyToClipboard(item.content);
                // Optionally hide window (if in Electron)
                if ((window as any).ipcRenderer) {
                    (window as any).ipcRenderer.send('hide-window');
                }
            } else if (e.key === 'Escape') {
                if (showSettings) {
                    setShowSettings(false);
                } else if (selectedItem) {
                    setSelectedItem(null);
                } else {
                    searchInputRef.current?.blur();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredItems, selectedIndex, showSettings, selectedItem, copyToClipboard]);

    const handleClearAll = () => {
        if (showClearConfirm) {
            clearAll();
            setShowClearConfirm(false);
        } else {
            setShowClearConfirm(true);
            setTimeout(() => setShowClearConfirm(false), 3000);
        }
    };

    return (
        <>
            <ToolPane
                title="Clipboard Manager"
                description="Manage and browse clipboard history with search and organization"
            >
                <div className="space-y-8 h-full flex flex-col">
                    {/* Quick Copy Section */}
                    <QuickCopySection />

                    {/* Divider */}
                    <div className="border-t border-border/50" />

                    {/* Search and Filter */}
                    <SearchAndFilter
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        filters={filters}
                        onFilterChange={setFilters}
                        onClearAll={handleClearAll}
                        onOpenSettings={() => setShowSettings(true)}
                        searchInputRef={searchInputRef}
                    />

                    {/* Clear Confirmation */}
                    {showClearConfirm && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="text-sm text-red-500 font-medium">
                                Click "Clear All" again to confirm deletion of all clipboard items
                            </p>
                        </div>
                    )}

                    {/* Clipboard List */}
                    <div className="flex-1 overflow-auto" ref={listContainerRef}>
                        <ClipboardList
                            items={filteredItems}
                            selectedIndex={selectedIndex}
                            onPin={pinItem}
                            onUnpin={unpinItem}
                            onDelete={removeItem}
                            onViewFull={setSelectedItem}
                            onSelect={(index) => setSelectedIndex(index)}
                        />
                    </div>

                    {/* Stats */}
                    {items.length > 0 && (
                        <div className="pt-4 border-t border-border">
                            <p className="text-xs text-foreground-muted text-center">
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
        </>
    );
};
