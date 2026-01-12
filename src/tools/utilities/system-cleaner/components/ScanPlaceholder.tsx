import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { cn } from '@utils/cn';

interface ScanPlaceholderProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    onScan: () => void;
    isScanning: boolean;
    progress: number;
    tips?: string[];
    quickActions?: Array<{ label: string; onClick: () => void }>;
}

export const ScanPlaceholder: React.FC<ScanPlaceholderProps> = ({
    title,
    icon: Icon,
    description,
    onScan,
    isScanning,
    progress,
    tips = [],
    quickActions = []
}) => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 text-center max-w-2xl mx-auto animate-in fade-in duration-500">
        <div className="relative">
            <div className={cn(
                "absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full transition-opacity duration-500",
                isScanning ? "opacity-100" : "opacity-0"
            )} />
            <div className={cn(
                "relative p-8 rounded-full border transition-all duration-500",
                isScanning ? "bg-indigo-500/10 border-indigo-500/50 scale-110" : "bg-white/5 border-border-glass"
            )}>
                {isScanning ? (
                    <>
                        <Loader2 className="w-16 h-16 text-indigo-400 animate-spin" />
                        <motion.div
                            className="absolute -top-1 -right-1"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                            <Sparkles className="w-6 h-6 text-indigo-400/70" />
                        </motion.div>
                    </>
                ) : (
                    <Icon className="w-16 h-16 text-foreground-muted" />
                )}
            </div>
        </div>

        {!isScanning ? (
            <div className="space-y-6 w-full">
                <div>
                    <h2 className="text-3xl font-bold text-foreground mb-3">{title}</h2>
                    <p className="text-foreground-muted leading-relaxed">{description}</p>
                </div>

                {/* Tips Section */}
                {tips.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4 border border-border-glass/50 text-left">
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-bold">Tips</span>
                        </div>
                        <ul className="space-y-2">
                            {tips.map((tip, i) => (
                                <li key={i} className="text-xs text-foreground-muted flex items-start gap-2">
                                    <ArrowRight className="w-3 h-3 mt-0.5 text-indigo-400 flex-shrink-0" />
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Quick Actions */}
                {quickActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {quickActions.map((action, i) => (
                            <Button
                                key={i}
                                variant="outline"
                                size="sm"
                                onClick={action.onClick}
                                className="text-xs"
                            >
                                {action.label}
                            </Button>
                        ))}
                    </div>
                )}

                <Button 
                    size="lg" 
                    variant="primary" 
                    className="px-12 py-6 rounded-2xl text-lg font-bold shadow-lg shadow-indigo-500/20"
                    onClick={onScan}
                >
                    Start Scan
                </Button>
            </div>
        ) : (
            <div className="w-full space-y-6">
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">Scanning System...</h3>
                    <p className="text-sm text-foreground-muted">Please wait while we analyze your files</p>
                </div>
                <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden border border-border-glass">
                    <motion.div 
                        className="absolute top-0 left-0 h-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <div className="text-2xl font-black text-indigo-400 font-mono">{progress}%</div>
            </div>
        )}
    </div>
);

