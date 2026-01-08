import React, { useState, useMemo } from 'react';
import { FileText, RefreshCw, Trash, Search as SearchIcon } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ScanPlaceholder } from '../components/ScanPlaceholder';
import { useSystemCleanerStore } from '../store/systemCleanerStore';
import { formatBytes as formatSize } from '../../../../utils/format';
import { retryWithBackoff, isRetryableError } from '../utils/errorRecovery';
import { fileListCache } from '../utils/cacheUtils';
import { toast } from 'sonner';

export const LargeFilesView: React.FC = () => {
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
        const cacheKey = 'large-files-50mb';
        
        // Check cache first
        const cached = fileListCache.get(cacheKey);
        if (cached) {
            setLargeFiles(cached);
            setIsScanning(false);
            return;
        }

        const interval = setInterval(() => setProgress(p => (p < 90 ? p + 5 : p)), 100);
        try {
            const files = await retryWithBackoff(
                () => (window as any).cleanerAPI.getLargeFiles({ minSize: 50 * 1024 * 1024 }),
                { 
                    maxRetries: 3, 
                    shouldRetry: isRetryableError,
                    onRetry: (attempt) => {
                        toast.info(`Retrying scan (attempt ${attempt}/3)...`);
                    }
                }
            );
            setLargeFiles(files as any);
            fileListCache.set(cacheKey, files as any);
            setProgress(100);
        } catch (error) {
            toast.error(`Failed to scan for large files: ${(error as Error).message}`);
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
    const filteredFiles = useMemo(() => {
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
    const fileTypes = useMemo(() => {
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
        return (
            <ScanPlaceholder 
                title="Large Files" 
                icon={FileText} 
                description="Quickly identify huge files and folders that are eating up your disk space." 
                onScan={scanLargeFiles} 
                isScanning={isScanning} 
                progress={progress}
                tips={[
                    'Files larger than 50MB are shown by default',
                    'Use search to find specific files quickly',
                    'Sort by size to see the largest files first',
                    'Be careful when deleting system files'
                ]}
            />
        );
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

