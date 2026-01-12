import React from 'react';
import { Lightbulb, Keyboard, Zap, Sparkles } from 'lucide-react';
import { cn } from '@utils/cn';

interface Tip {
    icon: React.ElementType;
    title: string;
    description: string;
    shortcut?: string;
    color: string;
}

const TIPS: Tip[] = [
    {
        icon: Keyboard,
        title: "Quick Open",
        description: "Open the command palette from anywhere in the app to quickly find tools.",
        shortcut: "Cmd + K",
        color: "text-indigo-400"
    },
    {
        icon: Zap,
        title: "Fast Switching",
        description: "Switch between your open tabs instantly without using the mouse.",
        shortcut: "Ctrl + Tab",
        color: "text-amber-400"
    },
    {
        icon: Sparkles,
        title: "Sidebar Toggle",
        description: "Maximize your workspace by collapsing the sidebar when you don't need it.",
        shortcut: "Cmd + B",
        color: "text-emerald-400"
    }
];

export const TipsSection: React.FC = () => {
    return (
        <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground-secondary flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Pro Tips
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TIPS.map((tip, idx) => (
                    <div 
                        key={idx}
                        className="p-4 rounded-2xl bg-[var(--color-glass-panel)] border border-border-glass hover:border-white/10 transition-all group"
                    >
                        <div className={cn("mb-3 p-2 rounded-lg bg-white/5 inline-block", tip.color)}>
                            <tip.icon className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground mb-1">{tip.title}</h4>
                        <p className="text-[12px] text-foreground-muted leading-relaxed">
                            {tip.description}
                        </p>
                        {tip.shortcut && (
                            <div className="mt-3 flex items-center gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wide">Shortcut</span>
                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-mono text-foreground-secondary">
                                    {tip.shortcut}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
