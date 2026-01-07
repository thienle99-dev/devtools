import React from 'react';
import { usePlatform } from '../../hooks/usePlatform';
import { formatShortcut } from '../../utils/keyboardShortcuts';

interface KeyboardShortcutProps {
    shortcut: string;
    className?: string;
}

/**
 * Displays a keyboard shortcut with platform-specific formatting
 * macOS: Shows symbols (⌘, ⌃, ⇧, ⌥)
 * Windows/Linux: Shows text (Ctrl, Shift, Alt)
 */
export const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({
    shortcut,
    className = ''
}) => {
    const { isMac } = usePlatform();
    const formattedShortcut = formatShortcut(shortcut, isMac);

    if (!formattedShortcut) return null;

    // Split the shortcut into individual keys
    const keys = formattedShortcut.split(/(?=[⌘⌃⇧⌥])|(?<=\+)/g).filter(k => k && k !== '+');

    return (
        <span className={`inline-flex items-center gap-0.5 ${className}`}>
            {keys.map((key, index) => (
                <kbd
                    key={index}
                    className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[10px] font-medium rounded border border-border-glass bg-glass-button text-foreground-muted shadow-sm"
                >
                    {key}
                </kbd>
            ))}
        </span>
    );
};

interface ShortcutHintProps {
    label: string;
    shortcut: string;
    className?: string;
}

/**
 * Displays a label with its keyboard shortcut
 * Example: "Close Tab" with "⌘W" or "Ctrl+W"
 */
export const ShortcutHint: React.FC<ShortcutHintProps> = ({
    label,
    shortcut,
    className = ''
}) => {
    return (
        <div className={`flex items-center justify-between gap-4 ${className}`}>
            <span className="text-sm text-foreground-secondary">{label}</span>
            <KeyboardShortcut shortcut={shortcut} />
        </div>
    );
};

interface ShortcutBadgeProps {
    shortcut: string;
    variant?: 'default' | 'primary' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Displays a keyboard shortcut as a badge
 * Useful for showing shortcuts inline with buttons or menu items
 */
export const ShortcutBadge: React.FC<ShortcutBadgeProps> = ({
    shortcut,
    variant = 'default',
    size = 'sm',
    className = ''
}) => {
    const { isMac } = usePlatform();
    const formattedShortcut = formatShortcut(shortcut, isMac);

    if (!formattedShortcut) return null;

    const sizeClasses = {
        sm: 'text-[10px] px-1.5 py-0.5 min-w-[1.5rem]',
        md: 'text-xs px-2 py-1 min-w-[2rem]',
        lg: 'text-sm px-2.5 py-1.5 min-w-[2.5rem]',
    };

    const variantClasses = {
        default: 'bg-glass-button border-border-glass text-foreground-muted',
        primary: 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
        secondary: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
    };

    return (
        <span
            className={`
        inline-flex items-center justify-center 
        font-mono font-medium rounded border
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
            title={`Keyboard shortcut: ${formattedShortcut}`}
        >
            {formattedShortcut}
        </span>
    );
};
