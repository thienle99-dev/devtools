import React, { useState, useMemo, Suspense } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { ArrowRight, Plus, Trash2, Play, Package, Download, Copy, CheckCircle, XCircle, Loader2, RotateCcw, Layout, List, Star, Sparkles, Upload, Share2 } from 'lucide-react';
import { useWorkflowStore, type WorkflowStep } from '@store/workflowStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { cn } from '@utils/cn';
import { toast } from 'sonner';
import { TOOLS } from '@tools/registry';
import { ConfirmationModal } from '@components/ui/ConfirmationModal';
import { TemplateSelector } from './TemplateSelector';
import type { ChainTemplate } from '@store/chainTemplates';

// Lazy load the visual designer to avoid loading ReactFlow heavy chunk when not needed
const VisualPipelineDesigner = React.lazy(() => import('./VisualPipelineDesigner'));

const PipelineDesigner: React.FC = () => {
    const { workflows, addWorkflow, updateWorkflow, deleteWorkflow, duplicateWorkflow, addStep, updateStep, removeStep, toggleFavorite } = useWorkflowStore();
    const removeWorkflow = deleteWorkflow; // Alias for cleaner usage
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'visual'>('list');
    const [input, setInput] = useState('');
    const [stepResults, setStepResults] = useState<Record<string, { status: 'pending' | 'running' | 'success' | 'error', output: any, error?: string, duration?: number }>>({});
    const [isRunning, setIsRunning] = useState(false);
    const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
    
    // UI State
    const [showTemplates, setShowTemplates] = useState(false);
    const [filterFavorites, setFilterFavorites] = useState(false);

    const activeWorkflow = useMemo(() =>
        workflows.find(w => w.id === activeWorkflowId),
        [workflows, activeWorkflowId]);

    // Available tools for pipeline (those that have inputTypes/outputTypes)
    const pipelineTools = useMemo(() =>
        TOOLS.filter((t: any) => t.inputTypes && t.outputTypes),
        []);

    // Smart Suggestions Logic
    const suggestedTools = useMemo(() => {
        if (!activeWorkflow || activeWorkflow.steps.length === 0) return [];
        
        const lastStep = activeWorkflow.steps[activeWorkflow.steps.length - 1];
        const lastTool = TOOLS.find((t: any) => t.id === lastStep.toolId);
        
        if (!lastTool || !lastTool.outputTypes) return [];

        const outputType = lastTool.outputTypes[0]; // Assuming primary output type for now
        
        return pipelineTools.filter((t: any) => 
            t.inputTypes?.includes(outputType) || t.inputTypes?.includes('text') || t.inputTypes?.includes('any')
        ).slice(0, 3); // Top 3 suggestions
    }, [activeWorkflow, pipelineTools]);

    const handleCreateWorkflow = (template: ChainTemplate) => {
        const id = addWorkflow({
            name: template.id === 'blank' ? 'New Pipeline' : template.name,
            steps: template.steps.map(s => ({ ...s, id: crypto.randomUUID() })) // New IDs for cleanup
        });
        setActiveWorkflowId(id);
        setShowTemplates(false);
        if (template.steps.length > 0) {
            toast.success(`Created workflow from "${template.name}" template`);
        }
    };


    // File input ref for import
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleExport = () => {
        if (!activeWorkflow) return;
        
        const exportData = {
            version: '1.0',
            ...activeWorkflow
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeWorkflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Pipeline exported');
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                
                // Basic validation
                if (!data.steps || !Array.isArray(data.steps)) {
                    throw new Error('Invalid pipeline format');
                }

                // Create new workflow from imported data
                const newId = addWorkflow({
                    name: `${data.name} (Imported)`,
                    steps: data.steps.map((s: any) => ({
                        ...s,
                        id: crypto.randomUUID() // Regenerate step IDs
                    })),
                    description: data.description,
                    isFavorite: !!data.isFavorite
                });
                
                setActiveWorkflowId(newId);
                toast.success('Pipeline imported');
            } catch (error) {
                toast.error('Failed to import pipeline: Invalid file format');
                console.error(error);
            }
        };
        reader.readAsText(file);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleShare = () => {
        if (!activeWorkflow) return;
        
        const exportData = {
            version: '1.0',
            ...activeWorkflow
        };
        
        navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
        toast.success('Pipeline configuration copied to clipboard');
    };

    // For cancellation
    const abortControllerRef = React.useRef<AbortController | null>(null);

    const runStep = async (stepIndex: number, startData: any) => {
        if (!activeWorkflow) return;
        const step = activeWorkflow.steps[stepIndex];
        if (!step) return;

        if (step.disabled) {
            setStepResults(prev => ({
                ...prev,
                [step.id]: { status: 'success', output: startData } // Pass-through
            }));
            return startData;
        }

        setStepResults(prev => ({
            ...prev,
            [step.id]: { status: 'running', output: null, error: undefined }
        }));

        const startTime = performance.now();
        try {
            const tool = TOOLS.find((t: any) => t.id === step.toolId);
            let result = startData;
            
            if (tool && tool.process) {
                // Check for abort before processing if it's a long task
                if (abortControllerRef.current?.signal.aborted) {
                    throw new Error('Operation cancelled');
                }
                result = await tool.process(startData, step.options);
            }
            
            const duration = performance.now() - startTime;
            setStepResults(prev => ({
                ...prev,
                [step.id]: { status: 'success', output: result, duration }
            }));
            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            const message = (error as Error).message || 'Unknown error';
            setStepResults(prev => ({
                ...prev,
                [step.id]: { status: 'error', output: null, error: message, duration }
            }));
            throw error;
        }
    };

    const handleRun = async () => {
        if (!activeWorkflow || activeWorkflow.steps.length === 0) return;

        setIsRunning(true);
        setStepResults({}); // Reset previous results
        abortControllerRef.current = new AbortController();

        let currentData = input;

        try {
            for (let i = 0; i < activeWorkflow.steps.length; i++) {
                if (abortControllerRef.current.signal.aborted) {
                    toast.error('Pipeline cancelled');
                    break;
                }
                currentData = await runStep(i, currentData);
            }
            if (!abortControllerRef.current.signal.aborted) {
                toast.success('Pipeline executed successfully');
            }
        } catch (error) {
            if ((error as Error).message !== 'Operation cancelled') {
                console.error(error);
                toast.error(`Pipeline failed: ${(error as Error).message}`);
            }
        } finally {
            setIsRunning(false);
            abortControllerRef.current = null;
        }
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            setIsRunning(false);
        }
    };
    
    const handleReset = () => {
        setStepResults({});
        setIsRunning(false);
    };

    const renderStep = (step: WorkflowStep, index: number) => {
        const tool = TOOLS.find((t: any) => t.id === step.toolId);
        const Icon = tool?.icon || Package;
        const result = stepResults[step.id];

        return (
            <div key={step.id} className="group relative flex items-center gap-4">
                <div className={cn(
                    "flex-1 glass-panel p-4 flex items-center gap-4 transition-all border",
                    result?.status === 'running' ? "border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]" : 
                    result?.status === 'error' ? "border-rose-500/50 bg-rose-500/5" :
                    step.disabled ? "opacity-50 grayscale border-dashed border-border-glass" :
                    "hover:border-indigo-500/50 border-transparent"
                )}>
                    <div className={cn("p-2 rounded-lg bg-indigo-500/10", tool?.color)}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-foreground truncate">{tool?.name || 'Unknown Tool'}</h4>
                            {result?.status === 'running' && <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />}
                            {result?.status === 'success' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                            {result?.status === 'error' && <XCircle className="w-3 h-3 text-rose-400" />}
                        </div>
                        <p className="text-[10px] text-foreground-muted truncate">{tool?.description}</p>
                        {result?.error && (
                            <p className="text-[10px] text-rose-400 mt-1 truncate">{result.error}</p>
                        )}
                    </div>
                    
                    {result?.duration && (
                        <div className="text-[10px] font-mono text-foreground-muted">
                            {Math.round(result.duration)}ms
                        </div>
                    )}

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={RotateCcw}
                            onClick={(e) => {
                                e.stopPropagation();
                                updateStep(activeWorkflow!.id, step.id, { disabled: !step.disabled });
                            }}
                            className={cn(step.disabled ? "text-amber-400" : "text-foreground-muted")}
                            title={step.disabled ? "Enable Step" : "Disable/Skip Step"}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={result?.status === 'error' ? RotateCcw : Play}
                            onClick={(e) => {
                                e.stopPropagation();
                                const prevStep = index > 0 ? activeWorkflow!.steps[index - 1] : null;
                                const prevOutput = index === 0 ? input : (prevStep ? stepResults[prevStep.id]?.output : null);
                                
                                if (index > 0 && !prevOutput) {
                                    toast.error('Previous step must be executed first');
                                    return;
                                }
                                runStep(index, prevOutput);
                            }}
                            className={cn(result?.status === 'error' ? "text-amber-400" : "text-indigo-400")}
                            title={result?.status === 'error' ? "Retry Step" : "Run only this step"}
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={Trash2}
                            onClick={() => removeStep(activeWorkflow!.id, step.id)}
                            className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
                        />
                    </div>
                </div>
                {index < activeWorkflow!.steps.length - 1 && (
                    <div className="flex flex-col items-center">
                        <div className="w-px h-8 bg-border-glass" />
                        <ArrowRight className="w-4 h-4 text-foreground-muted/50 my-1 rotate-90" />
                        <div className="w-px h-8 bg-border-glass" />
                    </div>
                )}
            </div>
        );
    };

    const sortedWorkflows = useMemo(() => {
        let list = [...workflows].sort((a, b) => b.updatedAt - a.updatedAt);
        if (filterFavorites) {
            list = list.filter(w => w.isFavorite);
        }
        return list;
    }, [workflows, filterFavorites]);

    return (
        <ToolPane
            title="Pipeline Mode (Tool Chain)"
            description="Chain multiple tools together to automate complex workflows"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* File Input for Import */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImport}
                    accept=".json"
                    className="hidden"
                />

                {/* Left side: Workflow List & Tool Picker */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
                    <div className="flex-none glass-panel p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">My Pipelines</h3>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setFilterFavorites(!filterFavorites)}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-colors", 
                                        filterFavorites ? "bg-amber-500/20 text-amber-500" : "hover:bg-glass-button text-foreground-muted"
                                    )}
                                    title="Show Favorites Only"
                                >
                                    <Star className={cn("w-4 h-4", filterFavorites && "fill-current")} />
                                </button>
                                <Button variant="secondary" size="xs" icon={Upload} onClick={() => fileInputRef.current?.click()}>Import</Button>
                                <Button variant="primary" size="xs" icon={Plus} onClick={() => setShowTemplates(true)}>New</Button>
                            </div>
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                            {sortedWorkflows.length === 0 && (
                                <p className="text-[10px] text-foreground-muted text-center py-4 italic">
                                    {filterFavorites ? 'No favorite pipelines' : 'No pipelines yet'}
                                </p>
                            )}
                            {sortedWorkflows.map(w => (
                                <div key={w.id} className="relative group">
                                    <button
                                        onClick={() => setActiveWorkflowId(w.id)}
                                        className={cn(
                                            "w-full px-3 py-2 rounded-lg text-left text-xs transition-all border pr-14 flex items-center justify-between",
                                            activeWorkflowId === w.id
                                                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 font-medium"
                                                : "border-transparent hover:bg-glass-button text-foreground-muted"
                                        )}
                                    >
                                        <span className="truncate">{w.name}</span>
                                        {w.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-current shrink-0" />}
                                    </button>
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center bg-[var(--color-glass-panel)] rounded-md shadow-sm">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleFavorite(w.id); }}
                                            className="p-1.5 text-foreground-muted hover:text-amber-500 transition-colors"
                                            title="Favorite"
                                        >
                                            <Star className={cn("w-3 h-3", w.isFavorite && "fill-current text-amber-500")} />
                                        </button>
                                        <button
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                duplicateWorkflow(w.id);
                                                toast.success('Pipeline duplicated');
                                            }}
                                            className="p-1.5 text-foreground-muted hover:text-indigo-400 transition-colors"
                                            title="Duplicate"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setWorkflowToDelete(w.id);
                                            }}
                                            className="p-1.5 text-foreground-muted hover:text-rose-400 transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {activeWorkflowId && (
                        <div className="flex-1 glass-panel p-4 flex flex-col gap-4 overflow-hidden">
                            {/* Smart Suggestions */}
                            {suggestedTools.length > 0 && (
                                <div className="space-y-2 pb-4 border-b border-border-glass">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3" />
                                        Suggested Next
                                    </h3>
                                    <div className="space-y-1">
                                    {suggestedTools.map((t: any) => (
                                         <button
                                            key={t.id}
                                            onClick={() => addStep(activeWorkflowId, { toolId: t.id, options: {} })}
                                            className="w-full px-3 py-2 rounded-lg bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 text-left transition-all flex items-center gap-3 group"
                                        >
                                            <t.icon className="w-3 h-3 text-indigo-400" />
                                            <span className="text-xs font-medium text-foreground">{t.name}</span>
                                        </button>
                                    ))}
                                    </div>
                                </div>
                            )}

                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Available Tools</h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                {pipelineTools.map((t: any) => (
                                    <button
                                        key={t.id}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', t.id);
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        onClick={() => addStep(activeWorkflowId, { toolId: t.id, options: {} })}
                                        className="w-full p-3 rounded-xl bg-glass-button hover:bg-glass-button-hover border border-transparent hover:border-indigo-500/30 text-left transition-all group cursor-move"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-1.5 rounded-lg bg-foreground/5", t.color)}>
                                                <t.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium text-foreground group-hover:text-indigo-400">{t.name}</div>
                                                <div className="text-[10px] text-foreground-muted truncate w-40">{t.description}</div>
                                            </div>
                                            <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 text-foreground-muted" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right side: Designer & Execution */}
                <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
                    {!activeWorkflow ? (
                        <div className="flex-1 glass-panel flex flex-col items-center justify-center text-center p-12 space-y-6">
                            <div className="p-6 rounded-full bg-indigo-500/10 text-indigo-400">
                                <Plus className="w-12 h-12" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-foreground">Select or Create a Pipeline</h2>
                                <p className="text-sm text-foreground-muted max-w-sm">
                                    Start building your automation by creating a new pipeline and adding your favorite tools.
                                </p>
                            </div>
                            <Button variant="primary" size="lg" icon={Plus} onClick={() => setShowTemplates(true)}>
                                Create New Pipeline
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                            {/* Workflow Header */}
                            <div className="glass-panel p-4 flex items-center gap-4">
                                <button onClick={() => toggleFavorite(activeWorkflow.id)}>
                                    <Star className={cn("w-5 h-5 transition-colors", activeWorkflow.isFavorite ? "fill-amber-400 text-amber-400" : "text-foreground-muted hover:text-amber-400")} />
                                </button>
                                <Input
                                    value={activeWorkflow?.name || ''}
                                    onChange={(e) => updateWorkflow(activeWorkflowId!, { name: e.target.value })}
                                    className="bg-transparent border-none text-lg font-bold p-0 focus:ring-0 min-w-[200px] text-foreground"
                                />
                                <div className="ml-auto flex items-center gap-1.5">
                                    <div className="flex bg-[var(--color-glass-item)] rounded-lg p-1 mr-2 border border-border-glass">
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn(
                                                "p-1.5 rounded-md transition-all",
                                                viewMode === 'list' ? "bg-indigo-500/20 text-indigo-400" : "text-foreground-muted hover:text-foreground"
                                            )}
                                            title="List View"
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('visual')}
                                            className={cn(
                                                "p-1.5 rounded-md transition-all",
                                                viewMode === 'visual' ? "bg-indigo-500/20 text-indigo-400" : "text-foreground-muted hover:text-foreground"
                                            )}
                                            title="Visual Builder"
                                        >
                                            <Layout className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-1 mr-2">
                                        <Button
                                            variant="ghost" 
                                            size="sm"
                                            icon={Share2}
                                            onClick={handleShare}
                                            title="Share Configuration"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            icon={Download}
                                            onClick={handleExport}
                                            title="Export Pipeline"
                                        />
                                    </div>

                                    <div className="h-6 w-px bg-border-glass mx-2" />
                                
                                    <Button
                                        variant="secondary"
                                        icon={RotateCcw}
                                        onClick={handleReset}
                                        disabled={Object.keys(stepResults).length === 0}
                                        title="Reset Pipeline Output"
                                    >
                                        Reset
                                    </Button>
                                    {isRunning ? (
                                        <Button
                                            variant="secondary"
                                            className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                                            icon={XCircle}
                                            onClick={handleCancel}
                                        >
                                            Cancel
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="primary"
                                            icon={Play}
                                            loading={isRunning}
                                            onClick={handleRun}
                                            disabled={!activeWorkflow?.steps.length}
                                        >
                                            Run Pipeline
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                                {viewMode === 'list' ? (
                                    <>
                                        {/* Steps Designer (List) */}
                                        <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-2">
                                                Pipeline Steps ({activeWorkflow?.steps.length})
                                            </h3>
                                            {activeWorkflow?.steps.length === 0 ? (
                                                <div className="flex-1 border-2 border-dashed border-border-glass rounded-2xl flex flex-col items-center justify-center p-8 text-center gap-3">
                                                    <Package className="w-8 h-8 text-foreground-muted opacity-30" />
                                                    <p className="text-xs text-foreground-muted">Add tools from the left to start your chain</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {activeWorkflow?.steps.map((step, idx) => renderStep(step, idx))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    /* Visual Designer */
                                    <div className="col-span-full h-full min-h-[400px]">
                                        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>}>
                                            <VisualPipelineDesigner workflowId={activeWorkflowId!} stepResults={stepResults} />
                                        </Suspense>
                                    </div>
                                )}
                                
                                {viewMode === 'list' && (
                                    /* Testing Area */
                                    <div className="flex flex-col gap-4 overflow-hidden">
                                        <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                                            <label className="text-[10px] font-bold uppercase opacity-50 ml-1 text-foreground-muted">Initial Input</label>
                                            <textarea
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Paste initial data here..."
                                                className="flex-1 glass-input rounded-xl p-4 text-xs font-mono resize-none focus:outline-none focus:border-indigo-500/50"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-bold uppercase opacity-50 ml-1 text-foreground-muted">Pipeline Output</label>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="xs" icon={Copy} onClick={() => {
                                                        const lastStepId = activeWorkflow?.steps[activeWorkflow.steps.length - 1]?.id;
                                                        const output = lastStepId ? stepResults[lastStepId]?.output : null;
                                                        if (output) {
                                                            navigator.clipboard.writeText(typeof output === 'string' ? output : JSON.stringify(output, null, 2));
                                                            toast.success('Output copied');
                                                        }
                                                    }} />
                                                    <Button variant="ghost" size="xs" icon={Download} onClick={() => {
                                                        const lastStepId = activeWorkflow?.steps[activeWorkflow.steps.length - 1]?.id;
                                                        const output = lastStepId ? stepResults[lastStepId]?.output : null;
                                                        if (output) {
                                                            const blob = new Blob([typeof output === 'string' ? output : JSON.stringify(output, null, 2)], { type: 'text/plain' });
                                                            const url = URL.createObjectURL(blob);
                                                            const a = document.createElement('a');
                                                            a.href = url;
                                                            a.download = 'pipeline-output.txt';
                                                            a.click();
                                                        }
                                                    }} />
                                                </div>
                                            </div>
                                            <textarea
                                                value={(() => {
                                                    const lastStepId = activeWorkflow?.steps[activeWorkflow.steps.length - 1]?.id;
                                                    const output = lastStepId ? stepResults[lastStepId]?.output : null;
                                                    return output ? (typeof output === 'string' ? output : JSON.stringify(output, null, 2)) : '';
                                                })()}
                                                readOnly
                                                placeholder="Execution result will appear here..."
                                                className={cn(
                                                    "flex-1 bg-indigo-500/5 border border-border-glass rounded-xl p-4 text-xs font-mono resize-none focus:outline-none text-foreground",
                                                    activeWorkflow?.steps.length && stepResults[activeWorkflow.steps[activeWorkflow.steps.length - 1].id]?.output && "text-indigo-400"
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <ConfirmationModal
                    isOpen={!!workflowToDelete}
                    onClose={() => setWorkflowToDelete(null)}
                    onConfirm={() => {
                        if (workflowToDelete) {
                            const isActive = activeWorkflowId === workflowToDelete;
                            removeWorkflow(workflowToDelete);
                            if (isActive) setActiveWorkflowId(null);
                            setWorkflowToDelete(null);
                            toast.success('Pipeline deleted');
                        }
                    }}
                    title="Delete Pipeline"
                    message="Are you sure you want to delete this pipeline? This action cannot be undone."
                    confirmText="Delete"
                    variant="danger"
                />

                {showTemplates && (
                    <TemplateSelector
                        onSelect={handleCreateWorkflow}
                        onCancel={() => setShowTemplates(false)}
                    />
                )}
            </div>
        </ToolPane>
    );
};

export default PipelineDesigner;
