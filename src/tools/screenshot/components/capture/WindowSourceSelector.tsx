import React from 'react';
import { Square } from 'lucide-react';
import { cn } from '@utils/cn';
import type { CaptureSource } from '../../types';

interface WindowSourceSelectorProps {
    sources: CaptureSource[];
    selectedSource: string | null;
    isLoading: boolean;
    onSelect: (id: string) => void;
    hasElectronAPI: boolean;
}

export const WindowSourceSelector: React.FC<WindowSourceSelectorProps> = ({
    sources,
    selectedSource,
    isLoading,
    onSelect,
    hasElectronAPI,
}) => {
    if (!hasElectronAPI) {
        return (
            <div className="space-y-3">
                <h3
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    <Square className="w-4 h-4 inline mr-2" />
                    Select Window
                </h3>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-2 border-indigo-500/20 text-center">
                    <p
                        className="text-sm font-medium"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        💡 You'll select the window after clicking Capture
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3
                className="text-sm font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-text-muted)' }}
            >
                <Square className="w-4 h-4 inline mr-2" />
                Select Window
            </h3>
            {isLoading ? (
                <div
                    className="text-center py-12 text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                    <p>Loading windows...</p>
                </div>
            ) : sources.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    {sources.map((source) => (
                        <button
                            key={source.id}
                            onClick={() => onSelect(source.id)}
                            className={cn(
                                "group relative flex flex-col gap-3 p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02]",
                                selectedSource === source.id
                                    ? "border-indigo-500 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 shadow-lg shadow-indigo-500/20"
                                    : "border-border-glass bg-glass-panel hover:border-indigo-500/50"
                            )}
                        >
                            {selectedSource === source.id && (
                                <div className="absolute top-3 right-3 w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
                            )}

                            <img
                                src={source.thumbnail}
                                alt={source.name}
                                className="w-full h-28 object-cover rounded-xl border border-border-glass"
                            />
                            <span
                                className="text-sm font-medium text-center truncate w-full"
                                style={{
                                    color: selectedSource === source.id
                                        ? 'var(--color-text-primary)'
                                        : 'var(--color-text-secondary)'
                                }}
                            >
                                {source.name}
                            </span>
                        </button>
                    ))}
                </div>
            ) : (
                <div
                    className="text-center py-12 text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    No windows available
                </div>
            )}
        </div>
    );
};

WindowSourceSelector.displayName = 'WindowSourceSelector';
