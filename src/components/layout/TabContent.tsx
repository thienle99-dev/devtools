import React, { Suspense } from 'react';
import { useTabStore } from '../../store/tabStore';
import { getToolById } from '../../tools/registry';

export const TabContent: React.FC = () => {
    const { tabs, activeTabId } = useTabStore();

    // Find active tab
    const activeTab = tabs.find(t => t.id === activeTabId);

    if (!activeTab) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-foreground-muted select-none">
                <div className="text-6xl mb-4 opacity-20">🚀</div>
                <h2 className="text-xl font-medium opacity-60">No Key Selected</h2>
                <p className="text-sm opacity-40 mt-2">Select a tool from the sidebar to get started</p>
                <p className="text-xs opacity-30 mt-8">Press Cmd + K to search</p>
            </div>
        );
    }

    const toolDef = getToolById(activeTab.toolId);

    if (!toolDef) {
        return (
            <div className="flex-1 flex items-center justify-center text-red-400">
                <div className="text-center">
                    <p className="font-bold">Error Loading Tool</p>
                    <p className="text-sm opacity-80">Definition not found for ID: {activeTab.toolId}</p>
                </div>
            </div>
        );
    }

    const ToolComponent = toolDef.component;

    return (
        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0 bg-transparent">
            <Suspense fallback={<div className="flex-1 flex items-center justify-center opacity-50">Loading tool...</div>}>
                {/* Pass tabId to component. Components must be updated to use it for state isolation. */}
                <ToolComponent key={activeTab.id} tabId={activeTab.id} />
            </Suspense>
        </div>
    );
};
