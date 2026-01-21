import { ArrowRightLeft, Lock, Link, Globe, Binary, Type, FileCode, Hash, Network, HardDrive, Ruler, Minus, Clock, Percent, FileType, DollarSign, Table } from 'lucide-react';
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
        id: 'ip-address',
        name: 'IP Address Converter',
        path: '/ip-address',
        description: 'Convert between IPv4 address formats',
        category: 'converters',
        icon: Network,
        color: 'text-blue-400',
        component: Lazy.IpAddressConverter,
        keywords: ['ip', 'address', 'ipv4', 'dotted', 'decimal', 'binary', 'convert']
    },
    {
        id: 'mac-address',
        name: 'MAC Address Converter',
        path: '/mac-address',
        description: 'Convert between different MAC address formats',
        category: 'converters',
        icon: Network,
        color: 'text-indigo-400',
        component: Lazy.MacAddressConverter,
        keywords: ['mac', 'address', 'format', 'colon', 'hyphen', 'convert']
    },
    {
        id: 'file-size',
        name: 'File Size Converter',
        path: '/file-size',
        description: 'Convert between bytes, KB, MB, GB, TB, PB',
        category: 'converters',
        icon: HardDrive,
        color: 'text-amber-400',
        component: Lazy.FileSizeConverter,
        keywords: ['file', 'size', 'bytes', 'kb', 'mb', 'gb', 'tb', 'pb', 'convert']
    },
    {
        id: 'unit-converter',
        name: 'Unit Converter',
        path: '/unit-converter',
        description: 'Convert between length, weight, volume, and speed units',
        category: 'converters',
        icon: Ruler,
        color: 'text-teal-400',
        component: Lazy.UnitConverter,
        keywords: ['unit', 'length', 'weight', 'volume', 'speed', 'meter', 'kilogram', 'liter', 'convert']
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
        id: 'code-minifier',
        name: 'Code Minifier/Beautifier',
        path: '/code-minifier',
        description: 'Minify or beautify JSON, XML, HTML, CSS, and JavaScript',
        category: 'converters',
        icon: Minus,
        color: 'text-violet-400',
        component: Lazy.CodeMinifier,
        keywords: ['minify', 'beautify', 'json', 'xml', 'html', 'css', 'javascript', 'format']
    },
    {
        id: 'epoch-timestamp',
        name: 'Epoch Timestamp Converter',
        path: '/epoch-timestamp',
        description: 'Convert between Unix timestamps and dates',
        category: 'converters',
        icon: Clock,
        color: 'text-orange-400',
        component: Lazy.EpochTimestampConverter,
        keywords: ['epoch', 'timestamp', 'unix', 'date', 'time', 'convert']
    },
    {
        id: 'timezone-converter',
        name: 'Time Zone Converter',
        path: '/timezone-converter',
        description: 'Convert dates between different time zones',
        category: 'converters',
        icon: Globe,
        color: 'text-cyan-400',
        component: Lazy.TimeZoneConverter,
        keywords: ['timezone', 'time', 'zone', 'utc', 'convert', 'date']
    },
    {
        id: 'percentage-fraction',
        name: 'Percentage/Fraction/Decimal Converter',
        path: '/percentage-fraction',
        description: 'Convert between percentage, fraction, and decimal formats',
        category: 'converters',
        icon: Percent,
        color: 'text-pink-400',
        component: Lazy.PercentageFractionConverter,
        keywords: ['percentage', 'fraction', 'decimal', 'convert', 'percent']
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
    {
        id: 'currency-converter',
        name: 'Currency Converter',
        path: '/currency-converter',
        description: 'Convert between different currencies',
        category: 'converters',
        icon: DollarSign,
        color: 'text-green-400',
        component: Lazy.CurrencyConverter,
        keywords: ['currency', 'money', 'exchange', 'rate', 'usd', 'eur', 'gbp', 'convert']
    },
    {
        id: 'csv-excel',
        name: 'CSV → Excel Converter',
        path: '/csv-excel',
        description: 'Convert CSV files to Excel (XLSX) with formatting, filters, and presets',
        category: 'converters',
        icon: Table,
        color: 'text-emerald-400',
        component: Lazy.CsvExcelConverter,
        keywords: ['csv', 'excel', 'xlsx', 'data', 'spreadsheet', 'converter', 'table', 'import', 'export'],
        inputTypes: ['text', 'csv'],
        outputTypes: ['file']
    },

];
