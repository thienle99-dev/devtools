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
