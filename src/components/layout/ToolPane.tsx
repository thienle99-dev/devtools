import React, { useRef, useState } from 'react';
import type { ReactNode, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Copy, Download, Upload, Clipboard, ExternalLink, ArrowRight, Link as LinkIcon, HelpCircle, X, Bookmark, History as HistoryIcon, Save, Share2, Columns, AlertTriangle, Info, GitCompare } from 'lucide-react';
import { cn } from '../../utils/cn';
import { TOOLS } from '../../tools/registry/tools';
import { useToolState, useToolStore } from '../../store/toolStore';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { readFileAsText, downloadFile, openContentInNewTab } from '../../utils/fileIo';
import { ToolSelector } from './ToolSelector';
import type { ToolDefinition } from '../../tools/registry/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ToolPaneProps {
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
    toolId?: string; 
    validation?: {
        status: 'success' | 'warning' | 'error' | 'info';
        message: string;
        details?: string;
    } | null;
    onCopy?: () => void;
    onDownload?: () => void;
    onClear?: () => void;
    helpContent?: ReactNode;
    contentClassName?: string;
}

export const ToolPane = ({
    title,
    description,
    children,
    actions,
    toolId,
    validation,
    onCopy,
    onDownload,
    onClear,
    helpContent,
    contentClassName
}: ToolPaneProps): JSX.Element => {
    const navigate = useNavigate();

    // Connect to store
    const { 
        data, presets, setToolData, clearToolData: storeClear,
        clearToolHistory, 
        savePreset, deletePreset, loadPreset 
    } = useToolState(toolId || '');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isPipeOpen, setIsPipeOpen] = useState(false);
    const [activeSidebar, setActiveSidebar] = useState<'help' | 'presets' | 'history' | null>(null);
    const [isCompareMode, setIsCompareMode] = useState(false);

    const currentToolDef = toolId ? TOOLS.find(t => t.id === toolId) : undefined;
    // Default to 'text' if not defined but has output, for backward compatibility with older tools
    // But ideally should be explicit.
    const primaryOutputType = currentToolDef?.outputTypes?.[0] || 'text';

    const toggleCompare = () => {
        if (!data?.output) {
            toast.error("Generate an output first to compare.");
            return;
        }
        setIsCompareMode(!isCompareMode);
    };

    const handleSavePreset = () => {
        if (!toolId || !data?.input) {
            toast.error("Nothing to save. Provide input first.");
            return;
        }
        const name = window.prompt("Enter a name for this preset:");
        if (name) {
            savePreset(toolId, name);
            toast.success("Preset saved!");
        }
    };

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
            const text = e.dataTransfer.getData('text');
            if (text) setToolData(toolId, { input: text });
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
        useToolStore.getState().setToolData(targetTool.id, { input: data.output });
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

    const handleShare = () => {
        if (!data?.output) return;
        const shareText = `### ${title} Output\n\n\`\`\`\n${data.output}\n\`\`\`\n\nShared from Antigravity DevTools`;
        navigator.clipboard.writeText(shareText);
        toast.success("Shareable markdown copied to clipboard!");
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
                title={primaryOutputType ? `Pipe (${primaryOutputType}) to...` : "Pipe Output To..."}
                compatibleInputType={primaryOutputType}
            />

            {/* Header */}
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
                            <button
                                onClick={handleShare}
                                className="p-2 text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg transition-all disabled:opacity-50"
                                title="Share Output"
                                disabled={!data?.output}
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                            {toolId && (
                                <>
                                    <button
                                        onClick={toggleCompare}
                                        className={cn(
                                            "p-2 rounded-lg transition-all",
                                            isCompareMode ? "text-indigo-400 bg-indigo-500/10" : "text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover"
                                        )}
                                        title="Compare Input/Output"
                                    >
                                        <GitCompare className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setToolData(toolId, { layout: data?.layout === 'horizontal' ? 'vertical' : 'horizontal' })}
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
                                onClick={() => setActiveSidebar(activeSidebar === 'presets' ? null : 'presets')}
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
                                onClick={() => setActiveSidebar(activeSidebar === 'history' ? null : 'history')}
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
                                onClick={() => setActiveSidebar(activeSidebar === 'help' ? null : 'help')}
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
                            onClick={handleClearAll}
                            className="p-2 text-foreground-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
                            title="Clear All"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Validation Banner */}
            <AnimatePresence>
                {validation && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={cn(
                            "px-8 py-3 border-b border-white/5 flex items-start gap-4",
                            validation.status === 'error' && "bg-rose-500/10 text-rose-400",
                            validation.status === 'warning' && "bg-amber-500/10 text-amber-400",
                            validation.status === 'info' && "bg-indigo-500/10 text-indigo-400",
                            validation.status === 'success' && "bg-emerald-500/10 text-emerald-400"
                        )}
                    >
                        {validation.status === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> :
                         validation.status === 'warning' ? <AlertTriangle className="w-5 h-5 shrink-0" /> :
                         <Info className="w-5 h-5 shrink-0" />}
                        
                        <div className="flex-1">
                            <p className="text-sm font-bold">{validation.message}</p>
                            {validation.details && <p className="text-xs opacity-70 mt-1">{validation.details}</p>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content & Sidebar */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                <div className={cn(
                    "flex-1 overflow-auto p-8 custom-scrollbar", 
                    (data?.layout === 'horizontal' || isCompareMode) ? "flex flex-row gap-8" : "flex flex-col",
                    contentClassName
                )}>
                    {isCompareMode ? (
                        <>
                            <div className="flex-1 flex flex-col gap-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground-muted">Input</h4>
                                <div className="flex-1 bg-black/20 rounded-xl border border-white/5 p-4 font-mono text-sm overflow-auto whitespace-pre">
                                    {data?.input}
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col gap-4">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-foreground-muted">Output</h4>
                                <div className="flex-1 bg-indigo-500/5 rounded-xl border border-indigo-500/20 p-4 font-mono text-sm overflow-auto whitespace-pre">
                                    {data?.output}
                                </div>
                            </div>
                        </>
                    ) : (
                        children
                    )}
                </div>

                {/* Sidebar */}
                <AnimatePresence>
                    {activeSidebar && (
                        <motion.div
                            initial={{ x: 400, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 400, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="w-80 border-l border-border-glass bg-[var(--color-glass-panel)]/50 backdrop-blur-3xl overflow-y-auto custom-scrollbar flex flex-col"
                        >
                            <div className="p-6 flex items-center justify-between shrink-0">
                                <h3 className="text-lg font-bold capitalize">{activeSidebar}</h3>
                                <button 
                                    onClick={() => setActiveSidebar(null)}
                                    className="p-1.5 rounded-lg hover:bg-white/5 text-foreground-muted transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 pt-0">
                                {activeSidebar === 'help' && helpContent && (
                                    <div className="space-y-6 text-sm text-foreground-secondary leading-relaxed">
                                        {helpContent}
                                    </div>
                                )}

                                {activeSidebar === 'presets' && (
                                    <div className="space-y-4">
                                        <Button 
                                            className="w-full justify-start gap-2" 
                                            variant="secondary"
                                            onClick={handleSavePreset}
                                        >
                                            <Save className="w-4 h-4" />
                                            Save Current as Preset
                                        </Button>
                                        
                                        <div className="space-y-2">
                                            {presets.length === 0 && (
                                                <div className="text-center py-8 text-foreground-disabled italic text-sm">
                                                    No presets saved yet
                                                </div>
                                            )}
                                            {presets.map((preset) => (
                                                <Card key={preset.id} className="p-3 bg-white/5 hover:bg-white/10 transition-colors group">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-semibold text-sm truncate">{preset.name}</span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={() => deletePreset(toolId!, preset.id)}
                                                                className="p-1 text-rose-400 hover:bg-rose-500/10 rounded"
                                                                title="Delete Preset"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="w-full h-8 text-xs font-bold uppercase tracking-wider bg-indigo-500/5 hover:bg-indigo-500/20 text-indigo-400"
                                                        onClick={() => loadPreset(toolId!, preset.id)}
                                                    >
                                                        Apply Preset
                                                    </Button>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeSidebar === 'history' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-foreground-muted uppercase tracking-widest">Recent Activity</span>
                                            <button 
                                                onClick={() => clearToolHistory(toolId!)}
                                                className="text-[10px] font-bold text-rose-400/60 hover:text-rose-400 uppercase tracking-widest transition-colors"
                                            >
                                                Clear All
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {(data?.history || []).length === 0 && (
                                                <div className="text-center py-8 text-foreground-disabled italic text-sm">
                                                    No history entries yet
                                                </div>
                                            )}
                                            {(data?.history || []).map((entry) => (
                                                <Card key={entry.id} className="p-3 bg-white/5 hover:bg-white/10 transition-colors flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-foreground-muted font-mono">
                                                            {new Date(entry.timestamp).toLocaleTimeString()}
                                                        </span>
                                                        <button 
                                                            onClick={() => setToolData(toolId!, { input: entry.input, options: entry.options })}
                                                            className="text-[10px] font-bold text-indigo-400 hover:underline uppercase tracking-widest"
                                                        >
                                                            Restore
                                                        </button>
                                                    </div>
                                                    <div className="text-xs font-medium text-foreground-secondary line-clamp-2 bg-black/20 p-2 rounded border border-white/5">
                                                        {entry.input}
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
