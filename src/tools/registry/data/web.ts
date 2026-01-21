import { Globe, ShieldCheck } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import * as Logic from '../../web/logic';

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
    }
    // Removed tools (moved to Web Advanced plugin):
    // - Cookie Parser
    // - OTP Generator  
    // - User Agent Parser
    // - Basic Auth Generator
    // - Slug Generator
    // - HTTP Status Codes
    // - MIME Types List
    // - JSON/Text Diff
    // - Keycode Info
    // - Safelink Decoder
    // - Base64 URL
    // - HTTP Header Parser
    // - Set-Cookie Generator
    // - Content-Type Parser
];
