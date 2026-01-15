import React from 'react';
import { Loader2, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@utils/cn';
import { Button } from '../ui/Button';

export interface PermissionItemProps {
    name: string;
    description: string;
    permissionKey: string;
    permission?: any;
    onCheck: () => void;
    onTest?: () => void;
    onRequest: () => void;
}

export const PermissionItem: React.FC<PermissionItemProps> = ({
    name,
    description,
    permission,
    onCheck,
    onTest,
    onRequest,
}) => {
    const status = permission?.status || 'unknown';
    const message = permission?.message;
    const isLoading = permission?.checking;

    const getStatusIcon = () => {
        if (isLoading) return <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />;
        switch (status) {
            case 'authorized': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'denied': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'restricted': return <AlertCircle className="w-5 h-5 text-amber-500" />;
            default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'authorized': return 'bg-emerald-500/10 border-emerald-500/20';
            case 'denied': return 'bg-red-500/10 border-red-500/20';
            case 'restricted': return 'bg-amber-500/10 border-amber-500/20';
            default: return 'bg-gray-500/10 border-gray-500/20';
        }
    };

    return (
        <div className={cn(
            "p-3 rounded-lg border flex items-center justify-between transition-all",
            getStatusColor()
        )}>
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-white/50 dark:bg-black/20">
                    {getStatusIcon()}
                </div>
                <div>
                    <div className="font-medium flex items-center gap-2">
                        {name}
                        {status === 'authorized' && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">Granted</span>}
                        {status === 'denied' && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">Denied</span>}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {message || description}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {onTest && (
                    <Button variant="ghost" size="sm" onClick={onTest} disabled={isLoading}>
                        Test
                    </Button>
                )}
                <Button variant="outline" size="sm" onClick={onCheck} disabled={isLoading} className="w-8 h-8 p-0">
                    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                </Button>
                {status !== 'authorized' && (
                    <Button size="sm" onClick={onRequest} disabled={isLoading}>
                        Request
                    </Button>
                )}
            </div>
        </div>
    );
};
