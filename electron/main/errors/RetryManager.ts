/**
 * Retry Manager with Exponential Backoff
 * Handles intelligent retry logic for failed downloads
 */

import { DownloadError } from './DownloadError';

export interface RetryConfig {
    maxRetries: number;
    initialDelay: number; // milliseconds
    maxDelay: number; // milliseconds
    backoffMultiplier: number;
    jitter: boolean; // Add random jitter to prevent thundering herd
}

export interface RetryState {
    downloadId: string;
    attemptCount: number;
    nextRetryAt?: number;
    lastError?: DownloadError;
    totalWaitTime: number;
}

export class RetryManager {
    private retryStates: Map<string, RetryState> = new Map();
    private retryTimers: Map<string, NodeJS.Timeout> = new Map();
    
    private defaultConfig: RetryConfig = {
        maxRetries: 3,
        initialDelay: 2000, // 2 seconds
        maxDelay: 60000, // 1 minute
        backoffMultiplier: 2,
        jitter: true
    };

    /**
     * Check if download should be retried
     */
    shouldRetry(downloadId: string, error: DownloadError, config?: Partial<RetryConfig>): boolean {
        const cfg = { ...this.defaultConfig, ...config };
        const state = this.retryStates.get(downloadId);
        
        // Don't retry if error is not retryable
        if (!error.retryable) {
            console.log(`[RetryManager] Error ${error.code} is not retryable`);
            return false;
        }

        // Check if we've exceeded max retries
        const attemptCount = state?.attemptCount || 0;
        if (attemptCount >= cfg.maxRetries) {
            console.log(`[RetryManager] Max retries (${cfg.maxRetries}) reached for ${downloadId}`);
            return false;
        }

        return true;
    }

    /**
     * Calculate next retry delay with exponential backoff
     */
    calculateDelay(attemptCount: number, config?: Partial<RetryConfig>): number {
        const cfg = { ...this.defaultConfig, ...config };
        
        // Exponential backoff: delay = initialDelay * (multiplier ^ attemptCount)
        let delay = cfg.initialDelay * Math.pow(cfg.backoffMultiplier, attemptCount);
        
        // Cap at max delay
        delay = Math.min(delay, cfg.maxDelay);
        
        // Add jitter (random 0-25% variation) to prevent thundering herd
        if (cfg.jitter) {
            const jitterAmount = delay * 0.25 * Math.random();
            delay += jitterAmount;
        }
        
        return Math.floor(delay);
    }

    /**
     * Schedule a retry for a download
     */
    scheduleRetry(
        downloadId: string,
        retryCallback: () => Promise<void>,
        error: DownloadError,
        config?: Partial<RetryConfig>
    ): { scheduled: boolean; retryAt?: number; delay?: number } {
        if (!this.shouldRetry(downloadId, error, config)) {
            return { scheduled: false };
        }

        const state = this.retryStates.get(downloadId) || {
            downloadId,
            attemptCount: 0,
            totalWaitTime: 0
        };

        state.attemptCount++;
        state.lastError = error;

        const delay = this.calculateDelay(state.attemptCount - 1, config);
        const retryAt = Date.now() + delay;
        
        state.nextRetryAt = retryAt;
        state.totalWaitTime += delay;
        
        this.retryStates.set(downloadId, state);

        console.log(
            `[RetryManager] Scheduling retry ${state.attemptCount}/${this.defaultConfig.maxRetries} ` +
            `for ${downloadId} in ${(delay / 1000).toFixed(1)}s`
        );

        // Clear existing timer if any
        const existingTimer = this.retryTimers.get(downloadId);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Schedule retry
        const timer = setTimeout(async () => {
            console.log(`[RetryManager] Executing retry ${state.attemptCount} for ${downloadId}`);
            this.retryTimers.delete(downloadId);
            
            try {
                await retryCallback();
                // Success - clear retry state
                this.clearRetryState(downloadId);
            } catch (error) {
                console.error(`[RetryManager] Retry failed for ${downloadId}:`, error);
                // Will be handled by the download manager
            }
        }, delay);

        this.retryTimers.set(downloadId, timer);

        return {
            scheduled: true,
            retryAt,
            delay
        };
    }

    /**
     * Get retry state for a download
     */
    getRetryState(downloadId: string): RetryState | undefined {
        return this.retryStates.get(downloadId);
    }

    /**
     * Get time until next retry
     */
    getTimeUntilRetry(downloadId: string): number | null {
        const state = this.retryStates.get(downloadId);
        if (!state || !state.nextRetryAt) {
            return null;
        }
        
        const remaining = state.nextRetryAt - Date.now();
        return remaining > 0 ? remaining : 0;
    }

    /**
     * Cancel scheduled retry
     */
    cancelRetry(downloadId: string) {
        const timer = this.retryTimers.get(downloadId);
        if (timer) {
            clearTimeout(timer);
            this.retryTimers.delete(downloadId);
            console.log(`[RetryManager] Cancelled retry for ${downloadId}`);
        }
        this.retryStates.delete(downloadId);
    }

    /**
     * Clear retry state (after success)
     */
    clearRetryState(downloadId: string) {
        this.retryStates.delete(downloadId);
        const timer = this.retryTimers.get(downloadId);
        if (timer) {
            clearTimeout(timer);
            this.retryTimers.delete(downloadId);
        }
        console.log(`[RetryManager] Cleared retry state for ${downloadId}`);
    }

    /**
     * Get all active retries
     */
    getActiveRetries(): RetryState[] {
        return Array.from(this.retryStates.values());
    }

    /**
     * Clear all retries
     */
    clearAll() {
        this.retryTimers.forEach(timer => clearTimeout(timer));
        this.retryTimers.clear();
        this.retryStates.clear();
        console.log('[RetryManager] Cleared all retries');
    }

    /**
     * Get retry statistics
     */
    getStats() {
        const states = Array.from(this.retryStates.values());
        
        return {
            activeRetries: states.length,
            totalRetryAttempts: states.reduce((sum, s) => sum + s.attemptCount, 0),
            averageRetryCount: states.length > 0 
                ? states.reduce((sum, s) => sum + s.attemptCount, 0) / states.length 
                : 0,
            totalWaitTime: states.reduce((sum, s) => sum + s.totalWaitTime, 0),
            nextRetry: states
                .filter(s => s.nextRetryAt)
                .sort((a, b) => (a.nextRetryAt || 0) - (b.nextRetryAt || 0))[0]
        };
    }
}

// Singleton instance
export const retryManager = new RetryManager();
