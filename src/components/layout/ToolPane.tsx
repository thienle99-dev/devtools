import React, { useRef, useState } from 'react';
import type { ReactNode, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Copy, Download, Upload, Clipboard, ExternalLink, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { useToolState, useToolStore } from '../../store/toolStore';
import { readFileAsText, downloadFile, openContentInNewTab } from '../../utils/fileIo';
import { ToolSelector } from './ToolSelector';
import type { ToolDefinition } from '../../tools/registry/types';

interface ToolPaneProps {
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
    toolId?: string; // Optional toolId to enable auto-wiring

    // Manual overrides
    onCopy?: () => void;
    onDownload?: () => void;
    onClear?: () => void;
}

export const ToolPane: React.FC<ToolPaneProps> = ({
    title,
    description,
    children,
    actions,
    toolId,
    onCopy,
    onDownload,
    onClear
}) => {
    const navigate = useNavigate();

    // Connect to store unconditionally (safe even if toolId is empty)
    const { data, setToolData, clearToolData: storeClear } = useToolState(toolId || '');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPipeOpen, setIsPipeOpen] = useState(false);

    // --- Input Handlers ---

    const handlePasteInput = async () => {
        if (!setToolData || !toolId) return;
        try {
            const text = await navigator.clipboard.readText();
            setToolData(toolId, { input: text });
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    };

    const handleUrlInput = async () => {
        if (!setToolData || !toolId) return;
        const url = window.prompt("Enter URL to fetch content from:");
        if (url) {
            try {
                const res = await fetch(url);
                if (!res.ok) throw new Error('Fetch failed');
                const text = await res.text();
                setToolData(toolId, { input: text });
            } catch (err) {
                console.error('Failed to fetch URL:', err);
                // In a real app we might want better error handling UI
                alert('Failed to fetch URL. Check console for details (likely CORS restricted).');
            }
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!setToolData || !toolId) return;
        const file = e.target.files?.[0];
        if (file) {
            try {
                const text = await readFileAsText(file);
                setToolData(toolId, { input: text });
            } catch (err) {
                console.error('Failed to read file:', err);
            }
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!toolId) return;
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (!setToolData || !toolId) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            try {
                const text = await readFileAsText(file);
                setToolData(toolId, { input: text });
            } catch (err) {
                console.error('Failed to read dropped file:', err);
            }
        } else {
            // Try to read text
            const text = e.dataTransfer.getData('text');
            if (text) {
                setToolData(toolId, { input: text });
            }
        }
    };

    // --- Output Handlers ---

    const handleCopyOutput = () => {
        if (onCopy) {
            onCopy();
            return;
        }
        if (data?.output) {
            navigator.clipboard.writeText(data.output);
        }
    };

    const handleDownloadOutput = () => {
        if (onDownload) {
            onDownload();
            return;
        }
        if (data?.output && toolId) {
            downloadFile(data.output, `${toolId}-output.txt`);
        }
    };

    const handleNewTab = () => {
        if (data?.output) {
            openContentInNewTab(data.output, title);
        }
    };

    const handlePipeOutput = (targetTool: ToolDefinition) => {
        if (!data?.output) return;

        // 1. Set input of target tool
        useToolStore.getState().setToolData(targetTool.id, { input: data.output });

        // 2. Navigate
        navigate(targetTool.path);
        setIsPipeOpen(false);
    };

    const handleClearAll = () => {
        if (onClear) {
            onClear();
            return;
        }
        if (storeClear && toolId) {
            storeClear(toolId);
        }
    };

    const hasInputCapability = !!toolId;
    const hasOutputCapability = (!!toolId && !!data?.output) || !!onCopy || !!onDownload;

    return (
        <div
            className="flex-1 flex flex-col min-h-0 overflow-hidden relative h-full w-full"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag Overlay */}
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm border-2 border-primary border-dashed rounded-lg flex items-center justify-center pointer-events-none">
                    <div className="bg-background/80 p-6 rounded-xl shadow-2xl flex flex-col items-center animate-in fade-in zoom-in duration-200">
                        <Upload className="w-12 h-12 text-primary mb-4" />
                        <h3 className="text-xl font-bold text-foreground">Drop file to import</h3>
                    </div>
                </div>
            )}

            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
            />

            {/* Pipe Modal */}
            <ToolSelector
                isOpen={isPipeOpen}
                onClose={() => setIsPipeOpen(false)}
                onSelect={handlePipeOutput}
                title="Pipe Output To..."
            />

            {/* Header */}
            <div className="px-8 py-5 flex items-center justify-between backdrop-blur-md sticky top-0 z-10 bg-[var(--color-glass-50)] relative shrink-0">
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
                                onClick={handlePasteInput}
                                className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all"
                                title="Paste Input from Clipboard"
                            >
                                <Clipboard className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all"
                                title="Import File"
                            >
                                <Upload className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleUrlInput}
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
                                onClick={() => setIsPipeOpen(true)}
                                className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all disabled:opacity-50"
                                title="Pipe to another tool"
                                disabled={!data?.output}
                            >
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleNewTab}
                                className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all disabled:opacity-50"
                                title="Open Output in New Tab"
                                disabled={!data?.output}
                            >
                                <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleCopyOutput}
                                className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all disabled:opacity-50"
                                title="Copy Output"
                                disabled={!data?.output && !onCopy}
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleDownloadOutput}
                                className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all disabled:opacity-50"
                                title="Download Output"
                                disabled={!data?.output && !onDownload}
                            >
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Clear */}
                    <div className="flex bg-[var(--color-glass-input)] rounded-xl p-1 border border-border-glass">
                        <button
                            onClick={handleClearAll}
                            className="p-2 text-foreground-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
                            title="Clear All"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-auto p-8 custom-scrollbar">
                {children}
            </div>
        </div>
    );
};
