import React, { useState } from 'react';
import { Power } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { ScanPlaceholder } from '../components/ScanPlaceholder';
import { useSystemCleanerStore } from '../store/systemCleanerStore';
import { cn } from '@utils/cn';
import { toast } from 'sonner';

export const StartupView: React.FC = () => {
    const { startupItems, setStartupItems } = useSystemCleanerStore();
    const [isScanning, setIsScanning] = useState(false);
    const [progress, setProgress] = useState(0);

    const refreshItems = async () => {
        setIsScanning(true);
        const interval = setInterval(() => setProgress(p => (p < 90 ? p + 10 : p)), 150);
        try {
            const items = await (window as any).cleanerAPI.getStartupItems();
            setStartupItems(items);
            setProgress(100);
        } catch (e) {
            toast.error('Failed to get startup items.');
        } finally {
            clearInterval(interval);
            setTimeout(() => setIsScanning(false), 500);
        }
    };

    if (startupItems.length === 0 && !isScanning) {
        return (
            <ScanPlaceholder 
                title="Startup Management" 
                icon={Power} 
                description="Manage applications and services that start with your system." 
                onScan={refreshItems} 
                isScanning={isScanning} 
                progress={progress}
                tips={[
                    'Disable startup items to improve boot time',
                    'Some items may require admin privileges to modify',
                    'Be careful when disabling system services',
                    'You can enable items again if needed'
                ]}
            />
        );
    }

    return (
        <div className="space-y-6 h-full flex flex-col relative">
            {isScanning && <LoadingOverlay progress={progress} title="Startup Items" status="Loading startup items..." />}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Startup Items</h2>
                    <p className="text-sm text-foreground-muted">Manage apps that launch automatically.</p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshItems}>
                    <Power className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="flex-1 overflow-auto space-y-2 pr-2 custom-scrollbar">
                {startupItems.map((item, i) => {
                    const isEnabled = item.enabled !== undefined ? item.enabled : true;
                    
                    const handleToggle = async () => {
                        try {
                            const res = await (window as any).cleanerAPI.toggleStartupItem(item);
                            if (res.success) {
                                toast.success(`${res.enabled ? 'Enabled' : 'Disabled'} ${item.name}`);
                                const updatedItems = startupItems.map((it, idx) => 
                                    idx === i ? { ...it, enabled: res.enabled } : it
                                );
                                setStartupItems(updatedItems);
                                setTimeout(() => refreshItems(), 500);
                            } else {
                                toast.error(`Failed to toggle ${item.name}: ${res.error || 'Unknown error'}`);
                            }
                        } catch (error) {
                            toast.error(`Failed to toggle ${item.name}`);
                        }
                    };
                    
                    return (
                        <Card key={i} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isEnabled ? "bg-green-500/10" : "bg-gray-500/10"
                                )}>
                                    <Power className={cn(
                                        "w-5 h-5 transition-colors",
                                        isEnabled ? "text-green-500" : "text-gray-500"
                                    )} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-medium">{item.name}</h4>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                            isEnabled 
                                                ? "bg-green-500/20 text-green-400" 
                                                : "bg-gray-500/20 text-gray-400"
                                        )}>
                                            {isEnabled ? "Enabled" : "Disabled"}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-foreground-muted truncate max-w-sm mt-0.5">
                                        {item.type} • {item.path}
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant={isEnabled ? "outline" : "primary"}
                                size="sm" 
                                onClick={handleToggle}
                                className={cn(
                                    "min-w-[80px]",
                                    isEnabled && "border-red-500/50 text-red-500 hover:bg-red-500/10 hover:border-red-500"
                                )}
                            >
                                {isEnabled ? 'Disable' : 'Enable'}
                            </Button>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

