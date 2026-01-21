import { FileCode, Hash, Binary, Link, FileType } from 'lucide-react';
import * as Lazy from '../../../lazy-tools';
import type { ToolDefinition } from '../../../types';

export const structuredConverters: ToolDefinition[] = [
    {
        id: 'character-encoding',
        name: 'Character Encoding Converter',
        path: '/character-encoding',
        description: 'Convert between different character encodings',
        category: 'converters',
        icon: FileCode,
        color: 'text-cyan-400',
        component: Lazy.CharacterEncodingConverter,
        keywords: ['encoding', 'utf-8', 'ascii', 'iso-8859-1', 'windows-1252', 'character', 'convert']
    },
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
    },
    {
        id: 'mime-type',
        name: 'MIME Type Converter',
        path: '/mime-type',
        description: 'Convert between file extensions and MIME types',
        category: 'converters',
        icon: FileType,
        color: 'text-indigo-400',
        component: Lazy.MimeTypeConverter,
        keywords: ['mime', 'type', 'extension', 'file', 'convert']
    },
    // CSV-Excel converter has been moved to data-converters plugin
];
