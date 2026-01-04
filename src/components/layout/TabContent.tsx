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
            <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-white tab-content-area">
                <div className="flex-1 flex flex-col items-center justify-center text-foreground-muted select-none">
                    <div className="text-6xl mb-4 opacity-20">🚀</div>
                    <h2 className="text-xl font-medium opacity-60">No Tool Selected</h2>
                    <p className="text-sm opacity-40 mt-2">Select a tool from the sidebar to get started</p>
                    <p className="text-xs opacity-30 mt-8">Press Cmd + K to search</p>
                </div>
            </div>
        );
    }

    if (!toolDef) {
        return (
            <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-white tab-content-area">
                <div className="flex-1 flex items-center justify-center text-red-400">
                    <div className="text-center">
                        <p className="font-bold">Error Loading Tool</p>
                        <p className="text-sm opacity-80">Definition not found for ID: {activeTab.toolId}</p>
                    </div>
                </div>
            </div>
        );
    }

    const ToolComponent = toolDef.component;

    return (
        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-white tab-content-area">
            <Suspense fallback={<div className="flex-1 flex items-center justify-center opacity-50">Loading tool...</div>}>
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
