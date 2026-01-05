import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Cpu, Zap, RefreshCw, AppWindow, X } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ScanPlaceholder } from '../components/ScanPlaceholder';
import { useSystemCleanerStore } from '../store/systemCleanerStore';
import type { HeavyApp } from '../store/systemCleanerStore';
import { formatSize } from '../utils/formatUtils';
import { toast } from 'sonner';

export const PerformanceView: React.FC = () => {
    const { performanceData, setPerformanceData } = useSystemCleanerStore();
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);

    const refreshData = async () => {
        setIsScanning(true);
        const interval = setInterval(() => {
            setProgress(prev => (prev < 90 ? prev + Math.floor(Math.random() * 10) : prev));
        }, 100);

        try {
            const data = await (window as any).cleanerAPI.getPerformanceData();
            setPerformanceData(data);
            setProgress(100);
        } catch (e) {
            toast.error('Failed to get performance data.');
        } finally {
            clearInterval(interval);
            setTimeout(() => {
                setIsScanning(false);
                setProgress(0);
            }, 500);
        }
    };

    useEffect(() => {
        if (!performanceData) refreshData();
    }, []);

    const killApp = async (pid: number) => {
        const res = await (window as any).cleanerAPI.killProcess(pid);
        if (res.success) {
            toast.success('Process terminated');
            refreshData();
        } else {
            toast.error('Failed to kill process: ' + res.error);
        }
    };

    const optimizeRAM = async () => {
        setIsScanning(true);
        setProgress(0);
        const interval = setInterval(() => setProgress(p => (p < 95 ? p + 5 : p)), 100);
        const res = await (window as any).cleanerAPI.freeRam();
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
            setIsScanning(false);
            if (res.success) toast.success('RAM optimized: ' + formatSize(res.ramFreed));
        }, 300);
    };

    if (!performanceData && !isScanning) {
        return <ScanPlaceholder title="Performance" icon={Activity} description="Monitor real-time CPU and Memory usage and optimize resources." onScan={refreshData} isScanning={isScanning} progress={progress} />;
    }

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {isScanning && <LoadingOverlay progress={progress} title="Performance" status="Loading performance data..." />}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Performance</h2>
                    <p className="text-sm text-foreground-muted">Monitor and optimize system resources.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={optimizeRAM}>
                        <Zap className="w-4 h-4 mr-2" />
                        Optimize RAM
                    </Button>
                    <Button variant="outline" size="sm" onClick={refreshData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-white/5 border-border-glass">
                    <div className="flex items-center gap-3 mb-2">
                        <Cpu className="w-5 h-5 text-indigo-400" />
                        <h4 className="font-bold text-sm">CPU Load</h4>
                    </div>
                    <div className="text-2xl font-bold">{performanceData?.cpuLoad.toFixed(1) || 0}%</div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                        <motion.div 
                            className="h-full bg-indigo-500" 
                            initial={{ width: 0 }}
                            animate={{ width: `${performanceData?.cpuLoad || 0}%` }}
                        />
                    </div>
                </Card>
                <Card className="p-4 bg-white/5 border-border-glass">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-5 h-5 text-emerald-400" />
                        <h4 className="font-bold text-sm">Memory Usage</h4>
                    </div>
                    <div className="text-2xl font-bold">{performanceData?.memory.percent.toFixed(1) || 0}%</div>
                    <div className="text-[10px] text-foreground-muted">
                        {formatSize(performanceData?.memory.used || 0)} / {formatSize(performanceData?.memory.total || 0)}
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                        <motion.div 
                            className="h-full bg-emerald-500" 
                            initial={{ width: 0 }}
                            animate={{ width: `${performanceData?.memory.percent || 0}%` }}
                        />
                    </div>
                </Card>
            </div>

            <div className="flex-1 overflow-auto space-y-2 pr-2 custom-scrollbar">
                <h4 className="text-xs font-bold text-foreground-muted uppercase tracking-widest mb-2 px-1">Heavy Processes</h4>
                {performanceData?.heavyApps.map((app: HeavyApp) => (
                    <Card key={app.pid} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-4 flex-1 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <AppWindow className="w-4 h-4 text-foreground-muted" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="text-sm font-medium truncate">{app.name}</div>
                                <div className="text-[10px] text-foreground-muted">PID: {app.pid} • User: {app.user}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-xs font-bold text-indigo-400">{app.cpu.toFixed(1)}% CPU</div>
                                <div className="text-[10px] text-foreground-muted">{app.mem.toFixed(1)}% MEM</div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="md" 
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                                onClick={() => killApp(app.pid)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

