/**
 * Power formatting utilities
 */

/**
 * Formats power in milliwatts to a human-readable string (W or mW)
 */
export const formatPower = (mW: number): string => {
    if (mW >= 1000) {
        return `${(mW / 1000).toFixed(2)} W`;
    }
    return `${mW.toFixed(0)} mW`;
};

/**
 * Formats capacity in mAh or mWh to a human-readable string
 */
export const formatCapacity = (value: number, unit: string): string => {
    if (unit === 'mWh') {
        if (value >= 1000) return `${(value / 1000).toFixed(2)} Wh`;
        return `${value.toFixed(0)} mWh`;
    }
    if (value >= 1000) return `${(value / 1000).toFixed(2)} Ah`;
    return `${value.toFixed(0)} mAh`;
};
