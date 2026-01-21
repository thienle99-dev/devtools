import React from 'react';
import { Layout, List, Star, Share2, Download, RotateCcw, XCircle, Play } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { cn } from '@utils/cn';
import type { Workflow } from '@store/workflowStore';
import type { PipelineViewMode } from '../types';

interface WorkflowHeaderProps {
    workflow: Workflow;
    viewMode: PipelineViewMode;
    onViewModeChange: (mode: PipelineViewMode) => void;
    onFavoriteToggle: () => void;
    onNameChange: (value: string) => void;
    onShare: () => void;
    onExport: () => void;
    onReset: () => void;
    canReset: boolean;
    isRunning: boolean;
    onCancel: () => void;
    onRun: () => void;
    runDisabled: boolean;
}

export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({
    workflow,
    viewMode,
    onViewModeChange,
    onFavoriteToggle,
    onNameChange,
    onShare,
    onExport,
    onReset,
    canReset,
    isRunning,
    onCancel,
    onRun,
    runDisabled,
}) => (
    <div className="glass-panel p-4 flex items-center gap-4">
        <button onClick={onFavoriteToggle}>
            <Star className={cn("w-5 h-5 transition-colors", workflow.isFavorite ? "fill-amber-400 text-amber-400" : "text-foreground-muted hover:text-amber-400")} />
        </button>
        <Input
            value={workflow.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="bg-transparent border-none text-lg font-bold p-0 focus:ring-0 min-w-[200px] text-foreground"
        />
        <div className="ml-auto flex items-center gap-1.5">
            <div className="flex bg-[var(--color-glass-item)] rounded-lg p-1 mr-2 border border-border-glass">
                <button
                    onClick={() => onViewModeChange('list')}
                    className={cn(
                        "p-1.5 rounded-md transition-all",
                        viewMode === 'list' ? "bg-indigo-500/20 text-indigo-400" : "text-foreground-muted hover:text-foreground"
                    )}
                    title="List View"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onViewModeChange('visual')}
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
                    onClick={onShare}
                    title="Share Configuration"
                />
                <Button
                    variant="ghost"
                    size="sm"
                    icon={Download}
                    onClick={onExport}
                    title="Export Pipeline"
                />
            </div>

            <div className="h-6 w-px bg-border-glass mx-2" />

            <Button
                variant="secondary"
                icon={RotateCcw}
                onClick={onReset}
                disabled={!canReset}
                title="Reset Pipeline Output"
            >
                Reset
            </Button>
            {isRunning ? (
                <Button
                    variant="secondary"
                    className="bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                    icon={XCircle}
                    onClick={onCancel}
                >
                    Cancel
                </Button>
            ) : (
                <Button
                    variant="primary"
                    icon={Play}
                    loading={isRunning}
                    onClick={onRun}
                    disabled={runDisabled}
                >
                    Run Pipeline
                </Button>
            )}
        </div>
    </div>
);

WorkflowHeader.displayName = 'WorkflowHeader';
