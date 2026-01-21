import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { cn } from '@utils/cn';

interface ToolPickerPanelProps {
    activeWorkflowId: string | null;
    suggestedTools: any[];
    pipelineTools: any[];
    onAddStep: (toolId: string) => void;
}

export const ToolPickerPanel: React.FC<ToolPickerPanelProps> = ({
    activeWorkflowId,
    suggestedTools,
    pipelineTools,
    onAddStep,
}) => {
    if (!activeWorkflowId) return null;

    return (
        <div className="flex-1 glass-panel p-4 flex flex-col gap-4 overflow-hidden">
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
                                onClick={() => onAddStep(t.id)}
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
                        onClick={() => onAddStep(t.id)}
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
    );
};

ToolPickerPanel.displayName = 'ToolPickerPanel';
