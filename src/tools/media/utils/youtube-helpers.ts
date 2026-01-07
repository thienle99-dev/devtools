/**
 * YouTube Helper Utilities
 * Utility functions for YouTube URL validation and parsing
 */

/**
 * Validates if a URL is a valid YouTube URL
 */
export const isValidYoutubeUrl = (url: string): boolean => {
    const patterns = [
        // Standard watch URL
        /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        // Shortened URL
        /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
        // Shorts URL
        /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
        // Embed URL
        /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
    ];
    
    return patterns.some(pattern => pattern.test(url));
};

/**
 * Extracts video ID from YouTube URL
 */
export const extractVideoId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
};

/**
 * Formats file size from bytes to human readable format
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Formats duration from seconds to HH:MM:SS
 */
export const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    return `${minutes}:${String(secs).padStart(2, '0')}`;
};

/**
 * Formats download speed
 */
export const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatFileSize(bytesPerSecond)}/s`;
};

/**
 * Sanitizes filename by removing invalid characters
 */
export const sanitizeFilename = (filename: string): string => {
    return filename
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim()
        .substring(0, 200); // Limit length
};

/**
 * Gets file extension based on format
 */
export const getFileExtension = (format: 'video' | 'audio' | 'best'): string => {
    switch (format) {
        case 'audio':
            return 'mp3';
        case 'video':
        case 'best':
        default:
            return 'mp4';
    }
};

/**
 * Formats quality label for display
 */
export const formatQualityLabel = (quality: string): string => {
    const qualityMap: Record<string, string> = {
        '144p': '144p (Low)',
        '240p': '240p',
        '360p': '360p (SD)',
        '480p': '480p (SD)',
        '720p': '720p (HD)',
        '1080p': '1080p (Full HD)',
        '1440p': '1440p (2K)',
        '2160p': '2160p (4K)',
        'best': 'Best Quality Available',
    };
    
    return qualityMap[quality] || quality;
};

/**
 * Estimates download time based on file size and speed
 */
export const estimateDownloadTime = (totalBytes: number, bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return 'Calculating...';
    
    const seconds = Math.ceil(totalBytes / bytesPerSecond);
    
    if (seconds < 60) {
        return `${seconds}s`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${seconds % 60}s`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
};

/**
 * Validates if quality is supported
 */
export const isSupportedQuality = (quality: string): boolean => {
    const supportedQualities = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p', 'best'];
    return supportedQualities.includes(quality);
};

/**
 * Parses playlist URL and extracts playlist ID
 */
export const extractPlaylistId = (url: string): string | null => {
    const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
};

/**
 * Checks if URL is a playlist
 */
export const isPlaylistUrl = (url: string): boolean => {
    return url.includes('list=');
};

