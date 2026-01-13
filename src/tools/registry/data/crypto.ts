import { Fingerprint, ShieldCheck, ScanLine, Key, KeyRound } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import * as Logic from '../../crypto/logic';

export const cryptoTools: ToolDefinition[] = [
    {
        id: 'hash',
        name: 'Hash Generator',
        path: '/hash',
        description: 'Generate MD5, SHA1, SHA256 hashes',
        category: 'crypto',
        icon: Fingerprint,
        color: 'text-violet-500',
        component: Lazy.HashGenerator,
        keywords: ['hash', 'md5', 'sha', 'crypto'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input, options) => Logic.generateHash(input, options?.algorithm)
    },
    {
        id: 'hmac',
        name: 'HMAC Generator',
        path: '/hmac',
        description: 'Keyed-hash message authentication code',
        category: 'crypto',
        icon: ShieldCheck,
        color: 'text-fuchsia-400',
        component: Lazy.HmacGenerator,
        keywords: ['hmac', 'key', 'hash', 'security'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input, options) => Logic.generateHmac(input, options?.key || '', options?.algorithm || 'sha256')
    },

    {
        id: 'uuid',
        name: 'UUID / ULID',
        path: '/uuid',
        description: 'Generate unique identifiers',
        category: 'crypto',
        icon: ScanLine,
        color: 'text-blue-400',
        component: Lazy.UuidGenerator,
        keywords: ['uuid', 'ulid', 'guid', 'id'],
        shortcut: 'Ctrl+Shift+U',
        outputTypes: ['text'],
        process: (_, options) => Logic.generateIds(options)
    },
    {
        id: 'token-generator',
        name: 'Token Generator',
        path: '/token-generator',
        description: 'Secure passwords and tokens',
        category: 'crypto',
        icon: Key,
        color: 'text-indigo-400',
        component: Lazy.TokenGenerator,
        keywords: ['token', 'password', 'random', 'secure', 'bearer', 'api', 'key'],
        outputTypes: ['text'],
        process: (_, options) => Logic.generateTokens(options)
    },
    {
        id: 'bearer-token',
        name: 'Bearer Token',
        path: '/bearer-token',
        description: 'Generate secure API secret tokens',
        category: 'crypto',
        icon: KeyRound,
        color: 'text-indigo-400',
        component: Lazy.BearerTokenGenerator,
        keywords: ['token', 'bearer', 'api', 'key', 'secret'],
        outputTypes: ['text'],
        process: (options) => Logic.generateBearerToken(options?.length || 32)
    },

];
