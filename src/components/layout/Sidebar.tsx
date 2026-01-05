import React, { useEffect, useMemo } from 'react';
import { useTabStore } from '../../store/tabStore';
import { useToolStore } from '../../store/toolStore';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Settings,
    Search,
    LayoutDashboard,
    Star
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { CATEGORIES, getToolsByCategory, type ToolCategory } from '../../tools/registry';
import { useSettingsStore } from '../../store/settingsStore';
import { motion } from 'framer-motion';

export const Sidebar: React.FC = React.memo(() => {
    const openTab = useTabStore(state => state.openTab);
    const setActiveTab = useTabStore(state => state.setActiveTab);
    const activeTabId = useTabStore(state => state.activeTabId);
    const tabs = useTabStore(state => state.tabs);
    const navigate = useNavigate();
    const location = useLocation();
    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
    const isDashboard = location.pathname === '/dashboard';
    
    // Count preview tabs
    const previewTabsCount = useMemo(() => tabs.filter(t => t.isPreview).length, [tabs]);

    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState<'all' | ToolCategory>('all');

    const favorites = useToolStore(state => state.favorites);
    const toggleFavorite = useToolStore(state => state.toggleFavorite);

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

    // Filter tools based on search + optional category
    const filteredContent = useMemo(() => {
        if (!searchQuery.trim()) return null;

        const query = searchQuery.toLowerCase();
        const allCategories = CATEGORIES.map(c => getToolsByCategory(c.id)).flat();
        // Remove duplicates and settings
        const uniqueTools = Array.from(new Set(allCategories.map(t => t.id)))
            .map(id => allCategories.find(t => t.id === id)!)
            .filter(t => t.id !== 'settings');
        
        let results = uniqueTools.filter(tool => 
            tool.name.toLowerCase().includes(query) || 
            tool.description.toLowerCase().includes(query) ||
            tool.keywords?.some(k => k.toLowerCase().includes(query))
        );

        if (selectedCategory !== 'all') {
            results = results.filter(tool => tool.category === selectedCategory);
        }

        return results.sort((a, b) => a.name.localeCompare(b.name));
    }, [searchQuery, selectedCategory]);

    const categoryFilterOptions: { id: 'all' | ToolCategory; label: string }[] = useMemo(() => {
        return [
            { id: 'all', label: 'All' },
            ...CATEGORIES
                .filter(c => !['favorites', 'recent'].includes(c.id))
                .map(c => ({ id: c.id, label: c.name }))
        ];
    }, []);

    return (
        <motion.aside 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-64 h-full sidebar-macos flex flex-col z-20"
        >
            {/* Dashboard Entry */}
            <div className="px-5 pt-4 pb-1">
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate('/dashboard');
                    }}
                    className={cn(
                        "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer",
                        "bg-[var(--color-glass-input)]/70 hover:bg-[var(--color-glass-input)] border border-transparent hover:border-border-glass",
                        isDashboard && "border-border-glass bg-[var(--color-glass-input)]"
                    )}
                >
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span className="truncate font-medium">Dashboard</span>
                </button>
            </div>

            {/* Enhanced Search Section */}
            <div className="px-5 pt-2 pb-4">
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
                {/* Category Filter for Search (Dropdown) */}
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                    <span className="text-foreground-muted shrink-0">Category</span>
                    <div className="relative flex-1">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value as 'all' | ToolCategory)}
                            className="w-full appearance-none bg-[var(--color-glass-input)] border border-border-glass/60 rounded-md py-1.5 pl-2.5 pr-7 text-[11px] text-foreground focus:outline-none focus:border-border-glass-hover transition-colors"
                        >
                            {categoryFilterOptions.map(option => (
                                <option key={option.id} value={option.id}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center text-foreground-muted text-[10px]">
                            ▾
                        </span>
                    </div>
                </div>
            </div>

            {/* Enhanced Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 space-y-5 custom-scrollbar pb-4">
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
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(tool.id);
                                            }}
                                            className="text-[10px] text-foreground-muted hover:text-amber-400 transition-colors"
                                            aria-label="Toggle favorite"
                                        >
                                            <Star className={cn(
                                                "w-3.5 h-3.5",
                                                favorites.includes(tool.id) && "fill-amber-400 text-amber-400"
                                            )} />
                                        </button>
                                        {shortcut && (
                                            <span className={cn(
                                                "text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono",
                                                isActive && "opacity-70 bg-black/5 dark:bg-white/10 text-foreground"
                                            )}>
                                                {shortcut.replace('Ctrl', 'Win').replace('Cmd', '⌘').replace('Shift', '⇧').replace('Alt', 'Alt').split('+').map(k => k.trim()).join('+').replace('Win+⇧', 'Win+⇧').replace(/\+/g, '')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                         })}
                    </div>
                ) : (
                    CATEGORIES.map((category, categoryIndex) => {
                    const tools = getToolsByCategory(category.id);

                    // Skip Favorites/Recent if empty for now
                    if (['favorites', 'recent'].includes(category.id) && tools.length === 0) return null;
                    if (tools.length === 0) return null;

                    const visibleTools = tools.filter(tool => tool.id !== 'settings');

                    return (
                        <div key={category.id} className="space-y-2">
                            {/* Category Separator - chỉ hiển thị nếu không phải category đầu tiên */}
                            {categoryIndex > 0 && (
                                <div className="h-px mx-2 my-3 bg-gradient-to-r from-transparent via-border-glass/80 to-transparent" />
                            )}
                            
                            {/* Enhanced Category Header với background & accent */}
                            <div className="px-3 py-1.5 rounded-lg bg-[var(--color-glass-panel)]/85 border border-border-glass/80 shadow-sm relative overflow-hidden">
                                {/* Left accent bar */}
                                <div className="absolute inset-y-1 left-1 w-[3px] rounded-full bg-gradient-to-b from-indigo-400/90 via-sky-400/90 to-emerald-400/90" />
                                <h3 className="pl-3 text-[10px] font-semibold text-foreground uppercase tracking-[0.16em] flex items-center gap-2">
                                    <category.icon className="w-3.5 h-3.5 text-foreground/80" />
                                    <span>{category.name}</span>
                                    <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/5 text-foreground/70 border border-border-glass/60">
                                        {visibleTools.length}
                                    </span>
                                </h3>
                            </div>

                            {/* Enhanced Tool Items với padding để tạo khoảng cách */}
                            <div className="space-y-1 pl-1">
                                {visibleTools.map((tool) => {
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
            <div className="px-5 py-2 border-t border-border-glass/50 bg-[var(--color-glass-panel)]/50 space-y-2">
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
                        "sidebar-settings-button flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer font-medium",
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
