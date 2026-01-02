import React from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'light' | 'dark';
    interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className,
    variant = 'default',
    interactive = false
}) => {
    return (
        <div className={cn(
            "rounded-3xl transition-all duration-300",
            variant === 'default' && "glass-panel",
            variant === 'light' && "glass-panel-light",
            variant === 'dark' && "bg-black/60 backdrop-blur-3xl border border-white/5",
            interactive && "hover:border-white/20 hover:translate-y-[-2px] cursor-pointer",
            className
        )}>
            {children}
        </div>
    );
};
