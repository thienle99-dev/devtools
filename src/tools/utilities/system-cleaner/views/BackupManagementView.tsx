import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Trash2, Download, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ScanPlaceholder } from '../components/ScanPlaceholder';
import { formatBytes as formatSize, formatTimeAgo } from '@utils/format';
import { cn } from '@utils/cn';
import { toast } from 'sonner';

interface BackupInfo {
    id: string;
    timestamp: string | Date;
    files: string[];
    totalSize: number;
    location: string;
    platform: string;
}

export const BackupManagementView: React.FC = () => {
    const [backups, setBackups] = useState<BackupInfo[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoring, setIsRestoring] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const loadBackups = async () => {
        setIsLoading(true);
        try {
            const res = await (window as any).cleanerAPI.listBackups();
            if (res.success) {
                setBackups(res.backups || []);
            } else {
                toast.error(`Failed to load backups: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to load backups');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadBackups();
    }, []);

    const handleRestore = async (backupId: string) => {
        if (!confirm('Are you sure you want to restore this backup? This will overwrite existing files.')) return;
        
        setIsRestoring(backupId);
        try {
            const res = await (window as any).cleanerAPI.restoreBackup(backupId);
            if (res.success) {
                toast.success('Backup restored successfully');
            } else {
                toast.error(`Failed to restore backup: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to restore backup');
        } finally {
            setIsRestoring(null);
        }
    };

    const handleDelete = async (backupId: string) => {
        if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) return;
        
        setIsDeleting(backupId);
        try {
            const res = await (window as any).cleanerAPI.deleteBackup(backupId);
            if (res.success) {
                toast.success('Backup deleted successfully');
                loadBackups();
            } else {
                toast.error(`Failed to delete backup: ${res.error || 'Unknown error'}`);
            }
        } catch (error) {
            toast.error('Failed to delete backup');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleDeleteOld = async () => {
        if (backups.length <= 1) {
            toast.info('Keep at least one backup');
            return;
        }
        
        if (!confirm(`Delete all backups except the most recent one? This will delete ${backups.length - 1} backup(s).`)) return;
        
        setIsLoading(true);
        try {
            const backupsToDelete = backups.slice(1); // Keep the first (newest) one
            let deleted = 0;
            let failed = 0;
            
            for (const backup of backupsToDelete) {
                const res = await (window as any).cleanerAPI.deleteBackup(backup.id);
                if (res.success) {
                    deleted++;
                } else {
                    failed++;
                }
            }
            
            if (deleted > 0) {
                toast.success(`Deleted ${deleted} backup(s)`);
            }
            if (failed > 0) {
                toast.error(`Failed to delete ${failed} backup(s)`);
            }
            
            loadBackups();
        } catch (error) {
            toast.error('Failed to delete old backups');
        } finally {
            setIsLoading(false);
        }
    };

    if (backups.length === 0 && !isLoading) {
        return (
            <ScanPlaceholder
                title="Backup Management"
                icon={Database}
                description="View and manage your system backups. Backups are automatically created before cleanup operations."
                onScan={loadBackups}
                isScanning={isLoading}
                progress={0}
            />
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {isLoading && <LoadingOverlay progress={100} title="Backup Management" status="Loading backups..." />}
            
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Backup Management</h2>
                    <p className="text-sm text-foreground-muted">
                        Manage your system backups. {backups.length} backup{backups.length !== 1 ? 's' : ''} available
                    </p>
                </div>
                <div className="flex gap-2">
                    {backups.length > 1 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDeleteOld}
                            disabled={isLoading}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Old Backups
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={loadBackups} disabled={isLoading}>
                        <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-auto space-y-3 pr-2 custom-scrollbar">
                {backups.map((backup) => {
                    const timestamp = typeof backup.timestamp === 'string' 
                        ? new Date(backup.timestamp) 
                        : backup.timestamp;
                    const isRestoringThis = isRestoring === backup.id;
                    const isDeletingThis = isDeleting === backup.id;
                    
                    return (
                        <Card key={backup.id} className="p-6 border-border-glass bg-white/5">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                            <Database className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold">Backup {backup.id.slice(0, 8)}</h3>
                                                {backups.indexOf(backup) === 0 && (
                                                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                                                        Latest
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-foreground-muted">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{formatTimeAgo(timestamp)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FileText className="w-3 h-3" />
                                                    <span>{backup.files.length} file{backup.files.length !== 1 ? 's' : ''}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Database className="w-3 h-3" />
                                                    <span>{formatSize(backup.totalSize)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 p-3 bg-white/5 rounded-lg border border-border-glass/50">
                                        <div className="text-xs text-foreground-muted mb-2">Backup Location:</div>
                                        <div className="text-xs font-mono text-foreground-muted/70 break-all">
                                            {backup.location}
                                        </div>
                                    </div>
                                    
                                    {backup.files.length > 0 && (
                                        <div className="mt-3">
                                            <div className="text-xs text-foreground-muted mb-2">Files in backup:</div>
                                            <div className="max-h-32 overflow-auto space-y-1 pr-2 custom-scrollbar">
                                                {backup.files.slice(0, 10).map((file, i) => (
                                                    <div key={i} className="text-xs font-mono text-foreground-muted/70 truncate">
                                                        {file}
                                                    </div>
                                                ))}
                                                {backup.files.length > 10 && (
                                                    <div className="text-xs text-foreground-muted italic">
                                                        ... and {backup.files.length - 10} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex gap-2">
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleRestore(backup.id)}
                                        disabled={isRestoringThis || isDeletingThis}
                                        loading={isRestoringThis}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        {isRestoringThis ? 'Restoring...' : 'Restore'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDelete(backup.id)}
                                        disabled={isRestoringThis || isDeletingThis}
                                        loading={isDeletingThis}
                                        className="border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        {isDeletingThis ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
            
            {backups.length > 0 && (
                <Card className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                        <div className="flex-1">
                            <div className="text-sm font-bold">Backup Safety</div>
                            <div className="text-xs text-foreground-muted">
                                Backups are automatically created before cleanup operations. You can restore files from any backup at any time.
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

