import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PluginManifest, PluginProgress } from '@/types/plugin';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { X, CheckCircle2, AlertTriangle, Download, Box, ShieldCheck } from 'lucide-react';
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
      // Reset state on open
      setProgress({ stage: 'download', percent: 0, message: 'Starting download...' });
      setError(null);
      setCompleted(false);

      // Listen for progress
      const cleanup = window.pluginAPI.onPluginProgress((p) => {
        setProgress(p);
        if (p.stage === 'error') {
            setError(p.message);
        } else if (p.stage === 'complete') {
            setCompleted(true);
        }
      });

      return cleanup;
    }
  }, [isOpen, plugin]);

  if (!isOpen || !plugin) return null;

  const steps = [
    { id: 'download', label: 'Download Package', icon: Download },
    { id: 'verify', label: 'Verify Integrity', icon: ShieldCheck },
    { id: 'dependencies', label: 'Install Dependencies', icon: Box },
    { id: 'register', label: 'Register Plugin', icon: CheckCircle2 },
  ];
  
  // Custom mapping for unknown stages
  const activeStep = completed ? steps.length : (
      progress.stage === 'download' ? 0 : 
      progress.stage === 'verify' ? 1 :
      progress.stage === 'extract' ? 2 : // Extract is part of dep/install phase visually
      progress.stage === 'dependencies' ? 2 :
      progress.stage === 'validate' ? 3 :
      progress.stage === 'register' ? 3 : 0
  );

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="w-[450px] bg-card border-border p-0 overflow-hidden shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/50">
            <div>
                <h3 className="text-lg font-semibold text-foreground mb-0.5">
                    {completed ? 'Installation Complete' : (error ? 'Installation Failed' : 'Installing Plugin')}
                </h3>
                <p className="text-sm text-muted-foreground">{plugin.name} v{plugin.version}</p>
            </div>
            {!completed && !error && (
                <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
            )}
            {(completed || error) && (
                 <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full">
                     <X className="w-5 h-5 text-muted-foreground" />
                 </Button>
            )}
        </div>

        {/* Content */}
        <div className="p-6">
            {!error ? (
                <>
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="flex justify-between text-xs mb-2">
                             <span className="text-muted-foreground font-medium">{progress.message}</span>
                             <span className="text-primary font-mono">{progress.percent}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-primary transition-all duration-300 ease-out"
                                style={{ width: `${progress.percent}%` }}
                            />
                        </div>
                    </div>

                    {/* Step List */}
                    <div className="space-y-4">
                        {steps.map((step, index) => {
                            const isDone = activeStep > index;
                            const isCurrent = activeStep === index;
                            const Icon = step.icon;

                            return (
                                <div key={step.id} className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg transition-colors border",
                                    isDone ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" :
                                    isCurrent ? "bg-primary/10 border-primary/20 text-foreground" :
                                    "bg-muted/50 border-border text-muted-foreground"
                                )}>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center border",
                                        isDone ? "bg-emerald-500 border-emerald-500 text-black" :
                                        isCurrent ? "border-primary text-primary" :
                                        "border-muted bg-muted"
                                    )}>
                                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                                    </div>
                                    <span className="text-sm font-medium">{step.label}</span>
                                    {isCurrent && (
                                        <span className="ml-auto text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full animate-pulse">
                                            Processing...
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-medium text-foreground mb-2">Installation Error</h4>
                    <p className="text-muted-foreground text-sm mb-6 max-w-[90%] mx-auto bg-muted/50 p-3 rounded-lg border border-border break-words">
                        {error}
                    </p>
                    <Button variant="secondary" onClick={onClose} className="w-full">
                        Close
                    </Button>
                </div>
            )}
        </div>

        {/* Footer */}
        {completed && !error && (
            <div className="p-5 border-t border-border bg-emerald-500/5">
                <Button variant="success" className="w-full" onClick={onClose}>
                    Done! Start Using Plugin
                </Button>
            </div>
        )}
      </Card>
    </div>,
    document.body
  );
};
