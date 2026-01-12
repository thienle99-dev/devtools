import { ArrowRightLeft } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';

export const converters: ToolDefinition[] = [
    {
        id: 'converter',
        name: 'Universal Converter',
        path: '/converter',
        description: 'Convert between JSON/YAML/XML, Base64, Number Bases, and Text Case',
        category: 'converters',
        icon: ArrowRightLeft,
        color: 'text-indigo-400',
        component: Lazy.Converter,
        props: { initialMode: 'json-yaml' },
        keywords: [
            'json', 'yaml', 'xml', 'convert', 'transform',
            'base64', 'encode', 'decode', 'string',
            'base', 'hex', 'binary', 'decimal', 'octal',
            'case', 'camel', 'snake', 'kebab', 'pascal', 'upper', 'lower',
            'csv', 'excel', 'export',
            'markdown', 'html', 'parse',
            'url', 'uri', 'encode', 'decode', 'entity', 'escape', 'unescape'
        ]
    },

    {
        id: 'base64-file',
        name: 'Base64 File',
        path: '/base64-file',
        description: 'Convert files to Base64 strings',
        category: 'converters',
        icon: ArrowRightLeft,
        color: 'text-amber-500',
        component: Lazy.Base64FileConverter,
        keywords: ['file', 'base64', 'encode', 'upload']
    },
    {
        id: 'color-converter',
        name: 'Color Converter',
        path: '/color-converter',
        description: 'Convert between HEX, RGB, HSL, and CMYK',
        category: 'converters',
        icon: ArrowRightLeft,
        color: 'text-pink-400',
        component: Lazy.ColorConverter,
        keywords: ['color', 'hex', 'rgb', 'hsl', 'cmyk', 'convert']
    },
    {
        id: 'date-converter',
        name: 'Date Converter',
        path: '/date-converter',
        description: 'Convert timestamps and date formats',
        category: 'converters',
        icon: ArrowRightLeft,
        color: 'text-orange-400',
        component: Lazy.DateConverter,
        keywords: ['date', 'time', 'timestamp', 'iso', 'convert', 'format']
    },
    {
        id: 'csv-excel',
        name: 'CSV <> Excel',
        path: '/csv-excel',
        description: 'Convert between CSV and Excel formats',
        category: 'converters',
        icon: ArrowRightLeft,
        color: 'text-emerald-400',
        component: Lazy.CsvExcelConverter,
        keywords: ['csv', 'excel', 'spreadsheet', 'convert', 'parse']
    }
];
