import React, { useMemo } from 'react';
import { useToolStore } from '../../store/toolStore';
import { useTabStore } from '../../store/tabStore';
import { getToolById } from '../../tools/registry';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, Plus, Settings } from 'lucide-react';

export const QuickAccessSection: React.FC = () => {
    const history = useToolStore(state => state.history);
    const favorites = useToolStore(state => state.favorites);
    const toggleFavorite = useToolStore(state => state.toggleFavorite);
    const openTab = useTabStore(state => state.openTab);
    const navigate = useNavigate();

    const recentTools = useMemo(() => {
        const seen = new Set<string>();
        const result: ReturnType<typeof getToolById>[] = [];
        for (const id of history) {
            if (seen.has(id)) continue;
            const tool = getToolById(id);
            if (tool) {
                seen.add(id);
                result.push(tool);
            }
            if (result.length >= 6) break;
        }
        return result;
    }, [history]);

    const favoriteTools = useMemo(() => {
        return favorites
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
                    </div>
                    <div className="space-y-1.5">
                        {recentTools.length === 0 ? (
                            <p className="text-xs text-foreground-muted italic">No recent tools yet. Start by using any tool from the sidebar.</p>
                        ) : recentTools.map(tool => (
                            <button
                                key={tool.id}
                                type="button"
                                onClick={() => handleOpenTool(tool.id)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-[var(--color-glass-input)]/60 hover:bg-[var(--color-glass-input)] border border-transparent hover:border-border-glass transition-all group"
                            >
                                <div className="flex items-center gap-2">
                                    {tool.icon && <tool.icon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />}
                                    <span className="font-medium truncate">{tool.name}</span>
                                </div>
                                <span className="text-[10px] text-foreground-muted truncate max-w-[120px] group-hover:text-foreground-secondary">
                                    {tool.description}
                                </span>
                            </button>
                        ))}
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
                    <div className="space-y-1.5">
                        {favoriteTools.length === 0 ? (
                            <p className="text-xs text-foreground-muted italic">Mark tools as favorites from the sidebar to see them here.</p>
                        ) : favoriteTools.map(tool => (
                            <button
                                key={tool.id}
                                type="button"
                                onClick={() => handleOpenTool(tool.id)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-[var(--color-glass-input)]/60 hover:bg-[var(--color-glass-input)] border border-transparent hover:border-border-glass transition-all group"
                            >
                                <div className="flex items-center gap-2">
                                    {tool.icon && <tool.icon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />}
                                    <span className="font-medium truncate">{tool.name}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFavorite(tool.id);
                                    }}
                                    className="ml-2 text-amber-400 hover:text-amber-300"
                                    aria-label="Toggle favorite"
                                >
                                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                                </button>
                            </button>
                        ))}
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


