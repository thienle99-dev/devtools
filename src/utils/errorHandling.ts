import { toast } from 'sonner';

/**
 * Centralized error logging helper.
 * For now it logs to console + shows a toast.
 * Later we can extend this to send to main process or external logging.
 */
export function logError(error: unknown, context?: string) {
  const err =
    error instanceof Error
      ? error
      : new Error(typeof error === 'string' ? error : 'Unknown error');

  // Console logging for developers
  // eslint-disable-next-line no-console
  console.error('[DevTools Error]', context, err);

  // User-facing toast (generic but friendly)
  const message =
    err.message && err.message !== 'Unknown error'
      ? err.message
      : 'An unexpected error occurred.';

  toast.error(context ? `${context}: ${message}` : message, {
    duration: 6000,
  });
}

/**
 * Helper to safely run async actions with standardized error handling.
 */
export async function runWithErrorHandling<T>(
  action: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await action();
  } catch (error) {
    logError(error, context);
    return null;
  }
}


