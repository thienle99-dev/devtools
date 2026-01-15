import React, { forwardRef } from 'react';
import { cn } from '@utils/cn';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, children, required, ...props }, ref) => {
        return (
            <label
                ref={ref}
                className={cn(
                    "text-xs font-bold uppercase tracking-wider text-foreground-muted mb-1.5 block select-none",
                    className
                )}
                {...props}
            >
                {children}
                {required && <span className="text-red-400 ml-1">*</span>}
            </label>
        );
    }
);

Label.displayName = 'Label';
