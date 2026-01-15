import { describe, it, expect } from 'vitest';
import { maskText, maskJson, scanSecrets, parseCertificate, convertCertificate, generateCsr } from './logic';

describe('Security Logic', () => {
    describe('maskText', () => {
        it('should mask middle characters', () => {
            expect(maskText('password', { visibleStart: 2, visibleEnd: 2 })).toBe('pa****rd');
        });

        it('should use custom mask character', () => {
            expect(maskText('password', { visibleStart: 1, visibleEnd: 1, maskChar: '#' })).toBe('p######d');
        });

        it('should handle short text', () => {
            expect(maskText('abc', { visibleStart: 2, visibleEnd: 2 })).toBe('abc');
        });

        it('should use fixed mask length if provided', () => {
            expect(maskText('verylongstring', { visibleStart: 2, visibleEnd: 2, maskLength: 3 })).toBe('ve***ng');
        });
    });

    describe('maskJson', () => {
        it('should mask specific fields', () => {
            const data = {
                user: 'alice',
                email: 'alice@example.com',
                apiKey: 'ak-1234567890abcdef'
            };
            const masked = maskJson(data, ['email', 'apiKey']);
            expect(masked.user).toBe('alice');
            expect(masked.email).toBe('al**********om');
            expect(masked.apiKey).toBe('ak**************ef');
        });

        it('should handle nested objects', () => {
            const data = {
                id: 1,
                auth: { token: 'secret-token' }
            };
            const masked = maskJson(data, ['token']);
            expect(masked.auth.token).toBe('se**********en');
        });
    });

    describe('scanSecrets', () => {
        it('should find AWS Access Keys', () => {
            const text = 'Found key: AKIA1234567890ABCDEF';
            const results = scanSecrets(text);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('AWS Access Key');
        });

        it('should find emails', () => {
            const text = 'contact support@example.com for help';
            const results = scanSecrets(text);
            expect(results).toHaveLength(1);
            expect(results[0].name).toBe('Email Address');
        });
    });

    describe('Certificate Utils', () => {
        it('should identify PEM certificate type', () => {
            const pem = '-----BEGIN CERTIFICATE-----\nMIID...';
            const info = parseCertificate(pem);
            expect(info.type).toBe('X.509 Certificate');
            expect(info.isLoaded).toBe(true);
        });

        it('should identify private key type', () => {
            const pem = '-----BEGIN PRIVATE KEY-----\nMIIE...';
            const info = parseCertificate(pem);
            expect(info.type).toBe('Private Key');
            expect(info.isLoaded).toBe(true);
        });

        it('should convert to PEM', () => {
            const base64 = 'MIID...';
            const pem = convertCertificate(base64, 'PEM');
            expect(pem).toContain('-----BEGIN CERTIFICATE-----');
            expect(pem).toContain(base64);
        });
    });

    describe('generateCsr', () => {
        it('should generate a CSR and key pair', () => {
            // Note: forge key generation is synchronous and might be slow for large keys
            // We use a small key for tests if implementation allowed, but its hardcoded to default/options
            // Logic.ts uses options.keySize || 2048. We'll pass 1024 to speed up.
            const result = generateCsr({
                commonName: 'example.com',
                organization: 'Test Org',
                country: 'US',
                keySize: 1024
            });

            expect(result.csr).toContain('-----BEGIN CERTIFICATE REQUEST-----');
            expect(result.privateKey).toContain('-----BEGIN RSA PRIVATE KEY-----');
            expect(result.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
        });
    });
});
