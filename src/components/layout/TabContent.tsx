import React, { Suspense, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTabStore } from '../../store/tabStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getToolById } from '../../tools/registry';

export const TabContent: React.FC = React.memo(() => {
    const tabs = useTabStore(state => state.tabs);
    const activeTabId = useTabStore(state => state.activeTabId);
    const maxBackgroundTabs = useSettingsStore(state => state.maxBackgroundTabs);
    const backgroundProcessing = useSettingsStore(state => state.backgroundProcessing);

    // Find active tab
    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

    // Determine which tabs should be kept mounted
    // Always mount: active tab + (maxBackgroundTabs - 1) most recently used tabs
    const tabsToMount = useMemo(() => {
        if (!backgroundProcessing || tabs.length <= maxBackgroundTabs) {
            return new Set(tabs.map(t => t.id));
        }

        // Sort tabs by last access time (most recent first)
        const sortedTabs = [...tabs].sort((a, b) => {
            // Active tab always first
            if (a.id === activeTabId) return -1;
            if (b.id === activeTabId) return 1;
            // Then by most recently used (assuming newer tabs are more recent)
            return tabs.indexOf(b) - tabs.indexOf(a);
        });

        // Keep only maxBackgroundTabs tabs
        return new Set(sortedTabs.slice(0, maxBackgroundTabs).map(t => t.id));
    }, [tabs, activeTabId, maxBackgroundTabs, backgroundProcessing]);

    if (tabs.length === 0 || !activeTab) {
        return (
            <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 tab-content-area">
                <div className="flex-1 flex flex-col items-center justify-center text-foreground-muted select-none px-8">
                    <div className="relative mb-8">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-5xl mb-6 shadow-2xl">
                            🚀
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500/60 rounded-full border-2 border-[var(--color-glass-panel)] animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground mb-2">No Tool Selected</h2>
                    <p className="text-sm opacity-70 text-center max-w-md mb-8">
                        Select a tool from the sidebar to get started, or use the search to find what you need
                    </p>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-glass-input)] border border-border-glass text-xs opacity-60">
                        <kbd className="px-2 py-1 rounded bg-[var(--color-glass-button)] border border-border-glass">⌘</kbd>
                        <span>+</span>
                        <kbd className="px-2 py-1 rounded bg-[var(--color-glass-button)] border border-border-glass">K</kbd>
                        <span className="ml-2">to search</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 tab-content-area h-full w-full">
            {/* Render tabs up to maxBackgroundTabs limit */}
            {tabs.map(tab => {
                const toolDef = getToolById(tab.toolId);
                const isActive = tab.id === activeTabId;
                const shouldMount = tabsToMount.has(tab.id);

                // Skip mounting tabs beyond the limit (unless they're active)
                if (!shouldMount && !isActive) {
                    return null;
                }

                if (!toolDef) {
                    // Only show error for active tab
                    if (!isActive) return null;
                    
                    return (
                        <div key={tab.id} className="flex-1 flex items-center justify-center">
                            <div className="text-center px-8">
                                <div className="w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 mx-auto">
                                    <span className="text-3xl">⚠️</span>
                                </div>
                                <p className="font-semibold text-lg text-red-400 mb-2">Error Loading Tool</p>
                                <p className="text-sm opacity-70">Definition not found for ID: {tab.toolId}</p>
                            </div>
                        </div>
                    );
                }

                const ToolComponent = toolDef.component;

                return (
                    <motion.div
                        key={tab.id}
                        initial={false}
                        animate={{
                            opacity: isActive ? 1 : 0,
                        }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{
                            display: isActive ? 'flex' : 'none',
                            position: 'absolute',
                            inset: 0,
                            flexDirection: 'column'
                        }}
                        className="h-full w-full"
                    >
                        <Suspense fallback={
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4 mx-auto" />
                                    <p className="text-sm text-foreground-muted">Loading tool...</p>
                                </div>
                            </div>
                        }>
                            {/* 
                              Keep tool instances mounted up to maxBackgroundTabs limit.
                              Each tab maintains its own state via tabId prop.
                            */}
                            <ToolComponent tabId={tab.id} />
                        </Suspense>
                    </motion.div>
                );
            })}

            {/* Info banner when limit is reached */}
            {backgroundProcessing && tabs.length > maxBackgroundTabs && activeTab && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 backdrop-blur-xl shadow-lg">
                        <span className="text-yellow-400 text-sm">⚠️</span>
                        <p className="text-xs text-foreground">
                            <span className="font-semibold">{tabs.length - maxBackgroundTabs}</span> background tab{tabs.length - maxBackgroundTabs > 1 ? 's' : ''} paused to save memory
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});

TabContent.displayName = 'TabContent';
