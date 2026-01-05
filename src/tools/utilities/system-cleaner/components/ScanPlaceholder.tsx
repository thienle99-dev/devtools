import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { cn } from '../../../../utils/cn';

interface ScanPlaceholderProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    onScan: () => void;
    isScanning: boolean;
    progress: number;
}

export const ScanPlaceholder: React.FC<ScanPlaceholderProps> = ({
    title,
    icon: Icon,
    description,
    onScan,
    isScanning,
    progress
}) => (
    <div className="flex flex-col items-center justify-center h-full space-y-8 text-center max-w-lg mx-auto animate-in fade-in duration-500">
        <div className="relative">
            <div className={cn(
                "absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full transition-opacity duration-500",
                isScanning ? "opacity-100" : "opacity-0"
            )} />
            <div className={cn(
                "relative p-8 rounded-full border transition-all duration-500",
                isScanning ? "bg-indigo-500/10 border-indigo-500/50 scale-110" : "bg-white/5 border-border-glass"
            )}>
                {isScanning ? <Loader2 className="w-16 h-16 text-indigo-400 animate-spin" /> : <Icon className="w-16 h-16 text-foreground-muted" />}
            </div>
        </div>

        {!isScanning ? (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-foreground mb-3">{title}</h2>
                    <p className="text-foreground-muted leading-relaxed">{description}</p>
                </div>
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

