/**
 * URL validation utilities
 */

export const isValidYoutubeUrl = (url: string): boolean => {
    const patterns = [
        /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
        /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=[\w-]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
};

export const extractVideoId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }
    return null;
};

export const extractPlaylistId = (url: string): string | null => {
    const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
};

export const isPlaylistUrl = (url: string): boolean => {
    return url.includes('list=') || url.includes('/playlist');
};
