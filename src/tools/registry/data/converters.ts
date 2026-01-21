import { ArrowRightLeft, Lock, Link, Globe, Binary, Type } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import * as Logic from '../../converters/logic';

export const converters: ToolDefinition[] = [
    {
        id: 'converter',
        name: 'Universal Converter',
        path: '/converter',
        description: 'Convert between JSON/YAML/XML, Markdown/HTML, and CSV',
        category: 'converters',
        icon: ArrowRightLeft,
        color: 'text-indigo-400',
        component: Lazy.Converter,
        props: { initialMode: 'json-yaml' },
        keywords: [
            'json', 'yaml', 'xml', 'convert', 'transform',
            'case', 'camel', 'snake', 'kebab', 'pascal', 'upper', 'lower',
            'csv', 'excel', 'export',
            'markdown', 'html', 'parse'
        ],
        inputTypes: ['text', 'json', 'yaml', 'xml', 'csv'],
        outputTypes: ['text', 'json', 'yaml', 'xml', 'csv'],
        process: (input, options) => {
            const mode = options?.mode || 'json-yaml';
            switch (mode) {
                case 'json-yaml': return Logic.jsonToYaml(input);
                case 'yaml-json': return Logic.yamlToJson(input);
                case 'json-xml': return Logic.jsonToXml(input);
                case 'xml-json': return Logic.xmlToJson(input);
                case 'json-csv': return Logic.jsonToCsv(input);
                case 'csv-json': return Logic.csvToJson(input);
                default: return input;
            }
        }
    },

    {
        id: 'base64',
        name: 'Base64 Converter',
        path: '/base64',
        description: 'Encode and decode Base64 strings or files',
        category: 'converters',
        icon: Lock,
        color: 'text-rose-400',
        component: Lazy.Base64Converter,
        keywords: ['base64', 'encode', 'decode', 'file', 'upload', 'string']
    },
    {
        id: 'url-encode',
        name: 'URL Encode/Decode',
        path: '/url-encode',
        description: 'Encode and decode URL strings',
        category: 'converters',
        icon: Link,
        color: 'text-blue-400',
        component: Lazy.UrlEncoder,
        keywords: ['url', 'uri', 'encode', 'decode', 'percent', 'encoding']
    },
    {
        id: 'html-entity',
        name: 'HTML Entity Encode/Decode',
        path: '/html-entity',
        description: 'Escape and unescape HTML entities',
        category: 'converters',
        icon: Globe,
        color: 'text-indigo-400',
        component: Lazy.HtmlEntityEncoder,
        keywords: ['html', 'entity', 'escape', 'unescape', 'encode', 'decode']
    },
    {
        id: 'number-base',
        name: 'Number Base Converter',
        path: '/number-base',
        description: 'Convert between decimal, hex, octal, and binary',
        category: 'converters',
        icon: Binary,
        color: 'text-orange-400',
        component: Lazy.NumberBaseConverter,
        keywords: ['number', 'base', 'hex', 'binary', 'decimal', 'octal', 'convert']
    },
    {
        id: 'text-case',
        name: 'Text Case Converter',
        path: '/text-case',
        description: 'Convert text to different case formats',
        category: 'converters',
        icon: Type,
        color: 'text-pink-400',
        component: Lazy.TextCaseConverter,
        keywords: ['text', 'case', 'camel', 'snake', 'kebab', 'pascal', 'upper', 'lower', 'title', 'convert']
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
        keywords: ['color', 'hex', 'rgb', 'hsl', 'cmyk', 'convert'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input, options) => Logic.convertColor(input, options?.format || 'hex')
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
        keywords: ['date', 'time', 'timestamp', 'iso', 'convert', 'format'],
        inputTypes: ['text'],
        outputTypes: ['text'],
        process: (input, options) => Logic.convertDate(input, options?.format || 'iso')
    },

];
