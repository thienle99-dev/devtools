import { useState, useEffect, useCallback, useRef } from 'react';
import type { RunningProcess, ProcessGroup } from '../../../types/application-manager';

export const useRunningProcesses = (interval: number = 3000, groupBy: boolean = true) => {
    const [processes, setProcesses] = useState<RunningProcess[]>([]);
    const [groups, setGroups] = useState<ProcessGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchProcesses = useCallback(async (isInitial = false) => {
        if (!window.appManagerAPI) {
            setError('Application Manager API not available');
            setLoading(false);
            return;
        }

        if (isInitial) setLoading(true);
        setError(null);
        try {
            const data = await window.appManagerAPI.getRunningProcesses();
            setProcesses(data);

            if (groupBy) {
                // Group processes by name
                const grouped = new Map<string, RunningProcess[]>();
                data.forEach(proc => {
                    const existing = grouped.get(proc.name) || [];
                    grouped.set(proc.name, [...existing, proc]);
                });

                const groupsArray: ProcessGroup[] = Array.from(grouped.entries()).map(([name, procs]) => {
                    const totalCpu = procs.reduce((sum, p) => sum + p.cpu, 0);
                    const totalMemory = procs.reduce((sum, p) => sum + p.memory, 0);
                    const totalMemoryPercent = procs.reduce((sum, p) => sum + p.memoryPercent, 0);

                    return {
                        name,
                        processes: procs,
                        totalCpu,
                        totalMemory,
                        totalMemoryPercent,
                        count: procs.length,
                    };
                });

                // Sort by CPU usage
                groupsArray.sort((a, b) => b.totalCpu - a.totalCpu);
                setGroups(groupsArray);
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [groupBy]);

    useEffect(() => {
        fetchProcesses(true);

        if (interval > 0) {
            intervalRef.current = setInterval(() => fetchProcesses(false), interval);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [fetchProcesses, interval]);

    return {
        processes,
        groups,
        loading,
        error,
        refresh: () => fetchProcesses(true),
    };
};

