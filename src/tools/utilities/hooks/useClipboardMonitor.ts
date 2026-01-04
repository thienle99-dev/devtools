import { useEffect, useRef } from 'react';
import { useClipboard } from './useClipboard';
import { useClipboardStore } from '../../../store/clipboardStore';
import { detectClipboardType, extractMetadata, getSourceApp } from '../utils/clipboardUtils';

export const useClipboardMonitor = (enabled: boolean, ignoredApps: string[] = []) => {
    const { readClipboard } = useClipboard();
    const addItem = useClipboardStore((state) => state.addItem);
    const lastClipboardRef = useRef<string>('');

    useEffect(() => {
        if (!enabled) return;

        const checkClipboard = async () => {
            try {
                // Check if current app is in ignore list
                const sourceApp = getSourceApp();
                if (sourceApp && ignoredApps.includes(sourceApp)) {
                    return; // Skip if app is ignored
                }

                const current = await readClipboard();
                if (current && current !== lastClipboardRef.current && current.trim().length > 0) {
                    // Detect type and extract metadata
                    const type = detectClipboardType(current);
                    const metadata = extractMetadata(current, type);
                    
                    if (sourceApp) {
                        metadata.sourceApp = sourceApp;
                    }

                    addItem(current, type, metadata);
                    lastClipboardRef.current = current;
                }
            } catch (error) {
                // Silently fail - clipboard permission might not be granted
                console.debug('Clipboard monitoring error:', error);
            }
        };

        // Check immediately on enable
        checkClipboard();

        // Then check every 1 second (balance between responsiveness and performance)
        const interval = setInterval(checkClipboard, 1000);

        return () => clearInterval(interval);
    }, [enabled, readClipboard, addItem, ignoredApps]);
};
