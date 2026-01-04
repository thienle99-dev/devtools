import React, { Suspense, useMemo } from 'react';
import { useTabStore } from '../../store/tabStore';
import { getToolById } from '../../tools/registry';

export const TabContent: React.FC = React.memo(() => {
    const tabs = useTabStore(state => state.tabs);
    const activeTabId = useTabStore(state => state.activeTabId);

    // Find active tab
    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

    // Memoize tool definition lookup
    const toolDef = useMemo(() => {
        if (!activeTab) return null;
        return getToolById(activeTab.toolId);
    }, [activeTab?.toolId]);

    if (!activeTab) {
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

    if (!toolDef) {
        return (
            <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 tab-content-area">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center px-8">
                        <div className="w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 mx-auto">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <p className="font-semibold text-lg text-red-400 mb-2">Error Loading Tool</p>
                        <p className="text-sm opacity-70">Definition not found for ID: {activeTab.toolId}</p>
                    </div>
                </div>
            </div>
        );
    }

    const ToolComponent = toolDef.component;

    return (
        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 tab-content-area">
            <Suspense fallback={
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4 mx-auto" />
                        <p className="text-sm text-foreground-muted">Loading tool...</p>
                    </div>
                </div>
            }>
                {/* 
                  Pass tabId to component. 
                  Removing 'key' allows React to reuse the component instance if the tool type is the same,
                  making tab switching much faster for the same tool type.
                  Isolated state is still maintained because ToolComponent uses useToolState(tabId).
                */}
                <ToolComponent tabId={activeTab.id} />
            </Suspense>
        </div>
    );
});

TabContent.displayName = 'TabContent';
