import { Hash, Binary, Link } from 'lucide-react';
import * as Lazy from '@tools/registry/lazy-tools';
import type { ToolDefinition } from '@tools/registry/types';

export const structuredConverters: ToolDefinition[] = [
    {
        id: 'unicode',
        name: 'Unicode Converter',
        path: '/unicode',
        description: 'Convert between text and Unicode codes/escape sequences',
        category: 'converters',
        icon: Hash,
        color: 'text-purple-400',
        component: Lazy.UnicodeConverter,
        keywords: ['unicode', 'escape', 'code', 'u+', 'convert']
    },
    {
        id: 'binary-hex-text',
        name: 'Binary/Hex to Text Converter',
        path: '/binary-hex-text',
        description: 'Convert between binary/hex strings and ASCII text',
        category: 'converters',
        icon: Binary,
        color: 'text-green-400',
        component: Lazy.BinaryHexTextConverter,
        keywords: ['binary', 'hex', 'text', 'ascii', 'convert']
    },
    {
        id: 'query-string',
        name: 'Query String Converter',
        path: '/query-string',
        description: 'Convert between query strings, form data, and JSON',
        category: 'converters',
        icon: Link,
        color: 'text-blue-400',
        component: Lazy.QueryStringConverter,
        keywords: ['query', 'string', 'url', 'form', 'data', 'json', 'parse', 'convert']
    }
    // Removed tools (moved to Advanced Converters plugin):
    // - Character Encoding Converter
    // - MIME Type Converter
    // - CSV-Excel Converter (already in data-converters plugin)
];
