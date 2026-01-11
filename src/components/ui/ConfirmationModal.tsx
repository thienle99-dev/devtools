import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
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
    const variantColors = {
        danger: 'bg-red-500/10 text-red-500 border-red-500/20',
        warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };

    const buttonVariants = {
        danger: 'bg-red-500 hover:bg-red-600 text-white',
        warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
        info: 'bg-blue-500 hover:bg-blue-600 text-white',
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            footer={
                <div className="flex gap-3 justify-end">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        loading={loading}
                        className={buttonVariants[variant]}
                    >
                        {confirmText}
                    </Button>
                </div>
            }
        >
            <div className="flex gap-4">
                <div className={`p-3 rounded-2xl border h-fit shrink-0 ${variantColors[variant]}`}>
                    <AlertTriangle size={24} />
                </div>
                <div className="space-y-2">
                    <p className="text-white/70 text-sm leading-relaxed">
                        {message}
                    </p>
                </div>
            </div>
        </Modal>
    );
};
