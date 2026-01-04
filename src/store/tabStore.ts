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

    openTab: (toolId: string, path: string, title: string, description?: string) => void;
    closeTab: (tabId: string) => void;
    setActiveTab: (tabId: string) => void;
    reorderTabs: (tabs: Tab[]) => void;
    closeAllTabs: () => void;
}

export const useTabStore = create<TabStore>()(
    persist(
        (set, get) => ({
            tabs: [],
            activeTabId: null,

            openTab: (toolId: string, path: string, title: string, description?: string) => {
                const { tabs } = get();

                // Optional: Check if a tab with this toolId already exists if we want singleton tabs per tool
                // For now, let's allow multiple tabs of the same tool if the design calls for it,
                // BUT the plan says "Sidebar Click ... Tab Exists? -> Switch". 
                // So let's check if the generic tool is already open.

                // NOTE: For a true multi-tab experience (like VS Code), you might want multiple 'Untitled-1', 'Untitled-2'
                // for the same tool. However, the architecture diagram says "Tab Exists? -> Yes -> Switch".
                // I will assume for now we switch to existing if found.

                const existingTab = tabs.find(t => t.toolId === toolId);
                if (existingTab) {
                    set({ activeTabId: existingTab.id });
                    return;
                }

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
            }
        }),
        {
            name: 'antigravity-tabs',
        }
    )
);
