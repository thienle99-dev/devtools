import { describe, it, expect } from 'vitest';
import { generateHash, generateHmac, generateTokens, generateIds, symmetricEncrypt, symmetricDecrypt } from './logic';

// Mock crypto for window.crypto.getRandomValues if not available
if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    Object.defineProperty(global, 'crypto', {
        value: {
            getRandomValues: (buffer: any) => {
                return require('crypto').randomFillSync(buffer);
            }
        }
    });
}

describe('Crypto Logic', () => {
    describe('generateHash', () => {
        it('should generate MD5 hash', () => {
            const hash = generateHash('hello', 'md5');
            expect(hash).toBe('5d41402abc4b2a76b9719d911017c592');
        });

        it('should generate SHA256 hash', () => {
            const hash = generateHash('hello', 'sha256');
            expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
        });

        it('should return empty string for empty input', () => {
            expect(generateHash('')).toBe('');
        });
    });

    describe('generateHmac', () => {
        it('should generate HMAC SHA256', () => {
            const hmac = generateHmac('hello', 'secret', 'sha256');
            expect(hmac).toBe('88aab3ede8d3adf94d26ab90d3bafd4a2083070c3bcce9c014ee04a443847c0b');
        });

        it('should return empty string for empty input or key', () => {
            expect(generateHmac('', 'secret')).toBe('');
            expect(generateHmac('hello', '')).toBe('');
        });
    });

    describe('generateTokens', () => {
        it('should generate token of specified length', () => {
            const token = generateTokens({ length: 10 });
            expect(token.length).toBe(10);
        });

        it('should generate multiple tokens', () => {
            const tokens = generateTokens({ length: 10, quantity: 3 });
            expect(tokens.split('\n')).toHaveLength(3);
        });

        it('should respect character sets', () => {
            // Only numbers
            const token = generateTokens({ 
                length: 100, 
                uppercase: false, 
                lowercase: false, 
                numbers: true, 
                symbols: false 
            });
            expect(token).toMatch(/^[0-9]+$/);
        });
    });

    describe('generateIds', () => {
        it('should generate UUID v4', () => {
            const id = generateIds({ type: 'v4' });
            expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        });

        it('should generate ULID', () => {
            const id = generateIds({ type: 'ulid' });
            expect(id).toHaveLength(26);
        });
    });

    describe('Symmetric Encryption', () => {
        it('should encrypt and decrypt using AES', () => {
            const text = 'secret message';
            const key = 'password123';
            const encrypted = symmetricEncrypt(text, key, 'AES');
            const decrypted = symmetricDecrypt(encrypted, key, 'AES');
            expect(decrypted).toBe(text);
        });

        it('should encrypt and decrypt using Rabbit', () => {
            const text = 'rabbit run';
            const key = 'carrot';
            const encrypted = symmetricEncrypt(text, key, 'Rabbit');
            const decrypted = symmetricDecrypt(encrypted, key, 'Rabbit');
            expect(decrypted).toBe(text);
        });
    });
});
