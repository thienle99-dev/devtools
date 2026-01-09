import React, { useEffect, useMemo } from 'react';
import { useTabStore } from '@store/tabStore';
import { useToolStore } from '@store/toolStore';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search,
    LayoutGrid,
    Star,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { cn } from '@utils/cn';
import { CATEGORIES, getToolsByCategory } from '@tools/registry';
import { useSettingsStore } from '@store/settingsStore';
import { motion } from 'framer-motion';
import { usePlatform } from '@hooks/usePlatform';

export const Sidebar: React.FC = React.memo(() => {
    const openTab = useTabStore(state => state.openTab);
    const activeTabId = useTabStore(state => state.activeTabId);
    const tabs = useTabStore(state => state.tabs);
    const navigate = useNavigate();
    const location = useLocation();
    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

    const [searchQuery, setSearchQuery] = React.useState('');

    const favorites = useToolStore(state => state.favorites);
    const toggleFavorite = useToolStore(state => state.toggleFavorite);

    const sidebarCollapsed = useSettingsStore(state => state.sidebarCollapsed);
    const toggleSidebar = useSettingsStore(state => state.toggleSidebar);

    // Platform detection for shortcuts
    const { isMac } = usePlatform();

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

        const results = uniqueTools.filter(tool =>
            tool.name.toLowerCase().includes(query) ||
            tool.description.toLowerCase().includes(query) ||
            tool.keywords?.some(k => k.toLowerCase().includes(query))
        );

        return results.sort((a, b) => a.name.localeCompare(b.name));
    }, [searchQuery]);

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
                "h-full sidebar-macos flex flex-col z-20 shrink-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
                sidebarCollapsed ? "w-20" : "w-72"
            )}
        >
            {/* Header: Logo & Controls */}
            <div className={cn(
                "pt-6 pb-2 transition-all duration-500",
                sidebarCollapsed ? "px-3" : "px-6"
            )}>
                <div className={cn(
                    "flex items-center gap-3",
                    sidebarCollapsed ? "flex-col" : "justify-between"
                )}>
                    <div 
                        onClick={() => navigate('/dashboard')}
                        className={cn(
                            "flex items-center gap-2.5 transition-all cursor-pointer hover:opacity-80 active:scale-95",
                            sidebarCollapsed && "flex-col"
                        )}
                    >
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                            <LayoutGrid className="w-5 h-5 text-white" />
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex flex-col min-w-0">
                                <span className="font-bold text-sm tracking-tight text-foreground truncate">DevTools</span>
                                <span className="text-[10px] text-foreground-muted font-bold tracking-[0.1em] uppercase -mt-0.5">Control Panel</span>
                            </div>
                        )}
                    </div>
                    
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className={cn(
                            "group p-2.5 rounded-xl text-foreground-muted hover:text-foreground bg-foreground/[0.03] dark:bg-white/[0.03] hover:bg-foreground/[0.08] dark:hover:bg-white/10 border border-border-glass transition-all duration-300",
                            sidebarCollapsed ? "w-full flex justify-center mt-2" : "shrink-0"
                        )}
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        ) : (
                            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Search Section */}
            {!sidebarCollapsed && (
                <div className="px-6 pt-3 pb-5">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none z-10">
                            <Search className="w-4 h-4 text-foreground-muted/50 group-focus-within:text-indigo-500 transition-colors duration-300" />
                        </div>
                        <input
                            type="text"
                            placeholder={`Quick Search...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="sidebar-search-input w-full pl-10 pr-4 py-3 text-xs bg-foreground/[0.03] dark:bg-white/[0.03] backdrop-blur-3xl border border-border-glass focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-foreground-muted/40 rounded-2xl shadow-sm"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                             <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border-glass bg-background/50 px-1.5 font-mono text-[10px] font-bold text-foreground-muted opacity-40">
                                {isMac ? '⌘' : 'Ctrl'} K
                            </kbd>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className={cn(
                "flex-1 overflow-y-auto space-y-4 custom-scrollbar pb-4 transition-all duration-300",
                sidebarCollapsed ? "px-3" : "px-4"
            )}>
                {/* Fixed Dashboard Entry */}
                {!searchQuery && (
                    <div className={cn(
                        "space-y-0.5 mb-4",
                        sidebarCollapsed ? "" : "px-2 pt-2"
                    )}>
                        <div
                            onClick={() => navigate('/dashboard')}
                            className={cn(
                                "group relative flex items-center transition-all duration-300 cursor-pointer overflow-hidden",
                                sidebarCollapsed 
                                    ? "w-full aspect-square justify-center rounded-2xl" 
                                    : "px-3.5 py-3 gap-3.5 rounded-2xl",
                                location.pathname === '/dashboard'
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                                    : "hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] text-foreground-secondary hover:text-foreground border border-transparent hover:border-border-glass"
                            )}
                        >
                            <LayoutGrid className={cn(
                                "shrink-0 transition-transform duration-300 group-hover:scale-110",
                                sidebarCollapsed ? "w-6 h-6" : "w-5 h-5"
                            )} />
                            {!sidebarCollapsed && (
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-[14px] tracking-tight">Dashboard</span>
                                    <span className="text-[9px] opacity-40 uppercase font-black tracking-widest leading-none">Home Overview</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!sidebarCollapsed && filteredContent ? (
                    <div className="space-y-1">
                        {filteredContent.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                <div className="w-12 h-12 rounded-full bg-foreground/[0.03] flex items-center justify-center mb-3">
                                    <Search className="w-6 h-6 text-foreground-muted/30" />
                                </div>
                                <p className="text-xs font-bold text-foreground/40 italic">Nothing found matching your query</p>
                            </div>
                        ) : filteredContent.map(tool => {
                            const isActive = activeTab?.toolId === tool.id;
                            const Icon = tool.icon;
                            const category = CATEGORIES.find(c => c.id === tool.category);
                            const colorClass = tool.color || category?.color || 'text-foreground-muted';

                            return (
                                <div
                                    key={tool.id}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openTab(tool.id, tool.path, tool.name, tool.description, e.altKey, false);
                                        navigate(tool.path);
                                    }}
                                    className={cn(
                                        "relative group flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[13px] transition-all duration-300 cursor-pointer mb-1",
                                        isActive 
                                            ? "bg-indigo-500/10 border border-indigo-500/20 text-foreground shadow-[0_4px_15px_-3px_rgba(99,102,241,0.1)]" 
                                            : "hover:bg-foreground/[0.04] dark:hover:bg-white/[0.04] border border-transparent text-foreground-secondary hover:text-foreground hover:translate-x-1"
                                    )}
                                >
                                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-indigo-500 rounded-r-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />}
                                    
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300",
                                        isActive ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40" : cn("bg-foreground/[0.03] dark:bg-white/[0.03]", colorClass)
                                    )}>
                                        {Icon && <Icon className="w-4 h-4 shrink-0" />}
                                    </div>
                                    
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="truncate font-bold tracking-tight">{tool.name}</span>
                                        <span className="text-[10px] text-foreground-muted/60 truncate font-medium">{tool.description}</span>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleFavorite(tool.id);
                                            }}
                                            className="p-1 hover:scale-110 transition-transform"
                                        >
                                            <Star className={cn(
                                                "w-3.5 h-3.5",
                                                favorites.includes(tool.id) ? "fill-amber-400 text-amber-400" : "text-foreground-muted"
                                            )} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : !sidebarCollapsed ? (
                    CATEGORIES
                        .map((category, categoryIndex) => {
                            const tools = getToolsByCategory(category.id);

                            // Skip Favorites/Recent if empty for now
                            if (['favorites', 'recent'].includes(category.id) && tools.length === 0) return null;
                            if (tools.length === 0) return null;

                            const visibleTools = tools.filter(tool => tool.id !== 'settings');

                            return (
                                <div key={category.id} className="space-y-2">
                                    {/* Category Separator - chỉ hiển thị nếu không phải category đầu tiên */}
                                    {categoryIndex > 0 && !sidebarCollapsed && (
                                        <div className="h-px mx-2 my-3 bg-gradient-to-r from-transparent via-border-glass/80 to-transparent" />
                                    )}

                                    {/* Premium Category Header */}
                                    {!sidebarCollapsed && (
                                        <div className="px-3 pt-2 group/header">
                                            <div className="flex items-center gap-2 mb-2 px-1">
                                                <div className={cn("w-1 h-3 rounded-full bg-current opacity-40 group-hover/header:opacity-100 transition-opacity", category.color || "text-foreground")} />
                                                <h3 className="text-[10px] font-black text-foreground-muted group-hover/header:text-foreground transition-colors uppercase tracking-[0.2em] flex items-center justify-between flex-1">
                                                    <span>{category.name}</span>
                                                    <span className="text-[8px] font-mono opacity-30 group-hover/header:opacity-50 transition-opacity">{visibleTools.length}</span>
                                                </h3>
                                            </div>
                                        </div>
                                    )}

                                    {/* Enhanced Tool Items với padding để tạo khoảng cách */}
                                    <div className={cn(
                                        "space-y-0.5",
                                        sidebarCollapsed ? "" : "px-2"
                                    )}>
                                        {visibleTools.map((tool) => {
                                            const isActive = activeTab?.toolId === tool.id;
                                            const Icon = tool.icon;
                                            const toolShortcuts = useSettingsStore.getState().toolShortcuts;
                                            const shortcut = toolShortcuts[tool.id] || tool.shortcut;
                                            const colorClass = tool.color || category.color || 'text-foreground-muted';

                                            return (
                                                <div
                                                    key={tool.id}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        openTab(tool.id, tool.path, tool.name, tool.description, e.altKey, false);
                                                        navigate(tool.path);
                                                    }}
                                                    title={tool.description}
                                                    className={cn(
                                                        "relative group flex items-center transition-all duration-300 cursor-pointer overflow-hidden",
                                                        sidebarCollapsed 
                                                            ? "px-3 py-3 justify-center rounded-2xl mb-1.5" 
                                                            : "px-3 py-2.5 gap-3.5 rounded-xl mb-0.5",
                                                        isActive 
                                                            ? "sidebar-nav-item-active !bg-indigo-500 shadow-lg shadow-indigo-500/30 text-white" 
                                                            : "hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] text-foreground-secondary hover:text-foreground"
                                                    )}
                                                >
                                                    {Icon && (
                                                        <Icon className={cn(
                                                            "shrink-0 transition-all duration-300",
                                                            sidebarCollapsed ? "w-6 h-6" : "w-4 h-4",
                                                            isActive ? "scale-110 text-white" : cn(colorClass, "group-hover:scale-110")
                                                        )} />
                                                    )}
                                                    
                                                    {!sidebarCollapsed && (
                                                        <>
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="truncate font-bold tracking-tight text-[13px]">{tool.name}</span>
                                                                {!isActive && <span className="text-[9px] opacity-40 truncate font-medium group-hover:opacity-70 transition-opacity uppercase tracking-tighter">{category.name}</span>}
                                                            </div>
                                                            {shortcut && !isActive && (
                                                                <kbd className="hidden group-hover:block h-4 select-none items-center gap-1 rounded bg-foreground/10 px-1 font-mono text-[8px] font-black text-foreground/50">
                                                                    {shortcut?.split('+').pop()}
                                                                </kbd>
                                                            )}
                                                        </>
                                                    )}
                                                    
                                                    {isActive && !sidebarCollapsed && (
                                                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-white/30 rounded-full" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })) : (
                    // Collapsed view: Show all tools as icons only
                    <div className="space-y-1.5 px-1 py-2">
                        {CATEGORIES
                            .flatMap(category => {
                                const tools = getToolsByCategory(category.id);
                                return tools.map(t => ({ ...t, categoryColor: category.color }));
                            })
                            .filter(tool => tool.id !== 'settings')
                            .map((tool, index, array) => {
                                const prevTool = index > 0 ? array[index - 1] : null;
                                const showSeparator = prevTool && prevTool.category !== tool.category;
                                const isActive = activeTab?.toolId === tool.id;
                                const Icon = tool.icon;
                                const colorClass = tool.color || tool.categoryColor || 'text-foreground-muted';

                                return (
                                    <React.Fragment key={tool.id}>
                                        {showSeparator && (
                                            <div className="h-px mx-3 my-2 bg-foreground/10 dark:bg-white/10" />
                                        )}
                                        <div
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openTab(tool.id, tool.path, tool.name, tool.description, false, false);
                                                navigate(tool.path);
                                            }}
                                            title={tool.name}
                                            className={cn(
                                                "flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 group cursor-pointer hover:scale-105 mx-auto",
                                                isActive
                                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 translate-x-1"
                                                    : "hover:bg-foreground/[0.08] dark:hover:bg-white/10 text-foreground-secondary hover:text-foreground"
                                            )}
                                        >
                                            {Icon && (
                                                <Icon className={cn(
                                                    "w-6 h-6 shrink-0 transition-transform group-hover:scale-110",
                                                    isActive ? "text-white" : colorClass
                                                )} />
                                            )}
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                    </div>
                )}
            </nav>
        </motion.aside>
    );
});

Sidebar.displayName = 'Sidebar';
