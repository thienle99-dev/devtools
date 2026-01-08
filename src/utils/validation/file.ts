/**
 * File validation and sanitization utilities
 */

export const sanitizeFilename = (filename: string, maxLength: number = 200): string => {
    return filename
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
        .replace(/\s+/g, ' ')          // Replace multiple spaces
        .trim()
        .substring(0, maxLength);
};

export const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : '';
};

export const isValidFilename = (filename: string): boolean => {
    const invalidChars = /[<>:"/\\|?*]/;
    return !invalidChars.test(filename) && filename.length > 0;
};
