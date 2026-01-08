import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity as ActivityIcon, Cpu, Activity, HardDrive, Battery, AlertCircle, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ScanPlaceholder } from '../components/ScanPlaceholder';
import { formatBytes as formatSize } from '../../../../utils/format';
import { cn } from '../../../../utils/cn';
import { toast } from 'sonner';

export const HealthMonitorView: React.FC = () => {
    const [healthStatus, setHealthStatus] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const refreshHealth = async () => {
        setIsLoading(true);
        try {
            const status = await (window as any).cleanerAPI.getHealthStatus();
            setHealthStatus(status);
            // Update tray widget
            if (status && (window as any).cleanerAPI.updateHealthTray) {
                (window as any).cleanerAPI.updateHealthTray(status);
            }
        } catch (error) {
            toast.error('Failed to get health status');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshHealth();
        
        if (autoRefresh) {
            const interval = setInterval(refreshHealth, 5000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);

    if (!healthStatus && !isLoading) {
        return (
            <ScanPlaceholder
                title="Health Monitor"
                icon={ActivityIcon}
                description="Monitor your system health in real-time"
                onScan={refreshHealth}
                isScanning={isLoading}
                progress={0}
            />
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {isLoading && (
                <LoadingOverlay 
                    progress={100} 
                    title="Health Monitor" 
                    status="Loading health data..." 
                />
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Health Monitor</h2>
                    <p className="text-sm text-foreground-muted">Real-time system health monitoring</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={refreshHealth} disabled={isLoading}>
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {healthStatus && (
                <>
                    {/* Health Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4 bg-white/5 border-border-glass">
                            <div className="flex items-center gap-3 mb-2">
                                <Cpu className="w-5 h-5 text-indigo-400" />
                                <h4 className="font-bold text-sm">CPU Usage</h4>
                            </div>
                            <div className="text-2xl font-bold">{healthStatus.cpu?.toFixed(1) || 0}%</div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                                <motion.div
                                    className="h-full bg-indigo-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${healthStatus.cpu || 0}%` }}
                                />
                            </div>
                        </Card>

                        <Card className="p-4 bg-white/5 border-border-glass">
                            <div className="flex items-center gap-3 mb-2">
                                <Activity className="w-5 h-5 text-emerald-400" />
                                <h4 className="font-bold text-sm">Memory Usage</h4>
                            </div>
                            <div className="text-2xl font-bold">{healthStatus.ram?.percentage?.toFixed(1) || 0}%</div>
                            <div className="text-[10px] text-foreground-muted">
                                {formatSize(healthStatus.ram?.used || 0)} / {formatSize(healthStatus.ram?.total || 0)}
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                                <motion.div
                                    className="h-full bg-emerald-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${healthStatus.ram?.percentage || 0}%` }}
                                />
                            </div>
                        </Card>

                        {healthStatus.disk && (
                            <Card className="p-4 bg-white/5 border-border-glass">
                                <div className="flex items-center gap-3 mb-2">
                                    <HardDrive className="w-5 h-5 text-amber-400" />
                                    <h4 className="font-bold text-sm">Disk Usage</h4>
                                </div>
                                <div className="text-2xl font-bold">{healthStatus.disk.percentage?.toFixed(1) || 0}%</div>
                                <div className="text-[10px] text-foreground-muted">
                                    {formatSize(healthStatus.disk.free || 0)} free
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full mt-2 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-amber-500"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${healthStatus.disk.percentage || 0}%` }}
                                    />
                                </div>
                            </Card>
                        )}

                        {healthStatus.battery && (
                            <Card className="p-4 bg-white/5 border-border-glass">
                                <div className="flex items-center gap-3 mb-2">
                                    <Battery className="w-5 h-5 text-emerald-400" />
                                    <h4 className="font-bold text-sm">Battery</h4>
                                </div>
                                <div className="text-2xl font-bold">{healthStatus.battery.level?.toFixed(0) || 0}%</div>
                                <div className="text-[10px] text-foreground-muted">
                                    {healthStatus.battery.charging ? 'Charging' : 'Not charging'}
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Alerts */}
                    {healthStatus.alerts && healthStatus.alerts.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                                Alerts ({healthStatus.alerts.length})
                            </h3>
                            {healthStatus.alerts.map((alert: any, i: number) => (
                                <Card
                                    key={i}
                                    className={cn(
                                        "p-4 border",
                                        alert.severity === 'critical' && "bg-red-500/10 border-red-500/30",
                                        alert.severity === 'warning' && "bg-amber-500/10 border-amber-500/30",
                                        alert.severity === 'info' && "bg-blue-500/10 border-blue-500/30"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className={cn(
                                            "w-5 h-5 mt-0.5",
                                            alert.severity === 'critical' && "text-red-400",
                                            alert.severity === 'warning' && "text-amber-400",
                                            alert.severity === 'info' && "text-blue-400"
                                        )} />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-sm">{alert.message}</span>
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded uppercase",
                                                    alert.severity === 'critical' && "bg-red-500/20 text-red-400",
                                                    alert.severity === 'warning' && "bg-amber-500/20 text-amber-400",
                                                    alert.severity === 'info' && "bg-blue-500/20 text-blue-400"
                                                )}>
                                                    {alert.severity}
                                                </span>
                                            </div>
                                            {alert.action && (
                                                <p className="text-xs text-foreground-muted">{alert.action}</p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {(!healthStatus.alerts || healthStatus.alerts.length === 0) && (
                        <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                                        System Health: Good
                                    </h3>
                                    <p className="text-sm text-foreground-muted mt-1">
                                        All systems operating normally. No issues detected.
                                    </p>
                                </div>
                                <CheckCircle className="w-12 h-12 text-emerald-400" />
                            </div>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

