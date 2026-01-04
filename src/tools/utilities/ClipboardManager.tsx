import React, { useEffect, useState, useMemo } from 'react';
import { ToolPane } from '../../components/layout/ToolPane';
import { useClipboardStore, ClipboardItem, FilterOptions } from '../../store/clipboardStore';
import { useClipboardMonitor } from './hooks/useClipboardMonitor';
import { QuickCopySection } from './components/QuickCopySection';
import { SearchAndFilter } from './components/SearchAndFilter';
import { ClipboardList } from './components/ClipboardList';
import { ViewFullModal } from './components/ViewFullModal';
import { ClipboardSettings } from './components/ClipboardSettings';
import { useToolStore } from '../../store/toolStore';

const TOOL_ID = 'clipboard-manager';

interface ClipboardManagerProps {
    tabId?: string;
}

export const ClipboardManager: React.FC<ClipboardManagerProps> = ({ tabId }) => {
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
    });
    const [selectedItem, setSelectedItem] = useState<ClipboardItem | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    // Enable clipboard monitoring if setting is enabled
    useClipboardMonitor(settings.enableMonitoring);

    useEffect(() => {
        addToHistory(TOOL_ID);
    }, [addToHistory]);

    // Filter and search items
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

        // Apply search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.content.toLowerCase().includes(query)
            );
        }

        // Sort: pinned first, then by timestamp
        return result.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return b.timestamp - a.timestamp;
        });
    }, [items, filters, searchQuery]);

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
                <div className="space-y-6 h-full flex flex-col">
                    {/* Quick Copy Section */}
                    <QuickCopySection />

                    {/* Divider */}
                    <div className="border-t border-border" />

                    {/* Search and Filter */}
                    <SearchAndFilter
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        filters={filters}
                        onFilterChange={setFilters}
                        onClearAll={handleClearAll}
                        onOpenSettings={() => setShowSettings(true)}
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
                    <div className="flex-1 overflow-auto">
                        <ClipboardList
                            items={filteredItems}
                            onPin={pinItem}
                            onUnpin={unpinItem}
                            onDelete={removeItem}
                            onViewFull={setSelectedItem}
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
