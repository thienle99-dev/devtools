/**
 * Common Format Types
 */

export type SizeUnit = 'Bytes' | 'KB' | 'MB' | 'GB' | 'TB';

export interface FormattedValue {
    value: number;
    unit: string;
    full: string;
}

export type DateFormatOptions = {
    showTime?: boolean;
    showSeconds?: boolean;
    use24Hour?: boolean;
};

export type DurationFormatOptions = {
    showMs?: boolean;
    padHours?: boolean;
};
