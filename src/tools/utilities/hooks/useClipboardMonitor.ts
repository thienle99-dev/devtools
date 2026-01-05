import { useEffect, useRef } from 'react';
import { useClipboard } from './useClipboard';
import { useClipboardStore } from '../../../store/clipboardStore';
import { getSourceApp } from '../utils/clipboardUtils';

// Shared ref để track clipboard content và tránh duplicate khi copy từ internal
let globalLastClipboardRef = '';

export const useClipboardMonitor = (enabled: boolean, ignoredApps: string[] = []) => {
    const { readClipboard } = useClipboard();
    const addItem = useClipboardStore((state) => state.addItem);
    const lastClipboardRef = useRef<string>(globalLastClipboardRef);
    
    // Expose ref globally để clipboardSync có thể update
    useEffect(() => {
        (window as any).__clipboardMonitorRef = lastClipboardRef;
        return () => {
            delete (window as any).__clipboardMonitorRef;
        };
    }, []);
    
    // Sync với global ref
    useEffect(() => {
        lastClipboardRef.current = globalLastClipboardRef;
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const checkClipboard = async () => {
            try {
                // Check if current app is in ignore list
                const sourceApp = getSourceApp();

                // Check for images first - Use Electron's clipboard API
                if ((window as any).ipcRenderer?.clipboard?.readImage) {
                    try {
                        const base64Image = await (window as any).ipcRenderer.clipboard.readImage();
                        if (base64Image) {
                            // Normalize base64 để so sánh
                            const normalizeBase64 = (base64: string): string => {
                                const match = base64.match(/data:image\/[^;]+;base64,(.+)/);
                                return match ? match[1] : base64;
                            };
                            
                            const normalizedImage = normalizeBase64(base64Image);
                            const normalizedLastRef = normalizeBase64(lastClipboardRef.current || '');
                            
                            // Check if giống với last clipboard hoặc lastCopiedContent
                            const lastCopied = (window as any).__lastCopiedContent || '';
                            const normalizedLastCopied = normalizeBase64(lastCopied);
                            
                            if (normalizedImage === normalizedLastRef || normalizedImage === normalizedLastCopied) {
                                // Skip duplicate
                                if (normalizedImage === normalizedLastCopied) {
                                    setTimeout(() => {
                                        (window as any).__lastCopiedContent = '';
                                    }, 1000);
                                }
                                return;
                            }
                            
                            // Check if current app is in ignore list for images
                            if (sourceApp && ignoredApps.includes(sourceApp)) {
                                return; // Skip if app is ignored
                            }

                            const metadata: Record<string, any> = {
                                mimeType: 'image/png', // Electron returns PNG
                            };
                            if (sourceApp) {
                                metadata.sourceApp = sourceApp;
                            }
                            addItem(base64Image, 'image', metadata);
                            lastClipboardRef.current = base64Image;
                            globalLastClipboardRef = base64Image;
                            return; // Found image, skip text check
                        }
                    } catch (imageError) {
                        // Image reading failed, fall through to text
                        console.debug('Image clipboard read failed:', imageError);
                    }
                }

                // Fallback to browser API for images (chỉ dùng nếu Electron API không có)
                if (!(window as any).ipcRenderer?.clipboard?.readImage && navigator.clipboard && navigator.clipboard.read) {
                    try {
                        const clipboardItems = await navigator.clipboard.read();
                        for (const clipboardItem of clipboardItems) {
                            // Check for image types
                            for (const type of clipboardItem.types) {
                                if (type.startsWith('image/')) {
                                    // Check if current app is in ignore list for images
                                    if (sourceApp && ignoredApps.includes(sourceApp)) {
                                        return; // Skip if app is ignored
                                    }

                                    const blob = await clipboardItem.getType(type);
                                    const reader = new FileReader();

                                    reader.onloadend = () => {
                                        const base64 = reader.result as string;
                                        if (base64) {
                                            // Normalize base64 để so sánh
                                            const normalizeBase64 = (base64: string): string => {
                                                const match = base64.match(/data:image\/[^;]+;base64,(.+)/);
                                                return match ? match[1] : base64;
                                            };
                                            
                                            const normalizedImage = normalizeBase64(base64);
                                            const normalizedLastRef = normalizeBase64(lastClipboardRef.current || '');
                                            
                                            // Check if giống với last clipboard hoặc lastCopiedContent
                                            const lastCopied = (window as any).__lastCopiedContent || '';
                                            const normalizedLastCopied = normalizeBase64(lastCopied);
                                            
                                            if (normalizedImage === normalizedLastRef || normalizedImage === normalizedLastCopied) {
                                                // Skip duplicate
                                                if (normalizedImage === normalizedLastCopied) {
                                                    setTimeout(() => {
                                                        (window as any).__lastCopiedContent = '';
                                                    }, 1000);
                                                }
                                                return;
                                            }
                                            
                                            const metadata: Record<string, any> = {
                                                mimeType: type,
                                                length: blob.size,
                                            };
                                            if (sourceApp) {
                                                metadata.sourceApp = sourceApp;
                                            }
                                            addItem(base64, 'image', metadata);
                                            lastClipboardRef.current = base64;
                                            globalLastClipboardRef = base64;
                                        }
                                    };

                                    reader.readAsDataURL(blob);
                                    return; // Found image, skip text check
                                }
                            }
                        }
                    } catch (imageError) {
                        // Image reading failed, fall through to text
                        console.debug('Image clipboard read failed:', imageError);
                    }
                }

                // Check for text
                // Check if current app is in ignore list for text
                if (sourceApp && ignoredApps.includes(sourceApp)) {
                    return; // Skip if app is ignored
                }

                const current = await readClipboard();
                if (!current || current === lastClipboardRef.current) {
                    return;
                }
                
                const trimmedCurrent = current.trim();
                if (trimmedCurrent.length === 0) {
                    return;
                }
                
                // Normalize để so sánh với lastCopiedContent
                const normalizedCurrent = trimmedCurrent;
                const lastCopied = (window as any).__lastCopiedContent?.trim() || '';
                
                // Skip nếu giống với content vừa copy từ Clipboard Manager (tránh duplicate)
                if (lastCopied && normalizedCurrent === lastCopied) {
                    // Clear flag sau khi skip
                    setTimeout(() => {
                        (window as any).__lastCopiedContent = '';
                    }, 1000);
                    return;
                }

                // Detect if it's a URL/link
                const urlPattern = /^https?:\/\/.+/i;
                const type = urlPattern.test(trimmedCurrent) ? 'link' : 'text';

                const metadata: Record<string, any> = type === 'link' ? { url: current } : {};
                if (sourceApp) {
                    metadata.sourceApp = sourceApp;
                }

                addItem(current, type, metadata);
                lastClipboardRef.current = current;
                globalLastClipboardRef = current;
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
