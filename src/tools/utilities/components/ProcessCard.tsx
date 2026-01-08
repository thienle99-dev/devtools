import React from 'react';
import { Activity, Trash2, AlertTriangle, Users, Cpu, MemoryStick } from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import type { RunningProcess, ProcessGroup } from '@/types/application-manager';
import { ProcessMetrics } from './ProcessMetrics';
import { formatBytes as formatSize } from '@utils/format';

interface ProcessCardProps {
    process: RunningProcess;
    onKill: (pid: number) => void;
    disabled?: boolean;
    isSystemProcess?: boolean;
}

interface ProcessGroupCardProps {
    group: ProcessGroup;
    onKill: (pids: number[]) => void;
    disabled?: boolean;
    isSystemProcess?: boolean;
}

export const ProcessCard: React.FC<ProcessCardProps> = ({ process, onKill, disabled, isSystemProcess }) => {
    return (
        <Card className={cn(
            "p-4 hover:bg-white/5 transition-all",
            isSystemProcess && "border-amber-500/20 bg-amber-500/5"
        )}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                        "p-2.5 rounded-lg shrink-0",
                        isSystemProcess
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-indigo-500/10 text-indigo-400"
                    )}>
                        <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-foreground truncate">{process.name}</h3>
                            {isSystemProcess && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
                                    System
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <ProcessMetrics cpu={process.cpu} memory={process.memoryPercent} />
                            <div className="flex items-center gap-4 text-xs text-foreground-muted">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-medium">PID:</span>
                                    <span className="font-mono">{process.pid}</span>
                                </div>
                                {process.user && (
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-3 h-3" />
                                        <span>{process.user}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <MemoryStick className="w-3 h-3" />
                                    <span>{formatSize(process.memory)}</span>
                                </div>
                            </div>
                            {process.command && (
                                <div className="text-[10px] text-foreground-muted/70 truncate font-mono">
                                    {process.command}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="shrink-0">
                    <Button
                        variant={isSystemProcess ? "outline" : "danger"}
                        size="sm"
                        onClick={() => onKill(process.pid)}
                        disabled={disabled || isSystemProcess}
                        className="text-xs"
                    >
                        {isSystemProcess ? (
                            <>
                                <AlertTriangle className="w-3 h-3 mr-1.5" />
                                Protected
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-3 h-3 mr-1.5" />
                                Kill
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export const ProcessGroupCard: React.FC<ProcessGroupCardProps> = ({ group, onKill, disabled, isSystemProcess }) => {
    const pids = group.processes.map(p => p.pid);

    return (
        <Card className={cn(
            "p-4 hover:bg-white/5 transition-all",
            isSystemProcess && "border-amber-500/20 bg-amber-500/5"
        )}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                        "p-2.5 rounded-lg shrink-0",
                        isSystemProcess
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-indigo-500/10 text-indigo-400"
                    )}>
                        <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-foreground truncate">{group.name}</h3>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">
                                {group.count} {group.count === 1 ? 'process' : 'processes'}
                            </span>
                            {isSystemProcess && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
                                    System
                                </span>
                            )}
                        </div>
                        <div className="space-y-2">
                            <ProcessMetrics cpu={group.totalCpu} memory={group.totalMemoryPercent} />
                            <div className="flex items-center gap-4 text-xs text-foreground-muted">
                                <div className="flex items-center gap-1.5">
                                    <Cpu className="w-3 h-3" />
                                    <span>{group.totalCpu.toFixed(1)}% CPU</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <MemoryStick className="w-3 h-3" />
                                    <span>{formatSize(group.totalMemory)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="shrink-0">
                    <Button
                        variant={isSystemProcess ? "outline" : "danger"}
                        size="sm"
                        onClick={() => onKill(pids)}
                        disabled={disabled || isSystemProcess}
                        className="text-xs"
                    >
                        {isSystemProcess ? (
                            <>
                                <AlertTriangle className="w-3 h-3 mr-1.5" />
                                Protected
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-3 h-3 mr-1.5" />
                                Kill All
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

