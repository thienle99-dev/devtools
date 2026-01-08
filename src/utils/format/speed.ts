/**
 * Speed formatting utilities
 */

import { formatBytes } from './bytes';

export const formatSpeed = (bytesPerSecond: number): string => {
    return `${formatBytes(bytesPerSecond)}/s`;
};

export const formatBandwidth = formatSpeed; // Alias

/**
 * Formats a bitrate in bps to a human-readable string (kbps or Mbps)
 */
export const formatBitrate = (bitrate?: number): string => {
    if (!bitrate) return 'N/A';
    if (bitrate >= 1000000) return `${(bitrate / 1000000).toFixed(1)} Mbps`;
    if (bitrate >= 1000) return `${(bitrate / 1000).toFixed(0)} kbps`;
    return `${bitrate} bps`;
};
