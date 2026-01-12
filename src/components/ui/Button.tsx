import React, { type ButtonHTMLAttributes, type JSX } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger' | 'warning' | 'success' | 'outline';
    size?: 'xs' | 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: React.ElementType;
}

export const Button = ({
    className,
    variant = 'glass',
    size = 'md',
    loading = false,
    disabled,
    children,
    icon: Icon,
    ...props
}: ButtonProps): JSX.Element => {
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
                variant === 'primary' && cn(
                    "glass-button-primary",
                    // Ocean Deep: Sky → Blue → Indigo
                    "bg-gradient-to-r from-[#0EA5E9] via-[#3B82F6] to-[#6366F1] text-white",
                    "shadow-[0_10px_30px_rgba(14,165,233,0.35)] hover:shadow-[0_12px_40px_rgba(14,165,233,0.5)]",
                    "hover:brightness-110 active:scale-[0.98]",
                    "border border-white/15 rounded-lg"
                ),
                variant === 'secondary' && cn(
                    "glass-button-secondary",
                    // Sunset Warm: Amber → Red → Pink
                    "bg-gradient-to-r from-[#F59E0B] via-[#EF4444] to-[#EC4899] text-white",
                    "shadow-[0_8px_26px_rgba(248,113,113,0.45)] hover:shadow-[0_10px_32px_rgba(248,113,113,0.6)]",
                    "hover:brightness-110 active:scale-[0.98]",
                    "border border-amber-300/70 rounded-lg"
                ),
                variant === 'danger' && cn(
                    "glass-button-danger",
                    "bg-gradient-to-r from-rose-500 to-amber-500 text-white",
                    "shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98]",
                    "border border-rose-500/60"
                ),
                variant === 'warning' && cn(
                    "glass-button-warning",
                    "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900",
                    "shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98]",
                    "border border-amber-400/70"
                ),
                variant === 'success' && cn(
                    "glass-button-success",
                    "bg-gradient-to-r from-emerald-400 to-teal-500 text-white",
                    "shadow-md hover:shadow-lg hover:brightness-110 active:scale-[0.98]",
                    "border border-emerald-400/70"
                ),
                variant === 'outline' && "glass-button-outline",
                variant === 'ghost' && "text-foreground-muted hover:text-foreground hover:bg-bg-glass-hover rounded-lg",

                // Sizes
                size === 'xs' && "text-[10px] px-2 py-1",
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
                {children as any}
            </div>
        </button>
    );
};
