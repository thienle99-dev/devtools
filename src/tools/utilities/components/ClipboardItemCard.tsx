import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Link as LinkIcon, File, Copy, Pin, Trash2, Eye, Check } from 'lucide-react';
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
    const { copyToClipboard, copyImageToClipboard } = useClipboard();
    const [copied, setCopied] = useState(false);
    const [showPlainTextOption, setShowPlainTextOption] = useState(false);

    const handleCopy = async (asPlainText = false) => {
        let success = false;

        if (item.type === 'image') {
            success = await copyImageToClipboard(item.content, item.metadata?.mimeType);
        } else {
            let content = item.content;
            if (asPlainText) {
                content = content.replace(/[\r\n]+/g, ' ').trim();
            }
            success = await copyToClipboard(content);
        }

        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
            setShowPlainTextOption(false);
        }
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
        const maxLength = 150;
        return item.content.length > maxLength
            ? item.content.substring(0, maxLength) + '...'
            : item.content;
    };

    const getTypeIcon = () => {
        switch (item.type) {
            case 'image':
                return <ImageIcon className="w-3.5 h-3.5" />;
            case 'link':
                return <LinkIcon className="w-3.5 h-3.5" />;
            case 'file':
                return <File className="w-3.5 h-3.5" />;
            default:
                return <FileText className="w-3.5 h-3.5" />;
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
            className={`group relative glass-panel rounded-xl border transition-all duration-200 cursor-pointer
                       ${item.pinned 
                           ? 'border-indigo-500/40 bg-indigo-500/5 hover:border-indigo-500/60' 
                           : 'border-[var(--color-glass-border)] hover:border-indigo-500/30 hover:bg-[var(--color-glass-button-hover)]'
                       }
                       ${isSelected ? 'ring-2 ring-indigo-500/50 border-indigo-500 shadow-lg' : ''}`}
            onClick={() => handleCopy()}
        >
            <div className="p-3">
                {/* Header */}
                <div className="flex items-start gap-3 mb-2">
                    {/* Type Icon or Image Thumbnail */}
                    {item.type === 'image' ? (
                        <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-[var(--color-glass-input)] border border-[var(--color-glass-border)]">
                            <img
                                src={item.content}
                                alt="Clipboard image"
                                className="w-full h-full object-cover"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewFull(item);
                                }}
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    ) : (
                        <div className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                            item.pinned ? 'bg-indigo-500/20' : 'bg-[var(--color-glass-input)]'
                        }`}>
                            {getTypeIcon()}
                        </div>
                    )}

                    {/* Content Preview */}
                    <div className="flex-1 min-w-0">
                        {item.type === 'image' ? (
                            <>
                                <p className="text-xs font-semibold text-foreground mb-0.5">
                                    Image Clipboard
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted">
                                    {item.metadata?.mimeType && (
                                        <span className="px-1.5 py-0.5 bg-[var(--color-glass-input)] rounded font-medium">
                                            {item.metadata.mimeType.split('/')[1]?.toUpperCase() || 'IMG'}
                                        </span>
                                    )}
                                    {item.metadata?.length && (
                                        <span>{(item.metadata.length / 1024).toFixed(1)} KB</span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-xs leading-relaxed text-foreground break-words whitespace-pre-wrap line-clamp-2 mb-1">
                                    {getPreview()}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {item.metadata?.length && item.type === 'text' && (
                                        <span className="text-[10px] text-foreground-muted font-medium">
                                            {item.metadata.length.toLocaleString()} chars
                                        </span>
                                    )}
                                    {item.copyCount > 1 && (
                                        <span className="text-[10px] text-foreground-muted font-medium">
                                            {item.copyCount}x
                                        </span>
                                    )}
                                    {item.sourceApp && (
                                        <span className="text-[10px] px-1.5 py-0.5 bg-[var(--color-glass-input)] rounded text-foreground-muted font-medium">
                                            {item.sourceApp}
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pinned Badge */}
                    {item.pinned && (
                        <div className="flex-shrink-0">
                            <Pin className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--color-glass-border)]">
                    {/* Timestamp */}
                    <span className="text-[10px] font-medium text-foreground-muted">
                        {getRelativeTime()}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {/* Copy */}
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(false);
                                }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowPlainTextOption(!showPlainTextOption);
                                }}
                                className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-foreground-muted hover:text-indigo-400 transition-colors"
                                title="Copy"
                            >
                                {copied ? (
                                    <Check className="w-3.5 h-3.5 text-indigo-400" />
                                ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                )}
                            </button>
                            {showPlainTextOption && (
                                <div className="absolute right-0 bottom-full mb-1 p-1.5 glass-panel border border-[var(--color-glass-border)] rounded-lg shadow-xl z-20">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopy(true);
                                        }}
                                        className="text-[10px] text-foreground hover:text-indigo-400 whitespace-nowrap"
                                    >
                                        Plain Text
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* View Full */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewFull(item);
                            }}
                            className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-foreground-muted hover:text-indigo-400 transition-colors"
                            title="View"
                        >
                            <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Pin/Unpin */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                item.pinned ? onUnpin(item.id) : onPin(item.id);
                            }}
                            className={`p-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors ${
                                item.pinned 
                                    ? 'text-indigo-400' 
                                    : 'text-foreground-muted hover:text-indigo-400'
                            }`}
                            title={item.pinned ? 'Unpin' : 'Pin'}
                        >
                            <Pin className={`w-3.5 h-3.5 ${item.pinned ? 'fill-current' : ''}`} />
                        </button>

                        {/* Delete */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-foreground-muted hover:text-red-500 transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
