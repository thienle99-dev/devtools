// Keyboard Shortcuts Utilities

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean; // Cmd on Mac
    action: () => void;
    description: string;
}

export class KeyboardShortcutManager {
    private shortcuts: Map<string, KeyboardShortcut> = new Map();
    private isEnabled = true;

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', this.handleKeyDown.bind(this));
        }
    }

    private getKeyString(shortcut: KeyboardShortcut): string {
        const parts: string[] = [];
        if (shortcut.ctrl || shortcut.meta) parts.push(shortcut.meta ? 'meta' : 'ctrl');
        if (shortcut.shift) parts.push('shift');
        if (shortcut.alt) parts.push('alt');
        parts.push(shortcut.key.toLowerCase());
        return parts.join('+');
    }

    register(shortcut: KeyboardShortcut): () => void {
        const key = this.getKeyString(shortcut);
        this.shortcuts.set(key, shortcut);
        
        // Return unregister function
        return () => {
            this.shortcuts.delete(key);
        };
    }

    unregister(key: string): void {
        this.shortcuts.delete(key);
    }

    enable(): void {
        this.isEnabled = true;
    }

    disable(): void {
        this.isEnabled = false;
    }

    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.isEnabled) return;

        const parts: string[] = [];
        if (event.ctrlKey || event.metaKey) parts.push(event.metaKey ? 'meta' : 'ctrl');
        if (event.shiftKey) parts.push('shift');
        if (event.altKey) parts.push('alt');
        parts.push(event.key.toLowerCase());

        const key = parts.join('+');
        const shortcut = this.shortcuts.get(key);

        if (shortcut) {
            event.preventDefault();
            event.stopPropagation();
            shortcut.action();
        }
    }

    getShortcuts(): KeyboardShortcut[] {
        return Array.from(this.shortcuts.values());
    }
}

// Global instance
export const keyboardShortcutManager = new KeyboardShortcutManager();

// Common shortcuts
export const commonShortcuts = {
    search: (action: () => void) => ({
        key: 'f',
        ctrl: true,
        meta: true,
        action,
        description: 'Search',
    }),
    selectAll: (action: () => void) => ({
        key: 'a',
        ctrl: true,
        meta: true,
        action,
        description: 'Select All',
    }),
    delete: (action: () => void) => ({
        key: 'Delete',
        action,
        description: 'Delete Selected',
    }),
    escape: (action: () => void) => ({
        key: 'Escape',
        action,
        description: 'Cancel/Close',
    }),
    refresh: (action: () => void) => ({
        key: 'r',
        ctrl: true,
        meta: true,
        action,
        description: 'Refresh',
    }),
};

