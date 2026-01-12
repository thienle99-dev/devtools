import React from 'react';
import { cn } from '@utils/cn';

interface ProcessMetricsProps {
    cpu: number;
    memory: number;
}

export const ProcessMetrics: React.FC<ProcessMetricsProps> = ({ cpu, memory }) => {
    const getCpuColor = (value: number) => {
        if (value >= 70) return 'bg-red-500';
        if (value >= 40) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getMemoryColor = (value: number) => {
        if (value >= 80) return 'bg-red-500';
        if (value >= 50) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="space-y-2">
            <div>
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-foreground-muted">CPU</span>
                    <span className="font-mono font-semibold text-foreground">{cpu.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full transition-all duration-300", getCpuColor(cpu))}
                        style={{ width: `${Math.min(cpu, 100)}%` }}
                    />
                </div>
            </div>
            <div>
                <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-foreground-muted">Memory</span>
                    <span className="font-mono font-semibold text-foreground">{memory.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className={cn("h-full transition-all duration-300", getMemoryColor(memory))}
                        style={{ width: `${Math.min(memory, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

