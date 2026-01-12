import { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import { Loader2, CheckCircle2, XCircle, Trash2, X, ChevronUp, ChevronDown, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';

export const TaskQueue = () => {
    const { tasks, removeTask } = useTaskStore();
    const [expanded, setExpanded] = useState(false);

    if (tasks.length === 0) return null;

    const running = tasks.filter(t => t.status === 'running' || t.status === 'pending').length;
    const errors = tasks.filter(t => t.status === 'error').length;

    const handleCancel = (task: any) => {
        if (task.onCancel) task.onCancel();
        removeTask(task.id);
    };

    return (
        <div className={cn(
            "fixed bottom-4 right-4 z-[100] flex flex-col items-end transition-all duration-300 pointer-events-none",
            expanded ? "w-80" : "w-auto"
        )}>
            <div className="pointer-events-auto">
            {expanded && (
                <div className="w-80 bg-background/95 backdrop-blur-lg border border-border rounded-lg shadow-2xl overflow-hidden mb-2 animate-in slide-in-from-bottom-5">
                    <div className="p-3 border-b border-border bg-muted/50 flex justify-between items-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Background Tasks</span>
                        <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground">
                            <ChevronDown className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {tasks.map(task => (
                            <div key={task.id} className="p-3 rounded-md bg-card border border-border text-sm relative group hover:border-border-active transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium truncate pr-6 text-foreground">{task.name}</span>
                                    {task.cancelable && (task.status === 'running' || task.status === 'pending') && (
                                         <button onClick={() => handleCancel(task)} className="text-muted-foreground hover:text-red-400 absolute top-2 right-2">
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                    { (task.status === 'completed' || task.status === 'error') && (
                                        <button onClick={() => removeTask(task.id)} className="text-muted-foreground hover:text-red-400 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2 mb-2">
                                    {task.status === 'running' && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
                                    {task.status === 'pending' && <span className="w-3 h-3 block rounded-full bg-muted-foreground/30" />}
                                    {task.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                                    {task.status === 'error' && <XCircle className="w-3 h-3 text-rose-400" />}
                                    
                                    <span className={cn(
                                        "text-xs capitalize",
                                        task.status === 'error' ? 'text-rose-400' : 'text-muted-foreground'
                                    )}>{task.status}</span>
                                    {task.message && <span className="text-xs text-muted-foreground/70 truncate flex-1 block max-w-[120px]" title={task.message}>- {task.message}</span>}
                                </div>

                                <div className="h-1 w-full bg-muted/50 rounded-full overflow-hidden">
                                    <div 
                                        className={cn("h-full transition-all duration-500 ease-out", 
                                            task.status === 'error' ? 'bg-rose-500' : 
                                            task.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                                        )}
                                        style={{ width: `${Math.max(task.progress, 5)}%` }} // Always show a little bit
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button 
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-full shadow-lg transition-all border border-transparent",
                    running > 0 
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20" 
                        : "bg-background border-border text-foreground hover:bg-muted shadow-xl"
                )}
            >
                {running > 0 ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Activity className="w-4 h-4" />
                )}
                <span className="font-semibold text-sm">
                    {running > 0 ? `${running} Running` : `${tasks.length} Tasks`}
                </span>
                {errors > 0 && (
                     <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1">{errors}</span>
                )}
                <ChevronUp className={cn("w-4 h-4 transition-transform duration-300", expanded ? "rotate-180" : "")} />
            </button>
            </div>
        </div>
    );
};
