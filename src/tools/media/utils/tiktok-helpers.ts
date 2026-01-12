import { formatBytes, formatDuration, formatCompactNumber } from '@utils/format';

// URL validation
export const isValidTikTokUrl = (url: string): boolean => {
    const patterns = [
        /^(https?:\/\/)?(www\.)?(tiktok\.com)\/@[\w.-]+\/video\/\d+/,
        /^(https?:\/\/)?(vm\.|vt\.)?(tiktok\.com)\/[\w]+/,
        /^(https?:\/\/)?(www\.)?tiktok\.com\/t\/[\w]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
};

// Extract video ID from URL
export const extractTikTokId = (url: string): string | null => {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : null;
};

// Format file size
export const formatFileSize = formatBytes;

// Format duration
export { formatDuration };

// Format view count
export const formatCount = formatCompactNumber;

