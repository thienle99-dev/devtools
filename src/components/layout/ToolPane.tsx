import React, { useRef, useState } from 'react';
import type { ReactNode, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@utils/cn';
import { TOOLS } from '../../tools/registry/tools';
import { useToolState, useToolStore } from '../../store/toolStore';
import { toast } from 'sonner';
import { readFileAsText, downloadFile, openContentInNewTab } from '../../utils/fileIo';
import { ToolSelector } from './ToolSelector';
// ToolDefinition is used.
import type { ToolDefinition } from '../../tools/registry/types';
import { motion, AnimatePresence } from 'framer-motion';

// Import extracted components
import { ToolHeader } from './toolpane/ToolHeader';
import { ToolSidebar } from './toolpane/ToolSidebar';

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
            <ToolHeader
                title={title}
                description={description}
                actions={actions}
                toolId={toolId}
                data={data}
                hasInputCapability={hasInputCapability}
                hasOutputCapability={hasOutputCapability}
                isCompareMode={isCompareMode}
                activeSidebar={activeSidebar}
                helpContent={helpContent}
                onPasteInput={handlePasteInput}
                onUrlInput={handleUrlInput}
                onFileInputRef={fileInputRef}
                onPipeOutput={() => setIsPipeOpen(true)}
                onNewTab={handleNewTab}
                onCopyOutput={handleCopyOutput}
                onDownloadOutput={handleDownloadOutput}
                onShare={handleShare}
                onToggleCompare={toggleCompare}
                onToggleLayout={() => toolId && setToolData(toolId, { layout: data?.layout === 'horizontal' ? 'vertical' : 'horizontal' })}
                onToggleSidebar={setActiveSidebar}
                onClearAll={handleClearAll}
            />

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
                <ToolSidebar
                    activeSidebar={activeSidebar}
                    setActiveSidebar={setActiveSidebar}
                    helpContent={helpContent}
                    presets={presets}
                    toolId={toolId}
                    data={data}
                    setToolData={setToolData}
                    clearToolHistory={clearToolHistory}
                    savePreset={handleSavePreset}
                    deletePreset={deletePreset}
                    loadPreset={loadPreset}
                />
            </div>
        </div>
    );
};
