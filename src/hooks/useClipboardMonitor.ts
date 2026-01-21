import { useEffect, useRef } from 'react';
import { useClipboardStore } from '@/store/clipboardStore';

/**
 * Hook to monitor clipboard changes and save them to the store
 * @param enabled Whether monitoring is enabled
 * @param ignoredApps List of apps to ignore (logic for detection would be here)
 */
export const useClipboardMonitor = (enabled: boolean, ignoredApps: string[] = []) => {
    const addItem = useClipboardStore(state => state.addItem);
    const lastTextRef = useRef<string | null>(null);
    const lastImageRef = useRef<string | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const checkClipboard = async () => {
            try {
                const activeApp = await window.ipcRenderer.invoke?.('clipboard-get-active-app');
                if (activeApp && ignoredApps.some(app => app.trim().length > 0 && app.toLowerCase() === activeApp.toLowerCase())) {
                    return;
                }

                // 1. Check for Text changes
                const text = await window.ipcRenderer.invoke('clipboard-read-text');
                if (text && text !== lastTextRef.current) {
                    lastTextRef.current = text;
                    
                    // Basic link detection
                    const isLink = text.startsWith('http://') || text.startsWith('https://') || text.startsWith('www.');
                    addItem(text, isLink ? 'link' : 'text');
                }

                // 2. Check for Image changes
                const imageData = await window.ipcRenderer.invoke('clipboard-read-image');
                if (imageData && imageData !== lastImageRef.current) {
                    lastImageRef.current = imageData;
                    addItem(imageData, 'image');
                }
            } catch (error) {
                console.error('Error monitoring clipboard:', error);
            }
        };

        // Initialize last values to current clipboard state to avoid adding existing content on mount
        const init = async () => {
            lastTextRef.current = await window.ipcRenderer.invoke('clipboard-read-text');
            lastImageRef.current = await window.ipcRenderer.invoke('clipboard-read-image');
        };
        init();

        const interval = setInterval(checkClipboard, 1000);
        return () => clearInterval(interval);
    }, [enabled, ignoredApps, addItem]);
};
