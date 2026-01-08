/**
 * Common UI Component Types
 */

export interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    children?: React.ReactNode;
    type?: 'button' | 'submit' | 'reset';
    title?: string;
}

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDragLeave?: () => void;
    onDrop?: (e: React.DragEvent) => void;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
}

export interface ToastOptions {
    title?: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}
