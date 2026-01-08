import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { ScanPlaceholder } from '../components/ScanPlaceholder';
import { useSystemCleanerStore } from '../store/systemCleanerStore';
import { useSmartScan } from '../hooks/useSmartScan';
import { formatBytes as formatSize } from '../../../../utils/format';

export const SmartScan: React.FC = () => {
    const { isScanning, scanProgress, scanStatus, results } = useSystemCleanerStore();
    const { runSmartScan } = useSmartScan();
    
    if (!results && !isScanning) {
        return (
            <ScanPlaceholder 
                title="Smart Care"
                icon={Shield}
                description="Analyze your system for junk files, malware, performance issues, and more in one go."
                onScan={runSmartScan}
                isScanning={isScanning}
                progress={scanProgress}
                tips={[
                    'Smart Scan analyzes multiple areas of your system simultaneously',
                    'Results are cached for faster subsequent scans',
                    'You can run Smart Scan anytime to check system health',
                    'All cleanup operations create automatic backups'
                ]}
            />
        );
    }

    return (
        <div className="h-full flex flex-col space-y-8">
            {isScanning ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                     <div className="relative p-12 rounded-full bg-indigo-500/10 border border-indigo-500/30">
                        <motion.div
                            className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse"
                        />
                        <div className="relative flex items-center justify-center">
                            <div className="text-xl font-bold">{scanProgress}%</div>
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-bold">{scanStatus}</h3>
                        <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden mx-auto">
                            <motion.div className="h-full bg-indigo-500" animate={{ width: `${scanProgress}%` }} />
                        </div>
                    </div>
                </div>
            ) : results && (
                <div className="w-full max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-3xl font-bold text-center mb-12">Scan Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="p-8 space-y-4 shadow-xl border-border-glass bg-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 text-emerald-400">
                                <CheckCircle2 className="w-6 h-6" />
                                <h4 className="font-bold text-lg">Cleanup</h4>
                            </div>
                            <div className="text-4xl font-bold">{formatSize(results.totalSpaceSavings || 0)}</div>
                            <p className="text-sm text-foreground-muted">Junk files can be safely removed</p>
                        </Card>
                        <Card className="p-8 space-y-4 shadow-xl border-border-glass bg-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 text-indigo-400">
                                <ShieldCheck className="w-6 h-6" />
                                <h4 className="font-bold text-lg">Protection</h4>
                            </div>
                            <div className="text-4xl font-bold">Safe</div>
                            <p className="text-sm text-foreground-muted">No threats detected</p>
                        </Card>
                        <Card className="p-8 space-y-4 shadow-xl border-border-glass bg-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3 text-amber-400">
                                <Zap className="w-6 h-6" />
                                <h4 className="font-bold text-lg">Performance</h4>
                            </div>
                            <div className="text-4xl font-bold">Ready</div>
                            <p className="text-sm text-foreground-muted">System is optimized</p>
                        </Card>
                    </div>
                    <div className="flex justify-center pt-8">
                        <Button size="lg" variant="primary" className="px-16 py-8 rounded-2xl text-xl font-bold" onClick={runSmartScan}>Run Again</Button>
                    </div>
                </div>
            )}
        </div>
    );
};

