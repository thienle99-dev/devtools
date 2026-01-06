import React from 'react';
import {
    Code2,
    Box,
    Hash,
    Link,
    Lock,
    Key,
    Shield,
    Globe,
    Star,
    History,
    Database,
    Binary,
    Braces,
    FileImage,
    Settings,
    Clipboard,
    Activity,
    Trash2,
    FileText,
    RotateCw,
    Archive,
    CheckCircle2,
    FileCode,
    Type,
    Calendar,
    Palette,
    FileDigit,
    Scissors,
    FileCheck,
    FileUp,
    ShieldCheck,
    Code,
    FileArchive,
    Smartphone,
    Server,
    ArrowRightLeft,
    Table2,
    Network,
    Fingerprint,
    Search,
    Percent,
    Clock,
    Container,
    Eraser,
    ScanLine,
    Move,
    Camera,
    Package
} from 'lucide-react';


export type ToolCategory = 'converters' | 'formatters' | 'crypto' | 'web' | 'network' | 'development' | 'utilities' | 'pdf' | 'favorites' | 'recent';

export interface ToolDefinition {
    id: string;
    name: string;
    path: string;
    description: string;
    category: ToolCategory;
    icon: React.ElementType;
    component: React.LazyExoticComponent<React.ComponentType<any>> | React.ComponentType<any>;
    keywords?: string[];
    shortcut?: string;
    color?: string;
}

export interface CategoryDefinition {
    id: ToolCategory;
    name: string;
    icon: React.ElementType;
    color?: string;
}

export const CATEGORIES: CategoryDefinition[] = [
    { id: 'favorites', name: 'Favorites', icon: Star, color: 'text-amber-400' },
    { id: 'recent', name: 'Recent', icon: History, color: 'text-blue-400' },
    { id: 'converters', name: 'Converters', icon: Box, color: 'text-emerald-400' },
    { id: 'formatters', name: 'Formatters', icon: Code2, color: 'text-orange-400' },
    { id: 'crypto', name: 'Crypto', icon: Hash, color: 'text-violet-400' },
    { id: 'web', name: 'Web', icon: Globe, color: 'text-sky-400' },
    { id: 'network', name: 'Network', icon: Globe, color: 'text-cyan-400' },
    { id: 'pdf', name: 'PDF Tools', icon: FileText, color: 'text-rose-500' },
    { id: 'utilities', name: 'Utilities', icon: Box, color: 'text-yellow-400' },
    { id: 'development', name: 'Dev Utils', icon: Code2, color: 'text-pink-400' },
];

// Lazy load all tool components for better performance
const JsonFormatter = React.lazy(() => import('./json/JsonFormatter').then(m => ({ default: m.JsonFormatter })));
const JsonYamlConverter = React.lazy(() => import('./converters/JsonYamlConverter').then(m => ({ default: m.JsonYamlConverter })));
const Base64Converter = React.lazy(() => import('./converters/Base64Converter').then(m => ({ default: m.Base64Converter })));
const NumberBaseConverter = React.lazy(() => import('./converters/NumberBaseConverter').then(m => ({ default: m.NumberBaseConverter })));
const CaseConverter = React.lazy(() => import('./converters/CaseConverter').then(m => ({ default: m.CaseConverter })));
const JsonXmlConverter = React.lazy(() => import('./converters/JsonXmlConverter').then(m => ({ default: m.JsonXmlConverter })));
const MarkdownHtmlConverter = React.lazy(() => import('./converters/MarkdownHtmlConverter').then(m => ({ default: m.MarkdownHtmlConverter })));
const DateConverter = React.lazy(() => import('./converters/DateConverter').then(m => ({ default: m.DateConverter })));
const ColorConverter = React.lazy(() => import('./converters/ColorConverter').then(m => ({ default: m.ColorConverter })));
const Base64FileConverter = React.lazy(() => import('./converters/Base64FileConverter').then(m => ({ default: m.Base64FileConverter })));
const ImagesToPdfConverter = React.lazy(() => import('./pdf/ImagesToPdfConverter').then(m => ({ default: m.ImagesToPdfConverter })));
const PdfMerger = React.lazy(() => import('./pdf/PdfMerger').then(m => ({ default: m.PdfMerger })));
const PdfSplitter = React.lazy(() => import('./pdf/PdfSplitter').then(m => ({ default: m.PdfSplitter })));
const PdfPageExtractor = React.lazy(() => import('./pdf/PdfPageExtractor').then(m => ({ default: m.PdfPageExtractor })));
const PdfPageRotator = React.lazy(() => import('./pdf/PdfPageRotator').then(m => ({ default: m.PdfPageRotator })));
const PdfMetadata = React.lazy(() => import('./pdf/PdfMetadata').then(m => ({ default: m.PdfMetadata })));
const PdfBase64 = React.lazy(() => import('./pdf/PdfBase64').then(m => ({ default: m.PdfBase64 })));
const PdfCompressor = React.lazy(() => import('./pdf/PdfCompressor').then(m => ({ default: m.PdfCompressor })));
const PdfValidator = React.lazy(() => import('./pdf/PdfValidator').then(m => ({ default: m.PdfValidator })));
const PdfPageReorder = React.lazy(() => import('./pdf/PdfPageReorder').then(m => ({ default: m.PdfPageReorder })));
const PdfWatermarker = React.lazy(() => import('./pdf/PdfWatermarker').then(m => ({ default: m.PdfWatermarker })));
const PdfPageNumbering = React.lazy(() => import('./pdf/PdfPageNumbering').then(m => ({ default: m.PdfPageNumbering })));
const HtmlToPdf = React.lazy(() => import('./pdf/HtmlToPdf').then(m => ({ default: m.HtmlToPdf })));
const MarkdownToPdf = React.lazy(() => import('./pdf/MarkdownToPdf').then(m => ({ default: m.MarkdownToPdf })));
const PdfMetadataRemover = React.lazy(() => import('./pdf/PdfMetadataRemover').then(m => ({ default: m.PdfMetadataRemover })));

const HashGenerator = React.lazy(() => import('./crypto/HashGenerator').then(m => ({ default: m.HashGenerator })));
const UuidGenerator = React.lazy(() => import('./crypto/UuidGenerator').then(m => ({ default: m.UuidGenerator })));
const TokenGenerator = React.lazy(() => import('./crypto/TokenGenerator').then(m => ({ default: m.TokenGenerator })));
const HmacGenerator = React.lazy(() => import('./crypto/HmacGenerator').then(m => ({ default: m.HmacGenerator })));
const AesEncryptor = React.lazy(() => import('./crypto/AesEncryptor').then(m => ({ default: m.AesEncryptor })));
const BcryptGenerator = React.lazy(() => import('./crypto/BcryptGenerator').then(m => ({ default: m.BcryptGenerator })));

const UrlEncoder = React.lazy(() => import('./web/UrlEncoder').then(m => ({ default: m.UrlEncoder })));
const HtmlEntityEncoder = React.lazy(() => import('./web/HtmlEntityEncoder').then(m => ({ default: m.HtmlEntityEncoder })));
const UrlParser = React.lazy(() => import('./web/UrlParser').then(m => ({ default: m.UrlParser })));
const BasicAuthGenerator = React.lazy(() => import('./web/BasicAuthGenerator').then(m => ({ default: m.BasicAuthGenerator })));
const SlugGenerator = React.lazy(() => import('./web/SlugGenerator').then(m => ({ default: m.SlugGenerator })));
const UserAgentParser = React.lazy(() => import('./web/UserAgentParser').then(m => ({ default: m.UserAgentParser })));
const JwtParser = React.lazy(() => import('./web/JwtParser').then(m => ({ default: m.JwtParser })));
const HttpStatusCode = React.lazy(() => import('./web/HttpStatusCode').then(m => ({ default: m.HttpStatusCode })));
const JsonDiff = React.lazy(() => import('./web/JsonDiff').then(m => ({ default: m.JsonDiff })));

const Ipv4SubnetCalculator = React.lazy(() => import('./network/Ipv4SubnetCalculator').then(m => ({ default: m.Ipv4SubnetCalculator })));
const Ipv4Converter = React.lazy(() => import('./network/Ipv4Converter').then(m => ({ default: m.Ipv4Converter })));
const MacGenerator = React.lazy(() => import('./network/MacGenerator').then(m => ({ default: m.MacGenerator })));
const MacLookup = React.lazy(() => import('./network/MacLookup').then(m => ({ default: m.MacLookup })));

const SqlFormatter = React.lazy(() => import('./development/SqlFormatter').then(m => ({ default: m.SqlFormatter })));
const JsonToCsv = React.lazy(() => import('./development/JsonToCsv').then(m => ({ default: m.JsonToCsv })));
const XmlFormatter = React.lazy(() => import('./development/XmlFormatter').then(m => ({ default: m.XmlFormatter })));
const YamlFormatter = React.lazy(() => import('./development/YamlFormatter').then(m => ({ default: m.YamlFormatter })));
const RegexTester = React.lazy(() => import('./development/RegexTester').then(m => ({ default: m.RegexTester })));
const CrontabGenerator = React.lazy(() => import('./development/CrontabGenerator').then(m => ({ default: m.CrontabGenerator })));
const ChmodCalculator = React.lazy(() => import('./development/ChmodCalculator').then(m => ({ default: m.ChmodCalculator })));
const DockerConverter = React.lazy(() => import('./development/DockerConverter').then(m => ({ default: m.DockerConverter })));
const ClipboardManager = React.lazy(() => import('./utilities/ClipboardManager').then(m => ({ default: m.ClipboardManager })));
const StatsMonitor = React.lazy(() => import('./utilities/stats-monitor/StatsMonitor').then(m => ({ default: m.default })));
const ApplicationManager = React.lazy(() => import('./utilities/ApplicationManager').then(m => ({ default: m.default })));
const SystemCleaner = React.lazy(() => import('./utilities/system-cleaner/SystemCleaner').then(m => ({ default: m.SystemCleaner })));
const Xnapper = React.lazy(() => import('./screenshot/Xnapper'));
const SettingsPage = React.lazy(() => import('../pages/Settings'));

// Import placeholders for now (we'll replace them as we build them)

export const TOOLS: ToolDefinition[] = [
    // Formatters
    {
        id: 'xml-format',
        name: 'XML Formatter',
        path: '/xml-format',
        description: 'Prettify and format XML',
        category: 'formatters',
        icon: FileCode,
        color: 'text-orange-500',
        component: XmlFormatter,
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
        component: YamlFormatter,
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
        component: JsonFormatter,
        keywords: ['json', 'format', 'minify', 'prettier'],
        shortcut: 'Ctrl+Shift+J'
    },
    {
        id: 'sql-format',
        name: 'SQL Formatter',
        path: '/sql-format',
        description: 'Prettify and format SQL queries',
        category: 'formatters',
        icon: Database,
        color: 'text-blue-500',
        component: SqlFormatter,
        keywords: ['sql', 'format', 'prettify', 'query']
    },

    // Converters
    {
        id: 'json-yaml',
        name: 'JSON <> YAML',
        path: '/json-yaml',
        description: 'Convert between JSON and YAML formats',
        category: 'converters',
        icon: ArrowRightLeft,
        color: 'text-indigo-400',
        component: JsonYamlConverter,
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
        component: JsonXmlConverter,
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
        component: JsonToCsv,
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
        component: MarkdownHtmlConverter,
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
        component: Base64Converter,
        keywords: ['base64', 'encode', 'decode', 'string']
    },
    {
        id: 'base64-file',
        name: 'Base64 File',
        path: '/base64-file',
        description: 'Convert file to Base64 string',
        category: 'converters',
        icon: FileArchive,
        color: 'text-orange-400',
        component: Base64FileConverter,
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
        component: NumberBaseConverter,
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
        component: CaseConverter,
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
        component: ColorConverter,
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
        component: DateConverter,
        keywords: ['date', 'time', 'timestamp', 'unix', 'iso']
    },

    // PDF Tools
    {
        id: 'images-to-pdf',
        name: 'Images to PDF',
        path: '/images-to-pdf',
        description: 'Convert multiple images to PDF, each image as one page',
        category: 'pdf',
        icon: FileImage,
        color: 'text-purple-400',
        component: ImagesToPdfConverter,
        keywords: ['pdf', 'image', 'convert', 'merge', 'pages']
    },
    {
        id: 'pdf-merger',
        name: 'PDF Merger',
        path: '/pdf-merger',
        description: 'Merge multiple PDF files into one',
        category: 'pdf',
        icon: FileCheck,
        color: 'text-indigo-500',
        component: PdfMerger,
        keywords: ['pdf', 'merge', 'combine', 'join']
    },
    {
        id: 'pdf-splitter',
        name: 'PDF Splitter',
        path: '/pdf-splitter',
        description: 'Split PDF into multiple files',
        category: 'pdf',
        icon: Scissors,
        color: 'text-red-400',
        component: PdfSplitter,
        keywords: ['pdf', 'split', 'divide', 'separate']
    },
    {
        id: 'pdf-page-extractor',
        name: 'PDF Page Extractor',
        path: '/pdf-page-extractor',
        description: 'Extract specific pages from a PDF',
        category: 'pdf',
        icon: FileUp,
        color: 'text-emerald-400',
        component: PdfPageExtractor,
        keywords: ['pdf', 'extract', 'pages', 'select']
    },
    {
        id: 'pdf-page-rotator',
        name: 'PDF Page Rotator',
        path: '/pdf-page-rotator',
        description: 'Rotate pages in a PDF',
        category: 'pdf',
        icon: RotateCw,
        color: 'text-blue-400',
        component: PdfPageRotator,
        keywords: ['pdf', 'rotate', 'pages', 'orientation']
    },
    {
        id: 'pdf-base64',
        name: 'PDF Base64',
        path: '/pdf-base64',
        description: 'Convert PDF to Base64 or decode Base64 to PDF',
        category: 'pdf',
        icon: Binary,
        color: 'text-amber-500',
        component: PdfBase64,
        keywords: ['pdf', 'base64', 'encode', 'decode']
    },
    {
        id: 'pdf-metadata',
        name: 'PDF Metadata',
        path: '/pdf-metadata',
        description: 'View and edit PDF metadata',
        category: 'pdf',
        icon: FileText,
        color: 'text-gray-400',
        component: PdfMetadata,
        keywords: ['pdf', 'metadata', 'info', 'properties', 'edit']
    },
    {
        id: 'pdf-compressor',
        name: 'PDF Compressor',
        path: '/pdf-compressor',
        description: 'Compress PDF file size',
        category: 'pdf',
        icon: Archive,
        color: 'text-orange-400',
        component: PdfCompressor,
        keywords: ['pdf', 'compress', 'reduce', 'size', 'optimize']
    },
    {
        id: 'pdf-validator',
        name: 'PDF Validator',
        path: '/pdf-validator',
        description: 'Validate PDF file structure and metadata',
        category: 'pdf',
        icon: CheckCircle2,
        color: 'text-green-500',
        component: PdfValidator,
        keywords: ['pdf', 'validate', 'check', 'verify', 'test']
    },
    {
        id: 'pdf-page-reorder',
        name: 'PDF Page Reorder',
        path: '/pdf-page-reorder',
        description: 'Reorder pages in a PDF',
        category: 'pdf',
        icon: Move,
        color: 'text-cyan-400',
        component: PdfPageReorder,
        keywords: ['pdf', 'reorder', 'pages', 'sort']
    },
    {
        id: 'pdf-watermarker',
        name: 'PDF Watermarker',
        path: '/pdf-watermarker',
        description: 'Add text or image watermark to PDF',
        category: 'pdf',
        icon: FileCode,
        color: 'text-blue-300',
        component: PdfWatermarker,
        keywords: ['pdf', 'watermark', 'text', 'image', 'brand']
    },
    {
        id: 'pdf-page-numbering',
        name: 'PDF Page Numbering',
        path: '/pdf-page-numbering',
        description: 'Add page numbers to PDF',
        category: 'pdf',
        icon: FileDigit,
        color: 'text-purple-300',
        component: PdfPageNumbering,
        keywords: ['pdf', 'page', 'number', 'numbering', 'footer', 'header']
    },
    {
        id: 'html-to-pdf',
        name: 'HTML to PDF',
        path: '/html-to-pdf',
        description: 'Convert HTML content to PDF',
        category: 'pdf',
        icon: Code2,
        color: 'text-orange-600',
        component: HtmlToPdf,
        keywords: ['pdf', 'html', 'convert', 'web']
    },
    {
        id: 'markdown-to-pdf',
        name: 'Markdown to PDF',
        path: '/markdown-to-pdf',
        description: 'Convert Markdown content to PDF',
        category: 'pdf',
        icon: FileCode,
        color: 'text-sky-300',
        component: MarkdownToPdf,
        keywords: ['pdf', 'markdown', 'convert', 'md']
    },
    {
        id: 'pdf-metadata-remover',
        name: 'PDF Metadata Remover',
        path: '/pdf-metadata-remover',
        description: 'Remove all metadata from PDF',
        category: 'pdf',
        icon: Eraser,
        color: 'text-red-500',
        component: PdfMetadataRemover,
        keywords: ['pdf', 'metadata', 'remove', 'clean', 'privacy']
    },

    // Crypto
    {
        id: 'hash',
        name: 'Hash Generator',
        path: '/hash',
        description: 'Generate MD5, SHA1, SHA256 hashes',
        category: 'crypto',
        icon: Fingerprint,
        color: 'text-violet-500',
        component: HashGenerator,
        keywords: ['hash', 'md5', 'sha', 'crypto']
    },
    {
        id: 'hmac',
        name: 'HMAC Generator',
        path: '/hmac',
        description: 'Keyed-hash message authentication code',
        category: 'crypto',
        icon: ShieldCheck,
        color: 'text-fuchsia-400',
        component: HmacGenerator,
        keywords: ['hmac', 'key', 'hash', 'security']
    },
    {
        id: 'bcrypt',
        name: 'Bcrypt Hash',
        path: '/bcrypt',
        description: 'Generate and compare Bcrypt hashes',
        category: 'crypto',
        icon: Shield,
        color: 'text-pink-500',
        component: BcryptGenerator,
        keywords: ['bcrypt', 'password', 'hash', 'salt']
    },
    {
        id: 'uuid',
        name: 'UUID / ULID',
        path: '/uuid',
        description: 'Generate unique identifiers',
        category: 'crypto',
        icon: ScanLine,
        color: 'text-blue-400',
        component: UuidGenerator,
        keywords: ['uuid', 'ulid', 'guid', 'id'],
        shortcut: 'Ctrl+Shift+U'
    },
    {
        id: 'token-generator',
        name: 'Token Generator',
        path: '/token-generator',
        description: 'Secure passwords and tokens',
        category: 'crypto',
        icon: Key,
        color: 'text-indigo-400',
        component: TokenGenerator,
        keywords: ['token', 'password', 'random', 'secure']
    },
    {
        id: 'aes',
        name: 'AES Encryptor',
        path: '/aes',
        description: 'Encrypt/Decrypt text with AES',
        category: 'crypto',
        icon: Lock,
        color: 'text- emerald-500',
        component: AesEncryptor,
        keywords: ['aes', 'encrypt', 'decrypt', 'cipher']
    },

    // Web
    {
        id: 'url-encoder',
        name: 'URL Encoder',
        path: '/url-encoder',
        description: 'Encode and decode URLs',
        category: 'web',
        icon: Link,
        color: 'text-sky-500',
        component: UrlEncoder,
        keywords: ['url', 'encode', 'decode', 'uri']
    },
    {
        id: 'html-entity',
        name: 'HTML Entity',
        path: '/html-entity',
        description: 'Escape/Unescape HTML Entities',
        category: 'web',
        icon: Code,
        color: 'text-orange-500',
        component: HtmlEntityEncoder,
        keywords: ['html', 'entity', 'escape', 'unescape']
    },
    {
        id: 'url-parser',
        name: 'URL Parser',
        path: '/url-parser',
        description: 'Parse URL parameters and components',
        category: 'web',
        icon: Globe,
        color: 'text-blue-400',
        component: UrlParser,
        keywords: ['url', 'parser', 'params', 'query']
    },
    {
        id: 'jwt',
        name: 'JWT Parser',
        path: '/jwt',
        description: 'Parse and inspect JSON Web Tokens',
        category: 'web',
        icon: ShieldCheck,
        color: 'text-violet-500',
        component: JwtParser,
        keywords: ['jwt', 'token', 'decode', 'jose']
    },
    {
        id: 'user-agent',
        name: 'UA Parser',
        path: '/user-agent',
        description: 'Parse User-Agent strings',
        category: 'web',
        icon: Smartphone,
        color: 'text-emerald-500',
        component: UserAgentParser,
        keywords: ['user', 'agent', 'browser', 'os', 'device']
    },
    {
        id: 'basic-auth',
        name: 'Basic Auth',
        path: '/basic-auth',
        description: 'Generate HTTP Basic Auth header',
        category: 'web',
        icon: Lock,
        color: 'text-rose-400',
        component: BasicAuthGenerator,
        keywords: ['auth', 'basic', 'header', 'http']
    },
    {
        id: 'slug',
        name: 'Slug Generator',
        path: '/slug',
        description: 'Generate URL-friendly slugs',
        category: 'web',
        icon: Link,
        color: 'text-teal-400',
        component: SlugGenerator,
        keywords: ['slug', 'url', 'seo', 'string']
    },
    {
        id: 'http-status',
        name: 'HTTP Codes',
        path: '/http-status',
        description: 'List of HTTP status codes',
        category: 'web',
        icon: Server,
        color: 'text-indigo-400',
        component: HttpStatusCode,
        keywords: ['http', 'status', 'code', 'error']
    },
    {
        id: 'json-diff',
        name: 'JSON/Text Diff',
        path: '/json-diff',
        description: 'Compare text or JSON',
        category: 'web',
        icon: ArrowRightLeft,
        color: 'text-amber-500',
        component: JsonDiff,
        keywords: ['diff', 'compare', 'json', 'text']
    },

    // Network
    {
        id: 'ipv4-subnet',
        name: 'IPv4 Subnet',
        path: '/ipv4-subnet',
        description: 'CIDR calculator and ranges',
        category: 'network',
        icon: Network,
        color: 'text-cyan-500',
        component: Ipv4SubnetCalculator,
        keywords: ['ip', 'subnet', 'cidr', 'network', 'mask']
    },
    {
        id: 'ipv4-converter',
        name: 'IPv4 Converter',
        path: '/ipv4-converter',
        description: 'Decimal, Binary, Hex converter',
        category: 'network',
        icon: RotateCw,
        color: 'text-blue-500',
        component: Ipv4Converter,
        keywords: ['ip', 'convert', 'decimal', 'binary', 'hex']
    },
    {
        id: 'mac-generator',
        name: 'MAC Generator',
        path: '/mac-generator',
        description: 'Generate Random MAC Addresses',
        category: 'network',
        icon: Fingerprint,
        color: 'text-purple-400',
        component: MacGenerator,
        keywords: ['mac', 'generator', 'address', 'network']
    },
    {
        id: 'mac-lookup',
        name: 'MAC Lookup',
        path: '/mac-lookup',
        description: 'Find vendor by MAC Address',
        category: 'network',
        icon: Search,
        color: 'text-orange-400',
        component: MacLookup,
        keywords: ['mac', 'lookup', 'vendor', 'oui']
    },

    // Development
    {
        id: 'regex-tester',
        name: 'Regex Tester',
        path: '/regex-tester',
        description: 'Test regular expressions',
        category: 'development',
        icon: Percent,
        color: 'text-pink-500',
        component: RegexTester,
        keywords: ['regex', 'test', 'regexp', 'match']
    },
    {
        id: 'crontab',
        name: 'Crontab Generator',
        path: '/crontab',
        description: 'Cron schedule generator',
        category: 'development',
        icon: Clock,
        color: 'text-blue-400',
        component: CrontabGenerator,
        keywords: ['cron', 'schedule', 'job', 'timer']
    },
    {
        id: 'chmod',
        name: 'Chmod Calculator',
        path: '/chmod',
        description: 'File permissions (chmod)',
        category: 'development',
        icon: Lock,
        color: 'text-red-400',
        component: ChmodCalculator,
        keywords: ['chmod', 'permission', 'octal', 'linux', 'unix']
    },
    {
        id: 'docker-convert',
        name: 'Docker > Compose',
        path: '/docker-convert',
        description: 'Convert run to compose',
        category: 'development',
        icon: Container,
        color: 'text-sky-500',
        component: DockerConverter,
        keywords: ['docker', 'compose', 'convert', 'container']
    },
    {
        id: 'clipboard-manager',
        name: 'Clipboard Manager',
        path: '/clipboard-manager',
        description: 'Manage and browse clipboard history with search and organization',
        category: 'development',
        icon: Clipboard,
        color: 'text-amber-500',
        component: ClipboardManager,
        keywords: ['clipboard', 'copy', 'paste', 'history', 'manager']
    },
    {
        id: 'stats-monitor',
        name: 'Process Monitor',
        path: '/stats-monitor',
        description: 'Real-time system resource monitoring',
        category: 'utilities',
        icon: Activity,
        color: 'text-emerald-500',
        component: StatsMonitor,
        keywords: ['cpu', 'memory', 'disk', 'network', 'battery', 'gpu', 'stats', 'monitor'],
        shortcut: 'Ctrl+Shift+M'
    },
    {
        id: 'application-manager',
        name: 'Application Manager',
        path: '/application-manager',
        description: 'Manage installed applications and running processes',
        category: 'utilities',
        icon: Package,
        color: 'text-blue-500',
        component: ApplicationManager,
        keywords: ['apps', 'processes', 'uninstall', 'cleanup', 'task manager', 'system apps'],
    },
    {
        id: 'system-cleaner',
        name: 'System Cleaner',
        path: '/system-cleaner',
        description: 'Comprehensive system cleaning and optimization suite',
        category: 'utilities',
        icon: Trash2,
        color: 'text-rose-500',
        component: SystemCleaner,
        keywords: ['cleaner', 'junk', 'optimization', 'malware', 'protection', 'maintenance', 'system'],
    },
    {
        id: 'xnapper',
        name: 'Screenshot Tool',
        path: '/xnapper',
        description: 'Capture, enhance, and export beautiful screenshots',
        category: 'utilities',
        icon: Camera,
        color: 'text-purple-500',
        component: Xnapper,
        keywords: ['screenshot', 'capture', 'screen', 'image', 'xnapper', 'snap'],
        shortcut: 'Ctrl+Shift+S'
    },

    // Settings (Special tool - not in any category)
    {
        id: 'settings',
        name: 'Settings',
        path: '/settings',
        description: 'Customize your experience and manage application preferences',
        category: 'development', // Temporary category for display
        icon: Settings,
        component: SettingsPage,
        keywords: ['settings', 'preferences', 'config', 'options']
    },
];

export const getToolsByCategory = (category: ToolCategory): ToolDefinition[] => {
    return TOOLS.filter(tool => tool.category === category);
};

export const getToolById = (id: string): ToolDefinition | undefined => {
    return TOOLS.find(tool => tool.id === id);
};
