import React from 'react';
import { Monitor, Square, MousePointer2, Globe, Upload } from 'lucide-react';
import { cn } from '@utils/cn';
import type { CaptureMode } from '../../types';

interface CaptureModeSelectorProps {
    mode: CaptureMode | 'upload';
    onChange: (mode: CaptureMode | 'upload') => void;
}

const CAPTURE_MODES: Array<{ mode: CaptureMode | 'upload'; icon: React.ComponentType<any>; label: string; description: string }> = [
    {
        mode: 'fullscreen',
        icon: Monitor,
        label: 'Full Screen',
        description: 'Capture entire screen',
    },
    {
        mode: 'window',
        icon: Square,
        label: 'Window',
        description: 'Capture a specific window',
    },
    {
        mode: 'area',
        icon: MousePointer2,
        label: 'Area',
        description: 'Select area to capture',
    },
    {
        mode: 'url',
        icon: Globe,
        label: 'Web Page',
        description: 'Capture full scrolling page',
    },
    {
        mode: 'upload',
        icon: Upload,
        label: 'Upload',
        description: 'Import image file',
    },
];

export const CaptureModeSelector: React.FC<CaptureModeSelectorProps> = ({ mode, onChange }) => (
    <div>
        <h3
            className="text-sm font-bold uppercase tracking-wider mb-4"
            style={{ color: 'var(--color-text-muted)' }}
        >
            Capture Mode
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {CAPTURE_MODES.map(({ mode: option, icon: Icon, label, description }) => (
                <button
                    key={option}
                    onClick={() => onChange(option)}
                    className={cn(
                        "group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300",
                        "hover:scale-[1.02] hover:shadow-lg",
                        mode === option
                            ? "border-indigo-500 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 shadow-lg shadow-indigo-500/20"
                            : "border-border-glass bg-glass-panel hover:border-indigo-500/50 hover:bg-glass-panel-light"
                    )}
                >
                    {mode === option && (
                        <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                    <div className={cn(
                        "relative p-4 rounded-2xl transition-all duration-300",
                        mode === option
                            ? "bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
                            : "bg-glass-panel group-hover:bg-indigo-500/10"
                    )}>
                        {mode === option && (
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-xl opacity-30 animate-pulse" />
                        )}
                        <Icon className={cn(
                            "w-8 h-8 relative z-10 transition-colors duration-300",
                            mode === option ? "text-white" : "text-indigo-400 group-hover:text-indigo-500"
                        )} />
                    </div>
                    <div className="text-center space-y-1">
                        <div
                            className="font-bold text-base"
                            style={{
                                color: mode === option
                                    ? 'var(--color-text-primary)'
                                    : 'var(--color-text-secondary)'
                            }}
                        >
                            {label}
                        </div>
                        <div
                            className="text-xs"
                            style={{ color: 'var(--color-text-muted)' }}
                        >
                            {description}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    </div>
);

CaptureModeSelector.displayName = 'CaptureModeSelector';
