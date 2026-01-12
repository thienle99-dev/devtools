/**
 * Number formatting utilities
 */

/**
 * Formats a number to a compact string (e.g., 1.2k, 1.5M, 1B)
 */
export const formatCompactNumber = (num?: number, limit = 0): string => {
    if (num === undefined || num === null || num < limit) return num?.toString() || '0';
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(num);
};

// Legacy support / Alias
export const formatViewCount = formatCompactNumber;
