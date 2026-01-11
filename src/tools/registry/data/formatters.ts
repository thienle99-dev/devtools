import { FileCode, FileText, Braces, Database } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import { formatJson, minifyJson, validateJson } from '../../json/logic';

export const formatters: ToolDefinition[] = [
    {
        id: 'xml-format',
        name: 'XML Formatter',
        path: '/xml-format',
        description: 'Prettify and format XML',
        category: 'formatters',
        icon: FileCode,
        color: 'text-orange-500',
        component: Lazy.XmlFormatter,
        keywords: ['xml', 'format', 'prettify']
    },
    {
        id: 'yaml-format',
        name: 'YAML Formatter',
        path: '/yaml-format',
        description: 'Prettify, minify and validate YAML data',
        category: 'formatters',
        icon: FileText,
        color: 'text-red-400',
        component: Lazy.YamlFormatter,
        keywords: ['yaml', 'yml', 'format', 'minify', 'prettify', 'validate']
    },
    {
        id: 'json-format',
        name: 'JSON Formatter',
        path: '/json-format',
        description: 'Prettify, minify and validate JSON data',
        category: 'formatters',
        icon: Braces,
        color: 'text-yellow-400',
        component: Lazy.JsonFormatter,
        keywords: ['json', 'format', 'minify', 'prettier'],
        shortcut: 'Ctrl+Shift+J',
        inputTypes: ['json', 'text'],
        outputTypes: ['json', 'text'],
        process: (input, options) => {
            const method = options?.method || 'format';
            try {
                if (method === 'minify') return minifyJson(input);
                if (method === 'validate') return validateJson(input);
                return formatJson(input);
            } catch (e) {
                throw new Error('Invalid JSON');
            }
        }
    },
    {
        id: 'sql-format',
        name: 'SQL Formatter',
        path: '/sql-format',
        description: 'Prettify and format SQL queries',
        category: 'formatters',
        icon: Database,
        color: 'text-blue-500',
        component: Lazy.SqlFormatter,
        keywords: ['sql', 'format', 'prettify', 'query']
    },
];
