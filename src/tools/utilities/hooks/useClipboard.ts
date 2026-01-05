import { useCallback } from 'react';

interface UseClipboardReturn {
    copyToClipboard: (text: string) => Promise<boolean>;
    copyImageToClipboard: (base64: string, mimeType?: string) => Promise<boolean>;
    readClipboard: () => Promise<string | null>;
}

export const useClipboard = (): UseClipboardReturn => {
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

    const copyImageToClipboard = useCallback(async (base64: string, mimeType?: string): Promise<boolean> => {
        try {
            console.log('Attempting to copy image to clipboard...');

            // Check if clipboard API supports writing images
            if (!navigator.clipboard || !navigator.clipboard.write) {
                console.error('Clipboard write not supported for images');
                return false;
            }

            // Extract MIME type from base64 if not provided
            let finalMimeType = mimeType;
            if (!finalMimeType && base64.startsWith('data:')) {
                const match = base64.match(/data:([^;]+);/);
                if (match) {
                    finalMimeType = match[1];
                }
            }

            // Default to PNG if still no MIME type
            if (!finalMimeType) {
                finalMimeType = 'image/png';
            }

            console.log('MIME type:', finalMimeType);

            try {
                // Method 1: Direct fetch and blob
                const response = await fetch(base64);
                const blob = await response.blob();

                console.log('Blob created:', blob.size, 'bytes, type:', blob.type);

                // Ensure blob has correct type
                const typedBlob = blob.type ? blob : new Blob([blob], { type: finalMimeType });

                // Create ClipboardItem with the image
                const clipboardItem = new ClipboardItem({
                    [finalMimeType]: typedBlob
                });

                console.log('ClipboardItem created, writing to clipboard...');

                // Write to clipboard
                await navigator.clipboard.write([clipboardItem]);

                console.log('✓ Image successfully copied to clipboard!');
                return true;
            } catch (directError) {
                console.warn('Direct blob method failed, trying canvas method...', directError);

                // Method 2: Canvas-based approach (more compatible)
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = async () => {
                        try {
                            // Create canvas and draw image
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            if (!ctx) {
                                console.error('Could not get canvas context');
                                resolve(false);
                                return;
                            }

                            ctx.drawImage(img, 0, 0);

                            // Convert canvas to blob
                            canvas.toBlob(async (blob) => {
                                if (!blob) {
                                    console.error('Could not create blob from canvas');
                                    resolve(false);
                                    return;
                                }

                                try {
                                    const clipboardItem = new ClipboardItem({
                                        [finalMimeType]: blob
                                    });

                                    await navigator.clipboard.write([clipboardItem]);
                                    console.log('✓ Image copied via canvas method!');
                                    resolve(true);
                                } catch (err) {
                                    console.error('Canvas method also failed:', err);
                                    resolve(false);
                                }
                            }, finalMimeType);
                        } catch (err) {
                            console.error('Error in canvas method:', err);
                            resolve(false);
                        }
                    };

                    img.onerror = () => {
                        console.error('Failed to load image for canvas method');
                        resolve(false);
                    };

                    img.src = base64;
                });
            }
        } catch (error) {
            console.error('Failed to copy image to clipboard:', error);
            console.error('Error details:', {
                name: (error as Error).name,
                message: (error as Error).message,
                stack: (error as Error).stack
            });
            return false;
        }
    }, []);

    const readClipboard = useCallback(async (): Promise<string | null> => {
        try {
            // Use Electron's clipboard API (no permission needed)
            if ((window as any).ipcRenderer?.clipboard?.readText) {
                const text = await (window as any).ipcRenderer.clipboard.readText();
                return text || null;
            }

            // Fallback to browser API (requires permission)
            if (navigator.clipboard && navigator.clipboard.readText) {
                const text = await navigator.clipboard.readText();
                return text;
            }
            
            console.warn('Clipboard read not supported');
            return null;
        } catch (err) {
            console.warn('Clipboard read error:', err);
            return null;
        }
    }, []);

    return {
        copyToClipboard,
        copyImageToClipboard,
        readClipboard,
    };
};
