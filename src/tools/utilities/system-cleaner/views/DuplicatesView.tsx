import React, { useState, useMemo } from 'react';
import { Copy, RefreshCw, Trash, Search as SearchIcon } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { useSystemCleanerStore } from '../store/systemCleanerStore';
import { retryWithBackoff, isRetryableError, processBatchWithRecovery } from '../utils/errorRecovery';
import { fileListCache } from '../utils/cacheUtils';
import { toast } from 'sonner';

export const DuplicatesView: React.FC = () => {
    const { duplicates, setDuplicates } = useSystemCleanerStore();
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [scanPath, setScanPath] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'size' | 'wasted'>('wasted');
    
    const scanDuplicates = async (path?: string) => {
        setIsScanning(true);
        const scanTarget = path || scanPath || undefined;
        const cacheKey = `duplicates-${scanTarget || 'home'}`;
        
        // Check cache first
        const cached = fileListCache.get(cacheKey);
        if (cached) {
            setDuplicates(cached);
            setIsScanning(false);
            return;
        }

        const interval = setInterval(() => setProgress(p => (p < 95 ? p + 1 : p)), 100);
        try {
            const dups = await retryWithBackoff(
                () => (window as any).cleanerAPI.getDuplicates(scanTarget),
                { 
                    maxRetries: 2, 
                    shouldRetry: isRetryableError 
                }
            );
            setDuplicates(dups as any);
            fileListCache.set(cacheKey, dups as any);
            setProgress(100);
        } catch (error) {
            toast.error(`Failed to scan for duplicates: ${(error as Error).message}`);
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
            // Use batch processing with error recovery
            const result = await processBatchWithRecovery(
                selectedFiles,
                async (filePath) => {
                    const res = await (window as any).cleanerAPI.runCleanup([filePath]);
                    if (!res.success) {
                        throw new Error(res.error || 'Failed to delete file');
                    }
                    return res;
                },
                {
                    batchSize: 10,
                    continueOnError: true,
                    onItemError: (filePath, error) => {
                        console.warn(`Failed to delete ${filePath}:`, error);
                    }
                }
            );

            setIsScanning(false);
            
            if (result.success) {
                toast.success(`Cleaned ${selectedFiles.length} files successfully`);
                setSelectedFiles([]);
                scanDuplicates();
            } else if (result.partialData) {
                const successCount = result.partialData.length;
                const failCount = result.errors?.length || 0;
                toast.warning(`Deleted ${successCount} files, ${failCount} failed`);
                setSelectedFiles([]);
                scanDuplicates();
            } else {
                toast.error(`Failed to delete files: ${result.errors?.map(e => e.error).join(', ') || 'Unknown error'}`);
            }
        } catch (error) {
            setIsScanning(false);
            toast.error(`Failed to delete files: ${(error as Error).message}`);
        }
    };

    const filteredDuplicates = useMemo(() => {
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
    }, [duplicates, searchQuery, sortBy]);

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
                {filteredDuplicates.length === 0 ? (
                    <Card className="p-12 text-center border-border-glass bg-white/5">
                        <SearchIcon className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
                        <h3 className="text-lg font-bold mb-2">No duplicates found</h3>
                        <p className="text-sm text-foreground-muted">Try adjusting your search criteria</p>
                    </Card>
                ) : (
                    filteredDuplicates.map((group, i) => (
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

