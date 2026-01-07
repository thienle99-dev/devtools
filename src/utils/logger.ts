export const logger = {
    debug: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.debug('%c[Debug]', 'color: #3b82f6; font-weight: bold;', ...args);
        }
    },
    info: (...args: any[]) => {
        if (import.meta.env.DEV) {
            console.info('%c[Info]', 'color: #10b981; font-weight: bold;', ...args);
        }
    },
    warn: (...args: any[]) => {
        console.warn('%c[Warn]', 'color: #f59e0b; font-weight: bold;', ...args);
    },
    error: (...args: any[]) => {
        console.error('%c[Error]', 'color: #ef4444; font-weight: bold;', ...args);
    },
    group: (label: string) => {
        if (import.meta.env.DEV) {
            console.group(label);
        }
    },
    groupEnd: () => {
        if (import.meta.env.DEV) {
            console.groupEnd();
        }
    }
};
