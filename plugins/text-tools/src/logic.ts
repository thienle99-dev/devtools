export type ObfuscationMethod = 'rot13' | 'base64' | 'hex' | 'binary' | 'reverse';

export const obfuscate = (str: string, m: ObfuscationMethod): string => {
    if (!str) return '';
    switch (m) {
        case 'rot13':
            return str.replace(/[a-zA-Z]/g, (c) => {
                const base = c <= 'Z' ? 65 : 97;
                return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
            });
        case 'base64':
            try { return btoa(str); } catch { return 'Error: Non-latin characters'; }
        case 'hex':
            return str.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
        case 'binary':
            return str.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
        case 'reverse':
            return str.split('').reverse().join('');
        default:
            return str;
    }
};

export const deobfuscate = (str: string, m: ObfuscationMethod): string => {
    if (!str) return '';
    switch (m) {
        case 'rot13':
            return obfuscate(str, m); // Rot13 is its own inverse
        case 'base64':
            try { return atob(str); } catch { return 'Error: Invalid base64'; }
        case 'hex':
            try {
                return str.split(' ').map(h => String.fromCharCode(parseInt(h, 16))).join('');
            } catch { return 'Error: Invalid hex'; }
        case 'binary':
            try {
                return str.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');
            } catch { return 'Error: Invalid binary'; }
        case 'reverse':
            return str.split('').reverse().join('');
        default:
            return str;
    }
};
