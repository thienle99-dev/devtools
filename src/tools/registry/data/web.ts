import { Link, Globe, ShieldCheck, Smartphone, Lock, Server, FileCode, ArrowRightLeft, Tag, Activity, Hash, Keyboard, Bot, KeyRound, Edit3, Map, Zap, Cookie } from 'lucide-react';
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
        id: 'html-wysiwyg',
        name: 'HTML Editor',
        path: '/html-wysiwyg',
        description: 'Visual HTML editor',
        category: 'web',
        icon: Edit3,
        color: 'text-cyan-500',
        component: Lazy.HtmlWysiwyg,
        keywords: ['html', 'editor', 'wysiwyg', 'visual']
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
        keywords: ['auth', 'basic', 'header', 'http']
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
        keywords: ['slug', 'url', 'seo', 'string'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input) => input.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
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
        id: 'meta-tags',
        name: 'Meta Tags',
        path: '/meta-tags',
        description: 'Generate standard SEO meta tags',
        category: 'web',
        icon: Tag,
        color: 'text-orange-400',
        component: Lazy.MetaTagsGenerator,
        keywords: ['meta', 'seo', 'tags', 'html'],
        inputTypes: ['json'],
        outputTypes: ['text'],
        process: (_, options) => Logic.generateMetaTags(options)
    },
    {
        id: 'open-graph',
        name: 'Open Graph',
        path: '/open-graph',
        description: 'Generate Open Graph meta tags',
        category: 'web',
        icon: Activity,
        color: 'text-blue-500',
        component: Lazy.OpenGraphGenerator,
        keywords: ['og', 'facebook', 'twitter', 'social'],
        inputTypes: ['json'],
        outputTypes: ['text'],
        process: (_, options) => Logic.generateOpenGraph(options)
    },
    {
        id: 'utm-builder',
        name: 'UTM Builder',
        path: '/utm-builder',
        description: 'Build UTM tracking URLs',
        category: 'web',
        icon: Hash,
        color: 'text-pink-500',
        component: Lazy.UtmBuilder,
        keywords: ['utm', 'analytics', 'tracking', 'url']
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
        id: 'robots-txt',
        name: 'Robots.txt',
        path: '/robots-txt',
        description: 'Generate robots.txt file',
        category: 'web',
        icon: Bot,
        color: 'text-green-500',
        component: Lazy.RobotsTxtGenerator,
        keywords: ['robots', 'seo', 'crawler', 'bot'],
        inputTypes: ['json'],
        outputTypes: ['text'],
        process: (_, options) => Logic.generateRobotsTxt(options)
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
        id: 'csp-generator',
        name: 'CSP Generator',
        path: '/csp-generator',
        description: 'Generate Content Security Policy headers',
        category: 'web',
        icon: ShieldCheck,
        color: 'text-purple-500',
        component: Lazy.CspGenerator,
        keywords: ['csp', 'security', 'header', 'policy', 'content']
    },
    {
        id: 'structured-data',
        name: 'Structured Data',
        path: '/structured-data',
        description: 'Generate JSON-LD structured data',
        category: 'web',
        icon: FileCode,
        color: 'text-yellow-500',
        component: Lazy.StructuredDataGenerator,
        keywords: ['seo', 'json-ld', 'schema', 'google', 'rich'],
        inputTypes: ['json'],
        outputTypes: ['json'],
        process: (_, options) => Logic.generateJsonLd(options)
    },
    {
        id: 'manifest-generator',
        name: 'Manifest Generator',
        path: '/manifest-generator',
        description: 'Generate Web App Manifest.json (PWA)',
        category: 'web',
        icon: Smartphone,
        color: 'text-cyan-500',
        component: Lazy.ManifestGenerator,
        keywords: ['pwa', 'manifest', 'json', 'web', 'app']
    },
    {
        id: 'sitemap-generator',
        name: 'Sitemap Generator',
        path: '/sitemap-generator',
        description: 'Generate XML sitemaps for SEO',
        category: 'web',
        icon: Map,
        color: 'text-indigo-400',
        component: Lazy.SitemapGenerator,
        keywords: ['sitemap', 'xml', 'seo', 'google', 'crawl'],
        inputTypes: ['json'],
        outputTypes: ['text'],
        process: (_, options) => Logic.generateSitemap(options)
    },
    {
        id: 'service-worker-generator',
        name: 'Service Worker',
        path: '/service-worker-generator',
        description: 'Generate PWA Service Worker (Workbox)',
        category: 'web',
        icon: Zap,
        color: 'text-amber-400',
        component: Lazy.ServiceWorkerGenerator,
        keywords: ['service', 'worker', 'pwa', 'offline', 'cache', 'workbox']
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
        id: 'canonical-url',
        name: 'Canonical URL',
        path: '/canonical-url',
        description: 'Generate canonical link tags',
        category: 'web',
        icon: Link,
        color: 'text-green-500',
        component: Lazy.CanonicalUrlGenerator,
        keywords: ['canonical', 'url', 'seo', 'link']
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

