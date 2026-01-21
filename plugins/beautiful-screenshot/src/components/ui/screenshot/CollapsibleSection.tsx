import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@utils/cn';

interface CollapsibleSectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: React.ReactNode;
    iconBg?: string;
}

/**
 * Collapsible section component with icon, title, and expandable content
 * Used in screenshot tool design panels
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
    icon, 
    title, 
    children, 
    defaultOpen = true, 
    badge, 
    iconBg = 'from-indigo-500/20 to-purple-500/20' 
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-border-glass/50 rounded-xl overflow-hidden bg-glass-subtle/30">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
            >
                <div className={cn(
                    "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0",
                    iconBg
                )}>
                    {icon}
                </div>
                <span className="text-sm font-semibold text-foreground flex-1 text-left">{title}</span>
                {badge}
                <ChevronDown className={cn(
                    "w-4 h-4 text-foreground-muted transition-transform duration-200",
                    !isOpen && "-rotate-90"
                )} />
            </button>
            <div className={cn(
                "overflow-hidden transition-all duration-200",
                isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
            )}>
                <div className="p-3 pt-0">
                    {children}
                </div>
            </div>
        </div>
    );
};
