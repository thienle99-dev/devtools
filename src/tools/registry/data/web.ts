import { Link, Globe, ShieldCheck, Smartphone, Lock, Server, FileCode, ArrowRightLeft, Keyboard, KeyRound, Cookie } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import * as Logic from '../../web/logic';

export const webTools: ToolDefinition[] = [
    {
        id: 'cookie-parser',
        name: 'Cookie Parser',
        path: '/cookie-parser',
        description: 'Parse and inspect HTTP cookies',
        category: 'web',
        icon: Cookie,
        color: 'text-amber-600',
        component: Lazy.CookieParser,
        keywords: ['cookie', 'parser', 'http', 'header', 'session'],
        inputTypes: ['text'],
        outputTypes: ['json'],
        process: (input) => Logic.parseCookies(input)
    },
    {
        id: 'otp',
        name: 'OTP Generator',
        path: '/otp',
        description: 'Generate TOTP codes (2FA)',
        category: 'web',
        icon: KeyRound,
        color: 'text-indigo-500',
        component: Lazy.OtpGenerator,
        keywords: ['otp', 'totp', '2fa', 'authenticator']
    },

    {
        id: 'url-parser',
        name: 'URL Parser',
        path: '/url-parser',
        description: 'Parse URL parameters and components',
        category: 'web',
        icon: Globe,
        color: 'text-blue-400',
        component: Lazy.UrlParser,
        keywords: ['url', 'parser', 'params', 'query'],
        inputTypes: ['text'],
        outputTypes: ['json'],
        process: (input) => Logic.parseUrl(input)
    },
    {
        id: 'jwt',
        name: 'JWT Parser',
        path: '/jwt',
        description: 'Parse and inspect JSON Web Tokens',
        category: 'web',
        icon: ShieldCheck,
        color: 'text-violet-500',
        component: Lazy.JwtParser,
        keywords: ['jwt', 'token', 'decode', 'jose'],
        inputTypes: ['text'],
        outputTypes: ['json'],
        process: (input) => Logic.parseJwt(input)
    },
    {
        id: 'user-agent',
        name: 'UA Parser',
        path: '/user-agent',
        description: 'Parse User-Agent strings',
        category: 'web',
        icon: Smartphone,
        color: 'text-emerald-500',
        component: Lazy.UserAgentParser,
        keywords: ['user', 'agent', 'browser', 'os', 'device'],
        inputTypes: ['text'],
        outputTypes: ['json'],
        process: (input) => Logic.parseUserAgent(input)
    },
    {
        id: 'basic-auth',
        name: 'Basic Auth',
        path: '/basic-auth',
        description: 'Generate HTTP Basic Auth header',
        category: 'web',
        icon: Lock,
        color: 'text-rose-400',
        component: Lazy.BasicAuthGenerator,
        keywords: ['auth', 'basic', 'header', 'http'],
        outputTypes: ['text'],
        process: (_, options) => Logic.generateBasicAuth(options?.username || '', options?.password || '')
    },
    {
        id: 'slug',
        name: 'Slug Generator',
        path: '/slug',
        description: 'Generate URL-friendly slugs',
        category: 'web',
        icon: Link,
        color: 'text-teal-400',
        component: Lazy.SlugGenerator,
        keywords: ['slug', 'url', 'seo', 'format'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input, options) => Logic.generateSlug(input, options)
    },
    {
        id: 'http-status',
        name: 'HTTP Codes',
        path: '/http-status',
        description: 'List of HTTP status codes',
        category: 'web',
        icon: Server,
        color: 'text-indigo-400',
        component: Lazy.HttpStatusCode,
        keywords: ['http', 'status', 'code', 'error']
    },
    {
        id: 'mime-types',
        name: 'MIME Types',
        path: '/mime-types',
        description: 'Lookup common MIME types and extensions',
        category: 'web',
        icon: FileCode,
        color: 'text-indigo-400',
        component: Lazy.MimeTypesList,
        keywords: ['mime', 'media', 'type', 'extension', 'lookup', 'header']
    },
    {
        id: 'json-diff',
        name: 'JSON/Text Diff',
        path: '/json-diff',
        description: 'Compare text or JSON',
        category: 'web',
        icon: ArrowRightLeft,
        color: 'text-amber-500',
        component: Lazy.JsonDiff,
        keywords: ['diff', 'compare', 'json', 'text'],
        inputTypes: ['json', 'text'],
        outputTypes: ['json']
    },

    {
        id: 'keycode',
        name: 'Keycode Info',
        path: '/keycode',
        description: 'Javascript keyboard event info',
        category: 'web',
        icon: Keyboard,
        color: 'text-gray-200',
        component: Lazy.KeycodeInfo,
        keywords: ['key', 'code', 'keyboard', 'event']
    },

    {
        id: 'safelink',
        name: 'Safelink Decoder',
        path: '/safelink',
        description: 'Decode Outlook Safe Links',
        category: 'web',
        icon: ShieldCheck,
        color: 'text-blue-400',
        component: Lazy.SafelinkDecoder,
        keywords: ['outlook', 'safelink', 'microsoft', 'decode', 'url'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input) => {
            try {
                const url = new URL(input);
                if (url.hostname.includes('safelinks.protection.outlook.com')) {
                    return url.searchParams.get('url') || input;
                }
            } catch {}
            return input;
        }
    },
    {
        id: 'base64-url',
        name: 'Base64 URL',
        path: '/base64-url',
        description: 'Base64 URL-safe encode/decode',
        category: 'web',
        icon: ArrowRightLeft,
        color: 'text-yellow-500',
        component: Lazy.Base64UrlConverter,
        keywords: ['base64', 'url', 'encode', 'decode', 'rfc4648'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input, options) => {
            if (options?.mode === 'decode') return Logic.base64UrlDecode(input);
            return Logic.base64UrlEncode(input);
        }
    },
    {
        id: 'http-headers',
        name: 'Header Parser',
        path: '/http-headers',
        description: 'Parse HTTP headers key-value pairs',
        category: 'web',
        icon: Server,
        color: 'text-indigo-500',
        component: Lazy.HttpHeaderParser,
        keywords: ['http', 'header', 'parser', 'request', 'response'],
        inputTypes: ['text'],
        outputTypes: ['json'],
        process: (input) => Logic.parseHttpHeaders(input)
    },

    {
        id: 'set-cookie-generator',
        name: 'Set-Cookie Gen',
        path: '/set-cookie-generator',
        description: 'Generate Set-Cookie headers',
        category: 'web',
        icon: Cookie,
        color: 'text-amber-500',
        component: Lazy.SetCookieGenerator,
        keywords: ['cookie', 'set-cookie', 'header', 'http']
    },

    {
        id: 'content-type-parser',
        name: 'Content-Type Parser',
        path: '/content-type-parser',
        description: 'Parse Content-Type headers',
        category: 'web',
        icon: FileCode,
        color: 'text-blue-500',
        component: Lazy.ContentTypeParser,
        keywords: ['content-type', 'mime', 'header', 'parser']
    },
];

