import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useClipboard } from '../hooks/useClipboard';
import { useClipboardStore } from '../../../store/clipboardStore';

export const QuickCopySection: React.FC = () => {
    const [text, setText] = useState('');
    const [copied, setCopied] = useState(false);
    const { copyToClipboard } = useClipboard();
    const addItem = useClipboardStore((state) => state.addItem);

    const handleCopy = async () => {
        if (!text.trim()) return;

        const success = await copyToClipboard(text);
        if (success) {
            addItem(text, 'text');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.2em] pl-1">
                    Quick Copy
                </label>
                <textarea
                    className="w-full h-32 px-4 py-3 bg-surface-elevated border border-border rounded-lg 
                             text-foreground placeholder-foreground-muted resize-none
                             focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
                             transition-all duration-200"
                    placeholder="Type or paste text to copy..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
            </div>
            <Button
                variant="primary"
                onClick={handleCopy}
                disabled={!text.trim()}
                className="uppercase tracking-widest"
            >
                {copied ? '✓ Copied!' : 'Copy to Clipboard'}
            </Button>
        </div>
    );
};
