/**
 * Utility functions for clipboard operations
 */

export type ClipboardType = 'text' | 'image' | 'link' | 'file';

/**
 * Detect the type of clipboard content
 */
export function detectClipboardType(content: string): ClipboardType {
    // Detect base64 image
    if (content.startsWith('data:image/')) {
        return 'image';
    }

    // Detect URL (http/https)
    const urlPattern = /^https?:\/\/[^\s]+$/i;
    if (urlPattern.test(content.trim())) {
        return 'link';
    }

    // Detect file path (macOS/Windows/Linux)
    // macOS: /Users/... or ~/...
    // Windows: C:\... or D:\...
    // Linux: /home/... or ~/...
    const filePathPattern = /^(~?\/|([A-Z]:\\))[^\s]+$/;
    if (filePathPattern.test(content.trim())) {
        return 'file';
    }

    return 'text';
}

/**
 * Extract metadata from clipboard content
 */
export function extractMetadata(content: string, type: ClipboardType) {
    const metadata: any = {
        length: content.length,
    };

    if (type === 'link') {
        metadata.url = content.trim();
    } else if (type === 'file') {
        metadata.filePath = content.trim();
    } else if (type === 'image') {
        // Extract mime type from data URI
        const mimeMatch = content.match(/data:([^;]+);/);
        if (mimeMatch) {
            metadata.mimeType = mimeMatch[1];
        }
    }

    return metadata;
}

/**
 * Get source app name from Electron (if available)
 */
export function getSourceApp(): string | undefined {
    if (typeof window !== 'undefined' && (window as any).ipcRenderer) {
        try {
            // This will be set by Electron main process
            return (window as any).sourceApp;
        } catch {
            return undefined;
        }
    }
    return undefined;
}

