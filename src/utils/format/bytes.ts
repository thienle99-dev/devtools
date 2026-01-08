/**
 * Byte formatting utilities
 */

export const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(decimals)} ${sizes[i]}`;
};

// Alias for compatibility
export const formatFileSize = formatBytes;
