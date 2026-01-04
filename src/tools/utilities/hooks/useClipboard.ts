import { useCallback, useRef } from 'react';

interface UseClipboardReturn {
    copyToClipboard: (text: string) => Promise<boolean>;
    readClipboard: () => Promise<string | null>;
}

export const useClipboard = (): UseClipboardReturn => {
    const fallbackCopyRef = useRef<HTMLTextAreaElement | null>(null);

    const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }

            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            } catch (err) {
                document.body.removeChild(textArea);
                return false;
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }, []);

    const readClipboard = useCallback(async (): Promise<string | null> => {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                return text;
            }
            console.warn('Clipboard read not supported');
            return null;
        } catch (err) {
            console.warn('Clipboard read permission denied');
            return null;
        }
    }, []);

    return {
        copyToClipboard,
        readClipboard,
    };
};
