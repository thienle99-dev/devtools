import React, { type TextareaHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
    variant?: 'glass' | 'filled' | 'outline';
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
    className,
    variant = 'glass',
    label,
    error,
    fullWidth = false,
    id,
    disabled,
    ...props
}) => {
    const textareaId = id || React.useId();

    return (
        <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
            {label && (
                <label 
                    htmlFor={textareaId} 
                    className="text-xs font-semibold text-foreground-secondary ml-1 select-none"
                >
                    {label}
                </label>
            )}
            
            <textarea
                id={textareaId}
                className={cn(
                    // Base styles
                    "w-full bg-transparent text-sm text-foreground placeholder:text-foreground-muted/50",
                    "transition-all duration-200 outline-none",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "px-4 py-2.5 min-h-[80px]",
                    
                    // Variants (matching Input)
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
};
