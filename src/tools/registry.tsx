import React from 'react';
import {
    Code2,
    Box,
    Hash,
    Globe,
    Star,
    History,
    FileJson,
    Database,
    Binary,
    Braces,
    FileImage,
    Settings,
    Clipboard,
    Activity,
    Trash2
} from 'lucide-react';


export type ToolCategory = 'converters' | 'formatters' | 'crypto' | 'web' | 'network' | 'development' | 'utilities' | 'favorites' | 'recent';

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
}

export interface CategoryDefinition {
    id: ToolCategory;
    name: string;
    icon: React.ElementType;
}

export const CATEGORIES: CategoryDefinition[] = [
    { id: 'favorites', name: 'Favorites', icon: Star },
    { id: 'recent', name: 'Recent', icon: History },
    { id: 'converters', name: 'Converters', icon: Box },
    { id: 'formatters', name: 'Formatters', icon: Code2 },
    { id: 'crypto', name: 'Crypto', icon: Hash },
    { id: 'web', name: 'Web', icon: Globe },
    { id: 'network', name: 'Network', icon: Globe },
    { id: 'utilities', name: 'Utilities', icon: Box },
    { id: 'development', name: 'Dev Utils', icon: Code2 },
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
const RegexTester = React.lazy(() => import('./development/RegexTester').then(m => ({ default: m.RegexTester })));
const CrontabGenerator = React.lazy(() => import('./development/CrontabGenerator').then(m => ({ default: m.CrontabGenerator })));
const ChmodCalculator = React.lazy(() => import('./development/ChmodCalculator').then(m => ({ default: m.ChmodCalculator })));
const DockerConverter = React.lazy(() => import('./development/DockerConverter').then(m => ({ default: m.DockerConverter })));
const ClipboardManager = React.lazy(() => import('./utilities/ClipboardManager').then(m => ({ default: m.ClipboardManager })));
const StatsMonitor = React.lazy(() => import('./utilities/stats-monitor/StatsMonitor').then(m => ({ default: m.default })));
const SystemCleaner = React.lazy(() => import('./utilities/system-cleaner/SystemCleaner').then(m => ({ default: m.SystemCleaner })));
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
        icon: Code2,
        component: XmlFormatter,
        keywords: ['xml', 'format', 'prettify']
    },
    {
        id: 'json-format',
        name: 'JSON Formatter',
        path: '/json-format',
        description: 'Prettify, minify and validate JSON data',
        category: 'formatters',
        icon: FileJson,
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
        icon: Braces,
        component: JsonYamlConverter,
        keywords: ['json', 'yaml', 'convert', 'transform']
    },
    {
        id: 'json-xml',
        name: 'JSON <> XML',
        path: '/json-xml',
        description: 'Convert between JSON and XML formats',
        category: 'converters',
        icon: Braces,
        component: JsonXmlConverter,
        keywords: ['json', 'xml', 'convert', 'transform']
    },
    {
        id: 'json-csv',
        name: 'JSON to CSV',
        path: '/json-csv',
        description: 'Convert JSON to CSV',
        category: 'converters',
        icon: FileJson,
        component: JsonToCsv,
        keywords: ['json', 'csv', 'convert', 'transform']
    },
    {
        id: 'markdown-html',
        name: 'Markdown to HTML',
        path: '/markdown-html',
        description: 'Convert Markdown to HTML',
        category: 'converters',
        icon: Code2, // Or similar
        component: MarkdownHtmlConverter,
        keywords: ['markdown', 'html', 'preview', 'convert']
    },
    {
        id: 'base64',
        name: 'Base64',
        path: '/base64',
        description: 'Encode and decode Base64 strings',
        category: 'converters',
        icon: Binary,
        component: Base64Converter,
        keywords: ['base64', 'encode', 'decode', 'string']
    },
    {
        id: 'base64-file',
        name: 'Base64 File',
        path: '/base64-file',
        description: 'Convert file to Base64 string',
        category: 'converters',
        icon: Binary,
        component: Base64FileConverter,
        keywords: ['base64', 'file', 'image', 'upload']
    },
    {
        id: 'images-to-pdf',
        name: 'Images to PDF',
        path: '/images-to-pdf',
        description: 'Convert multiple images to PDF, each image as one page',
        category: 'converters',
        icon: FileImage,
        component: ImagesToPdfConverter,
        keywords: ['pdf', 'image', 'convert', 'merge', 'pages']
    },
    {
        id: 'number-base',
        name: 'Number Base',
        path: '/number-base',
        description: 'Convert numbers between Decimal, Hex, Octal and Binary',
        category: 'converters',
        icon: Binary,
        component: NumberBaseConverter,
        keywords: ['base', 'hex', 'binary', 'decimal', 'octal', 'convert']
    },
    {
        id: 'case-converter',
        name: 'Case Converter',
        path: '/case-converter',
        description: 'Convert between different naming conventions',
        category: 'converters',
        icon: Box, // Using Box for now as a generic icon
        component: CaseConverter,
        keywords: ['case', 'camel', 'snake', 'kebab', 'pascal', 'upper', 'lower']
    },
    {
        id: 'color-converter',
        name: 'Color Converter',
        path: '/color-converter',
        description: 'Convert colors (Hex, RGB, HSL)',
        category: 'converters',
        icon: Box, // Using Box or Palette if available
        component: ColorConverter,
        keywords: ['color', 'hex', 'rgb', 'hsl', 'picker']
    },
    {
        id: 'date-converter',
        name: 'Date Converter',
        path: '/date-converter',
        description: 'Convert Dates (ISO, Unix, UTC)',
        category: 'converters',
        icon: History,
        component: DateConverter,
        keywords: ['date', 'time', 'timestamp', 'unix', 'iso']
    },

    // Crypto
    {
        id: 'hash',
        name: 'Hash Generator',
        path: '/hash',
        description: 'Generate MD5, SHA1, SHA256 hashes',
        category: 'crypto',
        icon: Hash,
        component: HashGenerator,
        keywords: ['hash', 'md5', 'sha', 'crypto']
    },
    {
        id: 'hmac',
        name: 'HMAC Generator',
        path: '/hmac',
        description: 'Keyed-hash message authentication code',
        category: 'crypto',
        icon: Hash,
        component: HmacGenerator,
        keywords: ['hmac', 'key', 'hash', 'security']
    },
    {
        id: 'bcrypt',
        name: 'Bcrypt Hash',
        path: '/bcrypt',
        description: 'Generate and compare Bcrypt hashes',
        category: 'crypto',
        icon: Hash,
        component: BcryptGenerator,
        keywords: ['bcrypt', 'password', 'hash', 'salt']
    },
    {
        id: 'uuid',
        name: 'UUID / ULID',
        path: '/uuid',
        description: 'Generate unique identifiers',
        category: 'crypto',
        icon: Hash, // fingerprint icon if available?
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
        icon: Hash, // Key icon?
        component: TokenGenerator,
        keywords: ['token', 'password', 'random', 'secure']
    },
    {
        id: 'aes',
        name: 'AES Encryptor',
        path: '/aes',
        description: 'Encrypt/Decrypt text with AES',
        category: 'crypto',
        icon: Hash, // Lock icon?
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
        icon: Globe,
        component: UrlEncoder,
        keywords: ['url', 'encode', 'decode', 'uri']
    },
    {
        id: 'html-entity',
        name: 'HTML Entity',
        path: '/html-entity',
        description: 'Escape/Unescape HTML Entities',
        category: 'web',
        icon: Code2,
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
        component: UrlParser,
        keywords: ['url', 'parser', 'params', 'query']
    },
    {
        id: 'jwt',
        name: 'JWT Parser',
        path: '/jwt',
        description: 'Parse and inspect JSON Web Tokens',
        category: 'web',
        icon: Hash,
        component: JwtParser,
        keywords: ['jwt', 'token', 'decode', 'jose']
    },
    {
        id: 'user-agent',
        name: 'UA Parser',
        path: '/user-agent',
        description: 'Parse User-Agent strings',
        category: 'web',
        icon: Globe, // or Monitor/Smartphone icon
        component: UserAgentParser,
        keywords: ['user', 'agent', 'browser', 'os', 'device']
    },
    {
        id: 'basic-auth',
        name: 'Basic Auth',
        path: '/basic-auth',
        description: 'Generate HTTP Basic Auth header',
        category: 'web',
        icon: Hash,
        component: BasicAuthGenerator,
        keywords: ['auth', 'basic', 'header', 'http']
    },
    {
        id: 'slug',
        name: 'Slug Generator',
        path: '/slug',
        description: 'Generate URL-friendly slugs',
        category: 'web',
        icon: Globe,
        component: SlugGenerator,
        keywords: ['slug', 'url', 'seo', 'string']
    },
    {
        id: 'http-status',
        name: 'HTTP Codes',
        path: '/http-status',
        description: 'List of HTTP status codes',
        category: 'web',
        icon: Globe,
        component: HttpStatusCode,
        keywords: ['http', 'status', 'code', 'error']
    },
    {
        id: 'json-diff',
        name: 'JSON/Text Diff',
        path: '/json-diff',
        description: 'Compare text or JSON',
        category: 'web',
        icon: FileJson,
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
        icon: Globe,
        component: Ipv4SubnetCalculator,
        keywords: ['ip', 'subnet', 'cidr', 'network', 'mask']
    },
    {
        id: 'ipv4-converter',
        name: 'IPv4 Converter',
        path: '/ipv4-converter',
        description: 'Decimal, Binary, Hex converter',
        category: 'network',
        icon: Binary,
        component: Ipv4Converter,
        keywords: ['ip', 'convert', 'decimal', 'binary', 'hex']
    },
    {
        id: 'mac-generator',
        name: 'MAC Generator',
        path: '/mac-generator',
        description: 'Generate Random MAC Addresses',
        category: 'network',
        icon: Hash,
        component: MacGenerator,
        keywords: ['mac', 'generator', 'address', 'network']
    },
    {
        id: 'mac-lookup',
        name: 'MAC Lookup',
        path: '/mac-lookup',
        description: 'Find vendor by MAC Address',
        category: 'network',
        icon: Globe,
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
        icon: Code2,
        component: RegexTester,
        keywords: ['regex', 'test', 'regexp', 'match']
    },
    {
        id: 'crontab',
        name: 'Crontab Generator',
        path: '/crontab',
        description: 'Cron schedule generator',
        category: 'development',
        icon: History,
        component: CrontabGenerator,
        keywords: ['cron', 'schedule', 'job', 'timer']
    },
    {
        id: 'chmod',
        name: 'Chmod Calculator',
        path: '/chmod',
        description: 'File permissions (chmod)',
        category: 'development',
        icon: Binary,
        component: ChmodCalculator,
        keywords: ['chmod', 'permission', 'octal', 'linux', 'unix']
    },
    {
        id: 'docker-convert',
        name: 'Docker > Compose',
        path: '/docker-convert',
        description: 'Convert run to compose',
        category: 'development',
        icon: Box,
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
        component: StatsMonitor,
        keywords: ['cpu', 'memory', 'disk', 'network', 'battery', 'gpu', 'stats', 'monitor'],
        shortcut: 'Ctrl+Shift+M'
    },
    {
        id: 'system-cleaner',
        name: 'System Cleaner',
        path: '/system-cleaner',
        description: 'Comprehensive system cleaning and optimization suite',
        category: 'utilities',
        icon: Trash2,
        component: SystemCleaner,
        keywords: ['cleaner', 'junk', 'optimization', 'malware', 'protection', 'maintenance', 'system'],
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
