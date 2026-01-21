import React, { useState, useMemo, Suspense } from 'react';
import { ToolPane } from '@components/layout/ToolPane';
import { Plus, Loader2 } from 'lucide-react';
import { useWorkflowStore, type WorkflowStep } from '@store/workflowStore';
import { toast } from 'sonner';
import { TOOLS } from '@tools/registry';
import { ConfirmationModal } from '@components/ui/ConfirmationModal';
import { TemplateSelector } from './TemplateSelector';
import type { ChainTemplate } from '@store/chainTemplates';
import { WorkflowListPanel } from './pipeline/components/WorkflowListPanel';
import { ToolPickerPanel } from './pipeline/components/ToolPickerPanel';
import { WorkflowHeader } from './pipeline/components/WorkflowHeader';
import { StepListView } from './pipeline/components/StepListView';
import { TestingPanel } from './pipeline/components/TestingPanel';
import type { PipelineViewMode, StepResultsMap } from './pipeline/types';
import { Button } from '@/components/ui/Button';

// Lazy load the visual designer to avoid loading ReactFlow heavy chunk when not needed
const VisualPipelineDesigner = React.lazy(() => import('./VisualPipelineDesigner'));
const TOOL_ID = 'pipeline-designer';

const PipelineDesigner: React.FC = () => {
    const { workflows, addWorkflow, updateWorkflow, deleteWorkflow, duplicateWorkflow, addStep, updateStep, removeStep, toggleFavorite } = useWorkflowStore();
    const removeWorkflow = deleteWorkflow; // Alias for cleaner usage
    const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<PipelineViewMode>('list');
    const [input, setInput] = useState('');
    const [stepResults, setStepResults] = useState<StepResultsMap>({});
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

    const handleAddStep = (toolId: string) => {
        if (!activeWorkflowId) return;
        addStep(activeWorkflowId, { toolId, options: {} });
    };

    const handleToggleStep = (stepId: string) => {
        if (!activeWorkflow) return;
        const step = activeWorkflow.steps.find(s => s.id === stepId);
        if (!step) return;
        updateStep(activeWorkflow.id, stepId, { disabled: !step.disabled });
    };

    const handleRunSingleStep = async (_: WorkflowStep, index: number) => {
        if (!activeWorkflow) return;
        let startData: any = input;
        if (index > 0) {
            const prevStep = activeWorkflow.steps[index - 1];
            const prevResult = stepResults[prevStep.id];
            if (!prevResult || prevResult.output === undefined) {
                toast.error('Previous step must be executed first');
                return;
            }
            startData = prevResult.output;
        }
        await runStep(index, startData);
    };

    const handleRemoveStep = (stepId: string) => {
        if (!activeWorkflow) return;
        removeStep(activeWorkflow.id, stepId);
    };

    const finalOutput = useMemo(() => {
        if (!activeWorkflow || activeWorkflow.steps.length === 0) return '';
        const lastStepId = activeWorkflow.steps[activeWorkflow.steps.length - 1].id;
        const output = stepResults[lastStepId]?.output;
        if (output === undefined || output === null) return '';
        return typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    }, [activeWorkflow, stepResults]);

    const handleCopyOutput = () => {
        if (!finalOutput) return;
        navigator.clipboard.writeText(finalOutput);
        toast.success('Output copied');
    };

    const handleDownloadOutput = () => {
        if (!finalOutput) return;
        const blob = new Blob([finalOutput], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pipeline-output.txt';
        a.click();
        URL.revokeObjectURL(url);
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
            toolId={TOOL_ID}
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
                    <WorkflowListPanel
                        workflows={sortedWorkflows}
                        activeWorkflowId={activeWorkflowId}
                        filterFavorites={filterFavorites}
                        onToggleFavorites={() => setFilterFavorites(!filterFavorites)}
                        onSelectWorkflow={setActiveWorkflowId}
                        onFavorite={toggleFavorite}
                        onDuplicate={duplicateWorkflow}
                        onDelete={(id) => setWorkflowToDelete(id)}
                        onCreateNew={() => setShowTemplates(true)}
                        onImport={() => fileInputRef.current?.click()}
                    />

                    <ToolPickerPanel
                        activeWorkflowId={activeWorkflowId}
                        suggestedTools={suggestedTools}
                        pipelineTools={pipelineTools}
                        onAddStep={handleAddStep}
                    />
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
                            <WorkflowHeader
                                workflow={activeWorkflow}
                                viewMode={viewMode}
                                onViewModeChange={setViewMode}
                                onFavoriteToggle={() => toggleFavorite(activeWorkflow.id)}
                                onNameChange={(value) => updateWorkflow(activeWorkflowId!, { name: value })}
                                onShare={handleShare}
                                onExport={handleExport}
                                onReset={handleReset}
                                canReset={Object.keys(stepResults).length > 0}
                                isRunning={isRunning}
                                onCancel={handleCancel}
                                onRun={handleRun}
                                runDisabled={!activeWorkflow.steps.length}
                            />

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                                {viewMode === 'list' ? (
                                    <>
                                        <StepListView
                                            steps={activeWorkflow.steps}
                                            stepResults={stepResults}
                                            onToggleStep={handleToggleStep}
                                            onRunStep={handleRunSingleStep}
                                            onRemoveStep={handleRemoveStep}
                                        />
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
                                    <TestingPanel
                                        inputValue={input}
                                        onInputChange={setInput}
                                        outputValue={finalOutput}
                                        onCopyOutput={handleCopyOutput}
                                        onDownloadOutput={handleDownloadOutput}
                                        hasOutput={Boolean(finalOutput)}
                                    />
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
