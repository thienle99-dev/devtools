import React from 'react';
import { Package, Trash2, AlertTriangle, HardDrive, Calendar, Building2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';
import type { InstalledApp } from '../../../types/application-manager';
import { formatBytes as formatSize } from '../../../utils/format';

interface AppCardProps {
    app: InstalledApp;
    onUninstall: (app: InstalledApp) => void;
    disabled?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({ app, onUninstall, disabled }) => {
    const isSystemApp = app.isSystemApp;

    return (
        <Card className={cn(
            "p-4 hover:bg-white/5 transition-all",
            isSystemApp && "border-amber-500/20 bg-amber-500/5"
        )}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                        "p-2.5 rounded-lg shrink-0",
                        isSystemApp
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-indigo-500/10 text-indigo-400"
                    )}>
                        <Package className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-sm font-semibold text-foreground truncate">{app.name}</h3>
                            {isSystemApp && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
                                    System
                                </span>
                            )}
                            {!isSystemApp && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30">
                                    User
                                </span>
                            )}
                        </div>
                        <div className="space-y-1 text-xs text-foreground-muted">
                            {app.version && (
                                <div className="flex items-center gap-1.5">
                                    <span className="font-medium">Version:</span>
                                    <span className="font-mono">{app.version}</span>
                                </div>
                            )}
                            {app.publisher && (
                                <div className="flex items-center gap-1.5">
                                    <Building2 className="w-3 h-3" />
                                    <span className="truncate">{app.publisher}</span>
                                </div>
                            )}
                            {app.size && (
                                <div className="flex items-center gap-1.5">
                                    <HardDrive className="w-3 h-3" />
                                    <span>{formatSize(app.size)}</span>
                                </div>
                            )}
                            {app.installDate && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(app.installDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            {app.installLocation && (
                                <div className="text-[10px] text-foreground-muted/70 truncate font-mono">
                                    {app.installLocation}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="shrink-0">
                    <Button
                        variant={isSystemApp ? "outline" : "danger"}
                        size="sm"
                        onClick={() => onUninstall(app)}
                        disabled={disabled || isSystemApp}
                        className="text-xs"
                    >
                        {isSystemApp ? (
                            <>
                                <AlertTriangle className="w-3 h-3 mr-1.5" />
                                Protected
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-3 h-3 mr-1.5" />
                                Uninstall
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Card>
    );
};

