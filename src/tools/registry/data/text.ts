import { AlignLeft, BarChart3, FileDiff, Lock, Type } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import { process as obfuscatorProcess } from '../../text/StringObfuscator';
import figlet from 'figlet';

export const textTools: ToolDefinition[] = [
    {
        id: 'lorem-ipsum-generator',
        name: 'Lorem Ipsum',
        path: '/lorem-ipsum',
        description: 'Generate placeholder text for layouts',
        category: 'text',
        icon: AlignLeft,
        color: 'text-indigo-400',
        component: Lazy.LoremIpsumGenerator,
        keywords: ['lorem', 'ipsum', 'text', 'placeholder', 'filler', 'generator'],
        outputTypes: ['text'],
        process: () => {
            // Logic handled by component usually, but for pipeline:
            return "Lorem ipsum dolor sit amet..."; 
        }
    },
    {
        id: 'slugify',
        name: 'Slugify',
        path: '/slugify',
        description: 'Convert text to URL-friendly slugs',
        category: 'text',
        icon: AlignLeft,
        color: 'text-indigo-400',
        component: Lazy.Slugify,
        keywords: ['slug', 'url', 'friendly', 'text'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input) => {
            return input.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        }
    },
    {
        id: 'regex-replace',
        name: 'Regex Replace',
        path: '/regex-replace',
        description: 'Advanced search and replace using RegEx',
        category: 'text',
        icon: AlignLeft,
        color: 'text-indigo-400',
        component: Lazy.RegexReplace,
        keywords: ['regex', 'replace', 'text', 'match', 'search'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input, options) => {
            if (!options?.pattern) return input;
            try {
                let flags = '';
                if (options.global !== false) flags += 'g';
                if (options.insensitive) flags += 'i';
                if (options.multiline) flags += 'm';
                const regex = new RegExp(options.pattern, flags);
                return input.replace(regex, options.replacement || '');
            } catch {
                return input;
            }
        }
    },
    {
        id: 'text-statistics',
        name: 'Text Statistics',
        path: '/text-stats',
        description: 'Analyze text statistics and keyword density',
        category: 'text',
        icon: BarChart3,
        color: 'text-indigo-400',
        component: Lazy.TextStatistics,
        keywords: ['text', 'stats', 'word', 'count', 'reading', 'time', 'analysis'],
        inputTypes: ['text'],
        outputTypes: ['text', 'json'],
        process: (input) => {
            const trimmedText = input.trim();
            const words = trimmedText ? trimmedText.split(/\s+/).filter(Boolean) : [];
            const characters = input.length;
            const lines = input.split('\n').length;
            return `Characters: ${characters}\nWords: ${words.length}\nLines: ${lines}`;
        }
    },
    {
        id: 'text-diff',
        name: 'Text Diff',
        path: '/text-diff',
        description: 'Compare two texts and see the differences',
        category: 'text',
        icon: FileDiff,
        color: 'text-indigo-400',
        component: Lazy.TextDiff,
        keywords: ['text', 'diff', 'compare', 'difference', 'patch'],
        inputTypes: ['text'],
        outputTypes: ['text']
    },
    {
        id: 'string-obfuscator',
        name: 'String Obfuscator',
        path: '/obfuscator',
        description: 'Encode or obfuscate text (ROT13, Base64, Hex, etc.)',
        category: 'text',
        icon: Lock,
        color: 'text-indigo-400',
        component: Lazy.StringObfuscator,
        keywords: ['text', 'obfuscate', 'encode', 'rot13', 'base64', 'hex'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input, options) => obfuscatorProcess(input, options)
    },
    {
        id: 'ascii-art',
        name: 'ASCII Art',
        path: '/ascii-art',
        description: 'Generate stylized ASCII art from text',
        category: 'text',
        icon: Type,
        color: 'text-indigo-400',
        component: Lazy.AsciiArtGenerator,
        keywords: ['text', 'ascii', 'art', 'figlet', 'stylized'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input, options) => {
            return new Promise((resolve) => {
                figlet.text(input, { font: options?.font || 'Standard' }, (_err, data) => {
                    resolve(data || input);
                });
            });
        }
    },
];
