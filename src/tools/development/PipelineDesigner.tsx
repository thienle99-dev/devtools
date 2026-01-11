import React, { useState, useMemo } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { ArrowRight, Plus, Trash2, Play, Package, Download, Copy } from 'lucide-react';
import { useWorkflowStore, type WorkflowStep } from '@store/workflowStore';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { cn } from '@utils/cn';
import { toast } from 'sonner';
import { TOOLS } from '@tools/registry';

const PipelineDesigner: React.FC = () => {
    const { workflows, addWorkflow, updateWorkflow, deleteWorkflow, addStep, removeStep } = useWorkflowStore();
    const removeWorkflow = deleteWorkflow; // Alias for cleaner usage
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<any>(null);
    const [isRunning, setIsRunning] = useState(false);

    const activeWorkflow = useMemo(() =>
        workflows.find(w => w.id === activeWorkflowId),
        [workflows, activeWorkflowId]);

    // Available tools for pipeline (those that have inputTypes/outputTypes)
    const pipelineTools = useMemo(() =>
        TOOLS.filter((t: any) => t.inputTypes && t.outputTypes),
        []);

    const handleCreateWorkflow = () => {
        const id = addWorkflow({
            name: 'New Pipeline',
            steps: []
        });
        setActiveWorkflowId(id);
    };

    const handleRun = async () => {
        if (!activeWorkflow || activeWorkflow.steps.length === 0) return;

        setIsRunning(true);
        let currentData = input;

        try {
            for (const step of activeWorkflow.steps) {
                const tool = TOOLS.find((t: any) => t.id === step.toolId);
                if (tool && tool.process) {
                    currentData = await tool.process(currentData, step.options);
                } else {
                    // If no process function, we might want to throw or just skip
                    // For now, let's assume we need it
                    // console.warn(`Tool ${step.toolId} doesn't support processing in pipeline.`);
                }
            }
            setOutput(currentData);
            toast.success('Pipeline executed successfully');
        } catch (error) {
            console.error(error);
            toast.error(`Pipeline failed: ${(error as Error).message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const renderStep = (step: WorkflowStep, index: number) => {
        const tool = TOOLS.find((t: any) => t.id === step.toolId);
        const Icon = tool?.icon || Package;

        return (
            <div key={step.id} className="group relative flex items-center gap-4">
                <div className="flex-1 glass-panel p-4 flex items-center gap-4 hover:border-indigo-500/50 transition-all">
                    <div className={cn("p-2 rounded-lg bg-indigo-500/10", tool?.color)}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-semibold">{tool?.name || 'Unknown Tool'}</h4>
                        <p className="text-[10px] text-foreground-muted">{tool?.description}</p>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                        <ArrowRight className="w-4 h-4 text-indigo-500/50 my-1 rotate-90" />
                        <div className="w-px h-8 bg-border-glass" />
                    </div>
                )}
            </div>
        );
    };

    return (
        <ToolPane
            title="Pipeline Mode (Tool Chain)"
            description="Chain multiple tools together to automate complex workflows"
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                {/* Left side: Workflow List & Tool Picker */}
                <div className="lg:col-span-4 flex flex-col gap-6 overflow-hidden">
                    <div className="flex-none glass-panel p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">My Pipelines</h3>
                            <Button variant="primary" size="xs" icon={Plus} onClick={handleCreateWorkflow}>New</Button>
                        </div>
                        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                            {workflows.length === 0 && (
                                <p className="text-[10px] text-foreground-muted text-center py-4 italic">No pipelines yet</p>
                            )}
                            {workflows.map(w => (
                                <div key={w.id} className="relative group">
                                    <button
                                        onClick={() => setActiveWorkflowId(w.id)}
                                        className={cn(
                                            "w-full px-3 py-2 rounded-lg text-left text-xs transition-all border pr-8",
                                            activeWorkflowId === w.id
                                                ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                                                : "border-transparent hover:bg-white/5 text-foreground-muted"
                                        )}
                                    >
                                        {w.name}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Delete this pipeline?')) {
                                                const isActive = activeWorkflowId === w.id;
                                                removeWorkflow(w.id);
                                                if (isActive) setActiveWorkflowId(null);
                                            }
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-foreground-muted hover:text-rose-400 transition-all"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {activeWorkflowId && (
                        <div className="flex-1 glass-panel p-4 flex flex-col gap-4 overflow-hidden">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Available Tools</h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                                {pipelineTools.map((t: any) => (
                                    <button
                                        key={t.id}
                                        onClick={() => addStep(activeWorkflowId, { toolId: t.id, options: {} })}
                                        className="w-full p-3 rounded-xl bg-white/5 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/30 text-left transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-1.5 rounded-lg bg-black/20", t.color)}>
                                                <t.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium group-hover:text-indigo-400">{t.name}</div>
                                                <div className="text-[10px] text-foreground-muted truncate w-40">{t.description}</div>
                                            </div>
                                            <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right side: Designer & Execution */}
                <div className="lg:col-span-8 flex flex-col gap-6 overflow-hidden">
                    {!activeWorkflowId ? (
                        <div className="flex-1 glass-panel flex flex-col items-center justify-center text-center p-12 space-y-6">
                            <div className="p-6 rounded-full bg-indigo-500/10 text-indigo-400">
                                <Plus className="w-12 h-12" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold">Select or Create a Pipeline</h2>
                                <p className="text-sm text-foreground-muted max-w-sm">
                                    Start building your automation by creating a new pipeline and adding your favorite tools.
                                </p>
                            </div>
                            <Button variant="primary" size="lg" icon={Plus} onClick={handleCreateWorkflow}>
                                Create New Pipeline
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                            {/* Workflow Header */}
                            <div className="glass-panel p-4 flex items-center gap-4">
                                <Input
                                    value={activeWorkflow?.name || ''}
                                    onChange={(e) => updateWorkflow(activeWorkflowId!, { name: e.target.value })}
                                    className="bg-transparent border-none text-lg font-bold p-0 focus:ring-0 min-w-[200px]"
                                />
                                <div className="ml-auto flex items-center gap-1.5">
                                    <Button
                                        variant="primary"
                                        icon={Play}
                                        loading={isRunning}
                                        onClick={handleRun}
                                        disabled={!activeWorkflow?.steps.length}
                                    >
                                        Run Pipeline
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                                {/* Steps Designer */}
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

                                {/* Testing Area */}
                                <div className="flex flex-col gap-4 overflow-hidden">
                                    <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                                        <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Initial Input</label>
                                        <textarea
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Paste initial data here..."
                                            className="flex-1 bg-black/20 border border-border-glass rounded-xl p-4 text-xs font-mono resize-none focus:outline-none focus:border-indigo-500/50"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold uppercase opacity-50 ml-1">Pipeline Output</label>
                                            <div className="flex items-center gap-1">
                                                <Button variant="ghost" size="xs" icon={Copy} onClick={() => {
                                                    if (output) {
                                                        navigator.clipboard.writeText(typeof output === 'string' ? output : JSON.stringify(output, null, 2));
                                                        toast.success('Output copied');
                                                    }
                                                }} />
                                                <Button variant="ghost" size="xs" icon={Download} onClick={() => {
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
                                            value={output ? (typeof output === 'string' ? output : JSON.stringify(output, null, 2)) : ''}
                                            readOnly
                                            placeholder="Execution result will appear here..."
                                            className={cn(
                                                "flex-1 bg-indigo-500/5 border border-border-glass rounded-xl p-4 text-xs font-mono resize-none focus:outline-none",
                                                output && "text-indigo-300"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ToolPane>
    );
};

export default PipelineDesigner;
