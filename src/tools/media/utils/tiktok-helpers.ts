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
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// Format duration
export const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format view count
export const formatCount = (count: number): string => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toString();
};
