import React, { type InputHTMLAttributes } from 'react';
import { cn } from '@utils/cn';


export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    description?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
    className,
    label,
    description,
    id,
    disabled,
    checked,
    onChange,
    ...props
}) => {
    const checkboxId = id || React.useId();

    return (
        <label 
            htmlFor={checkboxId}
            className={cn(
                "group flex items-start gap-3 cursor-pointer select-none",
                disabled && "opacity-50 pointer-events-none cursor-not-allowed",
                className
            )}
        >
            <div className="relative flex items-center justify-center mt-0.5">
                <input
                    type="checkbox"
                    id={checkboxId}
                    className="peer sr-only"
                    disabled={disabled}
                    checked={checked}
                    onChange={onChange}
                    {...props}
                />
                
                {/* Custom Checkbox Box */}
                <div className={cn(
                    "w-5 h-5 rounded-md border border-border-glass bg-white/5 dark:bg-white/10 transition-all duration-200",
                    "peer-focus:ring-2 peer-focus:ring-indigo-500/30 peer-focus:ring-offset-2 peer-focus:ring-offset-transparent",
                    "group-hover:border-indigo-500/50 group-hover:bg-white/10 dark:group-hover:bg-white/20",
                    
                    // Checked State
                    checked && "bg-indigo-500 border-indigo-500 hover:bg-indigo-600 hover:border-indigo-600 shadow-sm"
                )}>
                    {checked && (
                        <svg 
                            className={cn(
                                "w-full h-full text-white pointer-events-none p-0.5 animate-in zoom-in-50 duration-150 ease-out",
                            )}
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="3.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    )}
                </div>
            </div>

            {(label || description) && (
                <div className="flex flex-col">
                    {label && (
                        <span className="text-sm font-medium text-foreground transition-colors group-hover:text-foreground-primary">
                            {label}
                        </span>
                    )}
                    {description && (
                        <span className="text-xs text-foreground-muted mt-0.5">
                            {description}
                        </span>
                    )}
                </div>
            )}
        </label>
    );
};
