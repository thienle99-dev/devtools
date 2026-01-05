import React from 'react';
import { X } from 'lucide-react';
import type { ClipboardItem } from '../../../store/clipboardStore';
import { Button } from '../../../components/ui/Button';
import { useClipboard } from '../hooks/useClipboard';

interface ViewFullModalProps {
    item: ClipboardItem | null;
    onClose: () => void;
}

export const ViewFullModal: React.FC<ViewFullModalProps> = ({ item, onClose }) => {
    const { copyToClipboard, copyImageToClipboard } = useClipboard();
    const [copied, setCopied] = React.useState(false);
    const [imageZoom, setImageZoom] = React.useState(false);

    if (!item) return null;

    const handleCopy = async () => {
        let success = false;

        if (item.type === 'image') {
            // Copy image as actual image to clipboard
            success = await copyImageToClipboard(item.content, item.metadata?.mimeType);
        } else {
            // Copy text/link content
            success = await copyToClipboard(item.content);
        }

        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadImage = () => {
        if (item.type === 'image') {
            const link = document.createElement('a');
            link.href = item.content;
            link.download = `clipboard-image-${item.timestamp}.${item.metadata?.mimeType?.split('/')[1] || 'png'}`;
            link.click();
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getTypeLabel = () => {
        switch (item.type) {
            case 'image':
                return 'Image';
            case 'link':
                return 'Link';
            case 'file':
                return 'File';
            default:
                return 'Text';
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="w-full max-w-5xl max-h-[90vh] bg-surface border border-border rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            {getTypeLabel()} Content
                        </h2>
                        <div className="flex items-center gap-3 mt-1 text-sm text-foreground-muted">
                            {item.type === 'image' && item.metadata?.mimeType && (
                                <span className="px-2 py-0.5 bg-surface-elevated rounded text-xs font-medium">
                                    {item.metadata.mimeType.toUpperCase()}
                                </span>
                            )}
                            {item.metadata?.length && (
                                <span>
                                    {item.type === 'image'
                                        ? `${(item.metadata.length / 1024).toFixed(1)} KB`
                                        : `${item.metadata.length.toLocaleString()} characters`
                                    }
                                </span>
                            )}
                            {item.sourceApp && (
                                <span>• From {item.sourceApp}</span>
                            )}
                        </div>
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
                    {item.type === 'image' ? (
                        <div className="space-y-4">
                            <div
                                className={`relative rounded-lg border border-border overflow-hidden bg-surface-elevated ${imageZoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                                onClick={() => setImageZoom(!imageZoom)}
                            >
                                <img
                                    src={item.content}
                                    alt="Clipboard image"
                                    className={`w-full h-auto transition-transform duration-200 ${imageZoom ? 'scale-150' : 'scale-100'}`}
                                    style={{ maxHeight: imageZoom ? 'none' : '60vh' }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs text-foreground-muted bg-surface-elevated p-3 rounded-lg border border-border">
                                <span>Click image to {imageZoom ? 'zoom out' : 'zoom in'}</span>
                                <button
                                    onClick={handleDownloadImage}
                                    className="px-3 py-1 bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors"
                                >
                                    Download Image
                                </button>
                            </div>
                        </div>
                    ) : item.type === 'link' ? (
                        <div className="space-y-4">
                            <a
                                href={item.content}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-accent hover:underline break-all text-lg font-medium"
                            >
                                {item.content}
                            </a>
                            <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono bg-surface-elevated p-4 rounded-lg border border-border">
                                {item.content}
                            </pre>
                        </div>
                    ) : (
                        <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono bg-surface-elevated p-4 rounded-lg border border-border">
                            {item.content}
                        </pre>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
                    <Button variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleCopy}>
                        {copied ? '✓ Copied!' : 'Copy to Clipboard'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
