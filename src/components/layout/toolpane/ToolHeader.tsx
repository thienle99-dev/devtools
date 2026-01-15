import React, { useRef } from 'react';
import type { ReactNode } from 'react';
import { Upload, Clipboard, Link as LinkIcon, ArrowRight, ExternalLink, Copy, Download, Share2, GitCompare, Columns, Bookmark, History as HistoryIcon, HelpCircle, Trash2 } from 'lucide-react';
import { cn } from '@utils/cn';
import type { ToolDefinition } from '../../../tools/registry/types';
import { ToolState } from '../../../store/toolStore';

interface ToolHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    toolId?: string;
    data?: ToolState;
    hasInputCapability: boolean;
    hasOutputCapability: boolean;
    isCompareMode: boolean;
    activeSidebar: 'help' | 'presets' | 'history' | null;
    helpContent?: ReactNode;
    onPasteInput: () => void;
    onUrlInput: () => void;
    onFileInputRef: React.RefObject<HTMLInputElement>;
    onPipeOutput: () => void;
    onNewTab: () => void;
    onCopyOutput: () => void;
    onDownloadOutput: () => void;
    onShare: () => void;
    onToggleCompare: () => void;
    onToggleLayout: () => void;
    onToggleSidebar: (sidebar: 'help' | 'presets' | 'history' | null) => void;
    onClearAll: () => void;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
    title, description, actions, toolId, data,
    hasInputCapability, hasOutputCapability, isCompareMode, activeSidebar, helpContent,
    onPasteInput, onUrlInput, onFileInputRef, onPipeOutput, onNewTab, onCopyOutput,
    onDownloadOutput, onShare, onToggleCompare, onToggleLayout, onToggleSidebar, onClearAll
}) => {
    return (
        <div className="px-8 py-5 flex items-center justify-between backdrop-blur-md sticky top-0 z-10 bg-[var(--color-glass-50)] shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight leading-none">{title}</h2>
                {description && <p className="text-xs font-medium text-foreground-muted truncate mt-2 uppercase tracking-wider">{description}</p>}
            </div>

            <div className="flex items-center space-x-4">
                {actions}

                {/* Global Input Tools */}
                {hasInputCapability && (
                    <div className="flex bg-[var(--color-glass-input)] rounded-xl p-1 border border-border-glass">
                        <button
                            onClick={onPasteInput}
                            className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all"
                            title="Paste Input from Clipboard"
                        >
                            <Clipboard className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onFileInputRef.current?.click()}
                            className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all"
                            title="Import File"
                        >
                            <Upload className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onUrlInput}
                            className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all"
                            title="Import from URL"
                        >
                            <LinkIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Global Output Tools */}
                {hasOutputCapability && (
                    <div className="flex bg-[var(--color-glass-input)] rounded-xl p-1 border border-border-glass">
                        <button
                            onClick={onPipeOutput}
                            className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all disabled:opacity-50"
                            title="Pipe to another tool"
                            disabled={!data?.output}
                        >
                            <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onNewTab}
                            className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all disabled:opacity-50"
                            title="Open Output in New Tab"
                            disabled={!data?.output}
                        >
                            <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onCopyOutput}
                            className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all disabled:opacity-50"
                            title="Copy Output"
                            disabled={!data?.output}
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onDownloadOutput}
                            className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all disabled:opacity-50"
                            title="Download Output"
                            disabled={!data?.output}
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onShare}
                            className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all disabled:opacity-50"
                            title="Share Output"
                            disabled={!data?.output}
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                        {toolId && (
                            <>
                                <button
                                    onClick={onToggleCompare}
                                    className={cn(
                                        "p-2 rounded-lg transition-all",
                                        isCompareMode ? "text-indigo-400 bg-indigo-500/10" : "text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover"
                                    )}
                                    title="Compare Input/Output"
                                >
                                    <GitCompare className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={onToggleLayout}
                                    className={cn(
                                        "p-2 rounded-lg transition-all",
                                        data?.layout === 'horizontal' ? "text-indigo-400 bg-indigo-500/10" : "text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover"
                                    )}
                                    title="Toggle Side-by-Side Layout"
                                >
                                    <Columns className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* Presets & History */}
                {toolId && (
                    <div className="flex bg-[var(--color-glass-input)] rounded-xl p-1 border border-border-glass">
                        <button
                            onClick={() => onToggleSidebar(activeSidebar === 'presets' ? null : 'presets')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                activeSidebar === 'presets'
                                    ? "text-indigo-400 bg-indigo-500/10"
                                    : "text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover"
                            )}
                            title="Saved Presets"
                        >
                            <Bookmark className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onToggleSidebar(activeSidebar === 'history' ? null : 'history')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                activeSidebar === 'history'
                                    ? "text-indigo-400 bg-indigo-500/10"
                                    : "text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover"
                            )}
                            title="Tool History"
                        >
                            <HistoryIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Clear & Help */}
                <div className="flex bg-[var(--color-glass-input)] rounded-xl p-1 border border-border-glass">
                    {helpContent && (
                        <button
                            onClick={() => onToggleSidebar(activeSidebar === 'help' ? null : 'help')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                activeSidebar === 'help'
                                    ? "text-indigo-400 bg-indigo-500/10"
                                    : "text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover"
                            )}
                            title="Toggle Help"
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={onClearAll}
                        className="p-2 text-foreground-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
                        title="Clear All"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
