import React from 'react';
import { Star, Upload, Plus, Copy, Trash2 } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { cn } from '@utils/cn';
import type { Workflow } from '@store/workflowStore';
import { toast } from 'sonner';

interface WorkflowListPanelProps {
    workflows: Workflow[];
    activeWorkflowId: string | null;
    filterFavorites: boolean;
    onToggleFavorites: () => void;
    onSelectWorkflow: (id: string) => void;
    onFavorite: (id: string) => void;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onCreateNew: () => void;
    onImport: () => void;
}

export const WorkflowListPanel: React.FC<WorkflowListPanelProps> = ({
    workflows,
    activeWorkflowId,
    filterFavorites,
    onToggleFavorites,
    onSelectWorkflow,
    onFavorite,
    onDuplicate,
    onDelete,
    onCreateNew,
    onImport,
}) => (
    <div className="flex-none glass-panel p-4 space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground-muted">My Pipelines</h3>
            <div className="flex gap-2">
                <button
                    onClick={onToggleFavorites}
                    className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        filterFavorites ? "bg-amber-500/20 text-amber-500" : "hover:bg-glass-button text-foreground-muted"
                    )}
                    title="Show Favorites Only"
                >
                    <Star className={cn("w-4 h-4", filterFavorites && "fill-current")} />
                </button>
                <Button variant="secondary" size="xs" icon={Upload} onClick={onImport}>Import</Button>
                <Button variant="primary" size="xs" icon={Plus} onClick={onCreateNew}>New</Button>
            </div>
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
            {workflows.length === 0 && (
                <p className="text-[10px] text-foreground-muted text-center py-4 italic">
                    {filterFavorites ? 'No favorite pipelines' : 'No pipelines yet'}
                </p>
            )}
            {workflows.map(w => (
                <div key={w.id} className="relative group">
                    <button
                        onClick={() => onSelectWorkflow(w.id)}
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
                            onClick={(e) => { e.stopPropagation(); onFavorite(w.id); }}
                            className="p-1.5 text-foreground-muted hover:text-amber-500 transition-colors"
                            title="Favorite"
                        >
                            <Star className={cn("w-3 h-3", w.isFavorite && "fill-current text-amber-500")} />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDuplicate(w.id);
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
                                onDelete(w.id);
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
);

WorkflowListPanel.displayName = 'WorkflowListPanel';
