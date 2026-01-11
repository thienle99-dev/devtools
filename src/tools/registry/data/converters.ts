import { ArrowRightLeft, Code, Table2, FileCode, Lock, FileArchive, Binary, Type, Palette, Calendar } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import { base64Encode, base64Decode } from '../../converters/logic';

export const converters: ToolDefinition[] = [
    {
        id: 'json-yaml',
        name: 'JSON <> YAML',
        path: '/json-yaml',
        description: 'Convert between JSON and YAML formats',
        category: 'converters',
        icon: ArrowRightLeft,
        color: 'text-indigo-400',
        component: Lazy.JsonYamlConverter,
        keywords: ['json', 'yaml', 'convert', 'transform']
    },
    {
        id: 'json-xml',
        name: 'JSON <> XML',
        path: '/json-xml',
        description: 'Convert between JSON and XML formats',
        category: 'converters',
        icon: Code,
        color: 'text-violet-400',
        component: Lazy.JsonXmlConverter,
        keywords: ['json', 'xml', 'convert', 'transform']
    },
    {
        id: 'json-csv',
        name: 'JSON to CSV',
        path: '/json-csv',
        description: 'Convert JSON to CSV',
        category: 'converters',
        icon: Table2,
        color: 'text-green-500',
        component: Lazy.JsonToCsv,
        keywords: ['json', 'csv', 'convert', 'transform']
    },
    {
        id: 'markdown-html',
        name: 'Markdown to HTML',
        path: '/markdown-html',
        description: 'Convert Markdown to HTML',
        category: 'converters',
        icon: FileCode,
        color: 'text-neutral-300',
        component: Lazy.MarkdownHtmlConverter,
        keywords: ['markdown', 'html', 'preview', 'convert']
    },
    {
        id: 'base64',
        name: 'Base64',
        path: '/base64',
        description: 'Encode and decode Base64 strings',
        category: 'converters',
        icon: Lock,
        color: 'text-amber-500',
        component: Lazy.Base64Converter,
        keywords: ['base64', 'encode', 'decode', 'string'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input, options) => {
            const action = options?.action || 'encode';
            if (action === 'decode') return base64Decode(input);
            return base64Encode(input);
        }
    },
    {
        id: 'base64-file',
        name: 'Base64 File',
        path: '/base64-file',
        description: 'Convert file to Base64 string',
        category: 'converters',
        icon: FileArchive,
        color: 'text-orange-400',
        component: Lazy.Base64FileConverter,
        keywords: ['base64', 'file', 'image', 'upload']
    },
    {
        id: 'number-base',
        name: 'Number Base',
        path: '/number-base',
        description: 'Convert numbers between Decimal, Hex, Octal and Binary',
        category: 'converters',
        icon: Binary,
        color: 'text-cyan-400',
        component: Lazy.NumberBaseConverter,
        keywords: ['base', 'hex', 'binary', 'decimal', 'octal', 'convert']
    },
    {
        id: 'case-converter',
        name: 'Case Converter',
        path: '/case-converter',
        description: 'Convert between different naming conventions',
        category: 'converters',
        icon: Type,
        color: 'text-pink-400',
        component: Lazy.CaseConverter,
        keywords: ['case', 'camel', 'snake', 'kebab', 'pascal', 'upper', 'lower']
    },
    {
        id: 'color-converter',
        name: 'Color Converter',
        path: '/color-converter',
        description: 'Convert colors (Hex, RGB, HSL)',
        category: 'converters',
        icon: Palette,
        color: 'text-fuchsia-400',
        component: Lazy.ColorConverter,
        keywords: ['color', 'hex', 'rgb', 'hsl', 'picker']
    },
    {
        id: 'date-converter',
        name: 'Date Converter',
        path: '/date-converter',
        description: 'Convert Dates (ISO, Unix, UTC)',
        category: 'converters',
        icon: Calendar,
        color: 'text-sky-400',
        component: Lazy.DateConverter,
        keywords: ['date', 'time', 'timestamp', 'unix', 'iso']
    },
    {
        id: 'csv-excel',
        name: 'CSV to Excel',
        path: '/csv-excel',
        description: 'Convert CSV to Excel (XLSX)',
        category: 'converters',
        icon: Table2,
        color: 'text-emerald-500',
        component: Lazy.CsvExcelConverter,
        keywords: ['csv', 'excel', 'xlsx', 'convert', 'spreadsheet']
    },
];
