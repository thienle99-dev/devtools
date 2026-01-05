// Utility để sync clipboard content khi copy từ Clipboard Manager
// Giúp tránh duplicate khi clipboard monitor detect change

// Normalize base64 để so sánh (extract pure base64 data)
const normalizeBase64 = (base64: string): string => {
    if (!base64) return '';
    // Extract pure base64 từ data URL format
    const match = base64.match(/data:image\/[^;]+;base64,(.+)/);
    return match ? match[1] : base64;
};

export const setLastCopiedContent = (content: string, type: 'text' | 'image' | 'link' | 'file' = 'text') => {
    // Normalize content để so sánh
    let normalizedContent = content;
    if (type === 'image') {
        normalizedContent = normalizeBase64(content);
    } else if (type === 'text' || type === 'link') {
        normalizedContent = content.trim();
    }
    
    // Set flag để monitor skip add lại
    (window as any).__lastCopiedContent = normalizedContent;
    
    // Update global ref trong useClipboardMonitor
    if ((window as any).__clipboardMonitorRef) {
        (window as any).__clipboardMonitorRef.current = content; // Keep original format
    }
};

export const getLastCopiedContent = () => {
    return (window as any).__lastCopiedContent || '';
};

