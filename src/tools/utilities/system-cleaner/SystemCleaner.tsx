import React, { useState } from 'react';
import { ToolPane } from '../../../components/layout/ToolPane';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { 
    Trash2, 
    Shield, 
    Zap, 
    RotateCcw, 
    HardDrive,
    ShieldCheck,
    Wrench,
    CheckCircle2
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useSystemCleanerStore } from './store/systemCleanerStore';
import { useSmartScan } from './hooks/useSmartScan';
import { motion, AnimatePresence } from 'framer-motion';

// Sub-components
const SmartScan = () => {
    const { isScanning, scanProgress, scanStatus, results } = useSystemCleanerStore();
    const { runSmartScan } = useSmartScan();
    
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    };
    
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in duration-500">
            {!results && !isScanning && (
                <div className="text-center max-w-lg space-y-6">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                        <div className="relative bg-indigo-500/10 p-8 rounded-full border border-indigo-500/20">
                            <Shield className="w-16 h-16 text-indigo-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-foreground mb-3">System Smart Care</h2>
                        <p className="text-foreground-muted leading-relaxed">
                            Analyze your system for junk files, malware, performance issues, and more. 
                            Keep your Mac/PC running fast and secure with one click.
                        </p>
                    </div>
                    <Button 
                        size="lg" 
                        variant="primary" 
                        className="px-12 py-6 rounded-2xl text-lg font-bold shadow-lg shadow-indigo-500/20"
                        onClick={runSmartScan}
                    >
                        Start Smart Scan
                    </Button>
                </div>
            )}

            {isScanning && (
                <div className="w-full max-w-2xl space-y-8 text-center">
                    <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden border border-border-glass">
                        <motion.div 
                            className="absolute top-0 left-0 h-full bg-indigo-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${scanProgress}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground">{scanStatus}</h3>
                        <p className="text-sm text-foreground-muted">{scanProgress}% complete</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { icon: Trash2, label: 'Cleanup', active: scanProgress > 20 },
                            { icon: Shield, label: 'Protection', active: scanProgress > 40 },
                            { icon: Zap, label: 'Performance', active: scanProgress > 60 },
                            { icon: RotateCcw, label: 'Maintenance', active: scanProgress > 80 },
                        ].map((step, i) => (
                            <div key={i} className={cn(
                                "p-4 rounded-xl border transition-all duration-300",
                                step.active ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-white/5 border-border-glass text-foreground-muted"
                            )}>
                                <step.icon className="w-6 h-6 mx-auto mb-2" />
                                <span className="text-xs font-bold uppercase tracking-wider">{step.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {results && (
                <div className="w-full max-w-4xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-emerald-400">
                                <CheckCircle2 className="w-5 h-5" />
                                <h4 className="font-bold">Cleanup</h4>
                            </div>
                            <div className="text-3xl font-bold">{formatSize(results.totalSpaceSavings)}</div>
                            <p className="text-sm text-foreground-muted">Junk files can be safely removed</p>
                        </Card>
                        <Card className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-indigo-400">
                                <ShieldCheck className="w-5 h-5" />
                                <h4 className="font-bold">Protection</h4>
                            </div>
                            <div className="text-3xl font-bold">Safe</div>
                            <p className="text-sm text-foreground-muted">No threats detected in quick scan</p>
                        </Card>
                        <Card className="p-6 space-y-4">
                            <div className="flex items-center gap-3 text-amber-400">
                                <Zap className="w-5 h-5" />
                                <h4 className="font-bold">Performance</h4>
                            </div>
                            <div className="text-3xl font-bold">Ready</div>
                            <p className="text-sm text-foreground-muted">System is optimized</p>
                        </Card>
                    </div>
                    
                    <div className="flex justify-center pt-8">
                        <Button variant="primary" size="lg" className="px-16 py-6 rounded-2xl">
                            Run Full Cleanup
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

const ModulePlaceholder = ({ title, icon: Icon, description }: { title: string, icon: any, description: string }) => (
    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center max-w-2xl mx-auto">
        <div className="bg-white/5 p-8 rounded-full border border-border-glass">
            <Icon className="w-12 h-12 text-foreground-muted" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
            <p className="text-foreground-muted">{description}</p>
        </div>
        <Button variant="outline" size="lg">Coming Soon</Button>
    </div>
);

export const SystemCleaner: React.FC = () => {
    const [activeTab, setActiveTab] = useState('smart-scan');
    
    const tabs = [
        { id: 'smart-scan', name: 'Smart Care', icon: Shield, description: 'Quick system analysis' },
        { id: 'cleanup', name: 'Cleanup', icon: Trash2, description: 'Remove junk and trash' },
        { id: 'protection', name: 'Protection', icon: ShieldCheck, description: 'Malware & privacy' },
        { id: 'performance', name: 'Performance', icon: Zap, description: 'Speed up system' },
        { id: 'maintenance', name: 'Maintenance', icon: Wrench, description: 'System tasks' },
    ];

    return (
        <ToolPane
            title="System Cleaner"
            description="Comprehensive cross-platform cleaning and protection suite"
        >
            <div className="flex h-full gap-8 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 flex flex-col space-y-2 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30" 
                                    : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span>{tab.name}</span>
                        </button>
                    ))}
                    
                    <div className="mt-auto px-4 py-6 border-t border-border-glass">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-border-glass">
                                <HardDrive className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">Storage</div>
                                <div className="text-sm font-bold">45% Used</div>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[45%]" />
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white/5 rounded-3xl border border-border-glass overflow-hidden relative">
                    <div className="absolute inset-0 p-8 overflow-auto custom-scrollbar">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="h-full"
                            >
                                {activeTab === 'smart-scan' && <SmartScan />}
                                {activeTab === 'cleanup' && (
                                    <ModulePlaceholder 
                                        title="System Cleanup" 
                                        icon={Trash2} 
                                        description="Identify and remove junk files, cache, log files, and other unnecessary data to free up gigabytes of space." 
                                    />
                                )}
                                {activeTab === 'protection' && (
                                    <ModulePlaceholder 
                                        title="System Protection" 
                                        icon={ShieldCheck} 
                                        description="Scan for malware, adware, and privacy threats. Protect your personal data and browser history." 
                                    />
                                )}
                                {activeTab === 'performance' && (
                                    <ModulePlaceholder 
                                        title="Performance Optimization" 
                                        icon={Zap} 
                                        description="Speed up your system by freeing up RAM, managing startup items, and monitoring resource-heavy applications." 
                                    />
                                )}
                                {activeTab === 'maintenance' && (
                                    <ModulePlaceholder 
                                        title="Maintenance Tasks" 
                                        icon={Wrench} 
                                        description="Run deep system maintenance tasks like flushing DNS cache, rebuilding search indexes, and repairing disk permissions." 
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
