import React, { useEffect, useMemo } from 'react';
import { useTabStore } from '../../store/tabStore';
import { useNavigate } from 'react-router-dom';
import {
    Settings,
    Search
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { CATEGORIES, getToolsByCategory } from '../../tools/registry';

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
            {/* Search Section - macOS Style */}
            <div className="px-4 pt-4 pb-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search tools... (⌘K)"
                        className="sidebar-search-input w-full pl-10 pr-3 py-2.5 text-sm"
                    />
                </div>
            </div>

            {/* Navigation - macOS Style */}
            <nav className="flex-1 overflow-y-auto px-3 space-y-5 custom-scrollbar">
                {CATEGORIES.map((category) => {
                    const tools = getToolsByCategory(category.id);

                    // Skip Favorites/Recent if empty for now
                    if (['favorites', 'recent'].includes(category.id) && tools.length === 0) return null;
                    if (tools.length === 0) return null;

                    return (
                        <div key={category.id} className="space-y-1.5">
                            {/* Category Header - macOS Style */}
                            <h3 className="px-2.5 text-[11px] font-semibold text-foreground-muted uppercase tracking-[0.08em] mb-1.5 flex items-center">
                                <category.icon className="w-3.5 h-3.5 mr-2 opacity-60" />
                                {category.name}
                            </h3>

                            {/* Tool Items - macOS Style */}
                            <div className="space-y-0.5">
                                {tools.map((tool) => {
                                    const isActive = activeTab?.toolId === tool.id;

                                    return (
                                        <div
                                            key={tool.id}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                // Navigate to tool path - MainLayout will automatically open the tab
                                                // when location.pathname changes (see App.tsx MainLayout useEffect)
                                                if (e.altKey) {
                                                    // Alt/Option + Click => Force new tab
                                                    // We need to open tab first with forceNew, then navigate
                                                    openTab(tool.id, tool.path, tool.name, tool.description, true);
                                                    navigate(tool.path);
                                                } else {
                                                    // Normal click: just navigate, MainLayout will handle tab opening
                                                    navigate(tool.path);
                                                }
                                            }}
                                            title={tool.description}
                                            className={cn(
                                                "sidebar-nav-item flex items-center px-2.5 py-2 rounded-md text-sm transition-all duration-200 group cursor-pointer",
                                                isActive
                                                    ? "sidebar-nav-item-active"
                                                    : "sidebar-nav-item-inactive"
                                            )}
                                        >
                                            <span className="truncate flex-1">{tool.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer - Settings Button - macOS Style */}
            <div className="px-4 py-3 border-t border-border-glass">
                <div
                    onClick={(e) => {
                        e.preventDefault();
                        // Open Settings as a tab
                        navigate('/settings');
                        openTab('settings', '/settings', 'Settings', 'Customize your experience and manage application preferences');
                    }}
                    className={cn(
                        "sidebar-settings-button flex items-center px-3 py-2.5 rounded-md text-sm transition-all duration-200 cursor-pointer",
                        activeTab?.toolId === 'settings' && "sidebar-settings-button-active"
                    )}
                >
                    <Settings className="w-4 h-4 mr-2.5" />
                    <span>Settings</span>
                </div>
            </div>
        </aside>
    );
});

Sidebar.displayName = 'Sidebar';
