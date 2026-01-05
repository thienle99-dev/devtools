import React from 'react';
import { X, TrendingUp, Copy, Calendar, FileText, Image as ImageIcon, Link as LinkIcon, File } from 'lucide-react';
import { useClipboardStore } from '../../../store/clipboardStore';
import { Button } from '../../../components/ui/Button';

interface ClipboardStatisticsProps {
    onClose: () => void;
}

export const ClipboardStatistics: React.FC<ClipboardStatisticsProps> = ({ onClose }) => {
    const getStatistics = useClipboardStore((state) => state.getStatistics);
    const stats = getStatistics();

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'image':
                return <ImageIcon className="w-4 h-4" />;
            case 'link':
                return <LinkIcon className="w-4 h-4" />;
            case 'file':
                return <File className="w-4 h-4" />;
            default:
                return <FileText className="w-4 h-4" />;
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="w-full max-w-4xl max-h-[85vh] bg-surface border border-border rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-accent" />
                            Clipboard Statistics
                        </h2>
                        <p className="text-sm text-foreground-muted mt-1">
                            Insights about your clipboard usage
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-surface-elevated text-foreground-muted hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="space-y-6">
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Total Items */}
                            <div className="p-5 bg-surface-elevated border border-border rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-accent/10 rounded-lg">
                                        <FileText className="w-5 h-5 text-accent" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{stats.totalItems}</p>
                                        <p className="text-xs text-foreground-muted">Total Items</p>
                                    </div>
                                </div>
                            </div>

                            {/* Total Copies */}
                            <div className="p-5 bg-surface-elevated border border-border rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-green-500/10 rounded-lg">
                                        <Copy className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{stats.totalCopies}</p>
                                        <p className="text-xs text-foreground-muted">Total Copies</p>
                                    </div>
                                </div>
                            </div>

                            {/* Average Copies */}
                            <div className="p-5 bg-surface-elevated border border-border rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-500/10 rounded-lg">
                                        <TrendingUp className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">
                                            {stats.totalItems > 0 ? (stats.totalCopies / stats.totalItems).toFixed(1) : '0'}
                                        </p>
                                        <p className="text-xs text-foreground-muted">Avg Copies/Item</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Items by Type */}
                        <div className="p-5 bg-surface-elevated border border-border rounded-xl">
                            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-accent" />
                                Items by Type
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(stats.itemsByType).map(([type, count]) => {
                                    const percentage = stats.totalItems > 0 ? (count / stats.totalItems) * 100 : 0;
                                    return (
                                        <div key={type}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2 text-sm text-foreground capitalize">
                                                    {getTypeIcon(type)}
                                                    {type}
                                                </div>
                                                <span className="text-sm font-medium text-foreground-muted">
                                                    {count} ({percentage.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <div className="h-2 bg-surface rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-accent rounded-full transition-all duration-300"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Items by Day */}
                        <div className="p-5 bg-surface-elevated border border-border rounded-xl">
                            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-accent" />
                                Activity (Last 7 Days)
                            </h3>
                            <div className="space-y-3">
                                {Object.entries(stats.itemsByDay).map(([day, count]) => {
                                    const maxCount = Math.max(...Object.values(stats.itemsByDay));
                                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                                    return (
                                        <div key={day}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-foreground">{day}</span>
                                                <span className="text-sm font-medium text-foreground-muted">{count} items</span>
                                            </div>
                                            <div className="h-2 bg-surface rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Most Copied Items */}
                        <div className="p-5 bg-surface-elevated border border-border rounded-xl">
                            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-accent" />
                                Most Copied Items
                            </h3>
                            <div className="space-y-2">
                                {stats.mostCopiedItems.length === 0 ? (
                                    <p className="text-sm text-foreground-muted text-center py-4">
                                        No items yet
                                    </p>
                                ) : (
                                    stats.mostCopiedItems.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3 p-3 bg-surface rounded-lg hover:bg-surface-elevated transition-colors"
                                        >
                                            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-accent/10 text-accent rounded-full text-xs font-bold">
                                                {index + 1}
                                            </div>
                                            <div className="flex-shrink-0">
                                                {getTypeIcon(item.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-foreground truncate">
                                                    {item.type === 'image' ? 'Image' : item.content.substring(0, 50)}
                                                    {item.content.length > 50 && '...'}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-foreground-muted">
                                                <Copy className="w-3 h-3" />
                                                {item.copyCount}x
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};
