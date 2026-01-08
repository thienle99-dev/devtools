/**
 * Time and duration formatting utilities
 */

export const formatDuration = (seconds: number, options: { showMs?: boolean } = {}): string => {
    if (!seconds || seconds < 0) return options.showMs ? '00:00.00' : '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    
    let result = '';
    if (hours > 0) {
        result = `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
        result = `${minutes}:${String(secs).padStart(2, '0')}`;
    }

    if (options.showMs) {
        result += `.${String(ms).padStart(2, '0')}`;
    }
    
    return result;
};

export const formatTime = formatDuration; // Alias

/**
 * Formats a date or timestamp as a relative time string (e.g., "5 minutes ago")
 */
export const formatTimeAgo = (date: string | Date | number): string => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
};

export const formatETA = (seconds: number): string => {
    if (seconds === 0 || !isFinite(seconds)) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}m ${secs}s`;
    }
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
};

