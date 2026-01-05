import React, { useEffect, useMemo } from 'react';
import { useTabStore } from '../../store/tabStore';
import { useNavigate } from 'react-router-dom';
import {
    Settings,
    Search
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { CATEGORIES, getToolsByCategory } from '../../tools/registry';
import { useSettingsStore } from '../../store/settingsStore';

export const Sidebar: React.FC = React.memo(() => {
    const openTab = useTabStore(state => state.openTab);
    const activeTabId = useTabStore(state => state.activeTabId);
    const tabs = useTabStore(state => state.tabs);
    const navigate = useNavigate();
    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

    // Global shortcut for Search (Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.querySelector<HTMLInputElement>('.sidebar-search-input')?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <aside className="w-64 h-full sidebar-macos flex flex-col transition-all duration-300 z-20">
            {/* Enhanced Search Section */}
            <div className="px-5 pt-5 pb-4">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none transition-colors" />
                    <input
                        type="text"
                        placeholder="Search tools... (⌘K)"
                        className="sidebar-search-input w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg bg-[var(--color-glass-input)] border border-transparent hover:border-border-glass focus:border-border-glass-hover transition-all duration-200"
                    />
                </div>
            </div>

            {/* Enhanced Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar pb-4">
                {CATEGORIES.map((category) => {
                    const tools = getToolsByCategory(category.id);

                    // Skip Favorites/Recent if empty for now
                    if (['favorites', 'recent'].includes(category.id) && tools.length === 0) return null;
                    if (tools.length === 0) return null;

                    return (
                        <div key={category.id} className="space-y-2">
                            {/* Enhanced Category Header */}
                            <h3 className="px-3 text-[10px] font-bold text-foreground-muted uppercase tracking-[0.1em] mb-2 flex items-center gap-2">
                                <category.icon className="w-3.5 h-3.5 opacity-50" />
                                <span>{category.name}</span>
                            </h3>

                            {/* Enhanced Tool Items */}
                            <div className="space-y-1">
                                {tools.filter(tool => tool.id !== 'settings').map((tool) => {
                                    const isActive = activeTab?.toolId === tool.id;
                                    const Icon = tool.icon;
                                    // Get configured or default shortcut
                                    const toolShortcuts = useSettingsStore.getState().toolShortcuts;
                                    const shortcut = toolShortcuts[tool.id] || tool.shortcut;

                                    return (
                                        <div
                                            key={tool.id}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (e.altKey) {
                                                    // Alt+Click: Force new tab
                                                    openTab(tool.id, tool.path, tool.name, tool.description, true);
                                                    navigate(tool.path);
                                                } else {
                                                    // Normal click: Open or switch to existing tab
                                                    openTab(tool.id, tool.path, tool.name, tool.description, false);
                                                    navigate(tool.path);
                                                }
                                            }}
                                            title={tool.description + (shortcut ? ` (${shortcut})` : '')}
                                            className={cn(
                                                "sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group cursor-pointer",
                                                isActive
                                                    ? "sidebar-nav-item-active"
                                                    : "sidebar-nav-item-inactive"
                                            )}
                                        >
                                            {Icon && (
                                                <Icon className={cn(
                                                    "w-4 h-4 shrink-0 transition-opacity",
                                                    isActive ? "opacity-100" : "opacity-50 group-hover:opacity-70"
                                                )} />
                                            )}
                                            <span className="truncate flex-1 font-medium">{tool.name}</span>
                                            {shortcut && (
                                                <span className={cn(
                                                    "text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono",
                                                    isActive && "opacity-70 bg-black/5 dark:bg-white/10 text-foreground"
                                                )}>
                                                    {shortcut.replace('Ctrl', 'Win').replace('Cmd', '⌘').replace('Shift', '⇧').replace('Alt', 'Alt').split('+').map(k => k.trim()).join('+').replace('Win+⇧', 'Win+⇧').replace(/\+/g, '')}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Enhanced Footer - Settings Button */}
            <div className="px-5 py-4 border-t border-border-glass/50 bg-[var(--color-glass-panel)]/50">
                <div
                    onClick={(e) => {
                        e.preventDefault();
                        openTab('settings', '/settings', 'Settings', 'Customize your experience and manage application preferences', false);
                        navigate('/settings');
                    }}
                    className={cn(
                        "sidebar-settings-button flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm transition-all duration-200 cursor-pointer font-medium",
                        activeTab?.toolId === 'settings' && "sidebar-settings-button-active"
                    )}
                >
                    <Settings className="w-4 h-4 shrink-0" />
                    <span>Settings</span>
                </div>
            </div>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';
