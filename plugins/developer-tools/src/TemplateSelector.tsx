import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHAIN_TEMPLATES, type ChainTemplate } from '@store/chainTemplates';
import { Plus, X, Sparkles, Zap, ArrowRight, Layers, Layout, ChevronRight } from 'lucide-react';
import { TOOLS } from '@tools/registry';
import { cn } from '@utils/cn';

interface TemplateSelectorProps {
    onSelect: (template: ChainTemplate) => void;
    onCancel: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelect, onCancel }) => {
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onCancel}
                    className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md"
                />
                
                {/* Modal Container */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="w-full max-w-5xl bg-[var(--color-glass-panel)] border border-border-glass rounded-[24px] shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[85vh] overflow-hidden relative backdrop-blur-xl"
                >
                    {/* Decorative background elements */}
                    <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                    <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/10 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

                    {/* Header */}
                    <div className="px-6 py-5 border-b border-border-glass flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                                <Layout className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground tracking-tight leading-tight">Choose a Template</h2>
                                <p className="text-[11px] text-foreground-muted font-medium">Select a preset or create from scratch</p>
                            </div>
                        </div>
                        <button 
                            onClick={onCancel}
                            className="w-8 h-8 rounded-full border border-border-glass flex items-center justify-center hover:bg-foreground/5 transition-colors group"
                        >
                            <X className="w-4 h-4 text-foreground-muted group-hover:text-foreground transition-colors" />
                        </button>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative z-10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                            {/* Blank Option Card */}
                            <motion.button
                                whileHover={{ y: -2, border: '1px solid var(--accent-color)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onSelect({ id: 'blank', name: 'Blank Pipeline', description: 'Start from scratch', steps: [] })}
                                className="group relative flex flex-col text-left p-4 rounded-2xl border border-border-glass bg-foreground/[0.01] hover:bg-indigo-500/[0.02] transition-all overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 size-24 bg-indigo-500/5 blur-3xl" />
                                
                                <div className="mb-3 p-2.5 w-fit rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                    <Plus className="w-5 h-5" />
                                </div>
                                
                                <div className="space-y-1 flex-1">
                                    <h3 className="text-sm font-bold text-foreground group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">Blank Canvas</h3>
                                    <p className="text-[11px] text-foreground-muted leading-relaxed font-medium line-clamp-2">Build your own custom chain from the ground up.</p>
                                </div>
                                
                                <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-indigo-500 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0">
                                    START NEW <ArrowRight className="w-3 h-3" />
                                </div>
                            </motion.button>

                            {/* Templates */}
                            {CHAIN_TEMPLATES.map((template, index) => (
                                <motion.button
                                    key={template.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    whileHover={{ y: -2, border: '1px solid var(--accent-color)' }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelect(template)}
                                    className="group relative flex flex-col text-left p-4 rounded-2xl border border-border-glass bg-foreground/[0.01] hover:bg-glass-button-hover transition-all overflow-hidden h-full"
                                >
                                    <div className="absolute top-0 right-0 size-24 bg-indigo-500/5 blur-3xl transition-colors" />
                                    
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="px-2 py-0.5 rounded-md bg-foreground/[0.05] border border-border-glass text-[9px] font-bold text-foreground-muted uppercase tracking-wider flex items-center gap-1">
                                            <Zap className="w-2.5 h-2.5 text-amber-500" /> {template.steps.length}
                                        </div>
                                        <ChevronRight className="w-3.5 h-3.5 text-foreground-muted opacity-0 group-hover:opacity-100 group-hover:text-indigo-500 transition-all" />
                                    </div>
                                    
                                    <div className="space-y-1 flex-1">
                                        <h3 className="text-sm font-bold text-foreground group-hover:text-indigo-500 transition-colors leading-snug">
                                            {template.name}
                                        </h3>
                                        <p className="text-[11px] text-foreground-muted leading-relaxed font-medium line-clamp-2">
                                            {template.description}
                                        </p>
                                    </div>
                                    
                                    {/* Visual Flow Indicator - Compact */}
                                    <div className="mt-4 pt-3 border-t border-border-glass flex items-center gap-1.5 flex-wrap">
                                        {template.steps.map((step, i) => {
                                            const tool = TOOLS.find(t => t.id === step.toolId);
                                            const Icon = tool?.icon || Layers;
                                            return (
                                                <React.Fragment key={i}>
                                                    <div 
                                                        className="w-6 h-6 rounded-md bg-foreground/[0.03] border border-border-glass flex items-center justify-center group-hover:border-foreground/10 transition-colors"
                                                        title={tool?.name || step.label}
                                                    >
                                                        <Icon className={cn("w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity", tool?.color || 'text-foreground')} />
                                                    </div>
                                                    {i < template.steps.length - 1 && (
                                                        <div className="w-1.5 h-px bg-foreground/10" />
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Footer - Compacter */}
                    <div className="px-6 py-3 bg-foreground/[0.01] border-t border-border-glass flex items-center gap-2 relative z-10">
                        <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                        <span className="text-[9px] font-bold text-foreground-muted uppercase tracking-widest">Ordered Execution System</span>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
