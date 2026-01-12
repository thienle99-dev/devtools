import React, { Suspense, useMemo } from 'react';
import { useTabStore } from '../../store/tabStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getToolById } from '../../tools/registry';
import { DashboardPage } from '../../tools/registry/lazy-tools';
import { cn } from '@utils/cn';
import { ToolSkeleton } from '../ui/Skeleton';

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
                <Suspense fallback={null}>
                    <DashboardPage />
                </Suspense>
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
                    <div
                        key={tab.id}
                        className={cn(
                            "absolute inset-0 flex flex-col h-full w-full bg-background/50 backdrop-blur-[1px]",
                            isActive ? "z-10 opacity-100" : "z-0 opacity-0 pointer-events-none hidden"
                        )}
                    >
                        <Suspense fallback={
                            <div className="flex-1 p-8 overflow-y-auto">
                                <ToolSkeleton />
                            </div>
                        }>
                            {/* 
                              Keep tool instances mounted up to maxBackgroundTabs limit.
                              Each tab maintains its own state via tabId prop.
                            */}
                            <ToolComponent tabId={tab.id} {...(toolDef.props || {})} />
                        </Suspense>
                    </div>
                );
            })}

        </div>
    );
});

TabContent.displayName = 'TabContent';
