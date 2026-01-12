import { Link, Globe, ShieldCheck, Smartphone, Lock, Server, FileCode, ArrowRightLeft } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';

export const webTools: ToolDefinition[] = [

    {
        id: 'url-parser',
        name: 'URL Parser',
        path: '/url-parser',
        description: 'Parse URL parameters and components',
        category: 'web',
        icon: Globe,
        color: 'text-blue-400',
        component: Lazy.UrlParser,
        keywords: ['url', 'parser', 'params', 'query']
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
        keywords: ['jwt', 'token', 'decode', 'jose']
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
        keywords: ['user', 'agent', 'browser', 'os', 'device']
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
        keywords: ['slug', 'url', 'seo', 'string']
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
        keywords: ['diff', 'compare', 'json', 'text']
    },
];
