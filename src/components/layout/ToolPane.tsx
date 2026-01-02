import React from 'react';
import type { ReactNode } from 'react';
import { Share2, Trash2, Copy, Download } from 'lucide-react';

interface ToolPaneProps {
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
    onCopy?: () => void;
    onDownload?: () => void;
    onClear?: () => void;
}

export const ToolPane: React.FC<ToolPaneProps> = ({
    title,
    description,
    children,
    actions,
    onCopy,
    onDownload,
    onClear
}) => {
    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden glass-panel rounded-3xl m-2 shadow-2xl relative">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-border-glass backdrop-blur-md sticky top-0 z-10 bg-[var(--color-glass-50)]">
                <div>
                    <h2 className="text-xl font-bold text-foreground tracking-tight leading-none">{title}</h2>
                    {description && <p className="text-[11px] font-medium text-foreground-muted truncate mt-1.5 uppercase tracking-wider">{description}</p>}
                </div>

                <div className="flex items-center space-x-2">
                    {actions}
                    <div className="flex bg-[var(--color-glass-input)] rounded-xl p-1 border border-border-glass">
                        <button
                            onClick={onCopy}
                            className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Copy Output"
                            disabled={!onCopy}
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onDownload}
                            className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download Output"
                            disabled={!onDownload}
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClear}
                            className="p-2 text-foreground-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Clear Input"
                            disabled={!onClear}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <button className="glass-button-primary !p-2.5">
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                {children}
            </div>
        </div>
    );
};
