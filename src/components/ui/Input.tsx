import React, { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    variant?: 'glass' | 'filled' | 'outline';
    label?: string;
    error?: string;
    icon?: React.ElementType;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    className,
    variant = 'glass',
    label,
    error,
    icon: Icon,
    fullWidth = false,
    id,
    disabled,
    ...props
}, ref) => {
    const inputId = id || React.useId();

    return (
        <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
            {label && (
                <label 
                    htmlFor={inputId} 
                    className="text-xs font-semibold text-foreground-secondary ml-1 select-none"
                >
                    {label}
                </label>
            )}
            
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none transition-colors group-focus-within:text-indigo-400">
                        <Icon className="w-4 h-4" />
                    </div>
                )}
                
                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        // Base styles
                        "w-full bg-transparent text-sm text-foreground placeholder:text-foreground-muted/50",
                        "transition-all duration-200 outline-none",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        
                        // Padding based on icon
                        Icon ? "pl-10 pr-4 py-2.5" : "px-4 py-2.5",
                        
                        // Variants
                        variant === 'glass' && [
                            "bg-white/5 border border-border-glass rounded-lg",
                            "hover:bg-white/10 hover:border-indigo-500/30",
                            "focus:bg-white/10 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10",
                            "dark:bg-black/20",
                        ],
                        
                        variant === 'filled' && [
                            "bg-black/5 border-transparent rounded-lg",
                            "hover:bg-black/10",
                            "focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20",
                            // Dark mode
                            "dark:bg-white/10 dark:focus:bg-black/40",
                        ],
                        
                        variant === 'outline' && [
                            "bg-transparent border border-border-glass rounded-lg",
                            "hover:border-foreground-muted",
                            "focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10",
                        ],
                        
                        // Error State
                        error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10",
                        
                        className
                    )}
                    disabled={disabled}
                    {...props}
                />
                
                {/* Focus Border Animation (Optional, simplified for now) */}
            </div>

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[11px] text-rose-400 ml-1 font-medium"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
