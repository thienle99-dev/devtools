import React from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import type { ToolState, Preset } from '../../../store/toolStore';

interface ToolSidebarProps {
    activeSidebar: 'help' | 'presets' | 'history' | null;
    setActiveSidebar: (sidebar: 'help' | 'presets' | 'history' | null) => void;
    helpContent?: ReactNode;
    presets: Preset[];
    toolId?: string;
    data?: ToolState;
    setToolData: any; // Using exact type from store would be better, using any for now to match prop drilling
    clearToolHistory: (toolId: string) => void;
    savePreset: () => void;
    deletePreset: (toolId: string, presetId: string) => void;
    loadPreset: (toolId: string, presetId: string) => void;
}

export const ToolSidebar: React.FC<ToolSidebarProps> = ({
    activeSidebar, setActiveSidebar, helpContent, presets, toolId, data,
    setToolData, clearToolHistory, savePreset, deletePreset, loadPreset
}) => {
    return (
        <AnimatePresence>
            {activeSidebar && (
                <motion.div
                    initial={{ x: 400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 400, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="w-80 border-l border-border-glass bg-[var(--color-glass-panel)]/50 backdrop-blur-3xl overflow-y-auto custom-scrollbar flex flex-col"
                >
                    <div className="p-6 flex items-center justify-between shrink-0">
                        <h3 className="text-lg font-bold capitalize">{activeSidebar}</h3>
                        <button
                            onClick={() => setActiveSidebar(null)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-foreground-muted transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 pt-0">
                        {activeSidebar === 'help' && helpContent && (
                            <div className="space-y-6 text-sm text-foreground-secondary leading-relaxed">
                                {helpContent}
                            </div>
                        )}

                        {activeSidebar === 'presets' && toolId && (
                            <div className="space-y-4">
                                <Button
                                    className="w-full justify-start gap-2"
                                    variant="secondary"
                                    onClick={savePreset}
                                >
                                    <Save className="w-4 h-4" />
                                    Save Current as Preset
                                </Button>

                                <div className="space-y-2">
                                    {presets.length === 0 && (
                                        <div className="text-center py-8 text-foreground-disabled italic text-sm">
                                            No presets saved yet
                                        </div>
                                    )}
                                    {presets.map((preset) => (
                                        <Card key={preset.id} className="p-3 bg-white/5 hover:bg-white/10 transition-colors group">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold text-sm truncate">{preset.name}</span>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => deletePreset(toolId, preset.id)}
                                                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded"
                                                        title="Delete Preset"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="w-full h-8 text-xs font-bold uppercase tracking-wider bg-indigo-500/5 hover:bg-indigo-500/20 text-indigo-400"
                                                onClick={() => loadPreset(toolId, preset.id)}
                                            >
                                                Apply Preset
                                            </Button>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeSidebar === 'history' && toolId && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-foreground-muted uppercase tracking-widest">Recent Activity</span>
                                    <button
                                        onClick={() => clearToolHistory(toolId)}
                                        className="text-[10px] font-bold text-rose-400/60 hover:text-rose-400 uppercase tracking-widest transition-colors"
                                    >
                                        Clear All
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {(data?.history || []).length === 0 && (
                                        <div className="text-center py-8 text-foreground-disabled italic text-sm">
                                            No history entries yet
                                        </div>
                                    )}
                                    {(data?.history || []).map((entry) => (
                                        <Card key={entry.id} className="p-3 bg-white/5 hover:bg-white/10 transition-colors flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-foreground-muted font-mono">
                                                    {new Date(entry.timestamp).toLocaleTimeString()}
                                                </span>
                                                <button
                                                    onClick={() => setToolData(toolId, { input: entry.input, options: entry.options })}
                                                    className="text-[10px] font-bold text-indigo-400 hover:underline uppercase tracking-widest"
                                                >
                                                    Restore
                                                </button>
                                            </div>
                                            <div className="text-xs font-medium text-foreground-secondary line-clamp-2 bg-black/20 p-2 rounded border border-white/5">
                                                {entry.input}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
