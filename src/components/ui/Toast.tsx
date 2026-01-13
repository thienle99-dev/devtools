import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { cn } from '@utils/cn';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
    id,
    type,
    title,
    message,
    duration = 5000,
    action,
    onClose,
}) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    const icons = {
        success: CheckCircle2,
        error: AlertCircle,
        info: Info,
        warning: AlertTriangle,
    };

    const Icon = icons[type];

    const styles = {
        success: 'bg-[#060606]/80 border-emerald-500/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]',
        error: 'bg-[#060606]/80 border-rose-500/50 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)]',
        info: 'bg-[#060606]/80 border-blue-500/50 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.2)]',
        warning: 'bg-[#060606]/80 border-amber-500/50 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]',
    };

    return (
        <div
            className={cn(
                'flex items-start gap-4 p-5 rounded-2xl border backdrop-blur-xl',
                'animate-in slide-in-from-right-full fade-in duration-500 ease-out',
                'shadow-2xl min-w-[340px] max-w-md relative overflow-hidden group',
                styles[type]
            )}
        >
            <div className={cn("absolute inset-y-0 left-0 w-1", 
                type === 'success' ? 'bg-emerald-500' : 
                type === 'error' ? 'bg-rose-500' :
                type === 'info' ? 'bg-blue-500' : 'bg-amber-500'
            )} />
            <Icon className="w-6 h-6 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground-primary mb-1">
                    {title}
                </h4>
                {message && (
                    <p className="text-xs text-foreground-secondary">
                        {message}
                    </p>
                )}
                {action && (
                    <button
                        onClick={() => {
                            action.onClick();
                            onClose(id);
                        }}
                        className="mt-3 px-3 py-1.5 bg-foreground-primary/10 hover:bg-foreground-primary/20 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border border-foreground-primary/10"
                    >
                        {action.label}
                    </button>
                )}
            </div>
            <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export interface ToastContainerProps {
    toasts: ToastProps[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast {...toast} onClose={onClose} />
                </div>
            ))}
        </div>
    );
};

// Hook for using toasts
export const useToast = () => {
    const [toasts, setToasts] = React.useState<ToastProps[]>([]);

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = React.useCallback((
        type: ToastType,
        title: string,
        message?: string,
        duration?: number,
        action?: { label: string; onClick: () => void }
    ) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const toast: ToastProps = {
            id,
            type,
            title,
            message,
            duration,
            action,
            onClose: removeToast,
        };

        setToasts((prev) => [...prev, toast]);
        return id;
    }, [removeToast]);

    const success = React.useCallback(
        (title: string, message?: string, durationOrOptions?: number | { duration?: number; action?: { label: string; onClick: () => void } }) => {
            const duration = typeof durationOrOptions === 'number' ? durationOrOptions : durationOrOptions?.duration;
            const action = typeof durationOrOptions === 'object' ? durationOrOptions?.action : undefined;
            return showToast('success', title, message, duration, action);
        },
        [showToast]
    );

    const error = React.useCallback(
        (title: string, message?: string, durationOrOptions?: number | { duration?: number; action?: { label: string; onClick: () => void } }) => {
            const duration = typeof durationOrOptions === 'number' ? durationOrOptions : durationOrOptions?.duration;
            const action = typeof durationOrOptions === 'object' ? durationOrOptions?.action : undefined;
            return showToast('error', title, message, duration, action);
        },
        [showToast]
    );

    const info = React.useCallback(
        (title: string, message?: string, durationOrOptions?: number | { duration?: number; action?: { label: string; onClick: () => void } }) => {
            const duration = typeof durationOrOptions === 'number' ? durationOrOptions : durationOrOptions?.duration;
            const action = typeof durationOrOptions === 'object' ? durationOrOptions?.action : undefined;
            return showToast('info', title, message, duration, action);
        },
        [showToast]
    );

    const warning = React.useCallback(
        (title: string, message?: string, durationOrOptions?: number | { duration?: number; action?: { label: string; onClick: () => void } }) => {
            const duration = typeof durationOrOptions === 'number' ? durationOrOptions : durationOrOptions?.duration;
            const action = typeof durationOrOptions === 'object' ? durationOrOptions?.action : undefined;
            return showToast('warning', title, message, duration, action);
        },
        [showToast]
    );

    return {
        toasts,
        removeToast,
        success,
        error,
        info,
        warning,
    };
};
