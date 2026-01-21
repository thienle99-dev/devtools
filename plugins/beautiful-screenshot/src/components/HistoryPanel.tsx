import React from 'react';
import { useXnapperStore } from '../store/xnapperStore';
import { format } from 'date-fns';
import { Clock, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';

export const HistoryPanel: React.FC = () => {
    const {
        history,
        currentScreenshot,
        setCurrentScreenshot,
        removeFromHistory,
        clearHistory,
        setCanvasData,
        clearRedactionAreas
    } = useXnapperStore();

    const handleRestore = (item: typeof history[0]) => {
        // Restore the screenshot
        setCurrentScreenshot(item);

        // Reset annotations and redactions for the new session
        // (We assume history only stores the raw capture, not the edit state)
        setCanvasData(null);
        clearRedactionAreas();

        // We might want to keep background settings as "user preferences"
    };

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-foreground-muted p-6">
                <Clock className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">No history yet</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-glass-panel">
            <div className="p-4 border-b border-border-glass flex items-center justify-between">
                <h3 className="font-semibold text-sm">History ({history.length})</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-xs text-red-400 hover:text-red-300 h-7"
                >
                    Clear All
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {history.map((item) => (
                    <div
                        key={item.id}
                        className={cn(
                            "group relative flex gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-white/5",
                            currentScreenshot?.id === item.id
                                ? "border-indigo-500 bg-indigo-500/10"
                                : "border-border-glass bg-glass-subtle"
                        )}
                        onClick={() => handleRestore(item)}
                    >
                        {/* Thumbnail */}
                        <div className="relative w-20 h-20 bg-black/20 rounded flex-shrink-0 overflow-hidden border border-white/10">
                            {item.dataUrl ? (
                                <img
                                    src={item.dataUrl}
                                    alt="Thumbnail"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 opacity-50" />
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                                <span className="text-sm font-medium truncate pr-2">
                                    {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromHistory(item.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="text-xs text-foreground-muted mt-1">
                                {item.width} × {item.height} px
                            </div>
                            <div className="text-xs text-foreground-muted mt-0.5 uppercase">
                                {item.format}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
