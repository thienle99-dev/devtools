import { useEffect, useRef } from 'react';
import { useClipboard } from './useClipboard';
import { useClipboardStore } from '../../../store/clipboardStore';

export const useClipboardMonitor = (enabled: boolean) => {
    const { readClipboard } = useClipboard();
    const addItem = useClipboardStore((state) => state.addItem);
    const lastClipboardRef = useRef<string>('');

    useEffect(() => {
        if (!enabled) return;

        const checkClipboard = async () => {
            const current = await readClipboard();
            if (current && current !== lastClipboardRef.current && current.trim().length > 0) {
                addItem(current, 'text');
                lastClipboardRef.current = current;
            }
        };

        // Check immediately
        checkClipboard();

        // Then check every 2 seconds
        const interval = setInterval(checkClipboard, 2000);

        return () => clearInterval(interval);
    }, [enabled, readClipboard, addItem]);
};
