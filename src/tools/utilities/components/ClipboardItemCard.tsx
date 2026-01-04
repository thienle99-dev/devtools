import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Link as LinkIcon, File, Copy, Pin, Trash2, Eye } from 'lucide-react';
import type { ClipboardItem } from '../../../store/clipboardStore';
import { useClipboard } from '../hooks/useClipboard';
import { formatDistanceToNow } from 'date-fns';

interface ClipboardItemCardProps {
    item: ClipboardItem;
    isSelected?: boolean;
    onPin: (id: string) => void;
    onUnpin: (id: string) => void;
    onDelete: (id: string) => void;
    onViewFull: (item: ClipboardItem) => void;
}

export const ClipboardItemCard: React.FC<ClipboardItemCardProps> = ({
    item,
    isSelected = false,
    onPin,
    onUnpin,
    onDelete,
    onViewFull,
}) => {
    const { copyToClipboard } = useClipboard();
    const [copied, setCopied] = useState(false);
    const [showPlainTextOption, setShowPlainTextOption] = useState(false);

    const handleCopy = async (asPlainText = false) => {
        let content = item.content;
        if (asPlainText) {
            // Remove all formatting - convert to plain text
            content = content.replace(/[\r\n]+/g, ' ').trim();
        }
        const success = await copyToClipboard(content);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            setShowPlainTextOption(false);
        }
    };

    const getTooltipText = () => {
        const parts: string[] = [];
        if (item.sourceApp) {
            parts.push(`Source: ${item.sourceApp}`);
        }
        if (item.copyCount > 1) {
            parts.push(`Copied ${item.copyCount} times`);
        }
        parts.push(getRelativeTime());
        return parts.join(' • ');
    };

    const getPreview = () => {
        if (item.type === 'image') {
            return 'Image (base64)';
        }
        if (item.type === 'link') {
            return item.metadata?.url || item.content;
        }
        if (item.type === 'file') {
            return item.metadata?.filePath || item.content;
        }
        const maxLength = 300; // Increased from 150 for better preview
        return item.content.length > maxLength
            ? item.content.substring(0, maxLength) + '...'
            : item.content;
    };

    const getTypeIcon = () => {
        switch (item.type) {
            case 'image':
                return <ImageIcon className="w-4 h-4 text-foreground-muted" />;
            case 'link':
                return <LinkIcon className="w-4 h-4 text-foreground-muted" />;
            case 'file':
                return <File className="w-4 h-4 text-foreground-muted" />;
            default:
                return <FileText className="w-4 h-4 text-foreground-muted" />;
        }
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
            className={`group relative p-5 bg-surface-elevated border rounded-xl 
                       hover:border-accent/50 transition-all duration-200 cursor-pointer
                       ${item.pinned ? 'border-accent/30 bg-accent/5' : 'border-border'}
                       ${isSelected ? 'ring-2 ring-accent/50 border-accent shadow-lg' : ''}`}
            title={getTooltipText()}
        >
            {/* Header */}
            <div className="flex items-start gap-4 mb-3">
                {/* Type Icon */}
                <div className={`flex-shrink-0 p-2.5 rounded-lg ${item.pinned ? 'bg-accent/10' : 'bg-surface'}`}>
                    {getTypeIcon()}
                </div>

                {/* Content Preview */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed text-foreground break-words whitespace-pre-wrap line-clamp-4">
                        {getPreview()}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        {item.metadata?.length && (
                            <p className="text-xs text-foreground-muted">
                                {item.metadata.length.toLocaleString()} characters
                            </p>
                        )}
                        {item.copyCount > 1 && (
                            <span className="text-xs text-foreground-muted">
                                • {item.copyCount}x
                            </span>
                        )}
                        {item.sourceApp && (
                            <span className="text-xs text-foreground-muted">
                                • {item.sourceApp}
                            </span>
                        )}
                    </div>
                </div>

                {/* Pinned Badge */}
                {item.pinned && (
                    <div className="flex-shrink-0">
                        <Pin className="w-4 h-4 text-accent fill-accent" />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
                {/* Timestamp */}
                <span className="text-xs font-medium text-foreground-muted">
                    {getRelativeTime()}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {/* Copy with plain text option */}
                    <div className="relative">
                        <button
                            onClick={() => handleCopy(false)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setShowPlainTextOption(!showPlainTextOption);
                            }}
                            className="p-2 rounded-lg hover:bg-accent/10 text-foreground-muted hover:text-accent transition-colors"
                            title="Copy (Right-click for plain text)"
                        >
                            {copied ? (
                                <span className="text-xs text-accent">✓</span>
                            ) : (
                                <Copy className="w-3.5 h-3.5" />
                            )}
                        </button>
                        {showPlainTextOption && (
                            <div className="absolute right-0 bottom-full mb-1 p-2 bg-surface border border-border rounded-lg shadow-lg z-10">
                                <button
                                    onClick={() => handleCopy(true)}
                                    className="text-xs text-foreground hover:text-accent whitespace-nowrap"
                                >
                                    Copy as Plain Text
                                </button>
                            </div>
                        )}
                    </div>

                    {/* View Full */}
                    <button
                        onClick={() => onViewFull(item)}
                        className="p-2 rounded-lg hover:bg-accent/10 text-foreground-muted hover:text-accent transition-colors"
                        title="View Full"
                    >
                        <Eye className="w-4 h-4" />
                    </button>

                    {/* Pin/Unpin */}
                    <button
                        onClick={() => item.pinned ? onUnpin(item.id) : onPin(item.id)}
                        className="p-2 rounded-lg hover:bg-accent/10 text-foreground-muted hover:text-accent transition-colors"
                        title={item.pinned ? 'Unpin' : 'Pin'}
                    >
                        <Pin className={`w-4 h-4 ${item.pinned ? 'fill-accent text-accent' : ''}`} />
                    </button>

                    {/* Delete */}
                    <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-foreground-muted hover:text-red-500 transition-colors"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
