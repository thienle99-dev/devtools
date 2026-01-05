import React, { type SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
    label: string;
    value: string | number;
    disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
    label?: string;
    options: SelectOption[];
    error?: string;
    fullWidth?: boolean;
    variant?: 'glass' | 'filled' | 'outline';
}

export const Select: React.FC<SelectProps> = ({
    className,
    label,
    options,
    error,
    fullWidth = false,
    variant = 'glass',
    id,
    disabled,
    ...props
}) => {
    const selectId = id || React.useId();

    return (
        <div className={cn("flex flex-col gap-1.5", fullWidth && "w-full")}>
            {label && (
                <label 
                    htmlFor={selectId} 
                    className="text-xs font-semibold text-foreground-secondary ml-1 select-none"
                >
                    {label}
                </label>
            )}
            
            <div className="relative group">
                <select
                    id={selectId}
                    className={cn(
                        // Base styles
                        "w-full appearance-none bg-transparent text-sm text-foreground cursor-pointer",
                        "transition-all duration-200 outline-none",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        
                        // Padding to accommodate arrow
                        "pl-4 pr-10 py-2.5",
                        
                        // Variants (matching Input)
                        variant === 'glass' && [
                            "bg-white/5 border border-border-glass rounded-lg",
                            "hover:bg-white/10 hover:border-indigo-500/30",
                            "focus:bg-white/10 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10",
                            "dark:bg-black/20",
                        ],
                        
                        variant === 'filled' && [
                            "bg-black/5 border border-transparent rounded-lg",
                            "hover:bg-black/10 hover:border-border-glass",
                            "focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20",
                            "dark:bg-white/10 dark:focus:bg-black/40",
                        ],
                        
                        variant === 'outline' && [
                            "bg-transparent border border-border-glass rounded-lg",
                            "hover:border-foreground-muted hover:border-indigo-500/30",
                            "focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10",
                        ],
                        
                        error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/10",
                        
                        className
                    )}
                    disabled={disabled}
                    {...props}
                >
                    {options.map((opt) => (
                        <option 
                            key={opt.value} 
                            value={opt.value} 
                            disabled={opt.disabled}
                            className="bg-white dark:bg-slate-900 text-foreground"
                        >
                            {opt.label}
                        </option>
                    ))}
                </select>
                
                {/* Custom Arrow Icon */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground-muted group-hover:text-foreground transition-colors">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            {error && (
                <p className="text-[11px] text-rose-400 ml-1 font-medium animate-in slide-in-from-top-1 fade-in duration-200">
                    {error}
                </p>
            )}
        </div>
    );
};
