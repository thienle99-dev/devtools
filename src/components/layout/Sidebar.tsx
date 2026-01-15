import React, { useEffect, useMemo, useState } from 'react';
import { useTabStore } from '@store/tabStore';
import { useToolStore } from '@store/toolStore';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search,
    LayoutGrid,
    Star,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Command,
    X
} from 'lucide-react';
import { cn } from '@utils/cn';
import { CATEGORIES, TOOLS, getToolsByCategory, getToolById } from '@tools/registry';
import { useSettingsStore } from '@store/settingsStore';
import { usePluginStore } from '@store/pluginStore';
import { getCategoryIcon, getCategoryColor } from '@tools/plugins/plugin-utils';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar: React.FC = React.memo(() => {
    const openTab = useTabStore(state => state.openTab);
    const activeTabId = useTabStore(state => state.activeTabId);
    const tabs = useTabStore(state => state.tabs);
    const navigate = useNavigate();
    const location = useLocation();
    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);

    const [searchQuery, setSearchQuery] = useState('');

    const favorites = useToolStore(state => state.favorites);
    const history = useToolStore(state => state.history);
    const toggleFavorite = useToolStore(state => state.toggleFavorite);

    const sidebarCollapsed = useSettingsStore(state => state.sidebarCollapsed);
    const toggleSidebar = useSettingsStore(state => state.toggleSidebar);
    const collapsedCategories = useSettingsStore(state => state.collapsedCategories);
    const toggleCategoryCollapsed = useSettingsStore(state => state.toggleCategoryCollapsed);
    const categoryOrder = useSettingsStore(state => state.categoryOrder);

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

    const activePlugins = usePluginStore(state => state.activePlugins);
    const fetchActivePlugins = usePluginStore(state => state.fetchActivePlugins);

    useEffect(() => {
        fetchActivePlugins();
        
        // Listen for progress to refresh sidebar
        const cleanup = window.pluginAPI.onPluginProgress((progress) => {
            if (progress.stage === 'complete') {
                fetchActivePlugins();
            }
        });

        return () => cleanup();
    }, []);

    const filteredContent = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return null;

        const pluginTools = activePlugins.map(p => ({
            id: p.manifest.id,
            name: p.manifest.name,
            description: p.manifest.description,
            path: `/plugin/${p.manifest.id}`,
            icon: getCategoryIcon(p.manifest.category),
            color: getCategoryColor(p.manifest.category),
            category: 'Plugin',
            isPlugin: true,
            keywords: p.manifest.tags || []
        }));

        const allTools = [...TOOLS, ...pluginTools];
        
        const results = allTools.filter(tool => {
            if (tool.id === 'settings' || tool.id === 'dashboard') return false;
            
            return tool.name.toLowerCase().includes(query) ||
                tool.description.toLowerCase().includes(query) ||
                (tool as any).keywords?.some((k: string) => k.toLowerCase().includes(query));
        });

        return results.sort((a, b) => a.name.localeCompare(b.name));
    }, [searchQuery, activePlugins]);

    const categoriesWithTools = useMemo(() => {
        const mapped = CATEGORIES.map(category => {
            let tools: any[];
            if (category.id === 'favorites') {
                const uniqueFavorites = Array.from(new Set(favorites));
                tools = uniqueFavorites.map(id => getToolById(id)).filter((t): t is any => Boolean(t));
                
                const favPlugins = activePlugins
                    .filter(p => favorites.includes(p.manifest.id))
                    .map(p => ({
                        id: p.manifest.id,
                        name: p.manifest.name,
                        description: p.manifest.description,
                        path: `/plugin/${p.manifest.id}`,
                        icon: getCategoryIcon(p.manifest.category),
                        color: getCategoryColor(p.manifest.category),
                        category: 'Plugin',
                        isPlugin: true
                    }));
                tools = [...tools, ...favPlugins];

            } else if (category.id === 'recent') {
                const seen = new Set<string>();
                tools = history
                    .map(h => {
                        const tool = getToolById(h.id);
                        if (tool) return tool;
                        
                        const plugin = activePlugins.find(p => p.manifest.id === h.id);
                        if (plugin) {
                            return {
                                id: plugin.manifest.id,
                                name: plugin.manifest.name,
                                description: plugin.manifest.description,
                                path: `/plugin/${plugin.manifest.id}`,
                                icon: getCategoryIcon(plugin.manifest.category),
                                color: getCategoryColor(plugin.manifest.category),
                                category: 'Plugin',
                                isPlugin: true
                            };
                        }
                        return null;
                    })
                    .filter((t): t is any => {
                        if (!t || seen.has(t.id)) return false;
                        seen.add(t.id);
                        return true;
                    })
                    .slice(0, 5);
            } else {
                // Uses the pre-computed map from the registry
                tools = getToolsByCategory(category.id);
                
                const matchingPlugins = activePlugins
                    .filter(p => p.manifest.category === category.id || (category.id === 'plugins' && !CATEGORIES.some(c => c.id === p.manifest.category)))
                    .map(p => ({
                        id: p.manifest.id,
                        name: p.manifest.name,
                        description: p.manifest.description,
                        path: `/plugin/${p.manifest.id}`,
                        icon: getCategoryIcon(p.manifest.category),
                        color: getCategoryColor(p.manifest.category),
                        category: category.name,
                        isPlugin: true
                    }));
                
                tools = [...tools, ...matchingPlugins];
            }
            return { ...category, tools: tools.filter((t: any) => t.id !== 'settings' && t.id !== 'dashboard') };
        });

        if (categoryOrder.length === 0) return mapped;

        const orderMap = new Map(categoryOrder.map((id, index) => [id, index]));
        return [...mapped].sort((a, b) => {
            const indexA = orderMap.get(a.id);
            const indexB = orderMap.get(b.id);
            if (indexA === undefined && indexB === undefined) return 0;
            if (indexA === undefined) return 1;
            if (indexB === undefined) return -1;
            return indexA - indexB;
        });
    }, [favorites, history, categoryOrder, activePlugins]);

    return (
        <aside
            className={cn(
                "h-full border-r border-border-glass bg-background/50 backdrop-blur-3xl flex flex-col z-20 shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-[width]",
                sidebarCollapsed ? "w-20" : "w-72"
            )}
        >
            {/* Logo Section */}
            <div className={cn(
                "h-16 flex items-center shrink-0 border-b border-border-glass/50 transition-all duration-500",
                sidebarCollapsed ? "justify-center px-0" : "px-5"
            )}>
                <div className={cn(
                    "flex items-center gap-3 w-full",
                    sidebarCollapsed ? "justify-center" : "justify-between"
                )}>
                    <div
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-transform"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center shadow-[0_8px_16px_-4px_rgba(99,102,241,0.4)] group-hover:shadow-[0_12px_24px_-8px_rgba(99,102,241,0.6)] group-hover:scale-105 transition-all duration-300">
                            <LayoutGrid className="w-5 h-5 text-white" />
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex flex-col">
                                <span className="text-[14px] font-black tracking-tight text-foreground leading-none">DevTools</span>
                                <span className="text-[10px] text-indigo-500/80 font-black tracking-[0.1em] uppercase mt-0.5">Premium Suite</span>
                            </div>
                        )}
                    </div>

                    {!sidebarCollapsed && (
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsed Toggle Button */}
            {sidebarCollapsed && (
                <div className="flex justify-center py-4">
                    <button
                        onClick={toggleSidebar}
                        className="p-2.5 rounded-xl bg-foreground/[0.03] dark:bg-white/[0.03] hover:bg-foreground/[0.08] dark:hover:bg-white/10 text-foreground-muted hover:text-foreground transition-all duration-300 shadow-sm border border-border-glass"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Search Bar Container */}
            {!sidebarCollapsed && (
                <div className="px-4 pt-5 pb-2">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-foreground-muted/40 group-focus-within:text-indigo-400 transition-colors">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Find a tool..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="sidebar-search-input w-full h-10 pl-10 pr-12 text-[12px] font-medium bg-foreground/[0.03] dark:bg-white/[0.03] hover:bg-foreground/[0.05] dark:hover:bg-white/[0.05] border border-border-glass focus:border-indigo-500/30 focus:bg-background focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all rounded-xl placeholder:text-foreground-muted/30"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none gap-1">
                            {searchQuery ? (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="pointer-events-auto p-1 rounded-md hover:bg-foreground/10"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            ) : (
                                <div className="flex items-center gap-1 opacity-20">
                                    <Command className="w-3 h-3" />
                                    <span className="text-[10px] font-black font-sans uppercase">K</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Content */}
            <nav className={cn(
                "flex-1 overflow-y-auto px-2 custom-scrollbar pb-6 space-y-6 pt-2",
                sidebarCollapsed ? "scrollbar-hide" : ""
            )}>
                {/* Fixed Home Section */}
                {!searchQuery && !sidebarCollapsed && (
                    <div className="px-2">
                        <NavItem
                            icon={LayoutGrid}
                            label="Dashboard"
                            subtitle="Overview"
                            isActive={location.pathname === '/dashboard'}
                            onClick={() => {
                                const { setActiveTab } = useTabStore.getState();
                                setActiveTab(null);
                                navigate('/dashboard');
                            }}
                            color="text-indigo-400"
                        />
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {filteredContent ? (
                        <div className="px-2 space-y-1">
                            <div className="px-3 mb-2 flex items-center gap-2">
                                <Search className="w-3 h-3 text-indigo-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">Search Results</span>
                            </div>
                            {filteredContent.length === 0 ? (
                                <EmptySearch />
                            ) : (
                                filteredContent.map(tool => (
                                    <ToolNavItem
                                        key={tool.id}
                                        tool={tool}
                                        isActive={activeTab?.toolId === tool.id}
                                        isCollapsed={sidebarCollapsed}
                                        favorites={favorites}
                                        toggleFavorite={toggleFavorite}
                                        openTab={openTab}
                                        navigate={navigate}
                                    />
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {categoriesWithTools.map((category) => {
                                const tools = category.tools;
                                if (['favorites', 'recent'].includes(category.id) && tools.length === 0) return null;
                                if (tools.length === 0) return null;

                                const isCollapsed = collapsedCategories.includes(category.id);

                                return (
                                    <div key={category.id} className="space-y-1.5">
                                        {!sidebarCollapsed && (
                                            <button 
                                                onClick={() => toggleCategoryCollapsed(category.id)}
                                                className="w-full px-5 mb-1 flex items-center justify-between group/cat hover:bg-white/5 py-1 rounded-lg transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className={cn("w-1 h-3 rounded-full bg-current opacity-40 group-hover/cat:opacity-100 transition-opacity", category.color || "text-foreground")} />
                                                    <h3 className="text-[10px] font-black text-foreground-muted uppercase tracking-widest group-hover/cat:text-foreground transition-colors">{category.name}</h3>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-mono text-foreground-muted/30 group-hover/cat:text-foreground/50">{tools.length}</span>
                                                    {isCollapsed ? <ChevronDown className="w-3 h-3 text-foreground-muted/50" /> : <ChevronUp className="w-3 h-3 text-foreground-muted/50" />}
                                                </div>
                                            </button>
                                        )}

                                        <AnimatePresence initial={false}>
                                            {(!isCollapsed || sidebarCollapsed) && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                                    className={cn("space-y-0.5 overflow-hidden", sidebarCollapsed ? "flex flex-col items-center" : "px-2")}
                                                >
                                                    {tools.map((tool: any) => (
                                                        <ToolNavItem
                                                            key={tool.id}
                                                            tool={tool}
                                                            isActive={activeTab?.toolId === tool.id}
                                                            isCollapsed={sidebarCollapsed}
                                                            favorites={favorites}
                                                            toggleFavorite={toggleFavorite}
                                                            openTab={openTab}
                                                            navigate={navigate}
                                                        />
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </AnimatePresence>
            </nav>
        </aside>
    );
});

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    subtitle?: string;
    isActive: boolean;
    onClick: () => void;
    color?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, subtitle, isActive, onClick, color }) => (
    <div
        onClick={onClick}
        className={cn(
            "group relative flex items-center h-11 px-3.5 gap-3 rounded-xl cursor-pointer transition-all duration-300",
            isActive
                ? "bg-indigo-500 text-white shadow-[0_8px_16px_-4px_rgba(99,102,241,0.4)] z-10"
                : "hover:bg-foreground/[0.04] dark:hover:bg-white/[0.04] text-foreground-secondary hover:text-foreground"
        )}
    >
        <div className={cn(
            "w-5 h-5 flex items-center justify-center transition-all duration-300",
            isActive ? "text-white scale-110" : color
        )}>
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
            <span className="font-bold text-[12px] leading-none">{label}</span>
            {subtitle && !isActive && <span className="text-[9px] text-foreground-muted/60 font-black uppercase tracking-tighter mt-1">{subtitle}</span>}
        </div>
        {isActive && <div className="absolute right-3 w-1 h-3.5 bg-white/40 rounded-full" />}
    </div>
);

interface ToolNavItemProps {
    tool: any;
    isActive: boolean;
    isCollapsed: boolean;
    favorites: string[];
    toggleFavorite: (id: string) => void;
    openTab: (id: string, path: string, name: string, desc: string, isPreview: boolean, isOrderLocked: boolean) => void;
    navigate: (path: string) => void;
}

const ToolNavItem: React.FC<ToolNavItemProps> = ({ tool, isActive, isCollapsed, favorites, toggleFavorite, openTab, navigate }) => {
    const Icon = tool.icon;
    const isFav = favorites.includes(tool.id);

    return (
        <div
            onClick={(e) => {
                e.preventDefault();
                openTab(tool.id, tool.path, tool.name, tool.description, e.altKey, false);
                navigate(tool.path);
            }}
            className={cn(
                "group relative flex items-center transition-all duration-500 cursor-pointer overflow-hidden",
                isCollapsed
                    ? "w-12 h-12 justify-center rounded-2xl mb-1 hover:scale-105"
                    : "h-10 px-3.5 gap-3 rounded-xl mb-0.5",
                isActive
                    ? "bg-indigo-500 text-white shadow-[0_6px_12px_-4px_rgba(99,102,241,0.4)]"
                    : "hover:bg-foreground/[0.04] dark:hover:bg-white/[0.04] text-foreground-secondary hover:text-foreground"
            )}
            title={isCollapsed ? tool.name : tool.description}
        >
            {/* Left Indicator - Active only */}
            {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-white/60 rounded-r-full" />
            )}

            <div className={cn(
                "shrink-0 flex items-center justify-center transition-all duration-300",
                isCollapsed ? "w-7 h-7" : "w-5 h-5",
                isActive ? "text-white" : tool.color || "text-foreground-muted/60 group-hover:text-indigo-400 group-hover:scale-110"
            )}>
                {Icon && <Icon className={isCollapsed ? "w-6 h-6" : "w-4 h-4"} />}
            </div>

            {!isCollapsed && (
                <>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate font-bold tracking-tight text-[12px]">{tool.name}</span>
                        {!isActive && (
                            <span className="text-[8px] text-foreground-muted/40 font-black uppercase tracking-widest truncate group-hover:text-foreground-muted group-hover:opacity-100 transition-all">
                                {tool.category}
                            </span>
                        )}
                    </div>

                    {/* Favorite Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(tool.id);
                        }}
                        className={cn(
                            "opacity-0 group-hover:opacity-100 p-1 rounded-md transition-all hover:scale-125",
                            isFav ? "opacity-100" : ""
                        )}
                    >
                        <Star className={cn(
                            "w-3.5 h-3.5",
                            isFav ? "fill-amber-400 text-amber-400" : "text-foreground-muted/30"
                        )} />
                    </button>
                </>
            )}

            {/* Collapsed Active Indicator */}
            {isActive && isCollapsed && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3 bg-white/60 rounded-l-full" />
            )}
        </div>
    );
};

const EmptySearch = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-foreground/[0.03] dark:bg-white/[0.03] flex items-center justify-center mb-4 border border-border-glass">
            <Search className="w-8 h-8 text-foreground-muted/20" />
        </div>
        <h4 className="text-xs font-black uppercase tracking-widest text-foreground-muted mb-1">No Results</h4>
        <p className="text-[10px] text-foreground-muted/40 italic">Try searching for something else</p>
    </div>
);

Sidebar.displayName = 'Sidebar';
