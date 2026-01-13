/**
 * Custom Error Classes for Download Operations
 * Provides structured error information with codes, suggestions, and recovery options
 */

export enum ErrorCode {
    // Network Errors (1xxx)
    NETWORK_ERROR = 'NETWORK_ERROR',
    CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
    DNS_LOOKUP_FAILED = 'DNS_LOOKUP_FAILED',
    NO_INTERNET = 'NO_INTERNET',
    
    // Authentication Errors (2xxx)
    AUTH_REQUIRED = 'AUTH_REQUIRED',
    LOGIN_REQUIRED = 'LOGIN_REQUIRED',
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
    COOKIES_EXPIRED = 'COOKIES_EXPIRED',
    
    // Content Errors (3xxx)
    VIDEO_UNAVAILABLE = 'VIDEO_UNAVAILABLE',
    PRIVATE_VIDEO = 'PRIVATE_VIDEO',
    DELETED_VIDEO = 'DELETED_VIDEO',
    GEO_RESTRICTED = 'GEO_RESTRICTED',
    AGE_RESTRICTED = 'AGE_RESTRICTED',
    
    // Server Errors (4xxx)
    SERVER_ERROR = 'SERVER_ERROR',
    RATE_LIMITED = 'RATE_LIMITED',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    
    // System Errors (5xxx)
    DISK_FULL = 'DISK_FULL',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    INVALID_PATH = 'INVALID_PATH',
    
    // Format Errors (6xxx)
    NO_FORMATS_AVAILABLE = 'NO_FORMATS_AVAILABLE',
    UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
    EXTRACTION_FAILED = 'EXTRACTION_FAILED',
    
    // Unknown
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorSuggestion {
    title: string;
    description: string;
    action?: string;
}

export interface ErrorMetadata {
    url?: string;
    platform?: string;
    timestamp: number;
    retryCount?: number;
    originalError?: string;
}

/**
 * Base Download Error Class
 */
export class DownloadError extends Error {
    public readonly code: ErrorCode;
    public readonly recoverable: boolean;
    public readonly retryable: boolean;
    public readonly suggestions: ErrorSuggestion[];
    public readonly metadata: ErrorMetadata;

    constructor(
        message: string,
        code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
        options: {
            recoverable?: boolean;
            retryable?: boolean;
            suggestions?: ErrorSuggestion[];
            metadata?: Partial<ErrorMetadata>;
            cause?: Error;
        } = {}
    ) {
        super(message);
        this.name = 'DownloadError';
        this.code = code;
        this.recoverable = options.recoverable ?? false;
        this.retryable = options.retryable ?? true;
        this.suggestions = options.suggestions ?? [];
        this.metadata = {
            timestamp: Date.now(),
            ...options.metadata
        };

        if (options.cause) {
            this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;
        }
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            recoverable: this.recoverable,
            retryable: this.retryable,
            suggestions: this.suggestions,
            metadata: this.metadata,
            stack: this.stack
        };
    }
}

/**
 * Network Related Errors
 */
export class NetworkError extends DownloadError {
    constructor(message: string, metadata?: Partial<ErrorMetadata>) {
        super(message, ErrorCode.NETWORK_ERROR, {
            retryable: true,
            recoverable: true,
            suggestions: [
                {
                    title: 'Check Your Internet Connection',
                    description: 'Make sure you are connected to the internet',
                    action: 'retry'
                },
                {
                    title: 'Try Again Later',
                    description: 'The network might be temporarily unavailable',
                    action: 'retry-later'
                },
                {
                    title: 'Check Firewall/VPN',
                    description: 'Your firewall or VPN might be blocking the connection'
                }
            ],
            metadata
        });
    }
}

export class ConnectionTimeoutError extends DownloadError {
    constructor(message: string, metadata?: Partial<ErrorMetadata>) {
        super(message, ErrorCode.CONNECTION_TIMEOUT, {
            retryable: true,
            recoverable: true,
            suggestions: [
                {
                    title: 'Retry Download',
                    description: 'The connection timed out, try downloading again',
                    action: 'retry'
                },
                {
                    title: 'Check Network Speed',
                    description: 'Your internet connection might be slow'
                }
            ],
            metadata
        });
    }
}

/**
 * Authentication Related Errors
 */
export class AuthenticationError extends DownloadError {
    constructor(message: string, metadata?: Partial<ErrorMetadata>) {
        super(message, ErrorCode.AUTH_REQUIRED, {
            retryable: false,
            recoverable: true,
            suggestions: [
                {
                    title: 'Enable Browser Cookies',
                    description: 'Go to Settings and enable browser cookies (Chrome, Firefox, Edge)',
                    action: 'open-settings'
                },
                {
                    title: 'Login to Platform',
                    description: 'Make sure you are logged in to the platform in your browser'
                },
                {
                    title: 'Check Account Status',
                    description: 'Verify your account is active and in good standing'
                }
            ],
            metadata
        });
    }
}

export class LoginRequiredError extends DownloadError {
    constructor(message: string, platform?: string, metadata?: Partial<ErrorMetadata>) {
        super(message, ErrorCode.LOGIN_REQUIRED, {
            retryable: false,
            recoverable: true,
            suggestions: [
                {
                    title: 'Login Required',
                    description: `You need to be logged in to ${platform || 'this platform'} to download this content`,
                    action: 'open-settings'
                },
                {
                    title: 'Enable Browser Cookies',
                    description: 'In Settings, enable browser cookies to use your logged-in session',
                    action: 'open-settings'
                }
            ],
            metadata: { ...metadata, platform }
        });
    }
}

/**
 * Content Related Errors
 */
export class ContentUnavailableError extends DownloadError {
    constructor(message: string, reason: 'private' | 'deleted' | 'geo-restricted' | 'age-restricted' | 'unavailable', metadata?: Partial<ErrorMetadata>) {
        const codeMap = {
            'private': ErrorCode.PRIVATE_VIDEO,
            'deleted': ErrorCode.DELETED_VIDEO,
            'geo-restricted': ErrorCode.GEO_RESTRICTED,
            'age-restricted': ErrorCode.AGE_RESTRICTED,
            'unavailable': ErrorCode.VIDEO_UNAVAILABLE
        };

        const suggestionsMap = {
            'private': [
                {
                    title: 'Content is Private',
                    description: 'This content is private and cannot be downloaded'
                },
                {
                    title: 'Request Access',
                    description: 'You may need to request access from the content owner'
                }
            ],
            'deleted': [
                {
                    title: 'Content Removed',
                    description: 'This content has been deleted by the owner or platform'
                },
                {
                    title: 'Check URL',
                    description: 'Verify the URL is correct and the content still exists'
                }
            ],
            'geo-restricted': [
                {
                    title: 'Not Available in Your Region',
                    description: 'This content is geo-restricted and not available in your country'
                },
                {
                    title: 'Try Using VPN',
                    description: 'You might need a VPN to access this content'
                }
            ],
            'age-restricted': [
                {
                    title: 'Age Restricted Content',
                    description: 'You need to be logged in to download age-restricted content',
                    action: 'open-settings'
                }
            ],
            'unavailable': [
                {
                    title: 'Content Unavailable',
                    description: 'This content is currently unavailable'
                },
                {
                    title: 'Try Again Later',
                    description: 'The content might be temporarily unavailable',
                    action: 'retry-later'
                }
            ]
        };

        super(message, codeMap[reason], {
            retryable: reason === 'unavailable',
            recoverable: false,
            suggestions: suggestionsMap[reason],
            metadata
        });
    }
}

/**
 * Server Related Errors
 */
export class RateLimitError extends DownloadError {
    constructor(message: string, retryAfter?: number, metadata?: Partial<ErrorMetadata>) {
        super(message, ErrorCode.RATE_LIMITED, {
            retryable: true,
            recoverable: true,
            suggestions: [
                {
                    title: 'Too Many Requests',
                    description: retryAfter 
                        ? `You've made too many requests. Please wait ${Math.ceil(retryAfter / 60)} minutes before trying again.`
                        : 'You\'ve made too many requests. Please wait a few minutes before trying again.',
                    action: 'retry-later'
                },
                {
                    title: 'Reduce Concurrent Downloads',
                    description: 'Try downloading fewer files at once',
                    action: 'open-settings'
                }
            ],
            metadata: {
                ...metadata,
                retryAfter
            } as any
        });
    }
}

export class ServerError extends DownloadError {
    constructor(message: string, statusCode?: number, metadata?: Partial<ErrorMetadata>) {
        super(message, ErrorCode.SERVER_ERROR, {
            retryable: statusCode ? statusCode >= 500 : true,
            recoverable: true,
            suggestions: [
                {
                    title: 'Server Error',
                    description: 'The server encountered an error while processing your request'
                },
                {
                    title: 'Try Again Later',
                    description: 'The platform\'s servers might be experiencing issues',
                    action: 'retry-later'
                },
                {
                    title: 'Check Platform Status',
                    description: 'Visit the platform\'s status page to see if there are known issues'
                }
            ],
            metadata: {
                ...metadata,
                statusCode
            } as any
        });
    }
}

/**
 * System Related Errors
 */
export class DiskFullError extends DownloadError {
    constructor(message: string, availableSpace?: number, metadata?: Partial<ErrorMetadata>) {
        super(message, ErrorCode.DISK_FULL, {
            retryable: false,
            recoverable: true,
            suggestions: [
                {
                    title: 'Insufficient Disk Space',
                    description: availableSpace 
                        ? `You have only ${(availableSpace / (1024 * 1024 * 1024)).toFixed(2)} GB available. Free up some space and try again.`
                        : 'Your disk is full. Free up some space and try again.'
                },
                {
                    title: 'Clean Up Downloads Folder',
                    description: 'Delete old downloads to free up space'
                },
                {
                    title: 'Change Download Location',
                    description: 'Choose a different drive with more space',
                    action: 'open-settings'
                }
            ],
            metadata
        });
    }
}

/**
 * Error Parser - Converts error messages to structured errors
 */
export class ErrorParser {
    static parse(error: Error | string, metadata?: Partial<ErrorMetadata>): DownloadError {
        const message = typeof error === 'string' ? error : error.message;
        const lowerMsg = message.toLowerCase();

        // Network Errors
        if (
            lowerMsg.includes('network error') ||
            lowerMsg.includes('enotfound') ||
            lowerMsg.includes('getaddrinfo') ||
            lowerMsg.includes('unable to download') ||
            lowerMsg.includes('nodename nor servname')
        ) {
            return new NetworkError(message, metadata);
        }

        if (lowerMsg.includes('timeout') || lowerMsg.includes('timed out')) {
            return new ConnectionTimeoutError(message, metadata);
        }

        // Authentication
        if (lowerMsg.includes('login required')) {
            return new LoginRequiredError(message, metadata?.platform, metadata);
        }

        // Content Unavailable
        if (lowerMsg.includes('private video') || lowerMsg.includes('this video is private')) {
            return new ContentUnavailableError(message, 'private', metadata);
        }

        if (lowerMsg.includes('video unavailable') || lowerMsg.includes('has been removed')) {
            return new ContentUnavailableError(message, 'deleted', metadata);
        }

        if (lowerMsg.includes('geographic') || lowerMsg.includes('not available in your country')) {
            return new ContentUnavailableError(message, 'geo-restricted', metadata);
        }

        if (lowerMsg.includes('age') && lowerMsg.includes('restrict')) {
            return new ContentUnavailableError(message, 'age-restricted', metadata);
        }

        // Rate Limit
        if (lowerMsg.includes('429') || lowerMsg.includes('too many requests')) {
            const retryMatch = message.match(/retry after (\d+)/i);
            const retryAfter = retryMatch ? parseInt(retryMatch[1]) : undefined;
            return new RateLimitError(message, retryAfter, metadata);
        }

        // Server Errors
        if (lowerMsg.includes('500') || lowerMsg.includes('502') || lowerMsg.includes('503') || lowerMsg.includes('server error')) {
            const statusMatch = message.match(/(\d{3})/);
            const statusCode = statusMatch ? parseInt(statusMatch[1]) : undefined;
            return new ServerError(message, statusCode, metadata);
        }

        // Disk Space
        if (lowerMsg.includes('no space left') || lowerMsg.includes('disk full') || lowerMsg.includes('enospc')) {
            return new DiskFullError(message, undefined, metadata);
        }

        // Default
        return new DownloadError(message, ErrorCode.UNKNOWN_ERROR, {
            retryable: true,
            suggestions: [
                {
                    title: 'Unknown Error',
                    description: 'An unexpected error occurred'
                },
                {
                    title: 'Try Again',
                    description: 'Retry the download to see if the issue persists',
                    action: 'retry'
                },
                {
                    title: 'Report Issue',
                    description: 'If this error keeps occurring, please report it',
                    action: 'export-log'
                }
            ],
            metadata
        });
    }
}
