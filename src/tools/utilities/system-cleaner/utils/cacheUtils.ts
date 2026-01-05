// Caching Utilities with TTL and size limits

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
}

export interface CacheOptions {
    ttl?: number; // Default TTL in milliseconds
    maxSize?: number; // Maximum number of entries
    maxSizeBytes?: number; // Maximum size in bytes
}

export class Cache<T> {
    private cache: Map<string, CacheEntry<T>> = new Map();
    private options: Required<CacheOptions>;
    private currentSizeBytes = 0;

    constructor(options: CacheOptions = {}) {
        this.options = {
            ttl: options.ttl ?? 5 * 60 * 1000, // 5 minutes default
            maxSize: options.maxSize ?? 100,
            maxSizeBytes: options.maxSizeBytes ?? 50 * 1024 * 1024 // 50MB default
        };
    }

    /**
     * Get value from cache
     */
    get(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Check if expired
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    /**
     * Set value in cache
     */
    set(key: string, value: T, ttl?: number): boolean {
        const entryTTL = ttl ?? this.options.ttl;
        const entry: CacheEntry<T> = {
            data: value,
            timestamp: Date.now(),
            ttl: entryTTL
        };

        // Estimate size (rough approximation)
        const estimatedSize = this.estimateSize(value);

        // Check size limits
        if (this.cache.size >= this.options.maxSize) {
            // Remove oldest entry
            const oldestKey = this.getOldestKey();
            if (oldestKey) {
                this.delete(oldestKey);
            }
        }

        if (this.currentSizeBytes + estimatedSize > this.options.maxSizeBytes) {
            // Remove entries until we have space
            while (this.currentSizeBytes + estimatedSize > this.options.maxSizeBytes && this.cache.size > 0) {
                const oldestKey = this.getOldestKey();
                if (oldestKey) {
                    this.delete(oldestKey);
                } else {
                    break;
                }
            }
        }

        // If still too large, don't cache
        if (this.currentSizeBytes + estimatedSize > this.options.maxSizeBytes) {
            return false;
        }

        this.cache.set(key, entry);
        this.currentSizeBytes += estimatedSize;
        return true;
    }

    /**
     * Delete entry from cache
     */
    delete(key: string): boolean {
        const entry = this.cache.get(key);
        if (entry) {
            const estimatedSize = this.estimateSize(entry.data);
            this.currentSizeBytes -= estimatedSize;
            this.cache.delete(key);
            return true;
        }
        return false;
    }

    /**
     * Clear all cache entries
     */
    clear(): void {
        this.cache.clear();
        this.currentSizeBytes = 0;
    }

    /**
     * Clear expired entries
     */
    clearExpired(): number {
        const now = Date.now();
        let cleared = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.delete(key);
                cleared++;
            }
        }

        return cleared;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.options.maxSize,
            sizeBytes: this.currentSizeBytes,
            maxSizeBytes: this.options.maxSizeBytes,
            hitRate: 0 // Would need to track hits/misses for this
        };
    }

    /**
     * Get oldest cache key
     */
    private getOldestKey(): string | null {
        let oldestKey: string | null = null;
        let oldestTimestamp = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestKey = key;
            }
        }

        return oldestKey;
    }

    /**
     * Estimate size of value in bytes (rough approximation)
     */
    private estimateSize(value: T): number {
        try {
            const json = JSON.stringify(value);
            return new Blob([json]).size;
        } catch {
            // Fallback: rough estimate
            return 1024; // 1KB default
        }
    }
}

// Global cache instances
export const scanResultCache = new Cache<any>({
    ttl: 10 * 60 * 1000, // 10 minutes
    maxSize: 50,
    maxSizeBytes: 100 * 1024 * 1024 // 100MB
});

export const fileListCache = new Cache<any[]>({
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
    maxSizeBytes: 50 * 1024 * 1024 // 50MB
});

/**
 * Cache decorator for async functions
 */
export function cached<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttl?: number
): T {
    const cache = new Cache<any>({ ttl });
    
    return (async (...args: Parameters<T>) => {
        const key = keyGenerator 
            ? keyGenerator(...args)
            : JSON.stringify(args);
        
        const cached = cache.get(key);
        if (cached !== null) {
            return cached;
        }

        const result = await fn(...args);
        cache.set(key, result, ttl);
        return result;
    }) as T;
}

