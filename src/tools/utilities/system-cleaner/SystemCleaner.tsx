import React, { useState, useEffect, useRef } from 'react';
import { ToolPane } from '../../../components/layout/ToolPane';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Checkbox } from '../../../components/ui/Checkbox';
import { 
    Trash2, 
    Shield, 
    Zap, 
    ShieldCheck,
    Wrench,
    CheckCircle2,
    FileText,
    Copy,
    FolderOpen,
    RefreshCw,
    LayoutGrid,
    ChevronLeft,
    Cpu,
    Activity,
    Power,
    AppWindow,
    X,
    Search,
    Loader2,
    Trash,
    ScanLine,
    FileSearch,
    FolderSearch,
    HardDrive,
    Sparkles,
    XCircle,
    Database,
    History,
    Eye,
    EyeOff,
    AlertTriangle,
    CheckCircle,
    Clock,
    Wifi,
    Mail,
    Search as SearchIcon,
    Server,
    Activity as ActivityIcon,
    Battery,
    AlertCircle,
    List,
    GitBranch,
    Minimize2,
    ChevronRight,
    ChevronDown
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { SpaceLensNode, HeavyApp, PrivacyItem } from './store/systemCleanerStore';
import { useSystemCleanerStore } from './store/systemCleanerStore';
import { useSmartScan } from './hooks/useSmartScan';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// --- Utility ---
const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

// --- Reusable Loading Overlay Component ---
const LoadingOverlay = ({ progress, status, title }: { progress: number; status?: string; title?: string }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 dark:bg-black/50 bg-white/60 backdrop-blur-md z-50 flex flex-col items-center justify-center"
    >
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-gradient-to-br from-white/10 dark:from-white/10 to-white/5 dark:to-white/5 backdrop-blur-xl border border-white/20 dark:border-white/20 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl"
        >
            <div className="flex flex-col items-center space-y-6">
                {/* Spinner */}
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                    <div className="relative p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 backdrop-blur-sm">
                        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
                    </div>
                </div>
                
                {/* Title and Status */}
                <div className="text-center space-y-3 w-full">
                    {title && (
                        <h3 className="text-xl font-bold text-foreground">{title}</h3>
                    )}
                    {status && (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                            <p className="text-sm text-indigo-400 font-medium">{status}</p>
                        </div>
                    )}
                </div>
                
                {/* Progress bar */}
                <div className="w-full space-y-3">
                    <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden border border-border-glass">
                        <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 relative overflow-hidden"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                            />
                        </motion.div>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 backdrop-blur-sm">
                            <span className="text-lg font-bold text-indigo-400">{Math.round(progress)}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    </motion.div>
);

// --- Reusable Scan UI Component ---
const ScanPlaceholder = ({ title, icon: Icon, description, onScan, isScanning, progress }: { 
    title: string, 
    icon: any, 
    description: string, 
    onScan: () => void,
    isScanning: boolean,
    progress: number
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

// --- Sub-components ---

const SmartScan = () => {
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
            />
        );
    }

    return (
        <div className="h-full flex flex-col space-y-8">
            {isScanning ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                     <div className="relative p-12 rounded-full bg-indigo-500/10 border border-indigo-500/30">
                        <Loader2 className="w-20 h-20 text-indigo-400 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">{scanProgress}%</div>
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

// --- Performance Optimization View ---

const PerformanceView = () => {
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

// --- Startup Items View ---

const StartupView = () => {
    const { startupItems, setStartupItems } = useSystemCleanerStore();
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);

    const refreshItems = async () => {
        setIsScanning(true);
        const interval = setInterval(() => setProgress(p => (p < 90 ? p + 10 : p)), 150);
        try {
            const items = await (window as any).cleanerAPI.getStartupItems();
            setStartupItems(items);
            setProgress(100);
        } catch (e) {
            toast.error('Failed to get startup items.');
        } finally {
            clearInterval(interval);
            setTimeout(() => setIsScanning(false), 500);
        }
    };

    if (startupItems.length === 0 && !isScanning) {
        return <ScanPlaceholder title="Startup Management" icon={Power} description="Manage applications and services that start with your system." onScan={refreshItems} isScanning={isScanning} progress={progress} />;
    }

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {isScanning && <LoadingOverlay progress={progress} title="Startup Items" status="Loading startup items..." />}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Startup Items</h2>
                    <p className="text-sm text-foreground-muted">Manage apps that launch automatically.</p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshItems}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="flex-1 overflow-auto space-y-2 pr-2 custom-scrollbar">
                {startupItems.map((item, i) => {
                    const isEnabled = item.enabled !== undefined ? item.enabled : true; // Default to enabled if undefined
                    
                    const handleToggle = async () => {
                        try {
                            const res = await (window as any).cleanerAPI.toggleStartupItem(item);
                            if (res.success) {
                                toast.success(`${res.enabled ? 'Enabled' : 'Disabled'} ${item.name}`);
                                // Update local state immediately for better UX
                                const updatedItems = startupItems.map((it, idx) => 
                                    idx === i ? { ...it, enabled: res.enabled } : it
                                );
                                setStartupItems(updatedItems);
                                // Refresh to get accurate state
                                setTimeout(() => refreshItems(), 500);
                            } else {
                                toast.error(`Failed to toggle ${item.name}: ${res.error || 'Unknown error'}`);
                            }
                        } catch (error) {
                            toast.error(`Failed to toggle ${item.name}`);
                        }
                    };
                    
                    return (
                        <Card key={i} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isEnabled ? "bg-green-500/10" : "bg-gray-500/10"
                                )}>
                                    <Power className={cn(
                                        "w-5 h-5 transition-colors",
                                        isEnabled ? "text-green-500" : "text-gray-500"
                                    )} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-medium">{item.name}</h4>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                            isEnabled 
                                                ? "bg-green-500/20 text-green-400" 
                                                : "bg-gray-500/20 text-gray-400"
                                        )}>
                                            {isEnabled ? "Enabled" : "Disabled"}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-foreground-muted truncate max-w-sm mt-0.5">
                                        {item.type} • {item.path}
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant={isEnabled ? "outline" : "primary"}
                                size="sm" 
                                onClick={handleToggle}
                                className={cn(
                                    "min-w-[80px]",
                                    isEnabled && "border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500"
                                )}
                            >
                                {isEnabled ? 'Disable' : 'Enable'}
                            </Button>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

// --- App Uninstaller View ---

const UninstallerView = () => {
    const { installedApps, setInstalledApps } = useSystemCleanerStore();
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [search, setSearch] = useState('');

    const refreshApps = async () => {
        setIsScanning(true);
        const interval = setInterval(() => setProgress(p => (p < 95 ? p + 2 : p)), 100);
        try {
            const apps = await (window as any).cleanerAPI.getInstalledApps();
            setInstalledApps(apps);
            setProgress(100);
        } catch (e) {
            toast.error('Failed to load apps.');
        } finally {
            clearInterval(interval);
            setTimeout(() => setIsScanning(false), 500);
        }
    };

    const handleUninstall = async (app: any) => {
        if (!confirm(`Are you sure you want to uninstall ${app.name}? This will remove the application and all associated files.`)) return;
        setIsScanning(true);
        setProgress(0);
        try {
            const res = await (window as any).cleanerAPI.uninstallApp(app);
            setIsScanning(false);
            if (res.success) {
                toast.success(`Uninstalled ${app.name}${res.freedSizeFormatted ? ` (freed ${res.freedSizeFormatted})` : ''}`);
                refreshApps();
            } else {
                toast.error(`Failed to uninstall ${app.name}: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            setIsScanning(false);
            toast.error(`Failed to uninstall ${app.name}`);
        }
    };

    const filteredApps = installedApps.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

    if (installedApps.length === 0 && !isScanning) {
        return <ScanPlaceholder title="Uninstaller" icon={AppWindow} description="Completely remove applications and all their associated files." onScan={refreshApps} isScanning={isScanning} progress={progress} />;
    }

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {isScanning && <LoadingOverlay progress={progress} title="Uninstaller" status="Loading installed applications..." />}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Uninstaller</h2>
                    <p className="text-sm text-foreground-muted">Completely remove unwanted applications.</p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshApps}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted group-focus-within:text-indigo-400 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search apps..." 
                    className="w-full bg-white/5 border border-border-glass rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-auto space-y-2 pr-2 custom-scrollbar">
                {filteredApps.map((app, i) => (
                    <Card key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-border-glass">
                                <AppWindow className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold">{app.name}</h4>
                                <p className="text-[10px] text-foreground-muted">{app.size ? formatSize(app.size) + ' • ' : ''}{app.type}</p>
                            </div>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => handleUninstall(app)}>Uninstall</Button>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// --- Space Lens ---

type ViewMode = 'grid' | 'list' | 'tree' | 'detail' | 'compact';

const SpaceLensView = () => {
    const { spaceLensData, setSpaceLensData } = useSystemCleanerStore();
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [scanStatus, setScanStatus] = useState('');
    const [currentScanPath, setCurrentScanPath] = useState('');
    const [currentScanItem, setCurrentScanItem] = useState('');
    const [history, setHistory] = useState<SpaceLensNode[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const scanCancelRef = useRef(false);
    const progressCleanupRef = useRef<(() => void) | null>(null);

    const scanSpace = async (pathStr = '') => {
        setIsScanning(true);
        setProgress(0);
        setScanStatus('Initializing scan...');
        setCurrentScanPath(pathStr || 'Root directory');
        setCurrentScanItem('');
        scanCancelRef.current = false;
        
        // Initialize with empty data structure
        const rootPath = pathStr || '';
        const rootName = rootPath ? rootPath.split(/[/\\]/).pop() || 'Root' : 'Root';
        setSpaceLensData({
            name: rootName,
            path: rootPath || 'Root directory',
            size: 0,
            sizeFormatted: '0 B',
            type: 'dir',
            children: []
        });
        
        // Cleanup previous listener
        if (progressCleanupRef.current) {
            progressCleanupRef.current();
            progressCleanupRef.current = null;
        }
        
        // Listen to progress updates from main process
        if ((window as any).cleanerAPI.onSpaceLensProgress) {
            progressCleanupRef.current = (window as any).cleanerAPI.onSpaceLensProgress((progressData: { currentPath: string; progress: number; status: string; item?: SpaceLensNode }) => {
                if (!scanCancelRef.current) {
                    setCurrentScanItem(progressData.currentPath);
                    setScanStatus(progressData.status);
                    // Map progress from 0-100 to a smoother range
                    setProgress(Math.min(progressData.progress, 95));
                    
                    // Nếu có item đã scan xong, thêm vào danh sách ngay lập tức
                    if (progressData.item) {
                        const currentData = spaceLensData;
                        if (!currentData) {
                            const rootPath = pathStr || '';
                            const rootName = rootPath ? rootPath.split(/[/\\]/).pop() || 'Root' : 'Root';
                            setSpaceLensData({
                                name: rootName,
                                path: rootPath || 'Root directory',
                                size: progressData.item.size,
                                sizeFormatted: formatSize(progressData.item.size),
                                type: 'dir',
                                children: [progressData.item]
                            });
                        } else {
                            // Kiểm tra xem item đã tồn tại chưa
                            const exists = currentData.children?.some(item => item.path === progressData.item!.path);
                            if (!exists) {
                                const newChildren = [...(currentData.children || []), progressData.item];
                                const sorted = newChildren.sort((a, b) => b.size - a.size);
                                const totalSize = sorted.reduce((sum, item) => sum + item.size, 0);
                                
                                setSpaceLensData({
                                    ...currentData,
                                    children: sorted,
                                    size: totalSize,
                                    sizeFormatted: formatSize(totalSize)
                                });
                            }
                        }
                    }
                }
            });
        }

        try {
            const data = await (window as any).cleanerAPI.getSpaceLens(pathStr || undefined);
            if (!scanCancelRef.current) {
                setSpaceLensData(data);
                setProgress(100);
                setScanStatus('Scan complete!');
                setCurrentScanItem('');
                setTimeout(() => {
                    setIsScanning(false);
                    setScanStatus('');
                }, 500);
            }
        } catch (e) {
            toast.error('Failed to scan storage.');
            setIsScanning(false);
            setScanStatus('');
            setCurrentScanItem('');
        } finally {
            if (progressCleanupRef.current) {
                progressCleanupRef.current();
                progressCleanupRef.current = null;
            }
        }
    };

    const cancelScan = () => {
        scanCancelRef.current = true;
        setIsScanning(false);
        setProgress(0);
        setScanStatus('');
        setCurrentScanItem('');
        if (progressCleanupRef.current) {
            progressCleanupRef.current();
            progressCleanupRef.current = null;
        }
        toast.info('Scan cancelled');
    };

    const handleDelete = async (e: React.MouseEvent, node: SpaceLensNode) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete ${node.name}?`)) return;
        // Store current path before delete
        const currentPath = spaceLensData?.path || '';
        setIsScanning(true);
        try {
            const res = await (window as any).cleanerAPI.runCleanup([node.path]);
            setIsScanning(false);
            if (res.success) {
                toast.success(`Deleted ${node.name}`);
                // Refresh from stored path
                await scanSpace(currentPath);
            } else {
                toast.error(`Failed to delete ${node.name}: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            setIsScanning(false);
            toast.error(`Failed to delete ${node.name}`);
        }
    };

    const navigateTo = async (node: SpaceLensNode) => {
        if (node.type === 'dir' && !isScanning) {
            // Always rescan when entering a directory to ensure fresh data
            setHistory([...history, spaceLensData!]);
            await scanSpace(node.path);
        }
    };

    const goBack = () => {
        if (history.length > 0 && !isScanning) {
            const prev = history[history.length - 1];
            setSpaceLensData(prev);
            setHistory(history.slice(0, -1));
        }
    };

    // Cleanup listener on unmount
    useEffect(() => {
        return () => {
            if (progressCleanupRef.current) {
                progressCleanupRef.current();
            }
        };
    }, []);

    if (!spaceLensData && !isScanning) {
        return <ScanPlaceholder title="Space Lens" icon={LayoutGrid} description="Visually explore your storage structure to find what's taking up space." onScan={() => scanSpace()} isScanning={isScanning} progress={progress} />;
    }

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {/* Improved Loading Overlay với UI đẹp hơn - Full screen và theme-aware */}
            {isScanning && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/50 bg-white/60 backdrop-blur-md z-50 flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-gradient-to-br from-white/10 dark:from-white/10 to-white/5 dark:to-white/5 backdrop-blur-xl border border-white/20 dark:border-white/20 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl"
                    >
                        <div className="flex flex-col items-center space-y-6">
                            {/* Icon với animation */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full animate-pulse" />
                                <div className="relative p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 backdrop-blur-sm">
                                    {currentScanItem ? (
                                        currentScanItem.includes('.') ? (
                                            <FileSearch className="w-12 h-12 text-indigo-400 animate-pulse" />
                                        ) : (
                                            <FolderSearch className="w-12 h-12 text-indigo-400 animate-pulse" />
                                        )
                                    ) : (
                                        <ScanLine className="w-12 h-12 text-indigo-400 animate-pulse" />
                                    )}
                                </div>
                                <motion.div
                                    className="absolute -top-1 -right-1"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <Sparkles className="w-6 h-6 text-indigo-400/70" />
                                </motion.div>
                            </div>
                            
                            {/* Title và Status */}
                            <div className="text-center space-y-3 w-full">
                                <div className="flex items-center justify-center gap-2">
                                    <HardDrive className="w-5 h-5 text-indigo-400" />
                                    <h3 className="text-xl font-bold text-foreground">Scanning Storage</h3>
                                </div>
                                
                                {/* Current Path */}
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <p className="text-xs text-foreground-muted/70 mb-1">Current Path</p>
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {currentScanPath}
                                    </p>
                                </div>

                                {/* Status và Current Item */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                                        <p className="text-sm text-indigo-400 font-medium">
                                            {scanStatus}
                                        </p>
                                    </div>
                                    {currentScanItem && (
                                        <div className="bg-white/5 rounded-lg p-2 border border-border-glass">
                                            <div className="flex items-center gap-2 justify-center">
                                                {currentScanItem.includes('.') ? (
                                                    <FileText className="w-3 h-3 text-indigo-400" />
                                                ) : (
                                                    <FolderOpen className="w-3 h-3 text-indigo-400" />
                                                )}
                                                <p className="text-xs text-foreground-muted font-mono truncate max-w-xs">
                                                    {currentScanItem}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Progress bar với animation mượt hơn */}
                            <div className="w-full space-y-3">
                                <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden border border-border-glass">
                                    <motion.div 
                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 relative overflow-hidden"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                            animate={{ x: ['-100%', '100%'] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                        />
                                    </motion.div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 backdrop-blur-sm">
                                            <span className="text-xs font-bold text-indigo-400">{Math.round(progress)}%</span>
                                        </div>
                                        <span className="text-xs text-foreground-muted">Progress</span>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={cancelScan}
                                        className="text-xs h-8 px-3 hover:bg-white/5 hover:text-foreground transition-colors"
                                    >
                                        <XCircle className="w-3 h-3 mr-1" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Header với breadcrumb */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {history.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={goBack} disabled={isScanning}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold">Space Lens</h2>
                        <div className="flex items-center gap-2 text-sm text-foreground-muted">
                            <span className="truncate max-w-md">
                                {spaceLensData?.path || 'Analyzing storage structure...'}
                            </span>
                            {spaceLensData && (
                                <span className="text-xs bg-white/5 px-2 py-0.5 rounded">
                                    {spaceLensData.children?.length || 0} items
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* View Mode Selector */}
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-border-glass">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-1.5 rounded transition-colors",
                                viewMode === 'grid' 
                                    ? "bg-indigo-500 text-white" 
                                    : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                            )}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-1.5 rounded transition-colors",
                                viewMode === 'list' 
                                    ? "bg-indigo-500 text-white" 
                                    : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                            )}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('tree')}
                            className={cn(
                                "p-1.5 rounded transition-colors",
                                viewMode === 'tree' 
                                    ? "bg-indigo-500 text-white" 
                                    : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                            )}
                            title="Tree View"
                        >
                            <GitBranch className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('detail')}
                            className={cn(
                                "p-1.5 rounded transition-colors",
                                viewMode === 'detail' 
                                    ? "bg-indigo-500 text-white" 
                                    : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                            )}
                            title="Detail View"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('compact')}
                            className={cn(
                                "p-1.5 rounded transition-colors",
                                viewMode === 'compact' 
                                    ? "bg-indigo-500 text-white" 
                                    : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                            )}
                            title="Compact View"
                        >
                            <Minimize2 className="w-4 h-4" />
                        </button>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => scanSpace(spaceLensData?.path)}
                        disabled={isScanning}
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", isScanning && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Content - Render based on view mode */}
            <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                {spaceLensData && spaceLensData.children && spaceLensData.children.length > 0 ? (
                    <>
                        {viewMode === 'grid' && <GridView nodes={spaceLensData.children} parentSize={spaceLensData.size} onNavigate={navigateTo} onDelete={handleDelete} isScanning={isScanning} />}
                        {viewMode === 'list' && <ListView nodes={spaceLensData.children} parentSize={spaceLensData.size} onNavigate={navigateTo} onDelete={handleDelete} isScanning={isScanning} />}
                        {viewMode === 'tree' && <TreeView nodes={spaceLensData.children} parentSize={spaceLensData.size} onNavigate={navigateTo} onDelete={handleDelete} isScanning={isScanning} expandedNodes={expandedNodes} setExpandedNodes={setExpandedNodes} />}
                        {viewMode === 'detail' && <DetailView nodes={spaceLensData.children} parentSize={spaceLensData.size} onNavigate={navigateTo} onDelete={handleDelete} isScanning={isScanning} />}
                        {viewMode === 'compact' && <CompactView nodes={spaceLensData.children} parentSize={spaceLensData.size} onNavigate={navigateTo} onDelete={handleDelete} isScanning={isScanning} />}
                    </>
                ) : isScanning ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="p-4 rounded-2xl border border-border-glass bg-white/5 animate-pulse">
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/10" />
                                    <div className="w-full space-y-2">
                                        <div className="h-4 bg-white/10 rounded w-3/4 mx-auto" />
                                        <div className="h-3 bg-white/5 rounded w-1/2 mx-auto" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

// --- Space Lens View Components ---

// Grid View (Default)
const GridView = ({ nodes, parentSize, onNavigate, onDelete, isScanning }: {
    nodes: SpaceLensNode[];
    parentSize: number;
    onNavigate: (node: SpaceLensNode) => void;
    onDelete: (e: React.MouseEvent, node: SpaceLensNode) => void;
    isScanning: boolean;
}) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
            {nodes.map((node, i) => {
                const percentage = parentSize > 0 ? (node.size / parentSize) * 100 : 0;
                return (
                    <motion.div
                        key={`${node.path}-${i}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.01 }}
                        whileHover={{ scale: 1.02, y: -4 }}
                        onClick={() => !isScanning && onNavigate(node)}
                        className={cn(
                            "group relative p-4 rounded-2xl border transition-all overflow-hidden",
                            node.type === 'dir' 
                                ? "bg-white/5 border-border-glass cursor-pointer hover:bg-white/10" 
                                : "bg-white/[0.02] border-border-glass/50",
                            isScanning && node.type === 'dir' && "pointer-events-none opacity-75"
                        )}
                    >
                        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500/40 transition-all group-hover:bg-indigo-500/60" style={{ width: `${Math.max(percentage, 2)}%` }} />
                        {!isScanning && (
                            <button 
                                onClick={(e) => onDelete(e, node)}
                                className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white z-10"
                            >
                                <Trash className="w-3 h-3" />
                            </button>
                        )}
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className={cn(
                                "p-3 rounded-xl transition-colors",
                                node.type === 'dir' 
                                    ? "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white" 
                                    : "bg-white/5 text-foreground-muted"
                            )}>
                                {node.type === 'dir' ? <FolderOpen className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                            </div>
                            <div className="w-full">
                                <div className="text-sm font-bold truncate px-1">{node.name}</div>
                                <div className="text-[10px] text-foreground-muted">{formatSize(node.size)}</div>
                            </div>
                        </div>
                        {percentage > 10 && (
                            <div className="absolute top-2 left-2 text-[8px] font-bold text-foreground-muted/30 uppercase tracking-tighter">
                                {percentage.toFixed(0)}%
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
};

// List View
const ListView = ({ nodes, parentSize, onNavigate, onDelete, isScanning }: {
    nodes: SpaceLensNode[];
    parentSize: number;
    onNavigate: (node: SpaceLensNode) => void;
    onDelete: (e: React.MouseEvent, node: SpaceLensNode) => void;
    isScanning: boolean;
}) => {
    return (
        <div className="space-y-2 pb-8">
            {nodes.map((node, i) => {
                const percentage = parentSize > 0 ? (node.size / parentSize) * 100 : 0;
                return (
                    <motion.div
                        key={`${node.path}-${i}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => !isScanning && node.type === 'dir' && onNavigate(node)}
                        className={cn(
                            "group relative p-4 rounded-xl border transition-all cursor-pointer",
                            node.type === 'dir' 
                                ? "bg-white/5 border-border-glass hover:bg-white/10" 
                                : "bg-white/[0.02] border-border-glass/50",
                            isScanning && node.type === 'dir' && "pointer-events-none opacity-75"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "p-2 rounded-lg transition-colors",
                                node.type === 'dir' 
                                    ? "bg-indigo-500/10 text-indigo-400" 
                                    : "bg-white/5 text-foreground-muted"
                            )}>
                                {node.type === 'dir' ? <FolderOpen className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold truncate">{node.name}</div>
                                <div className="text-xs text-foreground-muted">{formatSize(node.size)} • {percentage.toFixed(1)}%</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${percentage}%` }} />
                                </div>
                                {!isScanning && (
                                    <button 
                                        onClick={(e) => onDelete(e, node)}
                                        className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

// Tree View
const TreeView = ({ nodes, parentSize, onNavigate, onDelete, isScanning, expandedNodes, setExpandedNodes }: {
    nodes: SpaceLensNode[];
    parentSize: number;
    onNavigate: (node: SpaceLensNode) => void;
    onDelete: (e: React.MouseEvent, node: SpaceLensNode) => void;
    isScanning: boolean;
    expandedNodes: Set<string>;
    setExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>;
}) => {
    const toggleExpand = (path: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedNodes(newExpanded);
    };

    const renderNode = (node: SpaceLensNode, level: number = 0) => {
        const percentage = parentSize > 0 ? (node.size / parentSize) * 100 : 0;
        const isExpanded = expandedNodes.has(node.path);
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div key={node.path} className="select-none">
                <div
                    className={cn(
                        "group flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors",
                        level > 0 && "ml-6"
                    )}
                    onClick={() => node.type === 'dir' && !isScanning && onNavigate(node)}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        {hasChildren && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpand(node.path);
                                }}
                                className="p-0.5 hover:bg-white/10 rounded transition-colors"
                            >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                        )}
                        {!hasChildren && <div className="w-5" />}
                        <div className={cn(
                            "p-1.5 rounded transition-colors",
                            node.type === 'dir' 
                                ? "bg-indigo-500/10 text-indigo-400" 
                                : "bg-white/5 text-foreground-muted"
                        )}>
                            {node.type === 'dir' ? <FolderOpen className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{node.name}</div>
                            <div className="text-xs text-foreground-muted">{formatSize(node.size)} • {percentage.toFixed(1)}%</div>
                        </div>
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${percentage}%` }} />
                        </div>
                        {!isScanning && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(e, node);
                                }}
                                className="p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 text-red-500 rounded hover:bg-red-500 hover:text-white"
                            >
                                <Trash className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
                {hasChildren && isExpanded && (
                    <div className="ml-4 border-l border-border-glass/30 pl-2">
                        {node.children!.map(child => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-1 pb-8">
            {nodes.map(node => renderNode(node))}
        </div>
    );
};

// Detail View
const DetailView = ({ nodes, parentSize, onNavigate, onDelete, isScanning }: {
    nodes: SpaceLensNode[];
    parentSize: number;
    onNavigate: (node: SpaceLensNode) => void;
    onDelete: (e: React.MouseEvent, node: SpaceLensNode) => void;
    isScanning: boolean;
}) => {
    return (
        <div className="space-y-3 pb-8">
            {nodes.map((node, i) => {
                const percentage = parentSize > 0 ? (node.size / parentSize) * 100 : 0;
                return (
                    <div
                        key={`${node.path}-${i}`}
                        className={cn(
                            "p-4 rounded-xl border border-border-glass bg-white/5 hover:bg-white/10 transition-colors group",
                            node.type === 'dir' && !isScanning && "cursor-pointer",
                            isScanning && node.type === 'dir' && "pointer-events-none opacity-75"
                        )}
                        onClick={() => !isScanning && node.type === 'dir' && onNavigate(node)}
                    >
                        <div className="flex items-start gap-4">
                            <div className={cn(
                                "p-3 rounded-xl transition-colors",
                                node.type === 'dir' 
                                    ? "bg-indigo-500/10 text-indigo-400" 
                                    : "bg-white/5 text-foreground-muted"
                            )}>
                                {node.type === 'dir' ? <FolderOpen className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <div>
                                    <div className="text-base font-bold">{node.name}</div>
                                    <div className="text-xs text-foreground-muted font-mono mt-1 break-all">{node.path}</div>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <div>
                                        <span className="text-foreground-muted">Size: </span>
                                        <span className="font-bold">{formatSize(node.size)}</span>
                                    </div>
                                    <div>
                                        <span className="text-foreground-muted">Percentage: </span>
                                        <span className="font-bold">{percentage.toFixed(2)}%</span>
                                    </div>
                                    <div>
                                        <span className="text-foreground-muted">Type: </span>
                                        <span className="font-bold uppercase">{node.type}</span>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400" style={{ width: `${percentage}%` }} />
                                </div>
                            </div>
                            {!isScanning && (
                                <button 
                                    onClick={(e) => onDelete(e, node)}
                                    className="p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"
                                >
                                    <Trash className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Compact View
const CompactView = ({ nodes, parentSize, onNavigate, onDelete, isScanning }: {
    nodes: SpaceLensNode[];
    parentSize: number;
    onNavigate: (node: SpaceLensNode) => void;
    onDelete: (e: React.MouseEvent, node: SpaceLensNode) => void;
    isScanning: boolean;
}) => {
    return (
        <div className="space-y-1 pb-8">
            {nodes.map((node, i) => {
                const percentage = parentSize > 0 ? (node.size / parentSize) * 100 : 0;
                return (
                    <div
                        key={`${node.path}-${i}`}
                        onClick={() => !isScanning && node.type === 'dir' && onNavigate(node)}
                        className={cn(
                            "group flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors text-sm",
                            node.type === 'dir' && !isScanning && "cursor-pointer",
                            isScanning && node.type === 'dir' && "pointer-events-none opacity-75"
                        )}
                    >
                        <div className={cn(
                            "p-1 rounded",
                            node.type === 'dir' 
                                ? "text-indigo-400" 
                                : "text-foreground-muted"
                        )}>
                            {node.type === 'dir' ? <FolderOpen className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        </div>
                        <div className="flex-1 min-w-0 truncate text-xs font-medium">{node.name}</div>
                        <div className="text-xs text-foreground-muted">{formatSize(node.size)}</div>
                        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${percentage}%` }} />
                        </div>
                        {!isScanning && (
                            <button 
                                onClick={(e) => onDelete(e, node)}
                                className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-500/10 rounded"
                            >
                                <Trash className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// --- Junk Cleanup View ---
const JunkCleanupView = () => {
    const { results, platformInfo, isScanning, scanProgress } = useSystemCleanerStore();
    const { runSmartScan } = useSmartScan();
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [isCleaning, setIsCleaning] = useState(false);

    useEffect(() => {
        if (results?.junkFiles?.items) {
            setSelectedItems(results.junkFiles.items.map(i => i.path));
        }
    }, [results]);

    const handleCleanup = async () => {
        if (selectedItems.length === 0) return;
        
        // Safety check
        try {
            const safetyCheck = await (window as any).cleanerAPI.checkSafety(selectedItems);
            if (!safetyCheck.safe) {
                if (safetyCheck.blocked.length > 0) {
                    toast.error(`Cannot delete ${safetyCheck.blocked.length} protected file(s)`);
                    return;
                }
                if (safetyCheck.warnings.length > 0) {
                    const proceed = confirm(`Warning: ${safetyCheck.warnings.length} file(s) may be important. Continue?`);
                    if (!proceed) return;
                }
            }
        } catch (e) {
            console.warn('Safety check failed:', e);
        }
        
        // Create backup before deletion
        try {
            const backupResult = await (window as any).cleanerAPI.createBackup(selectedItems);
            if (backupResult.success) {
                toast.success(`Backup created before cleanup`);
            }
        } catch (e) {
            const proceed = confirm('Failed to create backup. Continue with deletion?');
            if (!proceed) return;
        }
        
        setIsCleaning(true);
        try {
            const cleanupResult = await (window as any).cleanerAPI.runCleanup(selectedItems);
            if (cleanupResult.success) {
                toast.success(`Cleaned ${formatSize(cleanupResult.freedSize)} successfully!`);
                runSmartScan(); 
            } else {
                toast.error(`Failed to run cleanup: ${cleanupResult.error || 'Unknown error'}`);
            }
        } catch (e) {
            toast.error(`Failed to run cleanup: ${(e as Error).message || 'Unknown error'}`);
        } finally {
            setIsCleaning(false);
        }
    };

    if (!results && !isScanning) {
        return <ScanPlaceholder title="System Junk" icon={Trash2} description="Find and remove hidden junk files taking up valuable disk space." onScan={runSmartScan} isScanning={isScanning} progress={scanProgress} />;
    }

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {(isScanning || isCleaning) && (
                <LoadingOverlay 
                    progress={isScanning ? scanProgress : 100} 
                    title={isScanning ? "System Junk" : "Cleaning"} 
                    status={isScanning ? "Scanning for junk files..." : "Cleaning selected files..."} 
                />
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">System Junk</h2>
                    <p className="text-sm text-foreground-muted">Optimized for {platformInfo?.platform} paths.</p>
                </div>
                {results?.junkFiles && (
                    <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-400">{results.junkFiles.totalSizeFormatted}</div>
                        <div className="text-xs text-foreground-muted uppercase tracking-wider">Total Junk Found</div>
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-auto space-y-3 pr-2 custom-scrollbar">
                {results?.junkFiles?.items.map((item, i) => (
                    <Card key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-4">
                            <Checkbox 
                                checked={selectedItems.includes(item.path)}
                                onChange={(checked) => {
                                    if (checked) setSelectedItems([...selectedItems, item.path]);
                                    else setSelectedItems(selectedItems.filter(p => p !== item.path));
                                }}
                            />
                            <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                                <FolderOpen className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <p className="text-xs text-foreground-muted truncate max-w-md">{item.path}</p>
                            </div>
                        </div>
                        <div className="text-sm font-bold">{item.sizeFormatted}</div>
                    </Card>
                ))}
            </div>
            <div className="pt-4 border-t border-border-glass flex justify-between items-center">
                <Button variant="primary" size="lg" className="px-12" onClick={handleCleanup} loading={isCleaning}>Clean Selected</Button>
            </div>
        </div>
    );
};

const LargeFilesView = () => {
    const { largeFiles, setLargeFiles } = useSystemCleanerStore();
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'size' | 'name' | 'date'>('size');
    const [filterType, setFilterType] = useState<string>('all');
    
    const scanLargeFiles = async () => {
        setIsScanning(true);
        const interval = setInterval(() => setProgress(p => (p < 90 ? p + 5 : p)), 100);
        try {
            const files = await (window as any).cleanerAPI.getLargeFiles({ minSize: 50 * 1024 * 1024 });
            setLargeFiles(files);
            setProgress(100);
        } catch (error) {
            toast.error('Failed to scan for large files');
        } finally {
            clearInterval(interval);
            setTimeout(() => setIsScanning(false), 500);
        }
    };

    const handleDelete = async () => {
        if (selectedFiles.length === 0) return;
        if (!confirm(`Delete ${selectedFiles.length} files?`)) return;
        setIsDeleting(true);
        try {
            const res = await (window as any).cleanerAPI.runCleanup(selectedFiles);
            setIsDeleting(false);
            if (res.success) {
                toast.success(`Cleaned ${formatSize(res.freedSize)}`);
                setSelectedFiles([]);
                scanLargeFiles();
            } else {
                toast.error(`Failed to delete files: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            setIsDeleting(false);
            toast.error('Failed to delete files');
        }
    };

    // Filter and sort files
    const filteredFiles = React.useMemo(() => {
        let filtered = largeFiles.filter(file => {
            const matchesSearch = searchQuery === '' || 
                file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                file.path.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' || file.type === filterType;
            return matchesSearch && matchesType;
        });

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'size') return b.size - a.size;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'date') {
                const dateA = new Date(a.lastAccessed).getTime();
                const dateB = new Date(b.lastAccessed).getTime();
                return dateB - dateA;
            }
            return 0;
        });

        return filtered;
    }, [largeFiles, searchQuery, sortBy, filterType]);

    // Get unique file types
    const fileTypes = React.useMemo(() => {
        const types = new Set(largeFiles.map(f => f.type || 'unknown'));
        return ['all', ...Array.from(types)].sort();
    }, [largeFiles]);

    const handleSelectAll = () => {
        if (selectedFiles.length === filteredFiles.length) {
            setSelectedFiles([]);
        } else {
            setSelectedFiles(filteredFiles.map(f => f.path));
        }
    };

    if (largeFiles.length === 0 && !isScanning) {
        return <ScanPlaceholder title="Large Files" icon={FileText} description="Quickly identify huge files and folders that are eating up your disk space." onScan={scanLargeFiles} isScanning={isScanning} progress={progress} />;
    }

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {(isScanning || isDeleting) && (
                <LoadingOverlay 
                    progress={progress} 
                    title={isDeleting ? "Deleting Files" : "Large Files"} 
                    status={isDeleting ? "Deleting selected files..." : "Scanning for large files..."} 
                />
            )}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Large & Old Files</h2>
                <div className="flex gap-2">
                    {selectedFiles.length > 0 && (
                        <Button variant="danger" size="sm" onClick={handleDelete}>
                            <Trash className="w-4 h-4 mr-2" />
                            Delete ({selectedFiles.length})
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={scanLargeFiles}><RefreshCw className="mr-2 w-4 h-4" /> Rescan</Button>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex gap-3 items-center">
                <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-border-glass rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                </div>
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-white/5 border border-border-glass rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                >
                    {fileTypes.map(type => (
                        <option key={type} value={type}>{type === 'all' ? 'All Types' : type.toUpperCase()}</option>
                    ))}
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'size' | 'name' | 'date')}
                    className="bg-white/5 border border-border-glass rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                >
                    <option value="size">Sort by Size</option>
                    <option value="name">Sort by Name</option>
                    <option value="date">Sort by Date</option>
                </select>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                >
                    {selectedFiles.length === filteredFiles.length ? 'Deselect All' : 'Select All'}
                </Button>
            </div>

            <div className="flex-1 overflow-auto space-y-2 pr-2 custom-scrollbar">
                {filteredFiles.length === 0 ? (
                    <Card className="p-12 text-center border-border-glass bg-white/5">
                        <SearchIcon className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">No files found</h3>
                        <p className="text-sm text-foreground-muted">Try adjusting your search or filter criteria</p>
                    </Card>
                ) : (
                    filteredFiles.map((file, i) => (
                        <Card key={i} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Checkbox checked={selectedFiles.includes(file.path)} onChange={(c) => c ? setSelectedFiles([...selectedFiles, file.path]) : setSelectedFiles(selectedFiles.filter(p => p !== file.path))} />
                                <div className="p-2 bg-white/5 rounded-lg"><FileText className="w-5 h-5 text-indigo-400" /></div>
                                <div className="overflow-hidden"><h4 className="text-sm font-medium truncate">{file.name}</h4><p className="text-[10px] text-foreground-muted truncate">{file.path}</p></div>
                            </div>
                            <div className="text-sm font-bold">{file.sizeFormatted}</div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

const DuplicatesView = () => {
    const { duplicates, setDuplicates } = useSystemCleanerStore();
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [scanPath, setScanPath] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'size' | 'wasted'>('wasted');
    
    const scanDuplicates = async (path?: string) => {
        setIsScanning(true);
        const interval = setInterval(() => setProgress(p => (p < 95 ? p + 1 : p)), 100);
        try {
            const scanTarget = path || scanPath || undefined;
            const dups = await (window as any).cleanerAPI.getDuplicates(scanTarget);
            setDuplicates(dups);
            setProgress(100);
        } catch (error) {
            toast.error('Failed to scan for duplicates');
        } finally {
            clearInterval(interval);
            setTimeout(() => setIsScanning(false), 500);
        }
    };

    const handleDelete = async () => {
        if (selectedFiles.length === 0) return;
        if (!confirm(`Delete ${selectedFiles.length} duplicate copies?`)) return;
        setIsScanning(true);
        try {
            const res = await (window as any).cleanerAPI.runCleanup(selectedFiles);
            setIsScanning(false);
            if (res.success) {
                toast.success(`Cleaned ${formatSize(res.freedSize)}`);
                setSelectedFiles([]);
                scanDuplicates();
            } else {
                toast.error(`Failed to delete files: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            setIsScanning(false);
            toast.error('Failed to delete files');
        }
    };

    if (duplicates.length === 0 && !isScanning) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-8 text-center max-w-lg mx-auto animate-in fade-in duration-500">
                <div className="relative">
                    <div className="relative p-8 rounded-full border bg-white/5 border-border-glass">
                        <Copy className="w-16 h-16 text-foreground-muted" />
                    </div>
                </div>
                <div className="space-y-6 w-full">
                    <div>
                        <h2 className="text-3xl font-bold text-foreground mb-3">Duplicates</h2>
                        <p className="text-foreground-muted leading-relaxed">Find and delete identical files hidden in different folders to reclaim space.</p>
                    </div>
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Enter path to scan (leave empty for home directory)"
                            value={scanPath}
                            onChange={(e) => setScanPath(e.target.value)}
                            className="w-full bg-white/5 border border-border-glass rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                        />
                        <Button 
                            size="lg" 
                            variant="primary" 
                            className="w-full px-12 py-6 rounded-2xl text-lg font-bold shadow-lg shadow-indigo-500/20"
                            onClick={() => scanDuplicates()}
                        >
                            Start Scan
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {isScanning && <LoadingOverlay progress={progress} title="Duplicates" status="Scanning for duplicate files..." />}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Duplicates</h2>
                    <p className="text-sm text-foreground-muted">Scan path: {scanPath || 'Home directory'}</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Scan path..."
                        value={scanPath}
                        onChange={(e) => setScanPath(e.target.value)}
                        className="bg-white/5 border border-border-glass rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                    {selectedFiles.length > 0 && (
                        <Button variant="danger" size="sm" onClick={handleDelete}>
                            <Trash className="w-4 h-4 mr-2" />
                            Delete Selected ({selectedFiles.length})
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => scanDuplicates()}><RefreshCw className="mr-2 w-4 h-4" /> Rescan</Button>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex gap-3 items-center">
                <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <input
                        type="text"
                        placeholder="Search duplicate files..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-border-glass rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                </div>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'size' | 'wasted')}
                    className="bg-white/5 border border-border-glass rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                >
                    <option value="wasted">Sort by Wasted Space</option>
                    <option value="size">Sort by File Size</option>
                </select>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        const allFiles = duplicates.flatMap(g => g.files);
                        if (selectedFiles.length === allFiles.length) {
                            setSelectedFiles([]);
                        } else {
                            setSelectedFiles(allFiles);
                        }
                    }}
                >
                    {selectedFiles.length === duplicates.flatMap(g => g.files).length ? 'Deselect All' : 'Select All'}
                </Button>
            </div>

            <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
                {React.useMemo(() => {
                    let filtered = duplicates.filter(group => {
                        if (searchQuery === '') return true;
                        return group.files.some((path: string) => 
                            path.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                    });

                    filtered.sort((a, b) => {
                        if (sortBy === 'wasted') return b.totalWasted - a.totalWasted;
                        if (sortBy === 'size') return b.size - a.size;
                        return 0;
                    });

                    return filtered;
                }, [duplicates, searchQuery, sortBy]).length === 0 ? (
                    <Card className="p-12 text-center border-border-glass bg-white/5">
                        <SearchIcon className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">No duplicates found</h3>
                        <p className="text-sm text-foreground-muted">Try adjusting your search criteria</p>
                    </Card>
                ) : (
                    React.useMemo(() => {
                        let filtered = duplicates.filter(group => {
                            if (searchQuery === '') return true;
                            return group.files.some((path: string) => 
                                path.toLowerCase().includes(searchQuery.toLowerCase())
                            );
                        });

                        filtered.sort((a, b) => {
                            if (sortBy === 'wasted') return b.totalWasted - a.totalWasted;
                            if (sortBy === 'size') return b.size - a.size;
                            return 0;
                        });

                        return filtered;
                    }, [duplicates, searchQuery, sortBy]).map((group, i) => (
                        <Card key={i} className="overflow-hidden border-border-glass">
                            <div className="bg-white/10 p-3 flex items-center justify-between border-b border-border-glass">
                                <span className="text-xs font-bold text-indigo-400 uppercase">HASH: {group.hash.slice(0, 8)}</span>
                                <span className="text-xs font-bold text-amber-500">Wasted: {group.totalWastedFormatted}</span>
                            </div>
                            <div className="p-2 space-y-1">
                                {group.files.map((path: string, j: number) => (
                                    <div key={j} className="flex items-center p-2 rounded-lg hover:bg-white/5 text-[11px] group transition-colors">
                                        <Checkbox 
                                            checked={selectedFiles.includes(path)} 
                                            onChange={(c) => c ? setSelectedFiles([...selectedFiles, path]) : setSelectedFiles(selectedFiles.filter(p => p !== path))}
                                            className="mr-3"
                                        />
                                        <span className="truncate flex-1 text-foreground-muted italic group-hover:text-foreground">{path}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

// --- Maintenance View ---

const MaintenanceView = () => {
    const { platformInfo } = useSystemCleanerStore();
    const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set());
    const [taskHistory, setTaskHistory] = useState<any[]>([]);

    const platform = platformInfo?.platform;

    const windowsTasks = [
        {
            id: 'sfc',
            name: 'System File Checker',
            description: 'Scan and repair corrupted system files',
            category: 'sfc',
            icon: ShieldCheck,
            estimatedTime: '5-10 minutes',
            requiresSudo: true
        },
        {
            id: 'dism',
            name: 'DISM Health Restore',
            description: 'Restore Windows image health',
            category: 'dism',
            icon: Server,
            estimatedTime: '10-15 minutes',
            requiresSudo: true
        },
        {
            id: 'disk-cleanup',
            name: 'Disk Cleanup',
            description: 'Automated disk cleanup using Windows built-in tool',
            category: 'disk-cleanup',
            icon: HardDrive,
            estimatedTime: '2-5 minutes',
            requiresSudo: false
        },
        {
            id: 'dns-flush',
            name: 'Flush DNS Cache',
            description: 'Clear DNS resolver cache',
            category: 'dns-flush',
            icon: Wifi,
            estimatedTime: '< 1 minute',
            requiresSudo: false
        },
        {
            id: 'winsock-reset',
            name: 'Reset Winsock',
            description: 'Reset Windows network stack',
            category: 'winsock-reset',
            icon: Wifi,
            estimatedTime: '< 1 minute',
            requiresSudo: true
        },
        {
            id: 'windows-search-rebuild',
            name: 'Rebuild Windows Search Index',
            description: 'Rebuild Windows Search index for better performance',
            category: 'windows-search-rebuild',
            icon: SearchIcon,
            estimatedTime: '5-10 minutes',
            requiresSudo: true
        }
    ];

    const macosTasks = [
        {
            id: 'spotlight-reindex',
            name: 'Rebuild Spotlight Index',
            description: 'Rebuild macOS Spotlight search index',
            category: 'spotlight-reindex',
            icon: SearchIcon,
            estimatedTime: '10-30 minutes',
            requiresSudo: true
        },
        {
            id: 'disk-permissions',
            name: 'Verify Disk Permissions',
            description: 'Verify disk permissions (limited on macOS Big Sur+)',
            category: 'disk-permissions',
            icon: HardDrive,
            estimatedTime: '2-5 minutes',
            requiresSudo: true
        },
        {
            id: 'dns-flush',
            name: 'Flush DNS Cache',
            description: 'Clear DNS resolver cache',
            category: 'dns-flush',
            icon: Wifi,
            estimatedTime: '< 1 minute',
            requiresSudo: false
        },
        {
            id: 'mail-rebuild',
            name: 'Rebuild Mail Database',
            description: 'Rebuild Mail.app database (requires Mail.app to be closed)',
            category: 'mail-rebuild',
            icon: Mail,
            estimatedTime: '5-10 minutes',
            requiresSudo: false
        }
    ];

    const tasks = platform === 'windows' ? windowsTasks : platform === 'macos' ? macosTasks : [];

    const runTask = async (task: typeof tasks[0]) => {
        if (runningTasks.has(task.id)) return;
        
        setRunningTasks(new Set([...runningTasks, task.id]));
        
        try {
            const result = await (window as any).cleanerAPI.runMaintenance(task);
            
            const historyItem = {
                ...task,
                result,
                timestamp: new Date()
            };
            
            setTaskHistory([historyItem, ...taskHistory].slice(0, 20)); // Keep last 20
            
            if (result.success) {
                toast.success(`${task.name} completed successfully`);
            } else {
                toast.error(`${task.name} failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error(`Failed to run ${task.name}: ${(error as Error).message}`);
        } finally {
            setRunningTasks(new Set([...runningTasks].filter(id => id !== task.id)));
        }
    };

    const currentTask = [...windowsTasks, ...macosTasks].find(t => runningTasks.has(t.id));
    
    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {runningTasks.size > 0 && currentTask && (
                <LoadingOverlay 
                    progress={100} 
                    title={currentTask.name} 
                    status={`Running ${currentTask.name}...`} 
                />
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Maintenance</h2>
                    <p className="text-sm text-foreground-muted">System repair and upkeep tools for {platform === 'windows' ? 'Windows' : platform === 'macos' ? 'macOS' : 'your system'}</p>
                </div>
            </div>

            <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
                {tasks.map((task) => {
                    const Icon = task.icon;
                    const isRunning = runningTasks.has(task.id);
                    const lastRun = taskHistory.find(h => h.id === task.id);
                    
                    return (
                        <Card key={task.id} className="p-6 space-y-4 border-border-glass bg-white/5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className={cn(
                                        "p-3 rounded-xl transition-colors",
                                        isRunning ? "bg-indigo-500/20" : "bg-indigo-500/10"
                                    )}>
                                        <Icon className={cn(
                                            "w-6 h-6",
                                            isRunning ? "text-indigo-400 animate-pulse" : "text-indigo-400"
                                        )} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold">{task.name}</h3>
                                            {task.requiresSudo && (
                                                <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded">
                                                    Admin Required
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-foreground-muted mb-2">{task.description}</p>
                                        <div className="flex items-center gap-4 text-xs text-foreground-muted">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{task.estimatedTime}</span>
                                            </div>
                                            {lastRun && (
                                                <div className={cn(
                                                    "flex items-center gap-1",
                                                    lastRun.result.success ? "text-emerald-400" : "text-red-400"
                                                )}>
                                                    {lastRun.result.success ? (
                                                        <CheckCircle className="w-3 h-3" />
                                                    ) : (
                                                        <XCircle className="w-3 h-3" />
                                                    )}
                                                    <span>
                                                        {lastRun.result.success ? 'Completed' : 'Failed'} {formatTimeAgo(lastRun.timestamp)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {lastRun && lastRun.result.output && (
                                            <div className="mt-2 p-2 bg-white/5 rounded text-xs font-mono text-foreground-muted max-h-20 overflow-auto">
                                                {lastRun.result.output.substring(0, 200)}
                                                {lastRun.result.output.length > 200 && '...'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => runTask(task)}
                                    disabled={isRunning}
                                    loading={isRunning}
                                >
                                    {isRunning ? 'Running...' : 'Run'}
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

// Helper function for time ago
const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

// --- Health Monitor View ---

const HealthMonitorView = () => {
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
            const interval = setInterval(refreshHealth, 5000); // Refresh every 5 seconds
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

// --- Protection View ---

const ProtectionView = () => {
    const { privacyData, setPrivacyData, platformInfo } = useSystemCleanerStore();
    const [activeTab, setActiveTab] = useState<'privacy' | 'browser' | 'wifi'>('privacy');
    const [isScanning, setIsScanning] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedCategories, setSelectedCategories] = useState<{
        registry?: boolean;
        activityHistory?: boolean;
        spotlightHistory?: boolean;
        quickLookCache?: boolean;
    }>({});
    
    // Browser Data state
    const [browserData, setBrowserData] = useState<any>(null);
    const [isScanningBrowser, setIsScanningBrowser] = useState(false);
    const [isCleaningBrowser, setIsCleaningBrowser] = useState(false);
    const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>([]);
    const [selectedBrowserTypes, setSelectedBrowserTypes] = useState<string[]>(['history', 'cookies', 'cache', 'downloads']);
    
    // Wi-Fi Networks state
    const [wifiNetworks, setWifiNetworks] = useState<any[]>([]);
    const [isLoadingWifi, setIsLoadingWifi] = useState(false);
    const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);

    const scanPrivacy = async () => {
        setIsScanning(true);
        setProgress(0);
        const interval = setInterval(() => setProgress(p => (p < 90 ? p + 5 : p)), 100);
        try {
            const res = await (window as any).cleanerAPI.scanPrivacy();
            if (res.success) {
                setPrivacyData(res.results);
                setProgress(100);
                // Auto-select all categories
                setSelectedCategories({
                    registry: res.results.registryEntries.length > 0,
                    activityHistory: res.results.activityHistory.length > 0,
                    spotlightHistory: res.results.spotlightHistory.length > 0,
                    quickLookCache: res.results.quickLookCache.length > 0,
                });
            } else {
                toast.error(`Failed to scan privacy data: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to scan privacy data');
        } finally {
            clearInterval(interval);
            setTimeout(() => setIsScanning(false), 500);
        }
    };

    const cleanPrivacy = async () => {
        if (Object.values(selectedCategories).every(v => !v)) {
            toast.error('Please select at least one category to clean');
            return;
        }
        setIsCleaning(true);
        try {
            const res = await (window as any).cleanerAPI.cleanPrivacy(selectedCategories);
            if (res.success) {
                toast.success(`Cleaned ${res.cleanedItems} items (${res.freedSizeFormatted})`);
                setPrivacyData(null);
                setSelectedCategories({});
            } else {
                toast.error(`Failed to clean: ${res.errors?.join(', ') || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to clean privacy data');
        } finally {
            setIsCleaning(false);
        }
    };

    const renderPrivacySection = (title: string, items: PrivacyItem[], IconComponent: React.ComponentType<{ className?: string }>, categoryKey: keyof typeof selectedCategories) => {
        if (items.length === 0) return null;
        
        const totalSize = items.reduce((sum, item) => sum + item.size, 0);
        const totalCount = items.reduce((sum, item) => sum + item.count, 0);
        const isSelected = selectedCategories[categoryKey] ?? false;

        return (
            <Card className="p-6 space-y-4 border-border-glass bg-white/5">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <IconComponent className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{title}</h3>
                            <p className="text-xs text-foreground-muted">{totalCount} items • {formatSize(totalSize)}</p>
                        </div>
                    </div>
                    <Checkbox
                        checked={isSelected}
                        onChange={(checked) => setSelectedCategories({ ...selectedCategories, [categoryKey]: checked })}
                    />
                </div>
                <div className="space-y-2">
                    {items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-border-glass/50">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    {item.type === 'registry' ? (
                                        <Database className="w-4 h-4 text-indigo-400" />
                                    ) : (
                                        <FileText className="w-4 h-4 text-indigo-400" />
                                    )}
                                    <span className="text-sm font-medium">{item.name}</span>
                                </div>
                                <p className="text-xs text-foreground-muted mt-1">{item.description}</p>
                                <p className="text-xs text-foreground-muted/70 font-mono mt-1 truncate">{item.path}</p>
                            </div>
                            <div className="text-right ml-4">
                                <div className="text-sm font-bold text-indigo-400">{item.count} items</div>
                                {item.sizeFormatted && (
                                    <div className="text-xs text-foreground-muted">{item.sizeFormatted}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        );
    };

    // Browser Data functions
    const scanBrowserData = async () => {
        setIsScanningBrowser(true);
        setProgress(0);
        const interval = setInterval(() => setProgress(p => (p < 90 ? p + 5 : p)), 100);
        try {
            const res = await (window as any).cleanerAPI.scanBrowserData();
            if (res.success) {
                setBrowserData(res.results);
                setProgress(100);
                setSelectedBrowsers(res.results.browsers.map((b: any) => b.name));
            } else {
                toast.error(`Failed to scan browser data: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to scan browser data');
        } finally {
            clearInterval(interval);
            setTimeout(() => setIsScanningBrowser(false), 500);
        }
    };

    const cleanBrowserData = async () => {
        if (selectedBrowsers.length === 0 || selectedBrowserTypes.length === 0) {
            toast.error('Please select at least one browser and data type to clean');
            return;
        }
        setIsCleaningBrowser(true);
        try {
            const res = await (window as any).cleanerAPI.cleanBrowserData({
                browsers: selectedBrowsers,
                types: selectedBrowserTypes
            });
            if (res.success) {
                toast.success(`Cleaned ${res.cleanedItems} items (${res.freedSizeFormatted})`);
                setBrowserData(null);
                setSelectedBrowsers([]);
            } else {
                toast.error(`Failed to clean: ${res.errors?.join(', ') || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to clean browser data');
        } finally {
            setIsCleaningBrowser(false);
        }
    };

    // Wi-Fi Networks functions
    const loadWifiNetworks = async () => {
        setIsLoadingWifi(true);
        try {
            const res = await (window as any).cleanerAPI.getWifiNetworks();
            if (res.success) {
                setWifiNetworks(res.networks);
            } else {
                toast.error(`Failed to load Wi-Fi networks: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to load Wi-Fi networks');
        } finally {
            setIsLoadingWifi(false);
        }
    };

    const removeWifiNetwork = async (networkName: string) => {
        try {
            const res = await (window as any).cleanerAPI.removeWifiNetwork(networkName);
            if (res.success) {
                toast.success(`Removed Wi-Fi network: ${networkName}`);
                setWifiNetworks(wifiNetworks.filter(n => n.name !== networkName));
                setSelectedNetworks(selectedNetworks.filter(n => n !== networkName));
            } else {
                toast.error(`Failed to remove network: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to remove Wi-Fi network');
        }
    };

    const removeSelectedNetworks = async () => {
        if (selectedNetworks.length === 0) {
            toast.error('Please select at least one network to remove');
            return;
        }
        for (const networkName of selectedNetworks) {
            await removeWifiNetwork(networkName);
        }
    };

    // Load Wi-Fi networks on mount if on Wi-Fi tab
    useEffect(() => {
        if (activeTab === 'wifi' && wifiNetworks.length === 0 && !isLoadingWifi) {
            loadWifiNetworks();
        }
    }, [activeTab]);

    const platform = platformInfo?.platform;

    // Render Privacy Tab
    const renderPrivacyTab = () => {
        if (!privacyData && !isScanning) {
            return (
                <ScanPlaceholder
                    title="Privacy Protection"
                    icon={ShieldCheck}
                    description="Clean up privacy-sensitive data including registry entries, activity history, and search history."
                    onScan={scanPrivacy}
                    isScanning={isScanning}
                    progress={progress}
                />
            );
        }

        return (
            <div className="space-y-6 h-full flex flex-col relative">
                {(isScanning || isCleaning) && (
                    <LoadingOverlay 
                        progress={progress} 
                        title="Privacy Protection" 
                        status={isCleaning ? "Cleaning privacy data..." : "Scanning privacy data..."} 
                    />
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Privacy Protection</h2>
                        <p className="text-sm text-foreground-muted">
                            Remove privacy-sensitive data from your system
                        </p>
                    </div>
                <div className="flex gap-2">
                    {privacyData && (
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={cleanPrivacy}
                            disabled={isCleaning || Object.values(selectedCategories).every(v => !v)}
                        >
                            {isCleaning ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Cleaning...
                                </>
                            ) : (
                                <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Clean Selected
                                </>
                            )}
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={scanPrivacy} disabled={isScanning}>
                        <RefreshCw className={cn("w-4 h-4 mr-2", isScanning && "animate-spin")} />
                        {privacyData ? 'Rescan' : 'Scan'}
                    </Button>
                </div>
            </div>

            {privacyData && (
                <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
                    {platform === 'windows' && (
                        <>
                            {renderPrivacySection(
                                'Registry Entries',
                                privacyData.registryEntries,
                                Database,
                                'registry'
                            )}
                            {renderPrivacySection(
                                'Activity History',
                                privacyData.activityHistory,
                                History,
                                'activityHistory'
                            )}
                        </>
                    )}
                    {platform === 'macos' && (
                        <>
                            {renderPrivacySection(
                                'Spotlight History',
                                privacyData.spotlightHistory,
                                Search as React.ComponentType<{ className?: string }>,
                                'spotlightHistory'
                            )}
                            {renderPrivacySection(
                                'Quick Look Cache',
                                privacyData.quickLookCache,
                                Eye,
                                'quickLookCache'
                            )}
                        </>
                    )}
                    
                    {privacyData.totalItems > 0 && (
                        <Card className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold">Total Privacy Data Found</h3>
                                    <p className="text-sm text-foreground-muted">
                                        {privacyData.totalItems} items • {formatSize(privacyData.totalSize)}
                                    </p>
                                </div>
                                <ShieldCheck className="w-12 h-12 text-indigo-400" />
                            </div>
                        </Card>
                    )}
                </div>
            )}
            </div>
        );
    };

    // Render Browser Data Tab
    const renderBrowserTab = () => {
        if (!browserData && !isScanningBrowser) {
            return (
                <ScanPlaceholder
                    title="Browser Data Cleanup"
                    icon={SearchIcon}
                    description="Clean up browser history, cookies, cache, and download history from Chrome, Firefox, Edge, and Safari."
                    onScan={scanBrowserData}
                    isScanning={isScanningBrowser}
                    progress={progress}
                />
            );
        }

        return (
            <div className="space-y-6 h-full flex flex-col relative">
                {(isScanningBrowser || isCleaningBrowser) && (
                    <LoadingOverlay 
                        progress={progress} 
                        title="Browser Data Cleanup" 
                        status={isCleaningBrowser ? "Cleaning browser data..." : "Scanning browser data..."} 
                    />
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Browser Data Cleanup</h2>
                        <p className="text-sm text-foreground-muted">
                            Remove browser history, cookies, cache, and download history
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {browserData && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={cleanBrowserData}
                                disabled={isCleaningBrowser || selectedBrowsers.length === 0 || selectedBrowserTypes.length === 0}
                            >
                                {isCleaningBrowser ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Cleaning...
                                    </>
                                ) : (
                                    <>
                                        <Trash className="w-4 h-4 mr-2" />
                                        Clean Selected
                                    </>
                                )}
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={scanBrowserData} disabled={isScanningBrowser}>
                            <RefreshCw className={cn("w-4 h-4 mr-2", isScanningBrowser && "animate-spin")} />
                            {browserData ? 'Rescan' : 'Scan'}
                        </Button>
                    </div>
                </div>

                {browserData && (
                    <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
                        <div className="flex gap-4 mb-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Data Types</label>
                                <div className="flex flex-wrap gap-2">
                                    {['history', 'cookies', 'cache', 'downloads'].map(type => (
                                        <Checkbox
                                            key={type}
                                            checked={selectedBrowserTypes.includes(type)}
                                            onChange={(checked) => {
                                                if (checked) {
                                                    setSelectedBrowserTypes([...selectedBrowserTypes, type]);
                                                } else {
                                                    setSelectedBrowserTypes(selectedBrowserTypes.filter(t => t !== type));
                                                }
                                            }}
                                            label={type.charAt(0).toUpperCase() + type.slice(1)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {browserData.browsers.map((browser: any) => (
                            <Card key={browser.name} className="p-6 space-y-4 border-border-glass bg-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                            <SearchIcon className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">{browser.name}</h3>
                                            <p className="text-xs text-foreground-muted">{browser.totalSizeFormatted}</p>
                                        </div>
                                    </div>
                                    <Checkbox
                                        checked={selectedBrowsers.includes(browser.name)}
                                        onChange={(checked) => {
                                            if (checked) {
                                                setSelectedBrowsers([...selectedBrowsers, browser.name]);
                                            } else {
                                                setSelectedBrowsers(selectedBrowsers.filter(b => b !== browser.name));
                                            }
                                        }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {['history', 'cookies', 'cache', 'downloads'].map(type => {
                                        const data = browser[type];
                                        if (!data || data.size === 0) return null;
                                        return (
                                            <div key={type} className="p-3 bg-white/5 rounded-lg border border-border-glass/50">
                                                <div className="text-xs text-foreground-muted mb-1 capitalize">{type}</div>
                                                <div className="text-sm font-bold text-indigo-400">{formatSize(data.size)}</div>
                                                <div className="text-xs text-foreground-muted">{data.count} items</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        ))}

                        {browserData.totalSize > 0 && (
                            <Card className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold">Total Browser Data Found</h3>
                                        <p className="text-sm text-foreground-muted">
                                            {browserData.totalItems} items • {formatSize(browserData.totalSize)}
                                        </p>
                                    </div>
                                    <SearchIcon className="w-12 h-12 text-indigo-400" />
                                </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Render Wi-Fi Networks Tab
    const renderWifiTab = () => {
        return (
            <div className="space-y-6 h-full flex flex-col relative">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Wi-Fi Network Cleanup</h2>
                        <p className="text-sm text-foreground-muted">
                            Remove old or forgotten Wi-Fi networks from your system
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedNetworks.length > 0 && (
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={removeSelectedNetworks}
                                disabled={isLoadingWifi}
                            >
                                <Trash className="w-4 h-4 mr-2" />
                                Remove Selected ({selectedNetworks.length})
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={loadWifiNetworks} disabled={isLoadingWifi}>
                            <RefreshCw className={cn("w-4 h-4 mr-2", isLoadingWifi && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto space-y-2 pr-2 custom-scrollbar">
                    {isLoadingWifi ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                        </div>
                    ) : wifiNetworks.length === 0 ? (
                        <Card className="p-12 text-center border-border-glass bg-white/5">
                            <Wifi className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                            <h3 className="text-lg font-bold mb-2">No Wi-Fi Networks Found</h3>
                            <p className="text-sm text-foreground-muted mb-4">
                                Click Refresh to scan for saved Wi-Fi networks
                            </p>
                            <Button variant="outline" onClick={loadWifiNetworks}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Scan Networks
                            </Button>
                        </Card>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-sm text-foreground-muted">
                                    {wifiNetworks.length} network{wifiNetworks.length !== 1 ? 's' : ''} found
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        if (selectedNetworks.length === wifiNetworks.length) {
                                            setSelectedNetworks([]);
                                        } else {
                                            setSelectedNetworks(wifiNetworks.map(n => n.name));
                                        }
                                    }}
                                >
                                    {selectedNetworks.length === wifiNetworks.length ? 'Deselect All' : 'Select All'}
                                </Button>
                            </div>
                            {wifiNetworks.map((network) => (
                                <Card key={network.name} className="p-4 border-border-glass bg-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Checkbox
                                                checked={selectedNetworks.includes(network.name)}
                                                onChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedNetworks([...selectedNetworks, network.name]);
                                                    } else {
                                                        setSelectedNetworks(selectedNetworks.filter(n => n !== network.name));
                                                    }
                                                }}
                                            />
                                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                                <Wifi className="w-5 h-5 text-indigo-400" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold">{network.name}</div>
                                                <div className="text-xs text-foreground-muted">
                                                    {network.hasPassword ? 'Password protected' : 'Open network'}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeWifiNetwork(network.name)}
                                            disabled={isLoadingWifi}
                                        >
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-border-glass">
                <button
                    onClick={() => setActiveTab('privacy')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'privacy'
                            ? "border-indigo-500 text-indigo-400"
                            : "border-transparent text-foreground-muted hover:text-foreground"
                    )}
                >
                    <ShieldCheck className="w-4 h-4 inline mr-2" />
                    Privacy
                </button>
                <button
                    onClick={() => setActiveTab('browser')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'browser'
                            ? "border-indigo-500 text-indigo-400"
                            : "border-transparent text-foreground-muted hover:text-foreground"
                    )}
                >
                    <SearchIcon className="w-4 h-4 inline mr-2" />
                    Browser Data
                </button>
                <button
                    onClick={() => setActiveTab('wifi')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'wifi'
                            ? "border-indigo-500 text-indigo-400"
                            : "border-transparent text-foreground-muted hover:text-foreground"
                    )}
                >
                    <Wifi className="w-4 h-4 inline mr-2" />
                    Wi-Fi Networks
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'privacy' && renderPrivacyTab()}
                {activeTab === 'browser' && renderBrowserTab()}
                {activeTab === 'wifi' && renderWifiTab()}
            </div>
        </div>
    );
};

// --- Main Component ---

export const SystemCleaner: React.FC = () => {
    const [activeTab, setActiveTab] = useState('smart-scan');
    const { platformInfo, setPlatformInfo } = useSystemCleanerStore();
    
    // Load platform info on mount
    useEffect(() => {
        const loadPlatform = async () => {
            if (!platformInfo) {
                try {
                    const info = await (window as any).cleanerAPI.getPlatform();
                    setPlatformInfo(info);
                } catch (error) {
                    toast.error('Failed to detect platform');
                }
            }
        };
        loadPlatform();
    }, [platformInfo, setPlatformInfo]);
    
    // Start health monitoring for tray widget
    useEffect(() => {
        const startMonitoring = async () => {
            try {
                await (window as any).cleanerAPI.startHealthMonitoring();
            } catch (error) {
                console.warn('Failed to start health monitoring:', error);
            }
        };
        
        startMonitoring();
        
        return () => {
            // Stop monitoring on unmount
            (window as any).cleanerAPI.stopHealthMonitoring().catch(() => {});
        };
    }, []);
    
    // Update tray with health data when health status changes
    const { privacyData } = useSystemCleanerStore();
    useEffect(() => {
        const updateTray = async () => {
            try {
                const healthStatus = await (window as any).cleanerAPI.getHealthStatus();
                if (healthStatus && (window as any).cleanerAPI.updateHealthTray) {
                    (window as any).cleanerAPI.updateHealthTray(healthStatus);
                }
            } catch (error) {
                // Silently fail - tray updates are optional
            }
        };
        
        // Update tray periodically
        const interval = setInterval(updateTray, 5000);
        updateTray(); // Initial update
        
        return () => clearInterval(interval);
    }, [privacyData]);
    
    // Platform-specific UI adaptations
    const platform = platformInfo?.platform;
    const isWindows = platform === 'windows';
    const isMacOS = platform === 'macos';
    
    const tabs = [
        { id: 'smart-scan', name: 'Smart Care', icon: Shield },
        { id: 'space-lens', name: 'Space Lens', icon: LayoutGrid },
        { id: 'cleanup', name: 'System Junk', icon: Trash2 },
        { id: 'large-files', name: 'Large Files', icon: FileText },
        { id: 'duplicates', name: 'Duplicates', icon: Copy },
        { id: 'performance', name: 'Performance', icon: Activity },
        { id: 'startup', name: 'Startup', icon: Power },
        { id: 'uninstaller', name: 'Uninstaller', icon: AppWindow },
        { id: 'protection', name: 'Protection', icon: ShieldCheck },
        { id: 'maintenance', name: 'Maintenance', icon: Wrench },
        { id: 'health', name: 'Health', icon: ActivityIcon },
    ];

    return (
        <ToolPane
            title="System Cleaner"
            description={`Premium system maintenance and optimization suite${platform ? ` for ${isWindows ? 'Windows' : isMacOS ? 'macOS' : platform}` : ''}`}
        >
            <div className="flex h-full gap-8 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-56 flex flex-col space-y-1 shrink-0">
                    <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest px-4 mb-3 opacity-50">Intelligence</div>
                    {tabs.slice(0, 2).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                                    : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                        </button>
                    ))}
                    
                    <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest px-4 mt-6 mb-3 opacity-50">Cleaning</div>
                    {tabs.slice(2, 5).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                                    : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                        </button>
                    ))}

                    <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest px-4 mt-6 mb-3 opacity-50">Optimization</div>
                    {tabs.slice(5, 8).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                                    : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                        </button>
                    ))}

                    <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest px-4 mt-6 mb-3 opacity-50">Protection</div>
                    {tabs.slice(8, 10).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                                    : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                        </button>
                    ))}

                    <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest px-4 mt-6 mb-3 opacity-50">Monitoring</div>
                    {tabs.slice(10).map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium",
                                activeTab === tab.id 
                                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" 
                                    : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.name}</span>
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white/[0.03] rounded-[32px] border border-border-glass overflow-hidden relative shadow-inner">
                    <div className="absolute inset-0 p-10 overflow-auto custom-scrollbar">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="h-full"
                            >
                                {activeTab === 'smart-scan' && <SmartScan />}
                                {activeTab === 'space-lens' && <SpaceLensView />}
                                {activeTab === 'cleanup' && <JunkCleanupView />}
                                {activeTab === 'large-files' && <LargeFilesView />}
                                {activeTab === 'duplicates' && <DuplicatesView />}
                                {activeTab === 'performance' && <PerformanceView />}
                                {activeTab === 'startup' && <StartupView />}
                                {activeTab === 'uninstaller' && <UninstallerView />}
                                {activeTab === 'protection' && <ProtectionView />}
                                {activeTab === 'maintenance' && <MaintenanceView />}
                                {activeTab === 'health' && <HealthMonitorView />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </ToolPane>
    );
};
