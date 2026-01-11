import { AlignLeft, BarChart3, FileDiff, Lock, Type } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import { process as obfuscatorProcess } from '../../text/StringObfuscator';

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
    },
];
