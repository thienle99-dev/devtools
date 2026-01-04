import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Tab {
    id: string; // Unique ID for the tab instance
    toolId: string; // ID of the tool (e.g., 'json-format')
    title: string;
    path: string;
    description?: string;
}

interface TabStore {
    tabs: Tab[];
    activeTabId: string | null;

    openTab: (toolId: string, path: string, title: string, description?: string, forceNew?: boolean) => void;
    closeTab: (tabId: string) => void;
    setActiveTab: (tabId: string) => void;
    reorderTabs: (tabs: Tab[]) => void;
    closeAllTabs: () => void;
    closeOtherTabs: (tabId: string) => void;
    closeTabsToRight: (tabId: string) => void;
    closeTabsToLeft: (tabId: string) => void;
}

export const useTabStore = create<TabStore>()(
    persist(
        (set, get) => ({
            tabs: [],
            activeTabId: null,

            openTab: (toolId: string, path: string, title: string, description?: string, forceNew?: boolean) => {
                const { tabs } = get();

                // Check if a tab with this toolId already exists unless forceNew is true
                if (!forceNew) {
                    const existingTab = tabs.find(t => t.toolId === toolId);
                    if (existingTab) {
                        set({ activeTabId: existingTab.id });
                        return;
                    }
                }

                // If forceNew is true, or no existing tab found, create a new one
                const newTab: Tab = {
                    id: crypto.randomUUID(),
                    toolId,
                    title,
                    path,
                    description
                };

                set({
                    tabs: [...tabs, newTab],
                    activeTabId: newTab.id
                });
            },

            closeTab: (tabId: string) => {
                const { tabs, activeTabId } = get();
                const tabIndex = tabs.findIndex(t => t.id === tabId);
                const newTabs = tabs.filter(t => t.id !== tabId);

                let newActiveId = activeTabId;

                // If closing the active tab
                if (activeTabId === tabId) {
                    if (newTabs.length > 0) {
                        // Activate the nearest neighbor
                        // If we closed the last tab, go to the new last tab (which was previous to the closed one)
                        // If we closed a middle tab, go to the same index (which is the next tab)
                        if (tabIndex >= newTabs.length) {
                            newActiveId = newTabs[newTabs.length - 1].id;
                        } else {
                            newActiveId = newTabs[tabIndex].id;
                        }
                    } else {
                        newActiveId = null;
                    }
                }

                set({
                    tabs: newTabs,
                    activeTabId: newActiveId
                });
            },

            setActiveTab: (tabId: string) => {
                set({ activeTabId: tabId });
            },

            reorderTabs: (tabs: Tab[]) => {
                set({ tabs });
            },

            closeAllTabs: () => {
                set({ tabs: [], activeTabId: null });
            },

            closeOtherTabs: (tabId: string) => {
                const { tabs } = get();
                const newTabs = tabs.filter(t => t.id === tabId);
                set({
                    tabs: newTabs,
                    activeTabId: tabId
                });
            },

            closeTabsToRight: (tabId: string) => {
                const { tabs, activeTabId } = get();
                const tabIndex = tabs.findIndex(t => t.id === tabId);
                if (tabIndex === -1) return;

                const newTabs = tabs.slice(0, tabIndex + 1);
                let newActiveId = activeTabId;

                // If we closed the active tab or tabs after it, keep the current tab active
                if (activeTabId && !newTabs.find(t => t.id === activeTabId)) {
                    newActiveId = tabId;
                }

                set({
                    tabs: newTabs,
                    activeTabId: newActiveId || tabId
                });
            },

            closeTabsToLeft: (tabId: string) => {
                const { tabs, activeTabId } = get();
                const tabIndex = tabs.findIndex(t => t.id === tabId);
                if (tabIndex === -1) return;

                const newTabs = tabs.slice(tabIndex);
                let newActiveId = activeTabId;

                // If we closed the active tab, activate the target tab
                if (activeTabId && !newTabs.find(t => t.id === activeTabId)) {
                    newActiveId = tabId;
                }

                set({
                    tabs: newTabs,
                    activeTabId: newActiveId || tabId
                });
            }
        }),
        {
            name: 'antigravity-tabs',
        }
    )
);
