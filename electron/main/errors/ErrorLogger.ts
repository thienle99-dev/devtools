/**
 * Error Logger System
 * Tracks, stores, and exports download errors for debugging and user support
 */

import Store from 'electron-store';
import { DownloadError, ErrorCode } from './DownloadError';
import fs from 'fs/promises';
import path from 'path';
import { app } from 'electron';

export interface ErrorLogEntry {
    id: string;
    timestamp: number;
    downloadId?: string;
    url?: string;
    platform?: string;
    errorCode: ErrorCode;
    errorMessage: string;
    errorStack?: string;
    retryCount: number;
    resolved: boolean;
    userAction?: 'retry' | 'ignored' | 'reported';
    metadata?: any;
}

interface ErrorLogStore {
    errors: ErrorLogEntry[];
    stats: {
        totalErrors: number;
        errorsByCode: Record<ErrorCode, number>;
        lastCleanup: number;
    };
}

export class ErrorLogger {
    private store: Store<ErrorLogStore>;
    private maxEntries = 500; // Keep last 500 errors
    private retentionDays = 30; // Keep errors for 30 days

    constructor() {
        this.store = new Store<ErrorLogStore>({
            name: 'error-log',
            defaults: {
                errors: [],
                stats: {
                    totalErrors: 0,
                    errorsByCode: {} as Record<ErrorCode, number>,
                    lastCleanup: Date.now()
                }
            }
        });

        // Clean up old errors on startup
        this.cleanupOldErrors();
    }

    /**
     * Log a download error
     */
    log(error: DownloadError, downloadId?: string): string {
        const entry: ErrorLogEntry = {
            id: this.generateId(),
            timestamp: Date.now(),
            downloadId,
            url: error.metadata.url,
            platform: error.metadata.platform,
            errorCode: error.code,
            errorMessage: error.message,
            errorStack: error.stack,
            retryCount: error.metadata.retryCount || 0,
            resolved: false,
            metadata: error.metadata
        };

        // Add to store
        const errors = this.store.get('errors', []);
        errors.unshift(entry); // Add to beginning

        // Limit size
        if (errors.length > this.maxEntries) {
            errors.splice(this.maxEntries);
        }

        this.store.set('errors', errors);

        // Update stats
        this.updateStats(error.code);

        console.error(`[ErrorLogger] Logged error ${entry.id}: ${error.code} - ${error.message}`);

        return entry.id;
    }

    /**
     * Mark error as resolved
     */
    markResolved(errorId: string, userAction?: 'retry' | 'ignored' | 'reported') {
        const errors = this.store.get('errors', []);
        const error = errors.find(e => e.id === errorId);
        
        if (error) {
            error.resolved = true;
            error.userAction = userAction;
            this.store.set('errors', errors);
            console.log(`[ErrorLogger] Marked error ${errorId} as resolved (${userAction})`);
        }
    }

    /**
     * Get recent errors
     */
    getRecentErrors(limit: number = 50): ErrorLogEntry[] {
        const errors = this.store.get('errors', []);
        return errors.slice(0, limit);
    }

    /**
     * Get errors by download ID
     */
    getErrorsByDownload(downloadId: string): ErrorLogEntry[] {
        const errors = this.store.get('errors', []);
        return errors.filter(e => e.downloadId === downloadId);
    }

    /**
     * Get errors by error code
     */
    getErrorsByCode(code: ErrorCode): ErrorLogEntry[] {
        const errors = this.store.get('errors', []);
        return errors.filter(e => e.errorCode === code);
    }

    /**
     * Get unresolved errors
     */
    getUnresolvedErrors(): ErrorLogEntry[] {
        const errors = this.store.get('errors', []);
        return errors.filter(e => !e.resolved);
    }

    /**
     * Get error statistics
     */
    getStats() {
        const stats = this.store.get('stats');
        const errors = this.store.get('errors', []);
        
        // Calculate recent error rate (last 24 hours)
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        const recentErrors = errors.filter(e => e.timestamp > oneDayAgo);
        
        // Most common errors
        const errorCounts: Record<string, number> = {};
        errors.forEach(e => {
            errorCounts[e.errorCode] = (errorCounts[e.errorCode] || 0) + 1;
        });
        
        const mostCommon = Object.entries(errorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([code, count]) => ({ code: code as ErrorCode, count }));

        return {
            total: stats.totalErrors,
            stored: errors.length,
            recent24h: recentErrors.length,
            unresolved: errors.filter(e => !e.resolved).length,
            byCode: stats.errorsByCode,
            mostCommon,
            lastCleanup: new Date(stats.lastCleanup)
        };
    }

    /**
     * Export errors to file
     */
    async exportToFile(format: 'json' | 'csv' | 'txt'): Promise<string> {
        const errors = this.store.get('errors', []);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `error-log-${timestamp}.${format}`;
        const filePath = path.join(app.getPath('downloads'), filename);

        let content = '';

        if (format === 'json') {
            content = JSON.stringify({
                exported: new Date().toISOString(),
                stats: this.getStats(),
                errors
            }, null, 2);
        } else if (format === 'csv') {
            // CSV Header
            const headers = [
                'Timestamp',
                'Error Code',
                'Error Message',
                'URL',
                'Platform',
                'Retry Count',
                'Resolved',
                'User Action'
            ];
            content = headers.join(',') + '\n';

            // CSV Rows
            errors.forEach(e => {
                const row = [
                    new Date(e.timestamp).toISOString(),
                    e.errorCode,
                    `"${e.errorMessage.replace(/"/g, '""')}"`,
                    e.url || '',
                    e.platform || '',
                    e.retryCount,
                    e.resolved,
                    e.userAction || ''
                ];
                content += row.join(',') + '\n';
            });
        } else {
            // Text format
            content = `Error Log Export\n`;
            content += `Generated: ${new Date().toISOString()}\n`;
            content += `Total Errors: ${errors.length}\n`;
            content += `\n${'='.repeat(80)}\n\n`;

            errors.forEach((e, i) => {
                content += `Error #${i + 1}\n`;
                content += `Timestamp: ${new Date(e.timestamp).toLocaleString()}\n`;
                content += `Code: ${e.errorCode}\n`;
                content += `Message: ${e.errorMessage}\n`;
                if (e.url) content += `URL: ${e.url}\n`;
                if (e.platform) content += `Platform: ${e.platform}\n`;
                content += `Retry Count: ${e.retryCount}\n`;
                content += `Resolved: ${e.resolved ? 'Yes' : 'No'}\n`;
                if (e.userAction) content += `User Action: ${e.userAction}\n`;
                if (e.errorStack) {
                    content += `\nStack Trace:\n${e.errorStack}\n`;
                }
                content += `\n${'-'.repeat(80)}\n\n`;
            });
        }

        await fs.writeFile(filePath, content, 'utf-8');
        console.log(`[ErrorLogger] Exported ${errors.length} errors to ${filePath}`);
        
        return filePath;
    }

    /**
     * Clear all errors
     */
    clearAll() {
        this.store.set('errors', []);
        console.log('[ErrorLogger] Cleared all errors');
    }

    /**
     * Clear resolved errors
     */
    clearResolved() {
        const errors = this.store.get('errors', []);
        const unresolved = errors.filter(e => !e.resolved);
        this.store.set('errors', unresolved);
        console.log(`[ErrorLogger] Cleared ${errors.length - unresolved.length} resolved errors`);
    }

    /**
     * Clean up old errors (retention policy)
     */
    private cleanupOldErrors() {
        const errors = this.store.get('errors', []);
        const cutoffDate = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);
        
        const filtered = errors.filter(e => e.timestamp > cutoffDate);
        
        if (filtered.length < errors.length) {
            this.store.set('errors', filtered);
            const stats = this.store.get('stats');
            stats.lastCleanup = Date.now();
            this.store.set('stats', stats);
            
            console.log(`[ErrorLogger] Cleaned up ${errors.length - filtered.length} old errors`);
        }
    }

    /**
     * Update error statistics
     */
    private updateStats(errorCode: ErrorCode) {
        const stats = this.store.get('stats');
        stats.totalErrors++;
        stats.errorsByCode[errorCode] = (stats.errorsByCode[errorCode] || 0) + 1;
        this.store.set('stats', stats);
    }

    /**
     * Generate unique error ID
     */
    private generateId(): string {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Singleton instance
export const errorLogger = new ErrorLogger();
