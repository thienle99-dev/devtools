import React, { useState } from 'react';
import { AppWindow, RefreshCw, Search } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ScanPlaceholder } from '../components/ScanPlaceholder';
import { useSystemCleanerStore } from '../store/systemCleanerStore';
import { formatSize } from '../utils/formatUtils';
import { toast } from 'sonner';

export const UninstallerView: React.FC = () => {
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
        return (
            <ScanPlaceholder 
                title="Uninstaller" 
                icon={AppWindow} 
                description="Completely remove applications and all their associated files." 
                onScan={refreshApps} 
                isScanning={isScanning} 
                progress={progress}
                tips={[
                    'Uninstalling removes the app and all associated files',
                    'Some apps may require admin privileges',
                    'Backups are created before uninstallation',
                    'Use search to quickly find apps'
                ]}
            />
        );
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

