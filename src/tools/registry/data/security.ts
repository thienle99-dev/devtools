import { ShieldAlert, EyeOff, Shield } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import * as Logic from '../../security/logic';

export const securityTools: ToolDefinition[] = [
    {
        id: 'secrets-scanner',
        name: 'Secrets Scanner',
        path: '/secrets-scanner',
        description: 'Scan text for API keys, passwords, and PII',
        category: 'crypto',
        icon: ShieldAlert,
        color: 'text-rose-500',
        component: Lazy.SecretsScanner,
        keywords: ['security', 'audit', 'scan', 'secrets', 'api', 'key', 'pii'],
        inputTypes: ['text', 'json'],
        outputTypes: ['json'],
        process: (input) => {
            const results = Logic.scanSecrets(input);
            return results;
        }
    },
    {
        id: 'data-masking',
        name: 'Data Masking',
        path: '/data-masking',
        description: 'Mask sensitive information in text or JSON',
        category: 'crypto',
        icon: EyeOff,
        color: 'text-orange-400',
        component: Lazy.DataMasking,
        keywords: ['mask', 'pii', 'privacy', 'redact', 'security'],
        inputTypes: ['text', 'json'],
        outputTypes: ['text', 'json'],
        process: (input, options) => {
            if (typeof input === 'object' && input !== null) {
                return Logic.maskJson(input, options?.fields || []);
            }
            return Logic.maskText(input, options);
        }
    },
    {
        id: 'cert-tools',
        name: 'Certificate Tools',
        path: '/cert-tools',
        description: 'Parse certificates and convert between PEM/DER',
        category: 'crypto',
        icon: Shield,
        color: 'text-sky-400',
        component: Lazy.CertificateTools,
        keywords: ['cert', 'certificate', 'x509', 'pem', 'der', 'ssl', 'tls'],
        inputTypes: ['text', 'file'],
        outputTypes: ['json', 'text'],
        process: (input, options) => {
            if (options?.mode === 'convert') {
                return Logic.convertCertificate(input, options.format || 'PEM');
            }
            return Logic.parseCertificate(input);
        }
    }
];
