// Error Recovery Utilities

export interface RetryOptions {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, error: Error) => void;
    shouldRetry?: (error: Error) => boolean;
}

export interface PartialSuccessResult<T> {
    success: boolean;
    data?: T;
    errors?: Array<{ item: string; error: string }>;
    partialData?: T;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        onRetry,
        shouldRetry = () => true
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            
            if (attempt === maxRetries || !shouldRetry(lastError)) {
                throw lastError;
            }

            if (onRetry) {
                onRetry(attempt + 1, lastError);
            }

            // Exponential backoff
            const delay = retryDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError || new Error('Retry failed');
}

/**
 * Process items in batches with error recovery
 */
export async function processBatchWithRecovery<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: {
        batchSize?: number;
        continueOnError?: boolean;
        onItemError?: (item: T, error: Error) => void;
    } = {}
): Promise<PartialSuccessResult<R[]>> {
    const {
        batchSize = 10,
        continueOnError = true,
        onItemError
    } = options;

    const results: R[] = [];
    const errors: Array<{ item: string; error: string }> = [];

    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        await Promise.all(
            batch.map(async (item) => {
                try {
                    const result = await processor(item);
                    results.push(result);
                } catch (error) {
                    const errorMessage = (error as Error).message || 'Unknown error';
                    errors.push({
                        item: String(item),
                        error: errorMessage
                    });

                    if (onItemError) {
                        onItemError(item, error as Error);
                    }

                    if (!continueOnError) {
                        throw error;
                    }
                }
            })
        );
    }

    return {
        success: errors.length === 0,
        data: results.length > 0 ? results : undefined,
        errors: errors.length > 0 ? errors : undefined,
        partialData: results.length > 0 && errors.length > 0 ? results : undefined
    };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
    const retryableMessages = [
        'network',
        'timeout',
        'temporary',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND'
    ];

    const message = error.message.toLowerCase();
    return retryableMessages.some(keyword => message.includes(keyword));
}

/**
 * Create a retry wrapper for async functions
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: RetryOptions = {}
): T {
    return (async (...args: Parameters<T>) => {
        return retryWithBackoff(() => fn(...args), options);
    }) as T;
}

