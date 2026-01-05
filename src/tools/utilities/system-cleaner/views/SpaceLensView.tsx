import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, RefreshCw, ChevronLeft, FileText, FolderOpen, Trash, List, GitBranch, Minimize2, ScanLine, FileSearch, FolderSearch, HardDrive, Sparkles, XCircle, ChevronRight, ChevronDown, Download, Camera, TrendingUp } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { ScanPlaceholder } from '../components/ScanPlaceholder';
import { useSystemCleanerStore } from '../store/systemCleanerStore';
import type { SpaceLensNode } from '../types';
import { formatSize } from '../utils/formatUtils';
import { exportSpaceLensToJSON, exportSpaceLensToCSV, createSnapshot, compareSnapshots, downloadFile } from '../utils/spaceLensExport';
import { cn } from '../../../../utils/cn';
import { toast } from 'sonner';

type ViewMode = 'grid' | 'list' | 'tree' | 'detail' | 'compact';

export const SpaceLensView: React.FC = () => {
    const { spaceLensData, setSpaceLensData } = useSystemCleanerStore();
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [scanStatus, setScanStatus] = useState('');
    const [currentScanPath, setCurrentScanPath] = useState('');
    const [currentScanItem, setCurrentScanItem] = useState('');
    const [history, setHistory] = useState<SpaceLensNode[]>([]);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const scanCancelRef = useRef(false);
    const progressCleanupRef = useRef<(() => void) | null>(null);

    const scanSpace = async (pathStr = '') => {
        setIsScanning(true);
        setProgress(0);
        setScanStatus('Initializing scan...');
        setCurrentScanPath(pathStr || 'Root directory');
        setCurrentScanItem('');
        scanCancelRef.current = false;
        
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
        
        if (progressCleanupRef.current) {
            progressCleanupRef.current();
            progressCleanupRef.current = null;
        }
        
        if ((window as any).cleanerAPI.onSpaceLensProgress) {
            progressCleanupRef.current = (window as any).cleanerAPI.onSpaceLensProgress((progressData: { currentPath: string; progress: number; status: string; item?: SpaceLensNode }) => {
                if (!scanCancelRef.current) {
                    setCurrentScanItem(progressData.currentPath);
                    setScanStatus(progressData.status);
                    setProgress(Math.min(progressData.progress, 95));
                    
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
        const currentPath = spaceLensData?.path || '';
        setIsScanning(true);
        try {
            const res = await (window as any).cleanerAPI.runCleanup([node.path]);
            setIsScanning(false);
            if (res.success) {
                toast.success(`Deleted ${node.name}`);
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

    useEffect(() => {
        return () => {
            if (progressCleanupRef.current) {
                progressCleanupRef.current();
            }
        };
    }, []);

    if (!spaceLensData && !isScanning) {
        return (
            <ScanPlaceholder 
                title="Space Lens" 
                icon={LayoutGrid} 
                description="Visually explore your storage structure to find what's taking up space." 
                onScan={() => scanSpace()} 
                isScanning={isScanning} 
                progress={progress}
                tips={[
                    'Click on folders to navigate deeper',
                    'Use different view modes (grid, list, tree)',
                    'Export scan results to JSON or CSV',
                    'Create snapshots to compare changes over time'
                ]}
                quickActions={[
                    { label: 'Scan Home Directory', onClick: () => scanSpace(process.env.HOME || '') },
                    { label: 'Scan Root', onClick: () => scanSpace('/') }
                ]}
            />
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {isScanning && (
                <div className="fixed inset-0 bg-black/50 dark:bg-black/50 bg-white/60 backdrop-blur-md z-50 flex flex-col items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-gradient-to-br from-white/10 dark:from-white/10 to-white/5 dark:to-white/5 backdrop-blur-xl border border-white/20 dark:border-white/20 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl"
                    >
                        <div className="flex flex-col items-center space-y-6">
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
                            
                            <div className="text-center space-y-3 w-full">
                                <div className="flex items-center justify-center gap-2">
                                    <HardDrive className="w-5 h-5 text-indigo-400" />
                                    <h3 className="text-xl font-bold text-foreground">Scanning Storage</h3>
                                </div>
                                
                                <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                                    <p className="text-xs text-foreground-muted/70 mb-1">Current Path</p>
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {currentScanPath}
                                    </p>
                                </div>

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
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-border-glass">
                        {(['grid', 'list', 'tree', 'detail', 'compact'] as ViewMode[]).map(mode => {
                            const icons = { grid: LayoutGrid, list: List, tree: GitBranch, detail: FileText, compact: Minimize2 };
                            const Icon = icons[mode];
                            return (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={cn(
                                        "p-1.5 rounded transition-colors",
                                        viewMode === mode 
                                            ? "bg-indigo-500 text-white" 
                                            : "text-foreground-muted hover:text-foreground hover:bg-white/5"
                                    )}
                                    title={`${mode.charAt(0).toUpperCase() + mode.slice(1)} View`}
                                >
                                    <Icon className="w-4 h-4" />
                                </button>
                            );
                        })}
                    </div>
                    {spaceLensData && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const snapshot = createSnapshot(spaceLensData, spaceLensData.path);
                                    setSnapshots([...snapshots, snapshot]);
                                    toast.success('Snapshot created');
                                }}
                                disabled={isScanning}
                                title="Create Snapshot"
                            >
                                <Camera className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const json = exportSpaceLensToJSON(spaceLensData);
                                    downloadFile(json, `space-lens-${Date.now()}.json`, 'application/json');
                                    toast.success('Exported to JSON');
                                }}
                                disabled={isScanning}
                                title="Export JSON"
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const csv = exportSpaceLensToCSV(spaceLensData);
                                    downloadFile(csv, `space-lens-${Date.now()}.csv`, 'text/csv');
                                    toast.success('Exported to CSV');
                                }}
                                disabled={isScanning}
                                title="Export CSV"
                            >
                                <Download className="w-4 h-4" />
                            </Button>
                        </>
                    )}
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

