import React, { type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger' | 'warning' | 'success' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({
    className,
    variant = 'glass',
    size = 'md',
    loading = false,
    disabled,
    children,
    icon: Icon,
    ...props
}) => {
    return (
        <button
            className={cn(
                // Base styles - macOS style
                "relative inline-flex items-center justify-center font-semibold",
                "transition-all duration-200 select-none overflow-hidden",
                "cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2",
                "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
                
                // Focus ring colors by variant (macOS blue focus ring)
                variant === 'primary' && "focus:ring-blue-500 focus:ring-offset-1",
                variant === 'secondary' && "focus:ring-blue-500 focus:ring-offset-1",
                variant === 'glass' && "focus:ring-blue-500/50 focus:ring-offset-1",
                variant === 'danger' && "focus:ring-rose-500 focus:ring-offset-1",
                variant === 'warning' && "focus:ring-amber-500 focus:ring-offset-1",
                variant === 'success' && "focus:ring-emerald-500 focus:ring-offset-1",
                variant === 'outline' && "focus:ring-blue-500 focus:ring-offset-1",
                variant === 'ghost' && "focus:ring-blue-500/50 focus:ring-offset-0",

                // Variants
                variant === 'glass' && "glass-button",
                variant === 'primary' && "glass-button-primary",
                variant === 'secondary' && "glass-button-secondary",
                variant === 'danger' && "glass-button-danger",
                variant === 'warning' && "glass-button-warning",
                variant === 'success' && "glass-button-success",
                variant === 'outline' && "glass-button-outline",
                variant === 'ghost' && "text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg",

                // Sizes
                size === 'sm' && "text-xs px-3 py-1.5",
                size === 'md' && variant !== 'ghost' && "text-sm px-5 py-2.5",
                size === 'md' && variant === 'ghost' && "p-2", // Icon button size usually
                size === 'lg' && "text-base px-6 py-3",

                // Custom class override
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin absolute" />
            )}

            <div className={cn(
                "flex items-center gap-2 transition-opacity",
                loading && "opacity-0" // Hide content but keep size when loading
            )}>
                {Icon && <Icon className="w-4 h-4" />}
                {children}
            </div>
        </button>
    );
};
