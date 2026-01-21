import React from 'react';
import { ArrowRight, CheckCircle, Loader2, Package, RotateCcw, Trash2, Play, XCircle } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import { TOOLS } from '@tools/registry';
import type { WorkflowStep } from '@store/workflowStore';
import type { StepResultsMap } from '../types';

interface StepListViewProps {
    steps: WorkflowStep[];
    stepResults: StepResultsMap;
    onToggleStep: (stepId: string) => void;
    onRunStep: (step: WorkflowStep, index: number) => void;
    onRemoveStep: (stepId: string) => void;
}

export const StepListView: React.FC<StepListViewProps> = ({
    steps,
    stepResults,
    onToggleStep,
    onRunStep,
    onRemoveStep,
}) => (
    <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-2">
            Pipeline Steps ({steps.length})
        </h3>
        {steps.length === 0 ? (
            <div className="flex-1 border-2 border-dashed border-border-glass rounded-2xl flex flex-col items-center justify-center p-8 text-center gap-3">
                <Package className="w-8 h-8 text-foreground-muted opacity-30" />
                <p className="text-xs text-foreground-muted">Add tools from the left to start your chain</p>
            </div>
        ) : (
            <div className="space-y-4">
                {steps.map((step, idx) => (
                    <PipelineStepCard
                        key={step.id}
                        step={step}
                        index={idx}
                        totalSteps={steps.length}
                        result={stepResults[step.id]}
                        onToggleStep={onToggleStep}
                        onRunStep={onRunStep}
                        onRemoveStep={onRemoveStep}
                    />
                ))}
            </div>
        )}
    </div>
);

interface PipelineStepCardProps {
    step: WorkflowStep;
    index: number;
    totalSteps: number;
    result?: StepResultsMap[string];
    onToggleStep: (stepId: string) => void;
    onRunStep: (step: WorkflowStep, index: number) => void;
    onRemoveStep: (stepId: string) => void;
}

const PipelineStepCard: React.FC<PipelineStepCardProps> = ({
    step,
    index,
    totalSteps,
    result,
    onToggleStep,
    onRunStep,
    onRemoveStep,
}) => {
    const tool = TOOLS.find((t: any) => t.id === step.toolId);
    const Icon = tool?.icon || Package;

    return (
        <div className="group relative flex items-center gap-4">
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
                            onToggleStep(step.id);
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
                            onRunStep(step, index);
                        }}
                        className={cn(result?.status === 'error' ? "text-amber-400" : "text-indigo-400")}
                        title={result?.status === 'error' ? "Retry Step" : "Run only this step"}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        onClick={() => onRemoveStep(step.id)}
                        className="text-rose-400 hover:text-rose-500 hover:bg-rose-500/10"
                    />
                </div>
            </div>
            {index < totalSteps - 1 && (
                <div className="flex flex-col items-center">
                    <div className="w-px h-8 bg-border-glass" />
                    <ArrowRight className="w-4 h-4 text-foreground-muted/50 my-1 rotate-90" />
                    <div className="w-px h-8 bg-border-glass" />
                </div>
            )}
        </div>
    );
};

StepListView.displayName = 'StepListView';
PipelineStepCard.displayName = 'PipelineStepCard';
