import React from 'react';
import { QuickAccessSection } from './dashboard/QuickAccessSection';
import { ToolDiscoverySection } from './dashboard/ToolDiscoverySection';
import { StatisticsSection } from './dashboard/StatisticsSection';
import { TipsSection } from './dashboard/TipsSection';


export const Dashboard: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-8 pt-6 pb-4 border-b border-border-glass/60 bg-[var(--color-glass-panel)]/60 backdrop-blur-xl flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-xs text-foreground-muted mt-1 uppercase tracking-[0.18em]">Overview · Shortcuts · Insights</p>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6 space-y-8 custom-scrollbar">
                <QuickAccessSection />
                <TipsSection />
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                    <div className="xl:col-span-2 space-y-6">
                        <ToolDiscoverySection />
                    </div>
                    <div className="space-y-6">
                        <StatisticsSection />
                    </div>
                </div>
            </div>
        </div>
    );
};


