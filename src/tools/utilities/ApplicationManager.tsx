import React, { useState } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { Package, Activity } from 'lucide-react';
import { cn } from '@utils/cn';
import { InstalledAppsTab } from './components/InstalledAppsTab';
import { RunningProcessesTab } from './components/RunningProcessesTab';
import { toast } from 'sonner';
import type { InstalledApp } from '@/types/application-manager';

const ApplicationManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'apps' | 'processes'>('apps');

    const handleUninstall = async (app: InstalledApp) => {
        if (!(window as any).appManagerAPI?.uninstallApp) {
            toast.error('Uninstall API not available');
            return;
        }

        try {
            await (window as any).appManagerAPI.uninstallApp(app);
        } catch (error) {
            throw error;
        }
    };

    const handleKill = async (pid: number) => {
        if (!(window as any).appManagerAPI?.killProcess) {
            toast.error('Kill process API not available');
            return;
        }

        try {
            await (window as any).appManagerAPI.killProcess(pid);
        } catch (error) {
            throw error;
        }
    };

    const tabs = [
        { id: 'apps' as const, name: 'Installed Apps', icon: Package },
        { id: 'processes' as const, name: 'Running Processes', icon: Activity },
    ];

    return (
        <ToolPane
            title="Application Manager"
            description="Manage installed applications and running processes"
        >
            <div className="flex flex-col h-full">
                {/* Tab Navigation */}
                <div className="flex items-center gap-2 border-b border-border-glass mb-4 pb-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                                    isActive
                                        ? "border-indigo-500 text-indigo-400"
                                        : "border-transparent text-foreground-muted hover:text-foreground"
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.name}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="flex-1 min-h-0">
                    {activeTab === 'apps' && (
                        <InstalledAppsTab onUninstall={handleUninstall} />
                    )}
                    {activeTab === 'processes' && (
                        <RunningProcessesTab onKill={handleKill} />
                    )}
                </div>
            </div>
        </ToolPane>
    );
};

export default ApplicationManager;

