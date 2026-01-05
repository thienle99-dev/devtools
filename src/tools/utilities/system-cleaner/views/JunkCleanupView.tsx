import React, { useState, useEffect } from 'react';
import { Trash2, FolderOpen, RefreshCw } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Checkbox } from '../../../../components/ui/Checkbox';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ScanPlaceholder } from '../components/ScanPlaceholder';
import { useSystemCleanerStore } from '../store/systemCleanerStore';
import { useSmartScan } from '../hooks/useSmartScan';
import { formatSize } from '../utils/formatUtils';
import { toast } from 'sonner';

export const JunkCleanupView: React.FC = () => {
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

