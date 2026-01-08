import type { SupportedPlatform } from '@/types/universal-media';

export const detectPlatform = (url: string): SupportedPlatform => {
    const u = url.toLowerCase();

    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('tiktok.com')) return 'tiktok';
    if (u.includes('instagram.com')) return 'instagram';
    if (u.includes('facebook.com') || u.includes('fb.watch') || u.includes('fb.com')) return 'facebook';
    if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
    if (u.includes('twitch.tv')) return 'twitch';
    if (u.includes('reddit.com') || u.includes('redd.it')) return 'reddit';
    if (u.includes('pinterest.com')) return 'other';
    if (u.includes('vimeo.com')) return 'other';

    return 'other';
};

export const getPlatformName = (platform: SupportedPlatform): string => {
    switch (platform) {
        case 'youtube': return 'YouTube';
        case 'tiktok': return 'TikTok';
        case 'instagram': return 'Instagram';
        case 'facebook': return 'Facebook';
        case 'twitter': return 'Twitter / X';
        case 'twitch': return 'Twitch';
        case 'reddit': return 'Reddit';
        case 'other': return 'Unknown Platform';
        default: return 'Unknown';
    }
};

export const getPlatformColor = (platform: SupportedPlatform): string => {
    switch (platform) {
        case 'youtube': return 'text-red-500';
        case 'tiktok': return 'text-pink-500';
        case 'instagram': return 'text-fuchsia-500';
        case 'facebook': return 'text-blue-600';
        case 'twitter': return 'text-sky-500';
        case 'twitch': return 'text-purple-500';
        case 'reddit': return 'text-orange-500';
        default: return 'text-foreground-muted';
    }
};

export const getPlatformIconName = (platform: SupportedPlatform): string => {
    switch (platform) {
        case 'youtube': return 'Youtube';
        case 'tiktok': return 'Music2'; // Or generic video
        case 'instagram': return 'Instagram'; // Lucide has Instagram
        case 'facebook': return 'Facebook'; // Lucide has Facebook
        case 'twitter': return 'Twitter'; // Lucide has Twitter
        case 'twitch': return 'Twitch'; // Lucide has Twitch
        case 'reddit': return 'MessageCircle'; // No reddit icon in generic lucide? or maybe 'hash'
        default: return 'Link';
    }
};
