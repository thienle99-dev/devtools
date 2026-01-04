import React from 'react';
import { X } from 'lucide-react';
import { ClipboardItem } from '../../../store/clipboardStore';
import { Button } from '../../../components/ui/Button';
import { useClipboard } from '../hooks/useClipboard';

interface ViewFullModalProps {
    item: ClipboardItem | null;
    onClose: () => void;
}

export const ViewFullModal: React.FC<ViewFullModalProps> = ({ item, onClose }) => {
    const { copyToClipboard } = useClipboard();
    const [copied, setCopied] = React.useState(false);

    if (!item) return null;

    const handleCopy = async () => {
        const success = await copyToClipboard(item.content);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={handleBackdropClick}
        >
            <div className="w-full max-w-3xl max-h-[80vh] bg-surface border border-border rounded-xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">
                            {item.type === 'text' ? 'Text Content' : 'Image Content'}
                        </h2>
                        {item.metadata?.length && (
                            <p className="text-sm text-foreground-muted mt-1">
                                {item.metadata.length.toLocaleString()} characters
                            </p>
                        )}
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
                    {item.type === 'text' ? (
                        <pre className="text-sm text-foreground whitespace-pre-wrap break-words font-mono bg-surface-elevated p-4 rounded-lg border border-border">
                            {item.content}
                        </pre>
                    ) : (
                        <div className="space-y-4">
                            <img
                                src={item.content}
                                alt="Clipboard content"
                                className="max-w-full h-auto rounded-lg border border-border"
                            />
                            <div className="text-xs text-foreground-muted bg-surface-elevated p-3 rounded-lg border border-border break-all">
                                {item.content.substring(0, 200)}...
                            </div>
                        </div>
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
