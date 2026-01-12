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

export const cleanYoutubeUrl = (url: string): string => {
    try {
        const urlObj = new URL(url);

        // If it is strictly a playlist (no video ID), keep it
        if (urlObj.pathname.includes('/playlist')) {
            return url;
        }

        // Handle different YouTube URL formats
        if (urlObj.hostname.includes('youtu.be')) {
            // Short format: https://youtu.be/VIDEO_ID?params
            const videoId = urlObj.pathname.slice(1).split('?')[0];
            const timestamp = urlObj.searchParams.get('t');
            return `https://youtu.be/${videoId}${timestamp ? `?t=${timestamp}` : ''}`;
        } else if (urlObj.hostname.includes('youtube.com')) {
            // Standard format: https://www.youtube.com/watch?v=VIDEO_ID&params
            const videoId = urlObj.searchParams.get('v');
            if (!videoId) return url; // Not a video URL, return as is (maybe channel url etc)

            // If it has video ID, we treat it as Single Video and STRIP everything else (including list)
            const timestamp = urlObj.searchParams.get('t');
            return `https://www.youtube.com/watch?v=${videoId}${timestamp ? `&t=${timestamp}` : ''}`;
        }

        return url;
    } catch (e) {
        // If URL parsing fails, return original
        return url;
    }
};
