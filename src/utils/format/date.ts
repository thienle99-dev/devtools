/**
 * Date formatting utilities
 */

/**
 * Formats a date string or Date object to a localized string (e.g., "Jan 1, 2024")
 */
export const formatDate = (date: string | Date | number, options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
}): string => {
    if (!date) return '';
    try {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', options);
    } catch (e) {
        return String(date);
    }
};

/**
 * Parses a YYYYMMDD string and returns a formatted date string (DD/MM/YYYY or localized)
 */
export const formatYYYYMMDD = (dateStr?: string): string => {
    if (!dateStr || dateStr.length !== 8) return dateStr || '';

    // Parse parts
    const y = parseInt(dateStr.substring(0, 4));
    const m = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-indexed
    const d = parseInt(dateStr.substring(6, 8));

    const date = new Date(y, m, d);
    if (isNaN(date.getTime())) return dateStr;

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};
