import { v1 as uuidv1, v4 as uuidv4 } from 'uuid';
import { ulid } from 'ulid';
import CryptoJS from 'crypto-js';


export const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
};

export const generateTokens = (options?: { 
    length?: number, 
    uppercase?: boolean, 
    lowercase?: boolean, 
    numbers?: boolean, 
    symbols?: boolean, 
    excludeSimilar?: boolean,
    quantity?: number 
}): string => {
    const { 
        length = 16, 
        uppercase = true, 
        lowercase = true, 
        numbers = true, 
        symbols = false, 
        excludeSimilar = false,
        quantity = 1 
    } = options || {};

    let chars = '';
    if (uppercase) chars += CHAR_SETS.uppercase;
    if (lowercase) chars += CHAR_SETS.lowercase;
    if (numbers) chars += CHAR_SETS.numbers;
    if (symbols) chars += CHAR_SETS.symbols;

    if (excludeSimilar) {
        chars = chars.replace(/[ilLI|10Oo]/g, '');
    }

    if (!chars) return '';

    const tokens: string[] = [];
    const len = Math.max(1, length);

    for (let q = 0; q < quantity; q++) {
        let token = '';
        const array = new Uint32Array(len);
        crypto.getRandomValues(array);
        for (let i = 0; i < len; i++) {
            token += chars[array[i] % chars.length];
        }
        tokens.push(token);
    }

    return tokens.join('\n');
};

export const generateIds = (options?: { type?: 'v1' | 'v4' | 'ulid', count?: number, hyphens?: boolean, uppercase?: boolean }): string => {
    const { type = 'v4', count = 1, hyphens = true, uppercase = false } = options || {};
    const ids: string[] = [];

    for (let i = 0; i < count; i++) {
        let id = '';
        if (type === 'v1') id = uuidv1();
        else if (type === 'ulid') id = ulid();
        else id = uuidv4();

        if (!hyphens && type !== 'ulid') {
            id = id.replace(/-/g, '');
        }
        if (uppercase) {
            id = id.toUpperCase();
        }
        ids.push(id);
    }
    return ids.join('\n');
};



export const generateHash = (input: string, algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512' | 'ripemd160' | 'sha3' = 'sha256') => {
    if (!input) return '';
    switch (algorithm) {
        case 'md5': return CryptoJS.MD5(input).toString();
        case 'sha1': return CryptoJS.SHA1(input).toString();
        case 'sha256': return CryptoJS.SHA256(input).toString();
        case 'sha512': return CryptoJS.SHA512(input).toString();
        case 'ripemd160': return CryptoJS.RIPEMD160(input).toString();
        case 'sha3': return CryptoJS.SHA3(input).toString();
        default: return CryptoJS.SHA256(input).toString();
    }
};
export const generateHmac = (input: string, key: string, algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512' | 'sha3' | 'ripemd160' = 'sha256') => {
    if (!input || !key) return '';
    try {
        switch (algorithm) {
            case 'md5': return CryptoJS.HmacMD5(input, key).toString();
            case 'sha1': return CryptoJS.HmacSHA1(input, key).toString();
            case 'sha256': return CryptoJS.HmacSHA256(input, key).toString();
            case 'sha512': return CryptoJS.HmacSHA512(input, key).toString();
            case 'sha3': return CryptoJS.HmacSHA3(input, key).toString();
            case 'ripemd160': return CryptoJS.HmacRIPEMD160(input, key).toString();
            default: return CryptoJS.HmacSHA256(input, key).toString();
        }
    } catch (e) {
        console.error('HMAC generation error:', e);
        return '';
    }
};

export const generateBearerToken = (length: number = 32) => {
    return generateTokens({ length, numbers: true, uppercase: true, lowercase: true, symbols: false });
};

// Symmetric encryption/decryption functions
export const symmetricEncrypt = (plaintext: string, key: string, algorithm: 'AES' | 'TripleDES' | 'Rabbit' | 'RC4' = 'AES'): string => {
    if (!plaintext || !key) return '';
    try {
        switch (algorithm) {
            case 'AES':
                return CryptoJS.AES.encrypt(plaintext, key).toString();
            case 'TripleDES':
                return CryptoJS.TripleDES.encrypt(plaintext, key).toString();
            case 'Rabbit':
                return CryptoJS.Rabbit.encrypt(plaintext, key).toString();
            case 'RC4':
                return CryptoJS.RC4.encrypt(plaintext, key).toString();
            default:
                return CryptoJS.AES.encrypt(plaintext, key).toString();
        }
    } catch (error) {
        console.error('Encryption error:', error);
        return '';
    }
};

export const symmetricDecrypt = (ciphertext: string, key: string, algorithm: 'AES' | 'TripleDES' | 'Rabbit' | 'RC4' = 'AES'): string => {
    if (!ciphertext || !key) return '';
    try {
        let bytes;
        switch (algorithm) {
            case 'AES':
                bytes = CryptoJS.AES.decrypt(ciphertext, key);
                break;
            case 'TripleDES':
                bytes = CryptoJS.TripleDES.decrypt(ciphertext, key);
                break;
            case 'Rabbit':
                bytes = CryptoJS.Rabbit.decrypt(ciphertext, key);
                break;
            case 'RC4':
                bytes = CryptoJS.RC4.decrypt(ciphertext, key);
                break;
            default:
                bytes = CryptoJS.AES.decrypt(ciphertext, key);
        }
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption error:', error);
        return '';
    }
};