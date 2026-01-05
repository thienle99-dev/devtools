import React, { type InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { motion } from 'framer-motion';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    description?: string;
}

export const Switch: React.FC<SwitchProps> = ({
    className,
    label,
    description,
    id,
    disabled,
    checked,
    onChange,
    ...props
}) => {
    const switchId = id || React.useId();

    return (
        <label 
            htmlFor={switchId}
            className={cn(
                "group flex items-center justify-between gap-4 cursor-pointer select-none",
                disabled && "opacity-50 pointer-events-none cursor-not-allowed",
                className
            )}
        >
             {(label || description) && (
                <div className="flex flex-col flex-1 mr-4">
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

            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    id={switchId}
                    className="peer sr-only"
                    disabled={disabled}
                    checked={checked}
                    onChange={onChange}
                    {...props}
                />
                
                {/* Switch Track */}
                <div className={cn(
                    "w-11 h-6 rounded-full border border-border-glass transition-colors duration-200 ease-in-out bg-black/5 dark:bg-white/10",
                    // Hover state
                    "group-hover:bg-black/10 dark:group-hover:bg-white/20 hover:border-indigo-500/30",
                    // Focus state
                    "peer-focus:ring-2 peer-focus:ring-indigo-500/30 peer-focus:ring-offset-2 peer-focus:ring-offset-transparent",
                    // Checked state
                    checked && "bg-indigo-500 hover:bg-indigo-600 border-indigo-500 group-hover:border-indigo-600 group-hover:bg-indigo-600"
                )}>
                    {/* Switch Thumb */}
                    <motion.div 
                        initial={false}
                        animate={{ 
                            x: checked ? 20 : 0, 
                            scale: checked ? 1 : 0.85 
                        }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 500, 
                            damping: 30 
                        }}
                        className={cn(
                            "absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-colors",
                            checked ? "bg-white" : "bg-white/50"
                        )}
                    />
                </div>
            </div>
        </label>
    );
};
