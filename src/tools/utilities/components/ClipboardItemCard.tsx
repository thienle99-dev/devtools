import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Copy, Pin, Trash2, Eye } from 'lucide-react';
import { ClipboardItem } from '../../../store/clipboardStore';
import { useClipboard } from '../hooks/useClipboard';
import { formatDistanceToNow } from 'date-fns';

interface ClipboardItemCardProps {
    item: ClipboardItem;
    onPin: (id: string) => void;
    onUnpin: (id: string) => void;
    onDelete: (id: string) => void;
    onViewFull: (item: ClipboardItem) => void;
}

export const ClipboardItemCard: React.FC<ClipboardItemCardProps> = ({
    item,
    onPin,
    onUnpin,
    onDelete,
    onViewFull,
}) => {
    const { copyToClipboard } = useClipboard();
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        const success = await copyToClipboard(item.content);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    const getPreview = () => {
        if (item.type === 'image') {
            return 'Image (base64)';
        }
        const maxLength = 150;
        return item.content.length > maxLength
            ? item.content.substring(0, maxLength) + '...'
            : item.content;
    };

    const getRelativeTime = () => {
        try {
            return formatDistanceToNow(new Date(item.timestamp), { addSuffix: true });
        } catch {
            return 'Unknown time';
        }
    };

    return (
        <div
            className={`group relative p-4 bg-surface-elevated border rounded-lg 
                       hover:border-accent/50 transition-all duration-200
                       ${item.pinned ? 'border-accent/30 bg-accent/5' : 'border-border'}`}
        >
            {/* Header */}
            <div className="flex items-start gap-3 mb-2">
                {/* Type Icon */}
                <div className={`flex-shrink-0 p-2 rounded-lg ${item.pinned ? 'bg-accent/10' : 'bg-surface'}`}>
                    {item.type === 'text' ? (
                        <FileText className="w-4 h-4 text-foreground-muted" />
                    ) : (
                        <ImageIcon className="w-4 h-4 text-foreground-muted" />
                    )}
                </div>

                {/* Content Preview */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground break-words whitespace-pre-wrap line-clamp-3">
                        {getPreview()}
                    </p>
                    {item.metadata?.length && (
                        <p className="text-xs text-foreground-muted mt-1">
                            {item.metadata.length.toLocaleString()} characters
                        </p>
                    )}
                </div>

                {/* Pinned Badge */}
                {item.pinned && (
                    <div className="flex-shrink-0">
                        <Pin className="w-4 h-4 text-accent fill-accent" />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                {/* Timestamp */}
                <span className="text-xs text-foreground-muted">
                    {getRelativeTime()}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {/* Copy */}
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded hover:bg-accent/10 text-foreground-muted hover:text-accent transition-colors"
                        title="Copy"
                    >
                        {copied ? (
                            <span className="text-xs text-accent">✓</span>
                        ) : (
                            <Copy className="w-3.5 h-3.5" />
                        )}
                    </button>

                    {/* View Full */}
                    <button
                        onClick={() => onViewFull(item)}
                        className="p-1.5 rounded hover:bg-accent/10 text-foreground-muted hover:text-accent transition-colors"
                        title="View Full"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Pin/Unpin */}
                    <button
                        onClick={() => item.pinned ? onUnpin(item.id) : onPin(item.id)}
                        className="p-1.5 rounded hover:bg-accent/10 text-foreground-muted hover:text-accent transition-colors"
                        title={item.pinned ? 'Unpin' : 'Pin'}
                    >
                        <Pin className={`w-3.5 h-3.5 ${item.pinned ? 'fill-accent text-accent' : ''}`} />
                    </button>

                    {/* Delete */}
                    <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-foreground-muted hover:text-red-500 transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
