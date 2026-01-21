import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@utils/cn';

interface TimerDelayPickerProps {
    value: number;
    options: number[];
    onChange: (value: number) => void;
}

export const TimerDelayPicker: React.FC<TimerDelayPickerProps> = ({ value, options, onChange }) => (
    <div className="space-y-3">
        <div className="flex items-center gap-2">
            <Clock
                className="w-4 h-4"
                style={{ color: 'var(--color-text-muted)' }}
            />
            <h3
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
            >
                Timer Delay
            </h3>
        </div>
        <div className="flex items-center gap-3">
            {options.map((seconds) => (
                <button
                    key={seconds}
                    onClick={() => onChange(seconds)}
                    className={cn(
                        "flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2",
                        value === seconds
                            ? "bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border-indigo-500 shadow-lg shadow-indigo-500/20"
                            : "bg-glass-panel border-border-glass hover:border-indigo-500/30 hover:bg-glass-panel-light"
                    )}
                    style={{
                        color: value === seconds
                            ? '#818cf8'
                            : 'var(--color-text-secondary)'
                    }}
                >
                    {seconds === 0 ? 'Instant' : `${seconds}s`}
                </button>
            ))}
        </div>
    </div>
);

TimerDelayPicker.displayName = 'TimerDelayPicker';
