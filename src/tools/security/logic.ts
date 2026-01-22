import * as forge from 'node-forge';

export const maskText = (text: string, options: {
    maskChar?: string,
    visibleStart?: number,
    visibleEnd?: number,
    maskLength?: number
} = {}) => {
    const { maskChar = '*', visibleStart = 0, visibleEnd = 0, maskLength } = options;

    if (text.length <= visibleStart + visibleEnd) return text;

    const start = text.substring(0, visibleStart);
    const end = text.substring(text.length - visibleEnd);
    const middle = maskLength !== undefined
        ? maskChar.repeat(maskLength)
        : maskChar.repeat(text.length - visibleStart - visibleEnd);

    return start + middle + end;
};

export const maskJson = (json: any, fields: string[]): any => {
    if (typeof json !== 'object' || json === null) return json;

    if (Array.isArray(json)) {
        return json.map(item => maskJson(item, fields));
    }

    const result = { ...json };
    for (const key in result) {
        if (fields.includes(key)) {
            if (typeof result[key] === 'string') {
                result[key] = maskText(result[key], { visibleStart: 2, visibleEnd: 2 });
            } else {
                result[key] = '********';
            }
        } else if (typeof result[key] === 'object' && result[key] !== null) {
            result[key] = maskJson(result[key], fields);
        }
    }
    return result;
};

export const scanSecrets = (text: string) => {
    const rules = [
        { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g },
        { name: 'AWS Secret Key', regex: /[0-9a-zA-Z/+]{40}/g },
        { name: 'GitHub Token', regex: /gh[p|o|u|s|r]_[a-zA-Z0-9]{36,255}/g },
        { name: 'Generic API Key', regex: /api[_-]?key[:\s=]+[a-zA-Z0-9_-]{16,64}/gi },
        { name: 'Email Address', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
        { name: 'Private Key', regex: /-----BEGIN [A-Z ]+ PRIVATE KEY-----/g },
        { name: 'Password in JSON', regex: /"pass(word)?"\s*:\s*"([^"]+)"/gi }
    ];

    const matches: { name: string, found: string, line: number }[] = [];
    const lines = text.split('\n');

    lines.forEach((line, index) => {
        rules.forEach(rule => {
            const ruleMatches = line.match(rule.regex);
            if (ruleMatches) {
                ruleMatches.forEach(match => {
                    matches.push({
                        name: rule.name,
                        found: match,
                        line: index + 1
                    });
                });
            }
        });
    });

    return matches;
};

export const parseCertificate = (pem: string) => {
    // Basic structural parsing without heavy asn1.js
    const result: Record<string, string | boolean> = {
        type: 'Unknown',
        isLoaded: false
    };

    if (pem.includes('BEGIN CERTIFICATE')) {
        result.type = 'X.509 Certificate';
        result.isLoaded = true;
        // Mocking some fields for the UI until heavy libs are added
        const thumbprint = btoa(pem.substring(0, 100)).substring(0, 16).toUpperCase();
        result.subject = 'CN=Example, O=DevTools-App';
        result.issuer = 'CN=Antigravity CA';
        result.expiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        result.thumbprint = thumbprint;
    } else if (pem.includes('BEGIN RSA PRIVATE KEY') || pem.includes('BEGIN PRIVATE KEY')) {
        result.type = 'Private Key';
        result.isLoaded = true;
    }

    return result;
};

export const convertCertificate = (input: string, toFormat: 'PEM' | 'DER' | 'BASE64') => {
    if (toFormat === 'BASE64') return btoa(input);
    if (toFormat === 'PEM') {
        if (input.includes('BEGIN')) return input;
        return `-----BEGIN CERTIFICATE-----\n${input}\n-----END CERTIFICATE-----`;
    }
    // DER would usually be binary, but we return a hex/base64 representation for tools
    return btoa(input);
};

export const generateCsr = (options: {
    commonName: string,
    organization?: string,
    country?: string,
    state?: string,
    locality?: string,
    keySize?: number
}) => {
    const keys = forge.pki.rsa.generateKeyPair(options.keySize || 2048);
    const csr = forge.pki.createCertificationRequest();
    // RSA keys are compatible with generic PublicKey/PrivateKey at runtime
    // TypeScript's type system is strict here, so we use type assertion
    csr.publicKey = keys.publicKey as any;

    const attrs = [
        { name: 'commonName', value: options.commonName },
    ];

    if (options.country) attrs.push({ name: 'countryName', value: options.country });
    if (options.state) attrs.push({ name: 'st', value: options.state });
    if (options.locality) attrs.push({ name: 'localityName', value: options.locality });
    if (options.organization) attrs.push({ name: 'organizationName', value: options.organization });

    csr.setSubject(attrs);

    // sign certification request
    // RSA keys are compatible with generic PublicKey/PrivateKey at runtime
    csr.sign(keys.privateKey as any);

    return {
        csr: forge.pki.certificationRequestToPem(csr),
        privateKey: forge.pki.privateKeyToPem(keys.privateKey),
        publicKey: forge.pki.publicKeyToPem(keys.publicKey)
    };
};
