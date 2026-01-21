import type { WorkflowStep } from '@store/workflowStore';

export type PipelineViewMode = 'list' | 'visual';

export interface PipelineStepResult {
    status: 'pending' | 'running' | 'success' | 'error';
    output: any;
    error?: string;
    duration?: number;
}

export type StepResultsMap = Record<string, PipelineStepResult | undefined>;

export interface RunStepOptions {
    step: WorkflowStep;
    index: number;
}
