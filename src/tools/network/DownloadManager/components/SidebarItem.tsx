import React from 'react';
import { cn } from '@utils/cn';

interface SidebarItemProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    active: boolean;
    onClick: () => void;
    count?: number;
    color?: string;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick, count, color }) => (
    <button
        onClick={onClick}
        className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black transition-all duration-500 group relative overflow-hidden",
            active
                ? "bg-blue-600/10 dark:bg-blue-500/10 text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)] border border-blue-500/20"
                : "text-foreground-tertiary hover:bg-white/5 hover:text-foreground-secondary border border-transparent"
        )}
    >
        {active && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-blue-500 rounded-r-full shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
        )}
        <Icon
            className={cn(
                "w-4 h-4 transition-all duration-500",
                active ? (color || "text-blue-500") : "text-foreground-tertiary group-hover:scale-110",
                active && "scale-125 rotate-[5deg]"
            )}
        />
        <span className="uppercase tracking-widest">{label}</span>
        {count !== undefined && (
            <span
                className={cn(
                    "ml-auto px-2 py-0.5 rounded-lg text-[9px] font-black tabular-nums transition-all border",
                    active
                        ? "bg-blue-500 text-white shadow-lg border-blue-400/50"
                        : "bg-white/5 text-foreground-tertiary border-border-glass opacity-40 group-hover:opacity-100"
                )}
            >
                {count}
            </span>
        )}
    </button>
);

SidebarItem.displayName = 'SidebarItem';
