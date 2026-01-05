import React, { useState } from 'react';
import { ShieldCheck, Server, HardDrive, Wifi, Search as SearchIcon, Mail, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useSystemCleanerStore } from '../store/systemCleanerStore';
import { formatTimeAgo } from '../utils/formatUtils';
import { cn } from '../../../../utils/cn';
import { toast } from 'sonner';

export const MaintenanceView: React.FC = () => {
    const { platformInfo } = useSystemCleanerStore();
    const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set());
    const [taskHistory, setTaskHistory] = useState<any[]>([]);

    const platform = platformInfo?.platform;

    const windowsTasks = [
        {
            id: 'sfc',
            name: 'System File Checker',
            description: 'Scan and repair corrupted system files',
            category: 'sfc',
            icon: ShieldCheck,
            estimatedTime: '5-10 minutes',
            requiresSudo: true
        },
        {
            id: 'dism',
            name: 'DISM Health Restore',
            description: 'Restore Windows image health',
            category: 'dism',
            icon: Server,
            estimatedTime: '10-15 minutes',
            requiresSudo: true
        },
        {
            id: 'disk-cleanup',
            name: 'Disk Cleanup',
            description: 'Automated disk cleanup using Windows built-in tool',
            category: 'disk-cleanup',
            icon: HardDrive,
            estimatedTime: '2-5 minutes',
            requiresSudo: false
        },
        {
            id: 'dns-flush',
            name: 'Flush DNS Cache',
            description: 'Clear DNS resolver cache',
            category: 'dns-flush',
            icon: Wifi,
            estimatedTime: '< 1 minute',
            requiresSudo: false
        },
        {
            id: 'winsock-reset',
            name: 'Reset Winsock',
            description: 'Reset Windows network stack',
            category: 'winsock-reset',
            icon: Wifi,
            estimatedTime: '< 1 minute',
            requiresSudo: true
        },
        {
            id: 'windows-search-rebuild',
            name: 'Rebuild Windows Search Index',
            description: 'Rebuild Windows Search index for better performance',
            category: 'windows-search-rebuild',
            icon: SearchIcon,
            estimatedTime: '5-10 minutes',
            requiresSudo: true
        }
    ];

    const macosTasks = [
        {
            id: 'spotlight-reindex',
            name: 'Rebuild Spotlight Index',
            description: 'Rebuild macOS Spotlight search index',
            category: 'spotlight-reindex',
            icon: SearchIcon,
            estimatedTime: '10-30 minutes',
            requiresSudo: true
        },
        {
            id: 'disk-permissions',
            name: 'Verify Disk Permissions',
            description: 'Verify disk permissions (limited on macOS Big Sur+)',
            category: 'disk-permissions',
            icon: HardDrive,
            estimatedTime: '2-5 minutes',
            requiresSudo: true
        },
        {
            id: 'dns-flush',
            name: 'Flush DNS Cache',
            description: 'Clear DNS resolver cache',
            category: 'dns-flush',
            icon: Wifi,
            estimatedTime: '< 1 minute',
            requiresSudo: false
        },
        {
            id: 'mail-rebuild',
            name: 'Rebuild Mail Database',
            description: 'Rebuild Mail.app database (requires Mail.app to be closed)',
            category: 'mail-rebuild',
            icon: Mail,
            estimatedTime: '5-10 minutes',
            requiresSudo: false
        }
    ];

    const tasks = platform === 'windows' ? windowsTasks : platform === 'macos' ? macosTasks : [];

    const runTask = async (task: typeof tasks[0]) => {
        if (runningTasks.has(task.id)) return;
        
        setRunningTasks(new Set([...runningTasks, task.id]));
        
        try {
            const result = await (window as any).cleanerAPI.runMaintenance(task);
            
            const historyItem = {
                ...task,
                result,
                timestamp: new Date()
            };
            
            setTaskHistory([historyItem, ...taskHistory].slice(0, 20));
            
            if (result.success) {
                toast.success(`${task.name} completed successfully`);
            } else {
                toast.error(`${task.name} failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error(`Failed to run ${task.name}: ${(error as Error).message}`);
        } finally {
            setRunningTasks(new Set([...runningTasks].filter(id => id !== task.id)));
        }
    };

    const currentTask = [...windowsTasks, ...macosTasks].find(t => runningTasks.has(t.id));
    
    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {runningTasks.size > 0 && currentTask && (
                <LoadingOverlay 
                    progress={100} 
                    title={currentTask.name} 
                    status={`Running ${currentTask.name}...`} 
                />
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Maintenance</h2>
                    <p className="text-sm text-foreground-muted">System repair and upkeep tools for {platform === 'windows' ? 'Windows' : platform === 'macos' ? 'macOS' : 'your system'}</p>
                </div>
            </div>

            <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
                {tasks.map((task) => {
                    const Icon = task.icon;
                    const isRunning = runningTasks.has(task.id);
                    const lastRun = taskHistory.find(h => h.id === task.id);
                    
                    return (
                        <Card key={task.id} className="p-6 space-y-4 border-border-glass bg-white/5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={cn(
                                        "p-3 rounded-xl transition-colors",
                                        isRunning ? "bg-indigo-500/20" : "bg-indigo-500/10"
                                    )}>
                                        <Icon className={cn(
                                            "w-6 h-6",
                                            isRunning ? "text-indigo-400 animate-pulse" : "text-indigo-400"
                                        )} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold">{task.name}</h3>
                                            {task.requiresSudo && (
                                                <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded">
                                                    Admin Required
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-foreground-muted mb-2">{task.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-foreground-muted">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{task.estimatedTime}</span>
                                            </div>
                                            {lastRun && (
                                                <div className={cn(
                                                    "flex items-center gap-1",
                                                    lastRun.result.success ? "text-emerald-400" : "text-red-400"
                                                )}>
                                                    {lastRun.result.success ? (
                                                        <CheckCircle className="w-3 h-3" />
                                                    ) : (
                                                        <XCircle className="w-3 h-3" />
                                                    )}
                                                    <span>
                                                        {lastRun.result.success ? 'Completed' : 'Failed'} {formatTimeAgo(lastRun.timestamp)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {lastRun && lastRun.result.output && (
                                            <div className="mt-2 p-2 bg-white/5 rounded text-xs font-mono text-foreground-muted max-h-20 overflow-auto">
                                                {lastRun.result.output.substring(0, 200)}
                                                {lastRun.result.output.length > 200 && '...'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => runTask(task)}
                                    disabled={isRunning}
                                    loading={isRunning}
                                >
                                    {isRunning ? 'Running...' : 'Run'}
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

