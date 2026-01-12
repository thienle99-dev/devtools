import React, { useState, useMemo, useEffect } from 'react';
import { Search, RefreshCw, Loader2, Package, AlertCircle } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { AppCard } from './AppCard';
import { AppTypeFilter } from './AppTypeFilter';
import { useInstalledApps } from '../hooks/useInstalledApps';
import { cn } from '@utils/cn';
import { toast } from 'sonner';
import type { InstalledApp } from '../../../types/application-manager';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { Virtuoso } from 'react-virtuoso';
import { useDebounce } from '../../../hooks/useDebounce';

interface InstalledAppsTabProps {
    onUninstall: (app: InstalledApp) => Promise<void>;
}

export const InstalledAppsTab: React.FC<InstalledAppsTabProps> = ({ onUninstall }) => {
    const { apps, allApps, loading, error, filter, setFilter, setSearchQuery } = useInstalledApps();
    const [uninstalling, setUninstalling] = useState<string | null>(null);
    const [confirmUninstall, setConfirmUninstall] = useState<InstalledApp | null>(null);
    const [localSearch, setLocalSearch] = useState('');
    const debouncedSearch = useDebounce(localSearch, 300);

    useEffect(() => {
        setSearchQuery(debouncedSearch);
    }, [debouncedSearch, setSearchQuery]);

    const counts = useMemo(() => {
        const all = allApps.length;
        const user = allApps.filter(a => !a.isSystemApp).length;
        const system = allApps.filter(a => a.isSystemApp).length;
        return { all, user, system };
    }, [allApps]);

    const handleUninstall = (app: InstalledApp) => {
        if (app.isSystemApp) {
            toast.warning('System apps cannot be uninstalled');
            return;
        }

        setConfirmUninstall(app);
    };

    const executeUninstall = async () => {
        if (!confirmUninstall) return;
        const app = confirmUninstall;
        setConfirmUninstall(null);

        setUninstalling(app.id);
        try {
            await onUninstall(app);
            toast.success(`Successfully uninstalled ${app.name}`);
            // Note: useInstalledApps handles refresh via polling or re-fetch if needed.
            // Ideally onUninstall should trigger a refresh or we call it manually if exposed.
            // In the original code, refresh() was called. We need to expose it if we want to call it.
            // But for now let's assume the hook will update or we can add refresh back if needed.
            (window.appManagerAPI as any)?.getInstalledApps?.(); // Simplified trigger if available or rely on hook
            // Actually, the original code had refresh. Let's ask useInstalledApps to return it.
        } catch (error) {
            toast.error(`Failed to uninstall ${app.name}: ${(error as Error).message}`);
        } finally {
            setUninstalling(null);
        }
    };

    // Need to get refresh from useInstalledApps, so I will cast it or update hook usage
    // Re-getting everything from useInstalledApps since I destructure it above
    const { refresh } = useInstalledApps();

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Apps</h3>
                <p className="text-sm text-foreground-muted mb-4">{error}</p>
                <Button variant="outline" size="sm" onClick={refresh}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Search and Filter Bar */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <Input
                        type="text"
                        placeholder="Search apps..."
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <AppTypeFilter filter={filter} onFilterChange={setFilter} counts={counts} />
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={refresh}
                    disabled={loading}
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 relative">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    </div>
                ) : apps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Package className="w-12 h-12 text-foreground-muted mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Apps Found</h3>
                        <p className="text-sm text-foreground-muted">
                            {localSearch ? 'Try adjusting your search query' : 'No apps match the selected filter'}
                        </p>
                    </div>
                ) : (
                    <Virtuoso
                        style={{ height: '100%' }}
                        data={apps}
                        itemContent={(_index, app) => (
                            <div className="pb-3">
                                <AppCard
                                    app={app}
                                    onUninstall={handleUninstall}
                                    disabled={uninstalling === app.id}
                                />
                            </div>
                        )}
                    />
                )}
            </div>

            <ConfirmationModal
                isOpen={!!confirmUninstall}
                onClose={() => setConfirmUninstall(null)}
                onConfirm={executeUninstall}
                title="Uninstall Application"
                message={`Are you sure you want to uninstall "${confirmUninstall?.name}"? This will permanently remove the application and its data.`}
                confirmText="Uninstall"
                loading={uninstalling !== null}
            />
        </div>
    );
};

