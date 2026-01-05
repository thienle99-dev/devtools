import React, { useMemo } from 'react';
import { CATEGORIES, getToolsByCategory } from '../../tools/registry';
import { useTabStore } from '../../store/tabStore';
import { useNavigate } from 'react-router-dom';
import { useDashboardStore } from '../../store/dashboardStore';
import { cn } from '../../utils/cn';

export const ToolDiscoverySection: React.FC = () => {
    const openTab = useTabStore(state => state.openTab);
    const navigate = useNavigate();
    const getMostUsed = useDashboardStore(state => state.getMostUsed);

    const popularTools = useMemo(() => getMostUsed(6), [getMostUsed]);

    const handleOpenTool = (toolId: string) => {
        const allTools = CATEGORIES.flatMap(c => getToolsByCategory(c.id));
        const tool = allTools.find(t => t.id === toolId);
        if (!tool) return;
        openTab(tool.id, tool.path, tool.name, tool.description, false, false);
        navigate(tool.path);
    };

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-[0.16em] uppercase text-foreground-muted">Tool Discovery</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                {/* Categories */}
                <div className="lg:col-span-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {CATEGORIES.filter(c => !['favorites', 'recent'].includes(c.id)).map(category => {
                            const tools = getToolsByCategory(category.id);
                            if (tools.length === 0) return null;
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-[var(--color-glass-input)]/80 hover:bg-[var(--color-glass-input)] border border-border-glass/70 hover:border-border-glass text-left transition-all group"
                                    onClick={() => {
                                        const tool = tools[0];
                                        openTab(tool.id, tool.path, tool.name, tool.description, false, false);
                                        navigate(tool.path);
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={cn("p-1.5 rounded-lg bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors", category.color ? category.color.replace('text-', 'text-').replace('text-', 'bg-').replace('400', '500/10') : "bg-white/5")}>
                                            <category.icon className={cn("w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity", category.color)} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold tracking-wide text-foreground">{category.name}</p>
                                            <p className="text-[10px] text-foreground-muted mt-0.5">{tools.length} tools</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Popular tools */}
                <div className="glass-panel rounded-xl p-4 border border-border-glass/70 flex flex-col gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">Most Used Tools</h3>
                    <div className="space-y-1.5">
                        {popularTools.length === 0 ? (
                            <p className="text-xs text-foreground-muted italic">Start using tools to see the most popular ones here.</p>
                        ) : popularTools.map(item => {
                            const allTools = CATEGORIES.flatMap(c => getToolsByCategory(c.id));
                            const tool = allTools.find(t => t.id === item.toolId);
                            if (!tool) return null;
                            
                            const category = CATEGORIES.find(c => c.id === tool.category);
                            const colorClass = tool.color || category?.color;

                            return (
                                <button
                                    key={tool.id}
                                    type="button"
                                    onClick={() => handleOpenTool(tool.id)}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs bg-[var(--color-glass-input)]/60 hover:bg-[var(--color-glass-input)] border border-transparent hover:border-border-glass transition-all group"
                                >
                                    <div className="flex items-center gap-2">
                                        {tool.icon && <tool.icon className={cn("w-3.5 h-3.5 opacity-70 group-hover:opacity-100", colorClass)} />}
                                        <span className="font-medium truncate">{tool.name}</span>
                                    </div>
                                    <span className="text-[10px] text-foreground-muted">{item.count} uses</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};


