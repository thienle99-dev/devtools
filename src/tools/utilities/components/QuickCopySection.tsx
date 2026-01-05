import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { useClipboard } from '../hooks/useClipboard';
import { useClipboardStore } from '../../../store/clipboardStore';
import { Copy, Check, Sparkles } from 'lucide-react';

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
        <div className="glass-panel p-4 rounded-xl border border-[var(--color-glass-border)]">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <label className="text-[10px] font-bold text-foreground-muted uppercase tracking-[0.15em]">
                            Quick Copy
                        </label>
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleCopy}
                        disabled={!text.trim()}
                        className="flex items-center gap-1.5"
                        icon={copied ? Check : Copy}
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </Button>
                </div>
                
                <textarea
                    className="w-full h-20 px-3 py-2 glass-input rounded-lg border border-[var(--color-glass-border)]
                             text-foreground placeholder:text-foreground-muted/50 resize-none
                             focus:outline-none focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500/50
                             transition-all duration-200 text-sm"
                    placeholder="Type or paste text to copy... (⌘+Enter)"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                            e.preventDefault();
                            handleCopy();
                        }
                    }}
                />
            </div>
        </div>
    );
};
