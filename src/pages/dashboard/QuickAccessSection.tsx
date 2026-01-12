import React, { useMemo } from 'react';
import { useToolStore } from '../../store/toolStore';
import { useTabStore } from '../../store/tabStore';
import { getToolById, CATEGORIES } from '../../tools/registry';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Plus, Settings } from 'lucide-react';
import { cn } from '../../utils/cn';

export const QuickAccessSection: React.FC = () => {
    const history = useToolStore(state => state.history);
    const clearHistory = useToolStore(state => state.clearHistory);
    const favorites = useToolStore(state => state.favorites);
    const toggleFavorite = useToolStore(state => state.toggleFavorite);
    const openTab = useTabStore(state => state.openTab);
    const navigate = useNavigate();

    const recentTools = useMemo(() => {
        const result: ReturnType<typeof getToolById>[] = [];
        const seen = new Set<string>();
        
        for (const item of history) {
            // Deduplicate and exclude Dashboard itself
            if (seen.has(item.id) || item.id === 'dashboard') continue;
            
            const tool = getToolById(item.id);
            if (tool) {
                result.push(tool);
                seen.add(item.id);
            }
            if (result.length >= 6) break;
        }
        return result;
    }, [history]);

    const favoriteTools = useMemo(() => {
        // Deduplicate favorites
        const uniqueFavorites = Array.from(new Set(favorites));
        return uniqueFavorites
            .map(id => getToolById(id))
            .filter((t): t is NonNullable<ReturnType<typeof getToolById>> => Boolean(t));
    }, [favorites]);

    const handleOpenTool = (toolId: string) => {
        const tool = getToolById(toolId);
        if (!tool) return;
        openTab(tool.id, tool.path, tool.name, tool.description, false, false);
        navigate(tool.path);
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-[0.16em] uppercase text-foreground-muted">Quick Access</h2>
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                    <span className="hidden sm:inline">Tips:</span>
                    <span>⌘K to search</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Tools */}
                <div className="glass-panel rounded-xl p-4 border border-border-glass/70 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Recent Tools</span>
                        </div>
                        {history.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="text-[10px] text-foreground-muted hover:text-red-400 transition-colors uppercase font-bold tracking-wider"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                        {recentTools.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-4">
                                <p className="text-[11px] text-foreground-muted italic leading-relaxed">No recent tools yet. Start by using any tool from the sidebar.</p>
                            </div>
                        ) : recentTools.map(tool => {
                            if (!tool) return null;
                            const category = CATEGORIES.find(c => c.id === tool.category);
                            const colorClass = tool.color || category?.color;
                            return (
                                <button
                                    key={tool.id}
                                    type="button"
                                    onClick={() => handleOpenTool(tool.id)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-[var(--color-glass-input)]/40 hover:bg-[var(--color-glass-input)]/80 border border-transparent hover:border-border-glass/50 transition-all group"
                                >
                                    <div className="flex items-center gap-2">
                                        {tool.icon && <tool.icon className={cn("w-3.5 h-3.5 opacity-70 group-hover:opacity-100", colorClass)} />}
                                        <span className="font-semibold truncate">{tool.name}</span>
                                    </div>
                                    <span className="text-[9px] text-foreground-muted truncate ml-4 group-hover:text-foreground-secondary opacity-60">
                                        {tool.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Favorites */}
                <div className="glass-panel rounded-xl p-4 border border-border-glass/70 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                            <Star className="w-3.5 h-3.5" />
                            <span>Favorites</span>
                        </div>
                    </div>
                    <div className="space-y-1.5 flex-1">
                        {favoriteTools.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-4">
                                <p className="text-[11px] text-foreground-muted italic leading-relaxed">Mark tools as favorites from the sidebar to see them here.</p>
                            </div>
                        ) : favoriteTools.map(tool => {
                            if (!tool) return null;
                            const category = CATEGORIES.find(c => c.id === tool.category);
                            const colorClass = tool.color || category?.color;
                            return (
                                <div
                                    key={tool.id}
                                    onClick={() => handleOpenTool(tool.id)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-[var(--color-glass-input)]/40 hover:bg-[var(--color-glass-input)]/80 border border-transparent hover:border-border-glass/50 transition-all group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        {tool.icon && <tool.icon className={cn("w-3.5 h-3.5 opacity-70 group-hover:opacity-100", colorClass)} />}
                                        <span className="font-semibold truncate">{tool.name}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavorite(tool.id);
                                        }}
                                        className="ml-2 text-amber-400 hover:text-amber-300 transition-transform hover:scale-110 active:scale-90"
                                        aria-label="Toggle favorite"
                                    >
                                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-panel rounded-xl p-4 border border-border-glass/70 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
                            <Plus className="w-3.5 h-3.5" />
                            <span>Quick Actions</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                            type="button"
                            onClick={() => navigate('/settings')}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-glass-input)]/60 hover:bg-[var(--color-glass-input)] border border-transparent hover:border-border-glass transition-all"
                        >
                            <Settings className="w-3.5 h-3.5" />
                            <span className="truncate">Open Settings</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/clipboard-manager')}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-glass-input)]/60 hover:bg-[var(--color-glass-input)] border border-transparent hover:border-border-glass transition-all"
                        >
                            <span className="text-xs font-semibold">📋</span>
                            <span className="truncate">Clipboard Manager</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/stats-monitor')}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-glass-input)]/60 hover:bg-[var(--color-glass-input)] border border-transparent hover:border-border-glass transition-all"
                        >
                            <span className="text-xs font-semibold">📈</span>
                            <span className="truncate">Stats Monitor</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/system-cleaner')}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-glass-input)]/60 hover:bg-[var(--color-glass-input)] border border-transparent hover:border-border-glass transition-all"
                        >
                            <span className="text-xs font-semibold">🧹</span>
                            <span className="truncate">System Cleaner</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};


