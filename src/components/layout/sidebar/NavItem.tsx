import React from 'react';
import { cn } from '@utils/cn';

interface NavItemProps {
    icon: React.ElementType;
    label: string;
    subtitle?: string;
    isActive: boolean;
    onClick: () => void;
    color?: string;
}

export const NavItem: React.FC<NavItemProps> = ({ icon: Icon, label, subtitle, isActive, onClick, color }) => (
    <div
        onClick={onClick}
        className={cn(
            "group relative flex items-center h-11 px-3.5 gap-3 rounded-xl cursor-pointer transition-all duration-300",
            isActive
                ? "bg-indigo-500 text-white shadow-[0_8px_16px_-4px_rgba(99,102,241,0.4)] z-10"
                : "hover:bg-foreground/[0.04] dark:hover:bg-white/[0.04] text-foreground-secondary hover:text-foreground"
        )}
    >
        <div className={cn(
            "w-5 h-5 flex items-center justify-center transition-all duration-300",
            isActive ? "text-white scale-110" : color
        )}>
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex flex-col min-w-0">
            <span className="font-bold text-[12px] leading-none">{label}</span>
            {subtitle && !isActive && <span className="text-[9px] text-foreground-muted/60 font-black uppercase tracking-tighter mt-1">{subtitle}</span>}
        </div>
        {isActive && <div className="absolute right-3 w-1 h-3.5 bg-white/40 rounded-full" />}
    </div>
);
