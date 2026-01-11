import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Loader2, Activity, AlertCircle, Group } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Switch } from '../../../components/ui/Switch';
import { ProcessCard, ProcessGroupCard } from './ProcessCard';
import { useRunningProcesses } from '../hooks/useRunningProcesses';
import { cn } from '../../../utils/cn';
import { toast } from 'sonner';

import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

interface RunningProcessesTabProps {
    onKill: (pid: number) => Promise<void>;
}

const SYSTEM_PROCESS_NAMES = [
    'kernel_task', 'launchd', 'WindowServer', 'com.apple.',
    'svchost', 'explorer', 'dwm', 'csrss', 'winlogon',
    'system', 'smss', 'lsass', 'services',
];

const isSystemProcess = (name: string): boolean => {
    return SYSTEM_PROCESS_NAMES.some(pattern => name.toLowerCase().includes(pattern.toLowerCase()));
};

export const RunningProcessesTab: React.FC<RunningProcessesTabProps> = ({ onKill }) => {
    const [groupBy, setGroupBy] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [killing, setKilling] = useState<Set<number>>(new Set());
    const [confirmKill, setConfirmKill] = useState<{ pid: number; name: string } | null>(null);
    const [confirmKillGroup, setConfirmKillGroup] = useState<{ pids: number[]; name: string; count: number } | null>(null);
    const { processes, groups, loading, error, refresh } = useRunningProcesses(3000, groupBy);

    const filteredProcesses = useMemo(() => {
        if (!searchQuery.trim()) return processes;
        const query = searchQuery.toLowerCase();
        return processes.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.command?.toLowerCase().includes(query) ||
            p.user?.toLowerCase().includes(query)
        );
    }, [processes, searchQuery]);

    const filteredGroups = useMemo(() => {
        if (!searchQuery.trim()) return groups;
        const query = searchQuery.toLowerCase();
        return groups.filter(g =>
            g.name.toLowerCase().includes(query) ||
            g.processes.some(p => p.command?.toLowerCase().includes(query))
        );
    }, [groups, searchQuery]);

    const handleKill = async (pid: number) => {
        const process = processes.find(p => p.pid === pid);
        if (!process) return;

        if (isSystemProcess(process.name)) {
            toast.warning('System processes cannot be killed');
            return;
        }

        setConfirmKill({ pid, name: process.name });
    };

    const executeKill = async () => {
        if (!confirmKill) return;
        const { pid, name } = confirmKill;
        setConfirmKill(null);

        setKilling(prev => new Set(prev).add(pid));
        try {
            await onKill(pid);
            toast.success(`Successfully killed ${name}`);
            await refresh();
        } catch (error) {
            toast.error(`Failed to kill ${name}: ${(error as Error).message}`);
        } finally {
            setKilling(prev => {
                const next = new Set(prev);
                next.delete(pid);
                return next;
            });
        }
    };

    const handleKillGroup = async (pids: number[]) => {
        const group = groups.find(g => g.processes.some(p => pids.includes(p.pid)));
        if (!group) return;

        if (isSystemProcess(group.name)) {
            toast.warning('System processes cannot be killed');
            return;
        }

        setConfirmKillGroup({ pids, name: group.name, count: group.count });
    };

    const executeKillGroup = async () => {
        if (!confirmKillGroup) return;
        const { pids, name, count } = confirmKillGroup;
        setConfirmKillGroup(null);

        setKilling(prev => {
            const next = new Set(prev);
            pids.forEach(pid => next.add(pid));
            return next;
        });

        try {
            await Promise.all(pids.map(pid => onKill(pid)));
            toast.success(`Successfully killed ${count} process(es) of ${name}`);
            await refresh();
        } catch (error) {
            toast.error(`Failed to kill processes: ${(error as Error).message}`);
        } finally {
            setKilling(prev => {
                const next = new Set(prev);
                pids.forEach(pid => next.delete(pid));
                return next;
            });
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Processes</h3>
                <p className="text-sm text-foreground-muted mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={refresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search and Options Bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <Input
                        type="text"
                        placeholder="Search processes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-glass-input)] rounded-lg border border-border-glass">
                    <Group className="w-4 h-4 text-foreground-muted" />
                    <span className="text-xs text-foreground-muted">Group</span>
                    <Switch
                        checked={groupBy}
                        onChange={(e) => setGroupBy((e.target as HTMLInputElement).checked)}
                        className="ml-2"
                    />
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={refresh}
                    disabled={loading}
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
            </div>

            {/* Loading State */}
            {loading && processes.length === 0 && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
            )}

            {/* Processes List */}
            {!loading && (
                <>
                    {groupBy ? (
                        <>
                            {filteredGroups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Activity className="w-12 h-12 text-foreground-muted mb-4" />
                                    <h3 className="text-lg font-semibold text-foreground mb-2">No Processes Found</h3>
                                    <p className="text-sm text-foreground-muted">
                                        {searchQuery ? 'Try adjusting your search query' : 'No processes running'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {filteredGroups.map((group) => (
                                        <ProcessGroupCard
                                            key={group.name}
                                            group={group}
                                            onKill={handleKillGroup}
                                            disabled={group.processes.some(p => killing.has(p.pid))}
                                            isSystemProcess={isSystemProcess(group.name)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {filteredProcesses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Activity className="w-12 h-12 text-foreground-muted mb-4" />
                                    <h3 className="text-lg font-semibold text-foreground mb-2">No Processes Found</h3>
                                    <p className="text-sm text-foreground-muted">
                                        {searchQuery ? 'Try adjusting your search query' : 'No processes running'}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {filteredProcesses.map((process) => (
                                        <ProcessCard
                                            key={process.pid}
                                            process={process}
                                            onKill={handleKill}
                                            disabled={killing.has(process.pid)}
                                            isSystemProcess={isSystemProcess(process.name)}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            <ConfirmationModal
                isOpen={!!confirmKill}
                onClose={() => setConfirmKill(null)}
                onConfirm={executeKill}
                title="Kill Process"
                message={`Are you sure you want to end "${confirmKill?.name}" (PID: ${confirmKill?.pid})? This may cause data loss.`}
                confirmText="Kill Process"
            />

            <ConfirmationModal
                isOpen={!!confirmKillGroup}
                onClose={() => setConfirmKillGroup(null)}
                onConfirm={executeKillGroup}
                title="Kill Process Group"
                message={`Are you sure you want to kill all ${confirmKillGroup?.count} process(es) of "${confirmKillGroup?.name}"?`}
                confirmText="Kill All"
            />
        </div>
    );
};

