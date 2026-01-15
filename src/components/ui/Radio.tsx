import React, { type InputHTMLAttributes } from 'react';
import { cn } from '@utils/cn';


export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    description?: string;
}

export const Radio: React.FC<RadioProps> = ({
    className,
    label,
    description,
    id,
    disabled,
    checked,
    onChange,
    value,
    ...props
}) => {
    const radioId = id || React.useId();

    return (
        <label 
            htmlFor={radioId}
            className={cn(
                "group flex items-start gap-3 cursor-pointer select-none",
                disabled && "opacity-50 pointer-events-none cursor-not-allowed",
                className
            )}
        >
            <div className="relative flex items-center justify-center mt-0.5">
                <input
                    type="radio"
                    id={radioId}
                    className="peer sr-only"
                    disabled={disabled}
                    checked={checked}
                    onChange={onChange}
                    value={value}
                    {...props}
                />
                
                {/* Custom Radio Circle */}
                <div className={cn(
                    "w-5 h-5 rounded-full border border-border-glass bg-white/5 dark:bg-white/10 transition-all duration-200",
                    "peer-focus:ring-2 peer-focus:ring-indigo-500/30 peer-focus:ring-offset-2 peer-focus:ring-offset-transparent",
                    "group-hover:border-indigo-500/50 group-hover:bg-white/10 dark:group-hover:bg-white/20",
                    
                    // Checked State
                    checked && "border-indigo-500 bg-transparent"
                )}>
                    <div 
                        className={cn(
                            "w-2.5 h-2.5 bg-indigo-500 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-sm transition-all duration-150 ease-out",
                            checked ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        )}
                    />
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
