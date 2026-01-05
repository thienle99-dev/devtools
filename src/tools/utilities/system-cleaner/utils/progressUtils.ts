// Progress Tracking Utilities with ETA calculations

export interface ProgressTracker {
    startTime: number;
    currentProgress: number;
    totalItems: number;
    completedItems: number;
    itemsPerSecond: number;
    estimatedTimeRemaining: number;
}

/**
 * Create a progress tracker
 */
export function createProgressTracker(totalItems: number): ProgressTracker {
    return {
        startTime: Date.now(),
        currentProgress: 0,
        totalItems,
        completedItems: 0,
        itemsPerSecond: 0,
        estimatedTimeRemaining: 0
    };
}

/**
 * Update progress tracker
 */
export function updateProgress(
    tracker: ProgressTracker,
    completedItems: number
): ProgressTracker {
    const now = Date.now();
    const elapsed = (now - tracker.startTime) / 1000; // seconds
    
    tracker.completedItems = completedItems;
    tracker.currentProgress = (completedItems / tracker.totalItems) * 100;
    
    if (elapsed > 0) {
        tracker.itemsPerSecond = completedItems / elapsed;
        
        if (tracker.itemsPerSecond > 0) {
            const remainingItems = tracker.totalItems - completedItems;
            tracker.estimatedTimeRemaining = remainingItems / tracker.itemsPerSecond;
        }
    }

    return tracker;
}

/**
 * Format ETA string
 */
export function formatETA(seconds: number): string {
    if (seconds < 60) {
        return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${minutes}m ${secs}s`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}

/**
 * Calculate progress percentage with smoothing
 */
export function calculateSmoothedProgress(
    current: number,
    total: number,
    previousProgress: number = 0,
    smoothingFactor: number = 0.3
): number {
    const actualProgress = (current / total) * 100;
    return previousProgress * (1 - smoothingFactor) + actualProgress * smoothingFactor;
}

/**
 * Estimate completion time based on current rate
 */
export function estimateCompletionTime(
    startTime: number,
    currentProgress: number,
    totalProgress: number = 100
): number {
    if (currentProgress <= 0) return 0;
    
    const elapsed = Date.now() - startTime;
    const rate = currentProgress / elapsed; // progress per millisecond
    const remaining = totalProgress - currentProgress;
    
    return remaining / rate; // milliseconds
}

