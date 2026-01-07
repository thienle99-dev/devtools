/**
 * Utility functions for handling keyboard shortcuts across platforms
 */

export interface ShortcutKey {
    key: string;
    ctrl?: boolean;
    cmd?: boolean;
    shift?: boolean;
    alt?: boolean;
}

/**
 * Format a keyboard shortcut for display based on the current platform
 * @param shortcut - Shortcut string like "Ctrl+Shift+P" or "Cmd+K"
 * @param isMac - Whether the current platform is macOS
 * @returns Formatted shortcut string with platform-specific symbols
 */
export function formatShortcut(shortcut: string, isMac: boolean): string {
    if (!shortcut) return '';

    // Replace modifier keys with platform-specific symbols
    let formatted = shortcut;

    if (isMac) {
        // macOS uses symbols
        formatted = formatted
            .replace(/Ctrl\+/gi, '⌃')
            .replace(/Cmd\+/gi, '⌘')
            .replace(/Command\+/gi, '⌘')
            .replace(/Shift\+/gi, '⇧')
            .replace(/Alt\+/gi, '⌥')
            .replace(/Option\+/gi, '⌥')
            .replace(/Enter/gi, '⏎')
            .replace(/Delete/gi, '⌫')
            .replace(/Backspace/gi, '⌫')
            .replace(/Esc/gi, '⎋')
            .replace(/Tab/gi, '⇥');
    } else {
        // Windows/Linux uses text
        formatted = formatted
            .replace(/Cmd\+/gi, 'Ctrl+')
            .replace(/Command\+/gi, 'Ctrl+')
            .replace(/Option\+/gi, 'Alt+');
    }

    return formatted;
}

/**
 * Get the primary modifier key name for the current platform
 * @param isMac - Whether the current platform is macOS
 * @returns "Cmd" for macOS, "Ctrl" for Windows/Linux
 */
export function getPrimaryModifier(isMac: boolean): string {
    return isMac ? 'Cmd' : 'Ctrl';
}

/**
 * Get the primary modifier symbol for the current platform
 * @param isMac - Whether the current platform is macOS
 * @returns "⌘" for macOS, "Ctrl" for Windows/Linux
 */
export function getPrimaryModifierSymbol(isMac: boolean): string {
    return isMac ? '⌘' : 'Ctrl';
}

/**
 * Convert a shortcut string to a normalized format
 * Replaces platform-specific modifiers with a canonical form
 * @param shortcut - Shortcut string like "Ctrl+Shift+P"
 * @param isMac - Whether the current platform is macOS
 * @returns Normalized shortcut string
 */
export function normalizeShortcut(shortcut: string, isMac: boolean): string {
    let normalized = shortcut;

    // Normalize to use "Primary" for the main modifier
    if (isMac) {
        normalized = normalized.replace(/Ctrl\+/gi, 'Cmd+');
    } else {
        normalized = normalized.replace(/Cmd\+/gi, 'Ctrl+');
    }

    return normalized;
}

/**
 * Common keyboard shortcuts used in the application
 */
export const COMMON_SHORTCUTS = {
    // Navigation
    CLOSE_TAB: 'Cmd+W',
    NEW_TAB: 'Cmd+T',
    NEXT_TAB: 'Ctrl+Tab',
    PREV_TAB: 'Ctrl+Shift+Tab',
    SWITCH_TAB_1: 'Cmd+1',
    SWITCH_TAB_2: 'Cmd+2',
    SWITCH_TAB_3: 'Cmd+3',
    SWITCH_TAB_4: 'Cmd+4',
    SWITCH_TAB_5: 'Cmd+5',
    SWITCH_TAB_6: 'Cmd+6',
    SWITCH_TAB_7: 'Cmd+7',
    SWITCH_TAB_8: 'Cmd+8',
    SWITCH_TAB_9: 'Cmd+9',

    // UI
    TOGGLE_SIDEBAR: 'Cmd+B',
    TOGGLE_THEME: 'Cmd+Shift+T',
    OPEN_SETTINGS: 'Cmd+,',

    // Editing
    COPY: 'Cmd+C',
    PASTE: 'Cmd+V',
    CUT: 'Cmd+X',
    UNDO: 'Cmd+Z',
    REDO: 'Cmd+Shift+Z',
    SELECT_ALL: 'Cmd+A',
    FIND: 'Cmd+F',

    // Application
    QUIT: 'Cmd+Q',
    MINIMIZE: 'Cmd+M',
    HIDE: 'Cmd+H',
    REFRESH: 'Cmd+R',
} as const;

/**
 * Get a formatted shortcut from the common shortcuts
 * @param shortcutKey - Key from COMMON_SHORTCUTS
 * @param isMac - Whether the current platform is macOS
 * @returns Formatted shortcut string
 */
export function getFormattedCommonShortcut(
    shortcutKey: keyof typeof COMMON_SHORTCUTS,
    isMac: boolean
): string {
    return formatShortcut(COMMON_SHORTCUTS[shortcutKey], isMac);
}
