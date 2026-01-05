import { useState, useEffect, useCallback } from 'react';
import type { InstalledApp, AppFilterType } from '../../../types/application-manager';

export const useInstalledApps = () => {
    const [apps, setApps] = useState<InstalledApp[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<AppFilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchApps = useCallback(async () => {
        if (!window.appManagerAPI) {
            setError('Application Manager API not available');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await window.appManagerAPI.getInstalledApps();
            setApps(data);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchApps();
    }, [fetchApps]);

    const filteredApps = apps.filter(app => {
        // Apply filter
        if (filter === 'system' && !app.isSystemApp) return false;
        if (filter === 'user' && app.isSystemApp) return false;

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            return app.name.toLowerCase().includes(query) ||
                   app.publisher?.toLowerCase().includes(query) ||
                   app.version?.toLowerCase().includes(query);
        }

        return true;
    });

    return {
        apps: filteredApps,
        allApps: apps,
        loading,
        error,
        filter,
        setFilter,
        searchQuery,
        setSearchQuery,
        refresh: fetchApps,
    };
};

