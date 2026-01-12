/**
 * Common UI Component Types
 */

export interface ButtonProps {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'default';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    className?: string;
    children?: React.ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    type?: 'button' | 'submit' | 'reset';
    title?: string;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    children?: React.ReactNode;
    footer?: React.ReactNode;
}

export interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ElementType;
    error?: string;
    fullWidth?: boolean;
    label?: string;
}

export interface ToastOptions {
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}
