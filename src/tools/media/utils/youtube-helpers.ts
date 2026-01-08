import { 
    formatBytes as coreFormatBytes, 
    formatDuration as coreFormatDuration, 
    formatSpeed as coreFormatSpeed 
} from '../../../utils/format';
import { 
    isValidYoutubeUrl as coreIsValidYoutubeUrl, 
    extractVideoId as coreExtractVideoId, 
    extractPlaylistId as coreExtractPlaylistId, 
    isPlaylistUrl as coreIsPlaylistUrl,
    sanitizeFilename as coreSanitizeFilename
} from '../../../utils/validation';

/**
 * YouTube Helper Utilities
 * Re-exports from centralized utilities for backward compatibility
 */

export const isValidYoutubeUrl = coreIsValidYoutubeUrl;
export const extractVideoId = coreExtractVideoId;
export const formatFileSize = coreFormatBytes;
export const formatDuration = coreFormatDuration;
export const formatSpeed = coreFormatSpeed;
export const sanitizeFilename = coreSanitizeFilename;
export const extractPlaylistId = coreExtractPlaylistId;
export const isPlaylistUrl = coreIsPlaylistUrl;

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

