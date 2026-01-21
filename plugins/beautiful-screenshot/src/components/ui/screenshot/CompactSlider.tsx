import React from 'react';
import { cn } from '@utils/cn';

interface CompactSliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    unit?: string;
    color?: 'indigo' | 'blue' | 'amber' | 'pink';
}

/**
 * Compact slider component with label, number input, and range slider
 * Features gradient progress bar and animated thumb
 */
export const CompactSlider: React.FC<CompactSliderProps> = ({ 
    label, 
    value, 
    onChange, 
    min, 
    max, 
    unit = 'px', 
    color = 'indigo' 
}) => {
    const colorClasses: Record<string, string> = {
        indigo: 'from-indigo-500 to-purple-500 border-indigo-500',
        blue: 'from-blue-500 to-cyan-500 border-blue-500',
        amber: 'from-amber-500 to-orange-500 border-amber-500',
        pink: 'from-pink-500 to-rose-500 border-pink-500',
    };

    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground-muted">{label}</label>
                <div className="flex items-center gap-1">
                    <input
                        type="number"
                        min={min}
                        max={max}
                        value={value}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="w-12 px-1.5 py-0.5 text-xs text-center bg-background/60 border border-border-glass rounded text-foreground-primary focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-foreground-tertiary w-4">{unit}</span>
                </div>
            </div>
            <div className="relative h-1.5 group">
                <div className="absolute inset-0 bg-background/60 rounded-full overflow-hidden border border-border-glass/50">
                    <div
                        className={cn("h-full bg-gradient-to-r transition-all duration-100", colorClasses[color]?.split(' ').slice(0, 2).join(' '))}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                />
                <div
                    className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 rounded-full shadow-sm pointer-events-none transition-all duration-100 group-hover:scale-110",
                        colorClasses[color]?.split(' ').slice(2).join(' ')
                    )}
                    style={{ left: `calc(${percentage}% - 6px)` }}
                />
            </div>
        </div>
    );
};
