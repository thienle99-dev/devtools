import { Braces } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import { formatJson } from '../../json/logic';

export const formatters: ToolDefinition[] = [
    {
        id: 'code-formatter',
        name: 'Code Formatter',
        path: '/code-formatter',
        description: 'Universal formatter and validator for JSON, XML, YAML, and SQL',
        category: 'formatters',
        icon: Braces,
        color: 'text-indigo-400',
        component: Lazy.UniversalFormatter,
        keywords: ['json', 'xml', 'yaml', 'sql', 'format', 'prettify', 'minify', 'validate'],
        inputTypes: ['json', 'text', 'xml', 'yaml', 'sql'],
        outputTypes: ['json', 'text', 'xml', 'yaml', 'sql'],
        shortcut: 'Ctrl+Shift+F',
        process: (input: any, options: any) => {
            // Basic default: try to format as JSON
            try { return formatJson(input); } catch { return input; }
        }
    },
];
