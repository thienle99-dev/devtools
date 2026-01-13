import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PluginManifest, PluginProgress } from '@/types/plugin';
import { X, CheckCircle2, AlertTriangle, Download, Box, ShieldCheck, Zap, Layers, RefreshCw } from 'lucide-react';
import { cn } from '@utils/cn';

interface InstallProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  plugin: PluginManifest | null;
}

export const InstallProgressModal: React.FC<InstallProgressModalProps> = ({ 
  isOpen, 
  onClose,
  plugin 
}) => {
  const [progress, setProgress] = useState<PluginProgress>({ stage: 'download', percent: 0, message: 'Initializing...' });
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (isOpen && plugin) {
      setProgress({ stage: 'download', percent: 0, message: 'Warming up...' });
      setError(null);
      setCompleted(false);

      const cleanup = window.pluginAPI.onPluginProgress((p) => {
        setProgress(p);
        if (p.stage === 'error') setError(p.message);
        else if (p.stage === 'complete') setCompleted(true);
      });

      return cleanup;
    }
  }, [isOpen, plugin]);

  if (!isOpen || !plugin) return null;

  const steps = [
    { id: 'download', label: 'Retrieving Binary', icon: Download },
    { id: 'verify', label: 'Checking Integrity', icon: ShieldCheck },
    { id: 'dependencies', label: 'Link Dependencies', icon: Layers },
    { id: 'register', label: 'Mounting Module', icon: Zap },
  ];
  
  const activeStep = completed ? steps.length : (
      progress.stage === 'download' ? 0 : 
      progress.stage === 'verify' ? 1 :
      progress.stage === 'extract' ? 2 :
      progress.stage === 'dependencies' ? 2 :
      progress.stage === 'validate' ? 3 :
      progress.stage === 'register' ? 3 : 0
  );

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/40 dark:bg-black/80 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="w-full max-w-lg bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-300 relative">
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-[200px] bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="p-10 pb-6 relative z-10">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/5">
                        <Box size={20} className="text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight">
                            {completed ? 'Success' : (error ? 'Protocol Error' : 'Installation Sequence')}
                        </h3>
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-30 italic">
                            {plugin.name} v{plugin.version}
                        </p>
                    </div>
                </div>
                {(completed || error) && (
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center opacity-20 hover:opacity-100 transition-all">
                        <X size={20} />
                    </button>
                )}
            </div>
        </div>

        {/* Content */}
        <div className="px-10 pb-10 relative z-10">
            {!error ? (
                <>
                    {/* Visual Progress Ring/Bar Area */}
                    <div className="mb-12 relative p-8 bg-black/5 dark:bg-black/40 rounded-[2rem] border border-black/5 dark:border-white/5">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400/80 font-bold">Current Stage</span>
                            <span className="text-2xl font-black font-mono tabular-nums">{progress.percent}%</span>
                        </div>
                        
                        <div className="h-4 bg-black/5 dark:bg-white/[0.03] rounded-full overflow-hidden border border-black/5 dark:border-white/5 p-1">
                            <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300 dark:to-white rounded-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                style={{ width: `${progress.percent}%` }}
                            />
                        </div>
                        <p className="mt-4 text-[11px] font-bold opacity-40 italic flex items-center gap-2">
                            <RefreshCw size={10} className="animate-spin" />
                            {progress.message}
                        </p>
                    </div>

                    {/* Sequential Trace */}
                    <div className="space-y-3">
                        {steps.map((step, index) => {
                            const isDone = activeStep > index;
                            const isCurrent = activeStep === index;
                            const Icon = step.icon;

                            return (
                                <div key={step.id} className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500",
                                    isDone ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                                    isCurrent ? "bg-black/5 dark:bg-white/[0.03] border-black/10 dark:border-white/10 shadow-xl shadow-black/5" :
                                    "bg-transparent border-transparent opacity-20"
                                )}>
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-500 font-bold",
                                        isDone ? "bg-emerald-500 border-emerald-500 text-white dark:text-black shadow-lg shadow-emerald-500/20" :
                                        isCurrent ? "bg-indigo-500 text-white border-white/20 shadow-lg shadow-indigo-500/40" :
                                        "border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5"
                                    )}>
                                        {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest">{step.label}</span>
                                    {isCurrent && (
                                        <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="text-center py-6">
                    <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-500/20 shadow-2xl shadow-rose-500/10">
                        <AlertTriangle className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-black mb-2">Operation Failure</h4>
                    <p className="opacity-40 text-xs mb-8 max-w-xs mx-auto font-medium leading-relaxed">
                        Secure installation protocol was interrupted. Check logs for trace details.
                    </p>
                    <div className="bg-black/5 dark:bg-black/50 p-4 rounded-2xl border border-black/5 dark:border-white/5 mb-8">
                        <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400/80 break-words">{error}</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-full h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all active:scale-95 shadow-xl"
                    >
                        Acknowledge & Sync
                    </button>
                </div>
            )}
        </div>

        {/* Footer */}
        {completed && !error && (
            <div className="p-8 pt-0 relative z-10 animate-in slide-in-from-bottom duration-700">
                <button 
                    className="w-full h-16 rounded-[1.5rem] bg-emerald-500 text-white dark:text-black text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-emerald-500/40 group" 
                    onClick={onClose}
                >
                    <Zap className="w-4 h-4 fill-current group-hover:scale-125 transition-transform" />
                    Launch Module
                </button>
            </div>
        )}
      </div>
    </div>,
    document.body
  );
};
