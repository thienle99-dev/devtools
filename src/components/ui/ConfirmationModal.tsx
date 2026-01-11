import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '@utils/cn';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info' | 'success';
    loading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    loading = false,
}) => {
    const variantStyles = {
        danger: {
            icon: AlertTriangle,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/20',
            button: 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20',
            iconBg: 'from-rose-500/20 to-rose-600/5'
        },
        warning: {
            icon: AlertTriangle,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
            button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20',
            iconBg: 'from-amber-500/20 to-amber-600/5'
        },
        info: {
            icon: Info,
            color: 'text-sky-500',
            bg: 'bg-sky-500/10',
            border: 'border-sky-500/20',
            button: 'bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-500/20',
            iconBg: 'from-sky-500/20 to-sky-600/5'
        },
        success: {
            icon: CheckCircle2,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20',
            iconBg: 'from-emerald-500/20 to-emerald-600/5'
        }
    };

    const style = variantStyles[variant];
    const Icon = style.icon;

    // We can't easily override the title rendering of the Modal component if it's strictly defined props,
    // so we might need to adjust based on Modal's capabilities. 
    // Assuming Modal renders {title} in a standard header.
    // If we want a truly custom look, we might pass title="" to Modal and render our own header in children,
    // but looking at previous Modal usage, it takes a title string. 
    // Let's stick effectively to the Modal's structure but style the content within.

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <div className="flex gap-3 justify-end w-full">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        style={{
                            color: 'var(--color-text-secondary)'
                        }}
                        className="hover:!text-[var(--color-text-primary)]"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        loading={loading}
                        className={cn("min-w-[100px]", style.button)}
                    >
                        {confirmText}
                    </Button>
                </div>
            }
        >
            <div className="flex gap-5 py-2">
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border bg-gradient-to-br",
                    style.bg,
                    style.border,
                    style.iconBg
                )}>
                    <Icon className={cn("w-6 h-6", style.color)} />
                </div>
                <div className="space-y-2 pt-1 font-normal">
                    <p 
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--color-text-secondary)' }}
                    >
                        {message}
                    </p>
                </div>
            </div>
        </Modal>
    );
};
