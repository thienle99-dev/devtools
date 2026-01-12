import { Shield, Eye, ShieldAlert, KeyRound, FileKey } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import * as Logic from '../../security/logic';

export const securityTools: ToolDefinition[] = [
    {
        id: 'secrets-scanner',
        name: 'Secrets Scanner',
        path: '/secrets-scanner',
        description: 'Scan text for API keys, tokens, and credentials',
        category: 'security',
        icon: ShieldAlert,
        color: 'text-rose-500',
        component: Lazy.SecretsScanner,
        keywords: ['secrets', 'pats', 'keys', 'tokens', 'scan', 'security'],
        inputTypes: ['text', 'json'],
        outputTypes: ['json'],
        process: (input) => Logic.scanSecrets(input)
    },
    {
        id: 'data-masking',
        name: 'Data Masking',
        path: '/data-masking',
        description: 'Mask sensitive information in text or JSON',
        category: 'security',
        icon: Eye,
        color: 'text-indigo-400',
        component: Lazy.DataMasking,
        keywords: ['mask', 'anonymize', 'privacy', 'redact', 'pii'],
        inputTypes: ['text', 'json'],
        outputTypes: ['text', 'json'],
        process: (input, options) => {
            if (typeof input === 'object') {
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
        category: 'security',
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
    },
    {
        id: 'password-policy',
        name: 'Password Policy',
        path: '/password-policy',
        description: 'Test password compliance and strength',
        category: 'security',
        icon: KeyRound,
        color: 'text-indigo-400',
        component: Lazy.PasswordPolicyTester,
        keywords: ['password', 'policy', 'strength', 'security', 'compliance'],
        inputTypes: ['text'],
        outputTypes: ['json']
    },
    {
        id: 'csr-generator',
        name: 'CSR Generator',
        path: '/csr-generator',
        description: 'Generate CSR and Private Keys',
        category: 'security',
        icon: FileKey,
        color: 'text-amber-400',
        component: Lazy.CsrGenerator,
        keywords: ['csr', 'key', 'pair', 'request', 'ssl', 'tls'],
        outputTypes: ['json']
    }
];
