import { Fingerprint, ShieldCheck, Shield, ScanLine, Key, Lock } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import { generateHash } from '../../crypto/logic';
import { process as aesProcess } from '../../crypto/AesEncryptor';

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
        process: (input, options) => generateHash(input, options?.algorithm)
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
        keywords: ['hmac', 'key', 'hash', 'security']
    },
    {
        id: 'bcrypt',
        name: 'Bcrypt Hash',
        path: '/bcrypt',
        description: 'Generate and compare Bcrypt hashes',
        category: 'crypto',
        icon: Shield,
        color: 'text-pink-500',
        component: Lazy.BcryptGenerator,
        keywords: ['bcrypt', 'password', 'hash', 'salt']
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
        shortcut: 'Ctrl+Shift+U'
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
        keywords: ['token', 'password', 'random', 'secure']
    },
    {
        id: 'aes',
        name: 'AES Encryptor',
        path: '/aes',
        description: 'Encrypt/Decrypt text with AES',
        category: 'crypto',
        icon: Lock,
        color: 'text-emerald-500',
        component: Lazy.AesEncryptor,
        keywords: ['aes', 'encrypt', 'decrypt', 'cipher'],
        inputTypes: ['text', 'json'],
        outputTypes: ['text'],
        process: (input, options) => aesProcess(input, options)
    },
];
