import React, { useState, useMemo } from 'react';
import { Search, RefreshCw, Loader2, Package, AlertCircle } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { AppCard } from './AppCard';
import { AppTypeFilter } from './AppTypeFilter';
import { useInstalledApps } from '../hooks/useInstalledApps';
import { cn } from '../../../utils/cn';
import { toast } from 'sonner';
import type { InstalledApp } from '../../../types/application-manager';

import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

interface InstalledAppsTabProps {
    onUninstall: (app: InstalledApp) => Promise<void>;
}

export const InstalledAppsTab: React.FC<InstalledAppsTabProps> = ({ onUninstall }) => {
    const { apps, allApps, loading, error, filter, setFilter, searchQuery, setSearchQuery, refresh } = useInstalledApps();
    const [uninstalling, setUninstalling] = useState<string | null>(null);
    const [confirmUninstall, setConfirmUninstall] = useState<InstalledApp | null>(null);

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
            await refresh();
        } catch (error) {
            toast.error(`Failed to uninstall ${app.name}: ${(error as Error).message}`);
        } finally {
            setUninstalling(null);
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
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
        <div className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <Input
                        type="text"
                        placeholder="Search apps..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                </div>
            )}

            {/* Apps List */}
            {!loading && (
                <>
                    {apps.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Package className="w-12 h-12 text-foreground-muted mb-4" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No Apps Found</h3>
                            <p className="text-sm text-foreground-muted">
                                {searchQuery ? 'Try adjusting your search query' : 'No apps match the selected filter'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {apps.map((app) => (
                                <AppCard
                                    key={app.id}
                                    app={app}
                                    onUninstall={handleUninstall}
                                    disabled={uninstalling === app.id}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

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

