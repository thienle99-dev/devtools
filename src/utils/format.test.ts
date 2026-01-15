import { describe, it, expect } from 'vitest';
import { formatBytes } from './format/bytes';
import { formatDuration, formatTimeAgo, formatETA } from './format/time';

describe('Format Utils', () => {
    describe('formatBytes', () => {
        it('should format bytes correctly', () => {
            expect(formatBytes(0)).toBe('0 Bytes');
            expect(formatBytes(1024)).toBe('1.00 KB');
            expect(formatBytes(123456789)).toBe('117.74 MB');
        });
    });

    describe('formatDuration', () => {
        it('should format duration in MM:SS', () => {
            expect(formatDuration(65)).toBe('1:05');
            expect(formatDuration(10)).toBe('0:10');
        });

        it('should format duration in HH:MM:SS', () => {
             expect(formatDuration(3665)).toBe('1:01:05');
        });

        it('should handle ms', () => {
            // Check implementation detail: formatDuration logic for ms
            expect(formatDuration(1.5, { showMs: true })).toBe('0:01.50');
        });
    });

    describe('formatTimeAgo', () => {
        it('should format relative time', () => {
            const now = new Date();
            const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
            const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            
            expect(formatTimeAgo(fiveMinsAgo)).toBe('5 minutes ago');
            expect(formatTimeAgo(twoHoursAgo)).toBe('2 hours ago');
        });
    });
    
    describe('formatETA', () => {
        it('should format ETA correctly', () => {
            expect(formatETA(0)).toBe('--');
            expect(formatETA(45)).toBe('45s');
            expect(formatETA(90)).toBe('1m 30s');
            expect(formatETA(3700)).toBe('1h 1m');
        });
    });
});
