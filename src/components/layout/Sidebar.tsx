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
import { motion } from 'framer-motion';

export const Sidebar: React.FC = React.memo(() => {
    const openTab = useTabStore(state => state.openTab);
    const setActiveTab = useTabStore(state => state.setActiveTab);
    const activeTabId = useTabStore(state => state.activeTabId);
    const tabs = useTabStore(state => state.tabs);
    const navigate = useNavigate();
    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
    
    // Count preview tabs
    const previewTabsCount = useMemo(() => tabs.filter(t => t.isPreview).length, [tabs]);

    const [searchQuery, setSearchQuery] = React.useState('');

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

    // Filter tools based on search
    const filteredContent = useMemo(() => {
        if (!searchQuery.trim()) return null;

        const query = searchQuery.toLowerCase();
        const allCategories = CATEGORIES.map(c => getToolsByCategory(c.id)).flat();
        // Remove duplicates and settings
        const uniqueTools = Array.from(new Set(allCategories.map(t => t.id)))
            .map(id => allCategories.find(t => t.id === id)!)
            .filter(t => t.id !== 'settings');
        
        return uniqueTools.filter(tool => 
            tool.name.toLowerCase().includes(query) || 
            tool.description.toLowerCase().includes(query) ||
            tool.keywords?.some(k => k.toLowerCase().includes(query))
        );
    }, [searchQuery]);

    return (
        <motion.aside 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-64 h-full sidebar-macos flex flex-col z-20"
        >
            {/* Enhanced Search Section */}
            <div className="px-5 pt-5 pb-4">
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none transition-colors" />
                    <input
                        type="text"
                        placeholder="Search tools... (⌘K)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="sidebar-search-input w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg bg-[var(--color-glass-input)] border border-transparent hover:border-border-glass focus:border-border-glass-hover transition-all duration-200"
                    />
                </div>
            </div>

            {/* Enhanced Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar pb-4">
                {filteredContent ? (
                    <div className="space-y-1">
                         {filteredContent.length === 0 ? (
                             <div className="text-center text-xs text-foreground-muted py-8">
                                 No tools found
                             </div>
                         ) : filteredContent.map(tool => {
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
                                        e.stopPropagation();
                                        if (e.altKey) {
                                            // Alt+Click: Force new tab and activate immediately
                                            openTab(tool.id, tool.path, tool.name, tool.description, true, false);
                                            navigate(tool.path);
                                        } else {
                                            // Single click: Activate immediately (no preview)
                                            openTab(tool.id, tool.path, tool.name, tool.description, false, false);
                                            navigate(tool.path);
                                        }
                                    }}
                                    title={tool.description + (shortcut ? ` (${shortcut})` : '')}
                                    className={cn(
                                        "sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
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
                ) : (
                    CATEGORIES.map((category) => {
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
                                        e.stopPropagation();
                                        if (e.altKey) {
                                            // Alt+Click: Force new tab and activate immediately
                                            openTab(tool.id, tool.path, tool.name, tool.description, true, false);
                                            navigate(tool.path);
                                        } else {
                                            // Single click: Activate immediately (no preview)
                                            openTab(tool.id, tool.path, tool.name, tool.description, false, false);
                                            navigate(tool.path);
                                        }
                                    }}
                                            title={tool.description + (shortcut ? ` (${shortcut})` : '')}
                                            className={cn(
                                                "sidebar-nav-item flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
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
                }))}
            </nav>

            {/* Enhanced Footer - Settings Button */}
            <div className="px-5 py-4 border-t border-border-glass/50 bg-[var(--color-glass-panel)]/50 space-y-2">
                {/* Preview Tabs Indicator */}
                {previewTabsCount > 0 && (
                    <div className="px-3.5 py-2 text-xs text-foreground-muted flex items-center justify-between bg-[var(--color-glass-input)]/50 rounded-lg">
                        <span>{previewTabsCount} preview tab{previewTabsCount > 1 ? 's' : ''}</span>
                        <button
                            onClick={() => {
                                // Activate first preview tab
                                const firstPreview = tabs.find(t => t.isPreview);
                                if (firstPreview) {
                                    setActiveTab(firstPreview.id);
                                    const allTools = CATEGORIES.flatMap(c => getToolsByCategory(c.id));
                                    const tool = allTools.find(t => t.id === firstPreview.toolId);
                                    if (tool) {
                                        navigate(tool.path);
                                    }
                                }
                            }}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors text-xs underline"
                        >
                            Activate
                        </button>
                    </div>
                )}
                <div
                    onClick={(e) => {
                        e.preventDefault();
                        // Settings always activates immediately (not preview)
                        openTab('settings', '/settings', 'Settings', 'Customize your experience and manage application preferences', false, false);
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
        </motion.aside>
    );
});

Sidebar.displayName = 'Sidebar';
