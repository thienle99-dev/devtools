import { Fingerprint, ScanLine, Key } from 'lucide-react';
import * as Lazy from '@tools/registry/lazy-tools';
import type { ToolDefinition } from '@tools/registry/types';
import * as Logic from '@plugins/crypto-advanced/src/logic';

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
    }
    // Removed tools (moved to Crypto Advanced plugin):
    // - HMAC Generator
    // - Bearer Token Generator
];
