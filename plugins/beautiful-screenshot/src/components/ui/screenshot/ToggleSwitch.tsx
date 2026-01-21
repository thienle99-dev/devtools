import React from 'react';
import { cn } from '@utils/cn';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    size?: 'sm' | 'md';
}

/**
 * iOS-style toggle switch component
 * Supports small and medium sizes
 */
export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ 
    checked, 
    onChange, 
    size = 'md' 
}) => {
    const sizes = {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
    };
    const thumbSizes = {
        sm: 'h-3.5 w-3.5',
        md: 'h-4 w-4',
    };
    const translateSizes = {
        sm: 'translate-x-4',
        md: 'translate-x-5',
    };

    return (
        <button
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none",
                sizes[size],
                checked ? "bg-indigo-500" : "bg-gray-600"
            )}
        >
            <span
                className={cn(
                    "inline-block transform rounded-full bg-white shadow-sm transition-transform duration-200",
                    thumbSizes[size],
                    checked ? translateSizes[size] : "translate-x-1"
                )}
            />
        </button>
    );
};
