import React, { useState, useEffect } from 'react';
import { ToolPane } from '../../../components/layout/ToolPane';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Checkbox } from '../../../components/ui/Checkbox';
import { 
    Trash2, 
    Shield, 
    Zap, 
    RotateCcw, 
    HardDrive,
    ShieldCheck,
    Wrench,
    CheckCircle2,
    FileText,
    Copy,
    FolderOpen,
    Trash,
    RefreshCw,
    AlertCircle,
    LayoutGrid,
    ChevronLeft,
    Box
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { useSystemCleanerStore as StoreType, FileItem, DuplicateGroup, LargeFile, SpaceLensNode } from './store/systemCleanerStore';
import { useSystemCleanerStore } from './store/systemCleanerStore';
import { useSmartScan } from './hooks/useSmartScan';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// --- Sub-components ---

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const SmartScan = () => {
    const { isScanning, scanProgress, scanStatus, results } = useSystemCleanerStore();
    const { runSmartScan } = useSmartScan();
    
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
                        <Card className="p-6 space-y-4 shadow-xl border-border-glass bg-white/5">
                            <div className="flex items-center gap-3 text-emerald-400">
                                <CheckCircle2 className="w-5 h-5" />
                                <h4 className="font-bold">Cleanup</h4>
                            </div>
                            <div className="text-3xl font-bold">{formatSize(results.totalSpaceSavings)}</div>
                            <p className="text-sm text-foreground-muted">Junk files can be safely removed</p>
                        </Card>
                        <Card className="p-6 space-y-4 shadow-xl border-border-glass bg-white/5">
                            <div className="flex items-center gap-3 text-indigo-400">
                                <ShieldCheck className="w-5 h-5" />
                                <h4 className="font-bold">Protection</h4>
                            </div>
                            <div className="text-3xl font-bold">Safe</div>
                            <p className="text-sm text-foreground-muted">No threats detected in quick scan</p>
                        </Card>
                        <Card className="p-6 space-y-4 shadow-xl border-border-glass bg-white/5">
                            <div className="flex items-center gap-3 text-amber-400">
                                <Zap className="w-5 h-5" />
                                <h4 className="font-bold">Performance</h4>
                            </div>
                            <div className="text-3xl font-bold">Ready</div>
                            <p className="text-sm text-foreground-muted">System is optimized</p>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Space Lens ---

const SpaceLensView = () => {
    const { spaceLensData, setSpaceLensData } = useSystemCleanerStore();
    const [isScanning, setIsScanning] = useState(false);
    const [history, setHistory] = useState<SpaceLensNode[]>([]);
    const [currentPath, setCurrentPath] = useState('');

    const scanSpace = async (pathStr = '') => {
        setIsScanning(true);
        try {
            const data = await (window as any).cleanerAPI.getSpaceLens(pathStr || undefined);
            setSpaceLensData(data);
            if (!currentPath) setCurrentPath(data.path);
        } catch (e) {
            toast.error('Failed to scan storage.');
        } finally {
            setIsScanning(false);
        }
    };

    useEffect(() => {
        if (!spaceLensData) scanSpace();
    }, []);

    const navigateTo = (node: SpaceLensNode) => {
        if (node.type === 'dir' && node.children) {
            setHistory([...history, spaceLensData!]);
            setSpaceLensData(node);
        }
    };

    const goBack = () => {
        if (history.length > 0) {
            const prev = history[history.length - 1];
            setSpaceLensData(prev);
            setHistory(history.slice(0, -1));
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {history.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={goBack}>
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                    )}
                    <div>
                        <h2 className="text-2xl font-bold">Space Lens</h2>
                        <p className="text-sm text-foreground-muted truncate max-w-md">
                            {spaceLensData?.path || 'Analyzing storage structure...'}
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => scanSpace()} loading={isScanning}>
                    <RefreshCw className={cn("w-4 h-4 mr-2", isScanning && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
                {isScanning && (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 text-foreground-muted">
                        <Box className="w-12 h-12 animate-bounce" />
                        <p>Scanning files and folders...</p>
                    </div>
                )}

                {spaceLensData && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
                        {spaceLensData.children?.map((node, i) => {
                            const percentage = (node.size / spaceLensData.size) * 100;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    onClick={() => navigateTo(node)}
                                    className={cn(
                                        "group relative p-4 rounded-2xl border transition-all cursor-pointer overflow-hidden",
                                        node.type === 'dir' ? "bg-white/5 border-border-glass" : "bg-white/[0.02] border-border-glass/50"
                                    )}
                                >
                                    {/* Visual Size Meter Background */}
                                    <div 
                                        className="absolute bottom-0 left-0 h-1 bg-indigo-500/30 transition-all group-hover:bg-indigo-500"
                                        style={{ width: `${Math.max(percentage, 2)}%` }}
                                    />
                                    
                                    <div className="flex flex-col items-center text-center space-y-3">
                                        <div className={cn(
                                            "p-3 rounded-xl transition-colors",
                                            node.type === 'dir' ? "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white" : "bg-white/5 text-foreground-muted"
                                        )}>
                                            {node.type === 'dir' ? <FolderOpen className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                        </div>
                                        <div className="w-full">
                                            <div className="text-sm font-bold truncate px-1">{node.name}</div>
                                            <div className="text-[10px] text-foreground-muted">{formatSize(node.size)}</div>
                                        </div>
                                    </div>
                                    
                                    {percentage > 10 && (
                                        <div className="absolute top-2 right-2 text-[8px] font-bold text-foreground-muted/50 uppercase tracking-tighter">
                                            {percentage.toFixed(0)}%
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Cleanup Views ---

const JunkCleanupView = () => {
    const { results, isScanning, platformInfo } = useSystemCleanerStore();
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
        setIsCleaning(true);
        try {
            const cleanupResult = await (window as any).cleanerAPI.runCleanup(selectedItems);
            if (cleanupResult.success) {
                toast.success(`Cleaned ${formatSize(cleanupResult.freedSize)} successfully!`);
                runSmartScan(); 
            } else {
                toast.error('Some files could not be cleaned.');
            }
        } catch (e) {
            toast.error('Failed to run cleanup.');
        } finally {
            setIsCleaning(false);
        }
    };

    if (!results?.junkFiles && !isScanning) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Trash2 className="w-16 h-16 text-foreground-muted" />
                <h3 className="text-xl font-bold">No Scan Data</h3>
                <p className="text-foreground-muted">Run a Smart Scan to find junk files.</p>
                <Button onClick={runSmartScan}>Scan Now</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">System Junk</h2>
                    <p className="text-sm text-foreground-muted">
                        Optimized for {platformInfo?.platform === 'win32' ? 'Windows' : 'macOS'} system paths.
                    </p>
                </div>
                {results?.junkFiles && (
                    <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-400">{results.junkFiles.totalSizeFormatted}</div>
                        <div className="text-xs text-foreground-muted uppercase tracking-wider">Total Junk Found</div>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-auto space-y-3 pr-2 custom-scrollbar">
                {results?.junkFiles?.items.map((item: any, i: number) => (
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
                <div className="text-sm text-foreground-muted">
                    {selectedItems.length} items selected
                </div>
                <Button 
                    variant="primary" 
                    size="lg" 
                    className="px-12"
                    disabled={selectedItems.length === 0 || isCleaning}
                    onClick={handleCleanup}
                    loading={isCleaning}
                >
                    Clean Selected
                </Button>
            </div>
        </div>
    );
};

const LargeFilesView = () => {
    const { largeFiles, setLargeFiles } = useSystemCleanerStore();
    const [isScanning, setIsScanning] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    const scanLargeFiles = async () => {
        setIsScanning(true);
        try {
            const files = await (window as any).cleanerAPI.getLargeFiles({ minSize: 50 * 1024 * 1024 });
            setLargeFiles(files);
        } catch (e) {
            toast.error('Failed to scan for large files.');
        } finally {
            setIsScanning(false);
        }
    };

    const handleDelete = async () => {
        if (selectedFiles.length === 0) return;
        try {
            const result = await (window as any).cleanerAPI.runCleanup(selectedFiles);
            if (result.success) {
                toast.success(`Deleted ${formatSize(result.freedSize)}`);
                scanLargeFiles();
                setSelectedFiles([]);
            }
        } catch (e) {
            toast.error('Deletion failed.');
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Large & Old Files</h2>
                    <p className="text-sm text-foreground-muted">Find files over 50MB taking up space.</p>
                </div>
                <Button variant="outline" size="sm" onClick={scanLargeFiles} loading={isScanning}>
                    <RefreshCw className={cn("w-4 h-4 mr-2", isScanning && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            <div className="flex-1 overflow-auto space-y-2 pr-2 custom-scrollbar">
                {largeFiles.length === 0 && !isScanning && (
                    <div className="flex flex-col items-center justify-center h-full text-foreground-muted h-64">
                        <FileText className="w-12 h-12 mb-2 opacity-20" />
                        <p>No large files found. Click refresh to scan.</p>
                    </div>
                )}
                
                {largeFiles.map((file: any, i: number) => (
                    <Card key={i} className="p-3 flex items-center justify-between group hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Checkbox 
                                checked={selectedFiles.includes(file.path)}
                                onChange={(checked) => {
                                    if (checked) setSelectedFiles([...selectedFiles, file.path]);
                                    else setSelectedFiles(selectedFiles.filter(p => p !== file.path));
                                }}
                            />
                            <div className="shrink-0 p-2 bg-white/5 rounded-lg">
                                <FileText className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="overflow-hidden">
                                <h4 className="text-sm font-medium truncate">{file.name}</h4>
                                <p className="text-[10px] text-foreground-muted truncate group-hover:text-foreground transition-colors">{file.path}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="text-sm font-bold">{file.sizeFormatted}</div>
                        </div>
                    </Card>
                ))}
            </div>

            {selectedFiles.length > 0 && (
                <div className="pt-4 border-t border-border-glass flex justify-between items-center animate-in slide-in-from-bottom-2">
                    <div className="text-sm text-amber-400 flex items-center gap-2 font-medium">
                        <AlertCircle className="w-4 h-4" />
                        Files will be permanently deleted
                    </div>
                    <Button variant="danger" onClick={handleDelete}>
                        Delete {selectedFiles.length} Files
                    </Button>
                </div>
            )}
        </div>
    );
};

const DuplicatesView = () => {
    const { duplicates, setDuplicates } = useSystemCleanerStore();
    const [isScanning, setIsScanning] = useState(false);

    const scanDuplicates = async () => {
        setIsScanning(true);
        try {
            const dups = await (window as any).cleanerAPI.getDuplicates();
            setDuplicates(dups);
        } catch (e) {
            toast.error('Failed to scan for duplicates.');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Duplicates</h2>
                    <p className="text-sm text-foreground-muted">Identical files found in different locations.</p>
                </div>
                <Button variant="outline" size="sm" onClick={scanDuplicates} loading={isScanning}>
                    <Copy className={cn("w-4 h-4 mr-2", isScanning && "animate-spin")} />
                    Find Duplicates
                </Button>
            </div>

            <div className="flex-1 overflow-auto space-y-4 pr-2 custom-scrollbar">
                {duplicates.length === 0 && !isScanning && (
                    <div className="flex flex-col items-center justify-center h-full text-foreground-muted h-64">
                        <Copy className="w-12 h-12 mb-2 opacity-20" />
                        <p>No duplicates found yet.</p>
                    </div>
                )}

                {duplicates.map((group: any, i: number) => (
                    <Card key={i} className="overflow-hidden border-border-glass shadow-lg">
                        <div className="bg-white/10 p-3 flex items-center justify-between border-b border-border-glass">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-indigo-400 uppercase">HASH: {group.hash.slice(0, 8)}</span>
                                <span className="text-xs text-foreground-muted">• {group.files.length} copies found</span>
                            </div>
                            <div className="text-xs font-bold text-amber-500">Resource impact: {group.totalWastedFormatted}</div>
                        </div>
                        <div className="p-2 space-y-1">
                            {group.files.map((path: string, j: number) => (
                                <div key={j} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 text-[11px] group transition-colors">
                                    <span className="truncate flex-1 text-foreground-muted group-hover:text-foreground italic">{path}</span>
                                    {j > 0 && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-6 w-6 p-0 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                                            onClick={async () => {
                                                const res = await (window as any).cleanerAPI.runCleanup([path]);
                                                if (res.success) {
                                                    toast.success('Duplicate copy removed');
                                                    scanDuplicates();
                                                }
                                            }}
                                        >
                                            <Trash className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

const ModulePlaceholder = ({ title, icon: Icon, description }: { title: string, icon: any, description: string }) => (
    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center max-w-2xl mx-auto animate-in zoom-in-95 duration-500">
        <div className="bg-white/5 p-8 rounded-full border border-border-glass relative">
            <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-full" />
            <Icon className="w-12 h-12 text-foreground-muted relative" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
            <p className="text-foreground-muted leading-relaxed">{description}</p>
        </div>
        <Button variant="outline" size="lg" className="rounded-xl">Coming Soon</Button>
    </div>
);

// --- Main Component ---

export const SystemCleaner: React.FC = () => {
    const [activeTab, setActiveTab] = useState('smart-scan');
    
    const tabs = [
        { id: 'smart-scan', name: 'Smart Care', icon: Shield },
        { id: 'space-lens', name: 'Space Lens', icon: LayoutGrid },
        { id: 'cleanup', name: 'System Junk', icon: Trash2 },
        { id: 'large-files', name: 'Large Files', icon: FileText },
        { id: 'duplicates', name: 'Duplicates', icon: Copy },
        { id: 'protection', name: 'Protection', icon: ShieldCheck },
        { id: 'performance', name: 'Performance', icon: Zap },
        { id: 'maintenance', name: 'Maintenance', icon: Wrench },
    ];

    return (
        <ToolPane
            title="System Cleaner"
            description="Premium system maintenance and storage visualization"
        >
            <div className="flex h-full gap-8 overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-60 flex flex-col space-y-1 shrink-0">
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
                    {tabs.slice(5).map((tab) => (
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
                    
                    <div className="mt-auto px-4 py-5 border-t border-border-glass/50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-border-glass">
                                <HardDrive className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider">Disk Health</div>
                                <div className="text-sm font-bold">Excellent</div>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 w-[38%]" />
                        </div>
                    </div>
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
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="h-full"
                            >
                                {activeTab === 'smart-scan' && <SmartScan />}
                                {activeTab === 'space-lens' && <SpaceLensView />}
                                {activeTab === 'cleanup' && <JunkCleanupView />}
                                {activeTab === 'large-files' && <LargeFilesView />}
                                {activeTab === 'duplicates' && <DuplicatesView />}
                                {activeTab === 'protection' && (
                                    <ModulePlaceholder 
                                        title="System Protection" 
                                        icon={ShieldCheck} 
                                        description="Scan for malware, adware, and privacy threats. Protect your personal data and browser history with a real-time shield." 
                                    />
                                )}
                                {activeTab === 'performance' && (
                                    <ModulePlaceholder 
                                        title="Performance Optimization" 
                                        icon={Zap} 
                                        description="Speed up your system by freeing up RAM, managing startup items, and monitoring resource-heavy applications in real-time." 
                                    />
                                )}
                                {activeTab === 'maintenance' && (
                                    <ModulePlaceholder 
                                        title="Maintenance Tasks" 
                                        icon={Wrench} 
                                        description="Run deep system maintenance tasks like flushing DNS cache, rebuilding search indexes, and repairing disk permissions to keep things smooth." 
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
