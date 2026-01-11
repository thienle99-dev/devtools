import CryptoJS from 'crypto-js';

export const base64Encode = (input: string) => {
    if (!input) return '';
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(input));
};

export const base64Decode = (input: string) => {
    if (!input) return '';
    const decoded = CryptoJS.enc.Base64.parse(input).toString(CryptoJS.enc.Utf8);
    if (!decoded && input.trim().length > 0) {
        throw new Error('Could not decode to UTF-8 string. Input might be invalid Base64 or binary data.');
    }
    return decoded;
};
