import { ArrowRightLeft } from 'lucide-react';
import * as Lazy from '../lazy-tools';
import type { ToolDefinition } from '../types';
import * as Logic from '../../converters/logic';

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
                case 'case': return Logic.convertCase(input, options?.caseType || 'upper');
                default: return input;
            }
        }
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
