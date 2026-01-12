import React from 'react';
import { cn } from '@utils/cn';

interface SliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    className?: string;
}

export const Slider: React.FC<SliderProps> = ({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    unit = '',
    className
}) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground-secondary">
                    {label}
                </label>
                <span className="text-xs text-foreground-muted font-mono">
                    {value}{unit}
                </span>
            </div>
            <div className="relative">
                {/* Track */}
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    {/* Progress */}
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                {/* Input */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {/* Thumb */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full shadow-lg pointer-events-none transition-all duration-150"
                    style={{ left: `calc(${percentage}% - 8px)` }}
                />
            </div>
        </div>
    );
};
