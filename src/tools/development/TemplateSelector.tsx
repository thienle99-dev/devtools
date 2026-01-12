import React from 'react';
import { CHAIN_TEMPLATES, type ChainTemplate } from '@store/chainTemplates';
import { Button } from '@components/ui/Button';
import { Plus } from 'lucide-react';



interface TemplateSelectorProps {
    onSelect: (template: ChainTemplate) => void;
    onCancel: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, onCancel }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-3xl bg-[var(--color-glass-panel)] border border-border-glass rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-border-glass">
                    <h2 className="text-xl font-bold text-foreground">Choose a Template</h2>
                    <p className="text-sm text-foreground-muted mt-1">Start with a pre-configured workflow or create a blank one.</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4 custom-scrollbar">
                    {/* Blank Option */}
                    <button
                        onClick={() => onSelect({ id: 'blank', name: 'Blank Pipeline', description: 'Start from scratch', steps: [] })}
                        className="flex flex-col text-left p-4 rounded-xl border border-border-glass hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
                    >
                        <div className="p-3 w-fit rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform mb-4">
                            <Plus className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-foreground">Blank Pipeline</h3>
                        <p className="text-xs text-foreground-muted mt-1">Create a custom workflow from scratch</p>
                    </button>

                    {CHAIN_TEMPLATES.map(template => (
                        <button
                            key={template.id}
                            onClick={() => onSelect(template)}
                            className="flex flex-col text-left p-4 rounded-xl border border-border-glass hover:border-indigo-500/50 hover:bg-glass-button transition-all group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-foreground select-none pointer-events-none">
                                {template.steps.length}
                            </div>
                            <h3 className="font-bold text-foreground relative z-10">{template.name}</h3>
                            <p className="text-xs text-foreground-muted mt-1 relative z-10">{template.description}</p>
                            
                            <div className="mt-4 flex flex-wrap gap-1 relative z-10">
                                {template.steps.map((step, i) => (
                                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/5 text-foreground-muted border border-border-glass">
                                        {step.label || step.toolId}
                                    </span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-border-glass flex justify-end">
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                </div>
            </div>
        </div>
    );
};
