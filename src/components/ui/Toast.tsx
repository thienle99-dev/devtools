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
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
    id,
    type,
    title,
    message,
    duration = 5000,
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
        success: 'bg-green-500/10 border-green-500/30 text-green-400',
        error: 'bg-red-500/10 border-red-500/30 text-red-400',
        info: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
        warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    };

    return (
        <div
            className={cn(
                'flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm',
                'animate-in slide-in-from-right-full fade-in duration-300',
                'shadow-lg min-w-[320px] max-w-md',
                styles[type]
            )}
        >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground-primary mb-1">
                    {title}
                </h4>
                {message && (
                    <p className="text-xs text-foreground-secondary">
                        {message}
                    </p>
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
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={onClose} />
            ))}
        </div>
    );
};

// Hook for using toasts
export const useToast = () => {
    const [toasts, setToasts] = React.useState<ToastProps[]>([]);

    const showToast = React.useCallback((
        type: ToastType,
        title: string,
        message?: string,
        duration?: number
    ) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const toast: ToastProps = {
            id,
            type,
            title,
            message,
            duration,
            onClose: removeToast,
        };

        setToasts((prev) => [...prev, toast]);
        return id;
    }, []);

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const success = React.useCallback(
        (title: string, message?: string, duration?: number) =>
            showToast('success', title, message, duration),
        [showToast]
    );

    const error = React.useCallback(
        (title: string, message?: string, duration?: number) =>
            showToast('error', title, message, duration),
        [showToast]
    );

    const info = React.useCallback(
        (title: string, message?: string, duration?: number) =>
            showToast('info', title, message, duration),
        [showToast]
    );

    const warning = React.useCallback(
        (title: string, message?: string, duration?: number) =>
            showToast('warning', title, message, duration),
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

