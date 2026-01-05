import React from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import { Activity, BarChart2 } from 'lucide-react';

export const StatisticsSection: React.FC = () => {
    const getUsageStats = useDashboardStore(state => state.getUsageStats);
    const getMostUsed = useDashboardStore(state => state.getMostUsed);

    const stats = getUsageStats();
    const mostUsed = getMostUsed(5);

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-[0.16em] uppercase text-foreground-muted">Statistics</h2>
            </div>

            <div className="space-y-3">
                <div className="glass-panel rounded-xl p-4 border border-border-glass/70 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">Total Activity</p>
                            <p className="text-sm font-semibold text-foreground mt-0.5">{stats.totalUsageCount} tool runs</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-muted">Tools Used</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">{stats.totalToolsUsed}</p>
                    </div>
                </div>

                <div className="glass-panel rounded-xl p-4 border border-border-glass/70">
                    <div className="flex items-center gap-2 mb-3">
                        <BarChart2 className="w-4 h-4 text-foreground-muted" />
                        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">Most Used Tools</h3>
                    </div>
                    {mostUsed.length === 0 ? (
                        <p className="text-xs text-foreground-muted italic">Start using tools to see usage statistics here.</p>
                    ) : (
                        <div className="space-y-1">
                            {mostUsed.map(item => (
                                <div key={item.toolId} className="flex items-center justify-between text-xs py-1">
                                    <span className="truncate max-w-[130px]">
                                        {item.toolId}
                                    </span>
                                    <span className="text-foreground-muted">{item.count}×</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};


