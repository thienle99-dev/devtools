import { Braces, GitCompare } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import yaml from 'js-yaml';

export const formatters: ToolDefinition[] = [
    {
        id: 'universal-formatter',
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
        process: async (input: any, options: any) => {
            const format = options?.language || 'json';
            const minify = options?.minify || false;
            try {
                if (format === 'json') {
                    const parsed = JSON.parse(input);
                    return JSON.stringify(parsed, null, minify ? 0 : (options?.indent || 2));
                }
                if (format === 'sql') {
                    // Very basic SQL formatting mockup for now
                    return input.replace(/\s+SELECT\s+/gi, '\nSELECT ')
                                .replace(/\s+FROM\s+/gi, '\nFROM ')
                                .replace(/\s+WHERE\s+/gi, '\nWHERE ');
                }
                if (format === 'xml') {
                    const builder = new XMLBuilder({ ignoreAttributes: false, format: !minify, indentBy: "  " });
                    const parser = new XMLParser({ ignoreAttributes: false });
                    return builder.build(parser.parse(input));
                }
                if (format === 'yaml') {
                    const parsed = yaml.load(input);
                    return yaml.dump(parsed, { indent: options?.indent || 2 });
                }
                return input;
            } catch {
                return input;
            }
        }
    },
    {
        id: 'json-minifier',
        name: 'JSON Minifier',
        path: '/json-minifier',
        description: 'Compress JSON for production',
        category: 'formatters',
        icon: Braces,
        color: 'text-yellow-400',
        component: Lazy.UniversalFormatter,
        props: { initialMode: 'json' },
        keywords: ['json', 'minify', 'compress'],
        inputTypes: ['json'],
        outputTypes: ['json'],
        process: (input) => {
            try { return JSON.stringify(JSON.parse(input)); } catch { return input; }
        }
    },
    {
        id: 'json-diff',
        name: 'JSON Diff',
        path: '/json-diff',
        description: 'Compare two JSON objects/arrays',
        category: 'formatters',
        icon: GitCompare,
        color: 'text-amber-500',
        component: Lazy.JsonDiff,
        keywords: ['json', 'diff', 'compare', 'difference'],
        inputTypes: ['json'],
        outputTypes: ['text']
    }
];
