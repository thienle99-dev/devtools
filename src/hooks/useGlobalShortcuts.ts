import { useEffect, useMemo } from 'react';
import { useSettingsStore } from '@store/settingsStore';
import { useTabStore } from '@store/tabStore';
import { TOOLS } from '@tools/registry';

export function useGlobalShortcuts() {
    const { toolShortcuts, toggleSidebar } = useSettingsStore();
    const { openTab, tabs, activeTabId, setActiveTab, closeTab } = useTabStore();

    // Pre-calculate shortcut map for O(1) matching in the keydown handler
    const processedShortcuts = useMemo(() => {
        return TOOLS.map(tool => {
            const shortcut = toolShortcuts[tool.id] || tool.shortcut;
            if (!shortcut) return null;

            const parts = shortcut.toLowerCase().split('+').map(p => p.trim());
            return {
                tool,
                key: parts[parts.length - 1],
                modifiers: parts.slice(0, parts.length - 1)
            };
        }).filter(Boolean);
    }, [toolShortcuts]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const eventHasPrimary = isMac ? e.metaKey : e.ctrlKey;

            // --- Navigation Shortcuts ---

            // Sidebar Toggle: Cmd+B (Mac) or Ctrl+B (Windows/Linux)
            if (eventHasPrimary && e.key.toLowerCase() === 'b') {
                e.preventDefault();
                toggleSidebar();
                return;
            }

            // Close Tab: Ctrl+W (Win) or Cmd+W (Mac)
            if (eventHasPrimary && e.key.toLowerCase() === 'w' && !e.shiftKey && !e.altKey) {
                if (activeTabId && tabs.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    closeTab(activeTabId);
                }
                return;
            }

            // Cycle Tabs: Ctrl+Tab (Next) or Ctrl+Shift+Tab (Prev)
            if (e.ctrlKey && e.key === 'Tab') {
                e.preventDefault();
                const currentIndex = tabs.findIndex(t => t.id === activeTabId);
                if (currentIndex === -1) return;

                if (e.shiftKey) {
                    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
                    setActiveTab(tabs[prevIndex].id);
                } else {
                    const nextIndex = (currentIndex + 1) % tabs.length;
                    setActiveTab(tabs[nextIndex].id);
                }
                return;
            }

            // Switch by Number: Ctrl+1..9
            if (eventHasPrimary && !e.shiftKey && !e.altKey && e.key >= '1' && e.key <= '9') {
                const index = parseInt(e.key) - 1;
                if (index < tabs.length) {
                    e.preventDefault();
                    setActiveTab(tabs[index].id);
                } else if (e.key === '9' && tabs.length > 0) {
                    e.preventDefault();
                    setActiveTab(tabs[tabs.length - 1].id);
                }
                return;
            }

            // --- Tool Shortcuts ---
            for (const item of processedShortcuts) {
                if (!item) continue;
                const { tool, key, modifiers } = item;

                if (e.key.toLowerCase() !== key) continue;

                const configHasCtrl = modifiers.some(m => ['ctrl', 'cmd', 'command', 'control'].includes(m));
                const configHasShift = modifiers.includes('shift');
                const configHasAlt = modifiers.includes('alt') || modifiers.includes('option');

                if (configHasCtrl !== eventHasPrimary) continue;
                if (configHasShift !== e.shiftKey) continue;
                if (configHasAlt !== e.altKey) continue;

                e.preventDefault();
                openTab(tool.id, tool.path, tool.name, tool.description, false, false);
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [processedShortcuts, tabs, activeTabId, toggleSidebar, closeTab, setActiveTab, openTab]);
}
