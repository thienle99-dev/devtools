import React from 'react';
import { format } from 'date-fns';
import { Clock, Square } from 'lucide-react';
import type { Screenshot } from '../../../../store/xnapperStore';

interface RecentHistoryGridProps {
    history: Screenshot[];
    onSelect: (item: Screenshot) => void;
}

export const RecentHistoryGrid: React.FC<RecentHistoryGridProps> = ({ history, onSelect }) => {
    if (history.length === 0) return null;

    return (
        <div className="pt-8 space-y-4">
            <div className="flex items-center justify-between">
                <h3
                    className="text-sm font-bold uppercase tracking-wider flex items-center gap-2"
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    <Clock className="w-4 h-4" />
                    Recent Captures
                </h3>
                <span
                    className="text-xs font-mono px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20"
                    style={{ color: '#818cf8' }}
                >
                    {history.length} total
                </span>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {history.slice(0, 4).map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className="group relative aspect-video bg-glass-panel rounded-2xl overflow-hidden border-2 border-border-glass hover:border-indigo-500 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20"
                    >
                        {item.dataUrl ? (
                            <>
                                <img
                                    src={item.dataUrl}
                                    alt="Recent capture"
                                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                    <span className="text-xs text-white font-bold truncate block">
                                        {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Square
                                    className="w-8 h-8"
                                    style={{ color: 'var(--color-text-muted)', opacity: 0.3 }}
                                />
                            </div>
                        )}

                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <div className="w-0 h-0 border-l-8 border-l-white border-y-6 border-y-transparent ml-1" />
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

RecentHistoryGrid.displayName = 'RecentHistoryGrid';
