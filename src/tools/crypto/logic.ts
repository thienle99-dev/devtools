import CryptoJS from 'crypto-js';

export const aesEncrypt = (input: string, key: string) => {
    if (!input || !key) return '';
    return CryptoJS.AES.encrypt(input, key).toString();
};

export const aesDecrypt = (input: string, key: string) => {
    if (!input || !key) return '';
    const bytes = CryptoJS.AES.decrypt(input, key);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    if (!originalText) {
        throw new Error('Could not decrypt. Wrong key or invalid ciphertext.');
    }
    return originalText;
};

export const symmetricEncrypt = (input: string, key: string, algo: 'AES' | 'TripleDES' | 'Rabbit' | 'RC4') => {
    if (!input || !key) return '';
    switch (algo) {
        case 'TripleDES': return CryptoJS.TripleDES.encrypt(input, key).toString();
        case 'Rabbit': return CryptoJS.Rabbit.encrypt(input, key).toString();
        case 'RC4': return CryptoJS.RC4.encrypt(input, key).toString();
        case 'AES':
        default: return CryptoJS.AES.encrypt(input, key).toString();
    }
};

export const symmetricDecrypt = (input: string, key: string, algo: 'AES' | 'TripleDES' | 'Rabbit' | 'RC4') => {
    if (!input || !key) return '';
    let bytes;
    switch (algo) {
        case 'TripleDES': bytes = CryptoJS.TripleDES.decrypt(input, key); break;
        case 'Rabbit': bytes = CryptoJS.Rabbit.decrypt(input, key); break;
        case 'RC4': bytes = CryptoJS.RC4.decrypt(input, key); break;
        case 'AES':
        default: bytes = CryptoJS.AES.decrypt(input, key); break;
    }
    
    try {
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        if (!originalText) {
             // For RC4/Rabbit sometimes it doesn't throw but returns empty string if key is wrong, 
             // but usually Malformed UTF-8 data will cause issues or empty string.
             // We can just return it if it's what we got, but usually we want to warn.
             // However, strictly checking !originalText is fine for now.
             throw new Error('Could not decrypt.');
        }
        return originalText;
    } catch (e) {
        throw new Error('Could not decrypt. Wrong key or invalid ciphertext.');
    }
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
